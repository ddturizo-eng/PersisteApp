"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Trash2, Undo2, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/code/code-view";
import { checkGaps, checkOrder, move, orderPool, type OrderBlock } from "@/lib/exercises";
import type { TokenLines } from "@/lib/highlight";
import type { Step } from "@/lib/lesson-schema";

type CodeStep = Extract<Step, { kind: "code" }>;
type PickLineStep = Extract<CodeStep, { mode: "pick-line" }>;
type OrderStep = Extract<CodeStep, { mode: "order" }>;
type FillStep = Extract<CodeStep, { mode: "fill" }>;
type Lookup = (code: string) => TokenLines | undefined;

/** Feedback box shared by every exercise; text plus icon, never color alone. */
export function Feedback({ ok, title, children }: { ok: boolean; title: string; children?: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        ok ? "border-success/40 bg-success-soft text-success" : "border-danger/40 bg-danger-soft text-danger"
      )}
    >
      <p className="flex items-center gap-2 font-semibold">
        {ok ? <Check aria-hidden="true" className="size-4" /> : <X aria-hidden="true" className="size-4" />}
        {title}
      </p>
      {children && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}

/** Pick the right line: native radios (↑ ↓ move, no instant feedback) and a Check button. */
export function PickLine({
  step,
  lookup,
  solved,
  onSolved,
}: {
  step: PickLineStep;
  lookup: Lookup;
  solved: boolean;
  onSolved: () => void;
}) {
  const name = useId();
  const [selected, setSelected] = useState<number | null>(solved ? step.options.findIndex((o) => o.correct) : null);
  const [checked, setChecked] = useState<number | null>(solved ? selected : null);
  const result = checked === null ? undefined : step.options[checked];

  function check() {
    if (selected === null) return;
    setChecked(selected);
    if (step.options[selected].correct) onSolved();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        check();
      }}
    >
      <fieldset className="min-w-0 space-y-3" disabled={solved}>
        <legend className="mb-3 text-lg">{step.prompt}</legend>
        {step.options.map((option, index) => (
          <label
            key={index}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border bg-code px-4 py-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
              selected === index && "border-primary ring-1 ring-primary",
              solved && option.correct && "border-success ring-success",
              solved && "cursor-default"
            )}
          >
            <input
              type="radio"
              name={name}
              checked={selected === index}
              onChange={() => {
                setSelected(index);
                if (!solved) setChecked(null);
              }}
              className="mt-1 size-4 accent-primary"
            />
            <span className="min-w-0 overflow-x-auto">
              <CodeView inline lines={lookup(option.line)} fallback={option.line} />
            </span>
          </label>
        ))}
      </fieldset>
      {!solved && (
        <Button type="submit" variant="secondary" isDisabled={selected === null}>
          Comprobar
        </Button>
      )}
      <div aria-live="polite">
        {result && (
          <Feedback ok={result.correct} title={result.correct ? "Correcto" : "No exactamente"}>
            <p>{result.explanation}</p>
            {!result.correct && <p className="text-sm">Elige otra línea y vuelve a comprobar.</p>}
          </Feedback>
        )}
      </div>
    </form>
  );
}

/**
 * Order the blocks. Up/Down buttons are the primary control (no drag needed, Atlassian
 * guidance); every move is announced in a live region and focus follows the moved block.
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
  const [kept, setKept] = useState<OrderBlock[]>(() =>
    solved
      ? step.blocks.map((text, i) => ({ id: `b${i}`, text }))
      : orderPool(step.blocks, step.distractors, stepKey)
  );
  const [discarded, setDiscarded] = useState<OrderBlock[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [result, setResult] = useState<ReturnType<typeof checkOrder> | null>(null);
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

  function shift(index: number, delta: -1 | 1) {
    if (solved) return;
    const target = index + delta;
    if (target < 0 || target >= kept.length) return;
    const block = kept[index];
    setKept(move(kept, index, delta));
    setResult(null);
    setAnnouncement(`Bloque «${preview(block.text)}» en posición ${target + 1} de ${kept.length}.`);
    pendingFocus.current = `${block.id}-${delta < 0 ? "up" : "down"}`;
  }

  function discard(index: number) {
    const block = kept[index];
    setKept(kept.filter((_, i) => i !== index));
    setDiscarded([...discarded, block]);
    setResult(null);
    setAnnouncement(`Bloque «${preview(block.text)}» descartado.`);
  }

  function restore(index: number) {
    const block = discarded[index];
    setDiscarded(discarded.filter((_, i) => i !== index));
    setKept([...kept, block]);
    setResult(null);
    setAnnouncement(`Bloque «${preview(block.text)}» recuperado al final de la lista.`);
  }

  function check() {
    const outcome = checkOrder(kept, step.blocks);
    setResult(outcome);
    if (outcome.solved) onSolved();
  }

  const iconButton =
    "inline-flex size-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-40";

  return (
    <div className="space-y-4">
      <p className="text-lg">{step.prompt}</p>
      <p className="text-sm text-muted-foreground">
        Usa los botones Subir y Bajar de cada bloque.{hasDistractors && " Descarta los bloques que sobran."}
      </p>
      <ol aria-label="Bloques en orden" className="space-y-2">
        {kept.map((block, index) => (
          <li key={block.id} className="flex items-center gap-2 rounded-lg border bg-code p-2 pl-3">
            <span aria-hidden="true" className="w-5 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 overflow-x-auto py-1">
              <CodeView inline lines={lookup(block.text)} fallback={block.text} />
            </span>
            {!solved && (
              <span className="flex shrink-0 gap-1">
                {(["up", "down"] as const).map((dir) => {
                  const edge = dir === "up" ? index === 0 : index === kept.length - 1;
                  return (
                    <button
                      key={dir}
                      type="button"
                      ref={(el) => {
                        buttons.current.set(`${block.id}-${dir}`, el);
                      }}
                      aria-disabled={edge}
                      aria-label={`${dir === "up" ? "Subir" : "Bajar"} bloque ${index + 1}`}
                      onClick={() => !edge && shift(index, dir === "up" ? -1 : 1)}
                      className={iconButton}
                    >
                      {dir === "up" ? <ArrowUp aria-hidden="true" className="size-4" /> : <ArrowDown aria-hidden="true" className="size-4" />}
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
        ))}
      </ol>

      {discarded.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Descartados</p>
          <ul className="space-y-2">
            {discarded.map((block, index) => (
              <li key={block.id} className="flex items-center gap-2 rounded-lg border border-dashed p-2 pl-3 opacity-80">
                <span className="min-w-0 flex-1 overflow-x-auto py-1">
                  <CodeView inline lines={lookup(block.text)} fallback={block.text} />
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
      <div aria-live="polite">
        {solved && <Feedback ok title="Correcto">Los bloques están en el orden correcto.</Feedback>}
        {!solved && result && (
          <Feedback ok={false} title="Todavía no">
            <p>
              {result.inPlace} de {step.blocks.length} bloques están en su lugar.
            </p>
            {result.hasDistractor && <p>Hay al menos un bloque que no pertenece a la solución.</p>}
          </Feedback>
        )}
      </div>
    </div>
  );
}

/** Fill the gaps inline in the code; Enter or Check validates every gap at once. */
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
  const [values, setValues] = useState<Record<number, string>>(() =>
    solved ? Object.fromEntries(step.gaps.map((gap) => [gap.id, gap.answers[0]])) : {}
  );
  const [results, setResults] = useState<Record<number, boolean> | null>(null);
  const gapById = new Map(step.gaps.map((gap) => [gap.id, gap]));

  function check() {
    const outcome = checkGaps(step.gaps, values);
    setResults(outcome.results);
    if (outcome.solved) onSolved();
  }

  const renderGap = (gapId: number, occurrence: number) => {
    const gap = gapById.get(gapId);
    if (!gap) return "____";
    const width = Math.max(...gap.answers.map((a) => a.length), 6) + 2;
    const value = values[gapId] ?? "";
    const wrong = results?.[gapId] === false;
    if (occurrence > 0) {
      // Later occurrences of the same gap mirror the first input.
      return (
        <span className="rounded-sm border-b border-dashed border-primary px-0.5" aria-hidden="true">
          {value || "____"}
        </span>
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
        onChange={(event) => {
          setValues({ ...values, [gapId]: event.target.value });
          setResults(null);
        }}
        style={{ width: `${width}ch` }}
        className={cn(
          "mx-0.5 rounded-sm border bg-background px-1 font-mono text-sm text-foreground",
          wrong && "border-danger",
          (solved || results?.[gapId]) && "border-success"
        )}
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
      <p className="text-lg">{step.prompt}</p>
      <CodeView lines={lookup(code)} fallback={code} renderGap={renderGap} />
      {!solved && (
        <Button type="submit" variant="secondary">
          Comprobar
        </Button>
      )}
      <div aria-live="polite">
        {solved && <Feedback ok title="Correcto">Todos los huecos están bien.</Feedback>}
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
      </div>
    </form>
  );
}
