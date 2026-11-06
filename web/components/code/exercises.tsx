"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  Lightbulb,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/code/code-view";
import {
  canShowSolution,
  checkGaps,
  checkOrder,
  hintFor,
  move,
  optionOrder,
  orderPool,
  type OrderBlock,
} from "@/lib/exercises";
import type { TokenLines } from "@/lib/highlight";
import type { Step } from "@/lib/lesson-schema";
import { InlineText } from "@/components/lesson/inline-text";

type CodeStep = Extract<Step, { kind: "code" }>;
type PickLineStep = Extract<CodeStep, { mode: "pick-line" }>;
type OrderStep = Extract<CodeStep, { mode: "order" }>;
type FillStep = Extract<CodeStep, { mode: "fill" }>;
type Lookup = (code: string) => TokenLines | undefined;

/** Feedback box shared by every exercise; text plus icon, never color alone. */
export function Feedback({
  ok,
  title,
  children,
}: {
  ok: boolean;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        ok ? "bg-success-soft text-success" : "bg-danger-soft text-destructive",
      )}
    >
      <p className="flex items-center gap-2 font-semibold">
        {ok ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <X aria-hidden="true" className="size-4" />
        )}
        {title}
      </p>
      {children && <div className="mt-1 space-y-1 leading-relaxed text-foreground">{children}</div>}
    </div>
  );
}

/** Situation shown before a question so the prompt is explicit (REQ-32 CA1). */
export function Context({ text }: { text: string }) {
  return (
    <div className="max-w-prose space-y-2 rounded-xl bg-accent px-4 py-3 text-accent-foreground">
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i} className="leading-relaxed whitespace-pre-line">
          <InlineText text={paragraph} />
        </p>
      ))}
    </div>
  );
}

/**
 * Pick the right line: tapping a line answers at once (no Check button). A wrong line explains why
 * and stays marked; the right one solves the exercise.
 */
export function PickLine({
  step,
  stepKey,
  lookup,
  solved,
  onSolved,
}: {
  step: PickLineStep;
  stepKey: string;
  lookup: Lookup;
  solved: boolean;
  onSolved: () => void;
}) {
  const promptId = useId();
  const correctIndex = step.options.findIndex((o) => o.correct);
  const [tried, setTried] = useState<number[]>(() => (solved ? [correctIndex] : []));
  const last = tried.at(-1);
  const result = last === undefined ? undefined : step.options[last];

  function pick(index: number) {
    if (solved || tried.includes(index)) return;
    setTried([...tried, index]);
    if (step.options[index].correct) onSolved();
  }

  return (
    <div className="space-y-4">
      {step.context && <Context text={step.context} />}
      <p id={promptId} className="text-lg">
        <InlineText text={step.prompt} />
      </p>
      <ul aria-labelledby={promptId} className="space-y-2.5">
        {optionOrder(step.options.length, stepKey).map((index) => {
          const option = step.options[index];
          const wasTried = tried.includes(index);
          const right = wasTried && option.correct;
          const wrong = wasTried && !option.correct;
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => pick(index)}
                aria-disabled={solved || wasTried || undefined}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border-2 bg-code px-4 py-3 text-left outline-none transition-colors focus-visible:ring-4 focus-visible:ring-ring/40",
                  !solved && !wasTried && "border-transparent hover:border-foreground/40",
                  right && "border-success bg-success-soft",
                  wrong && "border-destructive/60 bg-danger-soft",
                  solved && !wasTried && "border-transparent opacity-60",
                )}
              >
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  {right ? <Check className="size-4 text-success" /> : wrong ? <X className="size-4 text-destructive" /> : <span className="block size-4 rounded-full border-2 border-input" />}
                </span>
                <span className="min-w-0">
                  <CodeView inline lines={lookup(option.line)} fallback={option.line} />
                </span>
                <span className="sr-only">{right ? " (correcta)" : wrong ? " (incorrecta)" : ""}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite">
        {result && (
          <Feedback ok={result.correct} title={result.correct ? "Correcto" : "No exactamente"}>
            <p>
              <InlineText text={result.explanation} />
            </p>
            {!result.correct && <p className="text-sm">Prueba con otra línea.</p>}
          </Feedback>
        )}
      </div>
    </div>
  );
}

/** Hint, «Ver solución» and the per-attempt message shared by order and fill (REQ-04 CA5). */
function HelpAfterFailure({
  failures,
  hints,
  onReveal,
}: {
  failures: number;
  hints?: string[];
  onReveal: () => void;
}) {
  const hint = hintFor(hints, failures);
  if (failures < 1) return null;
  return (
    <div className="space-y-3">
      {hint && (
        <p className="flex items-start gap-2 rounded-lg border bg-accent p-3 text-accent-foreground">
          <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-medium">Pista: </span>
            <InlineText text={hint} />
          </span>
        </p>
      )}
      {canShowSolution(failures) && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onPress={onReveal}>
            <Eye data-icon="inline-start" aria-hidden="true" />
            Ver solución
          </Button>
          <span className="text-sm text-muted-foreground">
            Puedes verla y seguir; repásala antes de continuar.
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Order the blocks. Up/Down buttons are the primary control (no drag needed, Atlassian
 * guidance); every move is announced in a live region and focus follows the moved block.
 * After a check, blocks already in place are marked (REQ-04 CA6).
 */
export function OrderBlocks({
  step,
  stepKey,
  lookup,
  solved,
  onSolved,
}: {
  step: OrderStep;
  stepKey: string;
  lookup: Lookup;
  solved: boolean;
  onSolved: () => void;
}) {
  const hasDistractors = (step.distractors?.length ?? 0) > 0;
  const correctBlocks = () =>
    step.blocks.map((text, i) => ({ id: `b${i}`, text }));
  const [kept, setKept] = useState<OrderBlock[]>(() =>
    solved
      ? correctBlocks()
      : orderPool(step.blocks, step.distractors, stepKey),
  );
  const [discarded, setDiscarded] = useState<OrderBlock[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [result, setResult] = useState<ReturnType<typeof checkOrder> | null>(
    null,
  );
  const [failures, setFailures] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    if (pendingFocus.current) {
      buttons.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  });

  const preview = (raw: string) => {
    const text = raw.trim();
    return text.length > 40 ? `${text.slice(0, 40)}…` : text;
  };

  function changed(next: OrderBlock[], message: string) {
    setKept(next);
    setResult(null);
    setAnnouncement(message);
  }

  function shift(index: number, delta: -1 | 1) {
    if (solved) return;
    const target = index + delta;
    if (target < 0 || target >= kept.length) return;
    const block = kept[index];
    changed(
      move(kept, index, delta),
      `Bloque «${preview(block.text)}» en posición ${target + 1} de ${kept.length}.`,
    );
    pendingFocus.current = `${block.id}-${delta < 0 ? "up" : "down"}`;
  }

  function discard(index: number) {
    const block = kept[index];
    setDiscarded([...discarded, block]);
    changed(
      kept.filter((_, i) => i !== index),
      `Bloque «${preview(block.text)}» descartado.`,
    );
  }

  function restore(index: number) {
    const block = discarded[index];
    setDiscarded(discarded.filter((_, i) => i !== index));
    changed(
      [...kept, block],
      `Bloque «${preview(block.text)}» recuperado al final de la lista.`,
    );
  }

  function check() {
    const outcome = checkOrder(kept, step.blocks);
    setResult(outcome);
    if (outcome.solved) onSolved();
    else setFailures((n) => n + 1);
  }

  function reveal() {
    setKept(correctBlocks());
    setDiscarded(
      (step.distractors ?? []).map((text, i) => ({ id: `d${i}`, text })),
    );
    setRevealed(true);
    setResult(null);
    onSolved();
  }

  const showMarks = result !== null && !solved;
  const iconButton =
    "inline-flex size-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-40";

  return (
    <div className="space-y-4">
      <p className="text-lg">
        <InlineText text={step.prompt} />
      </p>
      {!solved && (
        <p className="text-sm text-muted-foreground">
          Mueve cada bloque con los botones Subir y Bajar; el número de la
          izquierda es su posición.
          {hasDistractors && " Uno de los bloques sobra: descártalo."}
        </p>
      )}
      <ol aria-label="Bloques en orden" className="space-y-2">
        {kept.map((block, index) => {
          const inPlace = block.text === step.blocks[index];
          return (
            <li
              key={block.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border bg-code p-2 pl-3",
                showMarks && inPlace && "border-success/60",
                solved && "border-success/40",
              )}
            >
              <span
                aria-hidden="true"
                className="w-5 shrink-0 text-right text-sm text-muted-foreground tabular-nums"
              >
                {showMarks && inPlace ? (
                  <Check className="ml-auto size-4 text-success" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0 flex-1 py-1">
                <CodeView
                  inline
                  lines={lookup(block.text)}
                  fallback={block.text}
                />
                {showMarks && (
                  <span className="sr-only">
                    {inPlace ? " (en su lugar)" : " (fuera de lugar)"}
                  </span>
                )}
              </span>
              {!solved && (
                <span className="flex shrink-0 gap-1">
                  {(["up", "down"] as const).map((dir) => {
                    const edge =
                      dir === "up" ? index === 0 : index === kept.length - 1;
                    return (
                      <button
                        key={dir}
                        type="button"
                        ref={(el) => {
                          buttons.current.set(`${block.id}-${dir}`, el);
                        }}
                        aria-disabled={edge}
                        aria-label={`${dir === "up" ? "Subir" : "Bajar"} bloque ${index + 1}`}
                        onClick={() =>
                          !edge && shift(index, dir === "up" ? -1 : 1)
                        }
                        className={iconButton}
                      >
                        {dir === "up" ? (
                          <ArrowUp aria-hidden="true" className="size-4" />
                        ) : (
                          <ArrowDown aria-hidden="true" className="size-4" />
                        )}
                      </button>
                    );
                  })}
                  {hasDistractors && (
                    <button
                      type="button"
                      aria-label={`Descartar bloque ${index + 1}`}
                      onClick={() => discard(index)}
                      className={iconButton}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {discarded.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {revealed ? "Bloque que sobraba" : "Descartados"}
          </p>
          <ul className="space-y-2">
            {discarded.map((block, index) => (
              <li
                key={block.id}
                className="flex items-center gap-2 rounded-lg border border-dashed p-2 pl-3 opacity-80"
              >
                <span className="min-w-0 flex-1 py-1">
                  <CodeView
                    inline
                    lines={lookup(block.text)}
                    fallback={block.text}
                  />
                </span>
                {!solved && (
                  <button
                    type="button"
                    aria-label={`Recuperar bloque descartado ${index + 1}`}
                    onClick={() => restore(index)}
                    className={iconButton}
                  >
                    <Undo2 aria-hidden="true" className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!solved && (
        <Button variant="secondary" onPress={check}>
          Comprobar
        </Button>
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div aria-live="polite" className="space-y-3">
        {solved && (
          <Feedback
            ok
            title={revealed ? "Este es el orden correcto" : "Correcto"}
          >
            {revealed
              ? "Léelo de arriba abajo: primero el SQL, luego la sentencia, los valores y al final la ejecución."
              : "Los bloques están en el orden correcto."}
          </Feedback>
        )}
        {!solved && result && (
          <Feedback ok={false} title="Todavía no">
            <p>
              {result.inPlace} de {step.blocks.length} bloques ya están en su
              lugar (marcados con ✓).
            </p>
            {result.hasDistractor && (
              <p>Hay un bloque que no pertenece a la solución.</p>
            )}
          </Feedback>
        )}
        {!solved && (
          <HelpAfterFailure
            failures={failures}
            hints={step.hints}
            onReveal={reveal}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Fill the gaps inline in the code. With selectors the answer is checked as soon as every gap has a
 * value (no Check button); free-text gaps still check with Enter or the button.
 */
export function FillGaps({
  step,
  code,
  lookup,
  solved,
  onSolved,
}: {
  step: FillStep;
  code: string;
  lookup: Lookup;
  solved: boolean;
  onSolved: () => void;
}) {
  const id = useId();
  const answers = () =>
    Object.fromEntries(step.gaps.map((gap) => [gap.id, gap.answers[0]]));
  const [values, setValues] = useState<Record<number, string>>(() =>
    solved ? answers() : {},
  );
  const [results, setResults] = useState<Record<number, boolean> | null>(null);
  const [failures, setFailures] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const gapById = new Map(step.gaps.map((gap) => [gap.id, gap]));

  const allSelectors = step.gaps.every((gap) => gap.choices);

  function check(current = values) {
    const outcome = checkGaps(step.gaps, current);
    setResults(outcome.results);
    if (outcome.solved) onSolved();
    else setFailures((n) => n + 1);
  }

  function reveal() {
    setValues(answers());
    setResults(null);
    setRevealed(true);
    onSolved();
  }

  const renderGap = (gapId: number, occurrence: number) => {
    const gap = gapById.get(gapId);
    if (!gap) return "____";
    const width =
      Math.max(...(gap.choices ?? gap.answers).map((a) => a.length), 6) + 2;
    const value = values[gapId] ?? "";
    const wrong = results?.[gapId] === false;
    if (occurrence > 0) {
      // Later occurrences of the same gap mirror the first input.
      return (
        <span
          className="rounded-sm border-b border-dashed border-primary px-0.5"
          aria-hidden="true"
        >
          {value || "____"}
        </span>
      );
    }
    const fieldClass = cn(
      "mx-0.5 rounded-sm border bg-background px-1 font-mono text-sm text-foreground",
      wrong && "border-danger",
      (solved || results?.[gapId]) && "border-success",
    );
    const update = (next: string) => {
      const nextValues = { ...values, [gapId]: next };
      setValues(nextValues);
      setResults(null);
      if (allSelectors && step.gaps.every((g) => nextValues[g.id])) check(nextValues);
    };
    if (gap.choices) {
      // Selector: faster in class and no typos (REQ-04 CA7).
      return (
        <select
          aria-label={`Hueco ${gapId}: ${gap.label}`}
          aria-invalid={wrong || undefined}
          aria-describedby={wrong ? `${id}-hint-${gapId}` : undefined}
          value={value}
          disabled={solved}
          onChange={(event) => update(event.target.value)}
          style={{ width: `${width + 3}ch` }}
          className={cn(fieldClass, "py-0.5 disabled:opacity-100")}
        >
          <option value="">Elige…</option>
          {gap.choices.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        aria-label={`Hueco ${gapId}: ${gap.label}`}
        aria-invalid={wrong || undefined}
        aria-describedby={wrong ? `${id}-hint-${gapId}` : undefined}
        value={value}
        readOnly={solved}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        onChange={(event) => update(event.target.value)}
        style={{ width: `${width}ch` }}
        className={fieldClass}
      />
    );
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!solved) check();
      }}
    >
      <p className="text-lg">
        <InlineText text={step.prompt} />
      </p>
      {!solved && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {step.gaps.map((gap) => (
            <li key={gap.id}>
              Hueco {gap.id}: {gap.label}
            </li>
          ))}
        </ul>
      )}
      <CodeView lines={lookup(code)} fallback={code} renderGap={renderGap} />
      {!solved && !allSelectors && (
        <Button type="submit" variant="secondary">
          Comprobar
        </Button>
      )}
      <div aria-live="polite" className="space-y-3">
        {solved && (
          <Feedback ok title={revealed ? "Así quedan los huecos" : "Correcto"}>
            {revealed
              ? "Fíjate en cada método: lo vas a usar en tu proyecto."
              : "Todos los huecos están bien."}
          </Feedback>
        )}
        {!solved && results && (
          <Feedback ok={false} title="Revisa los huecos marcados">
            {step.gaps
              .filter((gap) => results[gap.id] === false)
              .map((gap) => (
                <p key={gap.id} id={`${id}-hint-${gap.id}`}>
                  Hueco {gap.id} ({gap.label}){gap.hint ? `: ${gap.hint}` : "."}
                </p>
              ))}
          </Feedback>
        )}
        {!solved && (
          <HelpAfterFailure
            failures={failures}
            hints={step.hints}
            onReveal={reveal}
          />
        )}
      </div>
    </form>
  );
}
