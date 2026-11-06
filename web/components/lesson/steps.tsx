"use client";

import { useId, type Ref } from "react";
import { Check, X } from "lucide-react";
import { cn } from "cn";
import { CodeView } from "@/components/code/code-view";
import { useEngine } from "@/components/code/engine";
import { EngineTabs } from "@/components/code/engine-tabs";
import { Context, FillGaps, OrderBlocks, PickLine } from "@/components/code/exercises";
import { ExecutionBadge } from "@/components/ui/execution-badge";
import { codeFor, optionOrder, toSentinels } from "@/lib/exercises";
import { highlightKey, type Highlights } from "@/lib/highlight";
import { stageLabels, type Step } from "@/lib/lesson-schema";
import { correctOptionIndex } from "@/lib/player";

type StepOf<K extends Step["kind"]> = Extract<Step, { kind: K }>;

/** Heading that receives focus on every step change, so screen readers start there. */
function StepHeading({ children, headingRef }: { children: React.ReactNode; headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance focus:outline-none">
      {children}
    </h2>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="max-w-prose space-y-4 text-lg leading-relaxed">
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

const reflectionFields = [
  ["motivo", "Motivo", "¿Por qué necesitabas resolver esto?"],
  ["problema", "Problema", "¿Qué fallaba o qué no entendías?"],
  ["prompt", "Prompt usado", "Si usaste una IA, ¿qué le pediste?"],
  ["solucion", "Solución y decisión", "¿Qué hiciste y por qué es correcto?"],
] as const;

/** Text step; with `reflection` it shows the teacher's AI log template (REQ-16 CA3). */
export function TextStep({ step, headingRef }: { step: StepOf<"text">; headingRef: Ref<HTMLHeadingElement> }) {
  const id = useId();
  return (
    <div className="space-y-6">
      <StepHeading headingRef={headingRef}>{step.title ?? stageLabels[step.stage]}</StepHeading>
      <Paragraphs text={step.body} />
      {step.reflection && (
        <form className="max-w-prose space-y-4" onSubmit={(e) => e.preventDefault()}>
          <p className="text-sm text-muted-foreground">
            Bitácora de uso de IA. Se queda en tu navegador; no se envía a ningún lado.
          </p>
          {reflectionFields.map(([key, label, placeholder]) => (
            <div key={key} className="space-y-1.5">
              <label htmlFor={`${id}-${key}`} className="text-sm font-medium">
                {label}
              </label>
              <textarea
                id={`${id}-${key}`}
                rows={2}
                placeholder={placeholder}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground"
              />
            </div>
          ))}
        </form>
      )}
    </div>
  );
}

/** Visual step; simulators arrive in PA-13..PA-16. */
export function VisualStep({ step, headingRef }: { step: StepOf<"visual">; headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <div className="space-y-6">
      <StepHeading headingRef={headingRef}>{stageLabels[step.stage]}</StepHeading>
      <Paragraphs text={step.caption} />
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-muted p-6 text-center text-muted-foreground">
        Simulador «{step.component}» en construcción.
      </div>
    </div>
  );
}

/**
 * Question step (REQ-03): instant feedback per option; a wrong pick explains why,
 * the right pick explains and unlocks Continue. Options lock once solved.
 */
export function QuestionStep({
  step,
  stepKey,
  picked,
  onPick,
  headingRef,
}: {
  step: StepOf<"question">;
  stepKey: string;
  picked: number[];
  onPick: (option: number) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const promptId = useId();
  const correct = correctOptionIndex(step);
  const solved = correct !== undefined && picked.includes(correct);
  const last = picked.at(-1);
  const feedback = last === undefined ? undefined : step.options[last];

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-muted-foreground">{stageLabels[step.stage]}</p>
      {step.context && <Context text={step.context} />}
      <div id={promptId}>
        <StepHeading headingRef={headingRef}>{step.prompt}</StepHeading>
      </div>
      <ul role="list" aria-labelledby={promptId} className="max-w-prose space-y-3">
        {optionOrder(step.options.length, stepKey).map((index) => {
          const option = step.options[index];
          const tried = picked.includes(index);
          const isRight = tried && option.correct;
          const isWrong = tried && !option.correct;
          return (
            <li key={index}>
              <button
                type="button"
                // aria-disabled instead of disabled: a disabled button would drop keyboard focus.
                aria-disabled={solved || isWrong}
                aria-describedby={tried ? `${promptId}-fb` : undefined}
                onClick={() => {
                  if (!solved && !isWrong) onPick(index);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors",
                  !tried && !solved && "cursor-pointer hover:border-primary hover:bg-accent",
                  (solved || isWrong) && "cursor-default",
                  isRight && "border-success/50 bg-success-soft text-success",
                  isWrong && "border-danger/40 bg-danger-soft text-danger",
                  solved && !tried && "opacity-60"
                )}
              >
                <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border">
                  {isRight && <Check className="size-3.5" />}
                  {isWrong && <X className="size-3.5" />}
                </span>
                <span>
                  {option.text}
                  {isRight && <span className="sr-only"> (correcta)</span>}
                  {isWrong && <span className="sr-only"> (incorrecta)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div id={`${promptId}-fb`} aria-live="polite" className="max-w-prose">
        {feedback && (
          <div
            className={cn(
              "rounded-lg border p-4",
              feedback.correct ? "border-success/40 bg-success-soft text-success" : "border-danger/40 bg-danger-soft text-danger"
            )}
          >
            <p className="font-semibold">{feedback.correct ? "Correcto" : "No exactamente"}</p>
            <p className="mt-1">{feedback.explanation}</p>
            {!feedback.correct && <p className="mt-2 text-sm">Prueba otra opción.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Code step (REQ-04): Shiki-highlighted code, engine tabs when the step has Oracle and
 * PostgreSQL variants, and the pick-line / order / fill exercises. The execution result
 * shows once the exercise is solved (or always for read-only code).
 */
export function CodeStep({
  step,
  stepKey,
  highlights,
  solved,
  onSolved,
  headingRef,
}: {
  step: StepOf<"code">;
  stepKey: string;
  highlights: Highlights;
  solved: boolean;
  onSolved: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const [engine, setEngine] = useEngine();
  const lookup = (code: string) => highlights[highlightKey(step.language, toSentinels(code))];
  const { code } = codeFor(step, engine);
  const hasEngineTabs = Boolean(step.variants.oracle && step.variants.postgresql);
  const wrapTabs = (content: React.ReactNode) =>
    hasEngineTabs ? (
      <EngineTabs engine={engine} onChange={setEngine}>
        {content}
      </EngineTabs>
    ) : (
      content
    );

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-muted-foreground">{stageLabels[step.stage]}</p>
      <StepHeading headingRef={headingRef}>{step.title ?? "Código"}</StepHeading>

      {step.mode === "read" && wrapTabs(<CodeView lines={lookup(code)} fallback={code} />)}
      {step.mode === "pick-line" && (
        <>
          {wrapTabs(<CodeView lines={lookup(code)} fallback={code} />)}
          <PickLine step={step} stepKey={stepKey} lookup={lookup} solved={solved} onSolved={onSolved} />
        </>
      )}
      {step.mode === "order" && (
        <OrderBlocks step={step} stepKey={stepKey} lookup={lookup} solved={solved} onSolved={onSolved} />
      )}
      {step.mode === "fill" &&
        wrapTabs(
          <FillGaps key={code} step={step} code={code} lookup={lookup} solved={solved} onSolved={onSolved} />
        )}

      {step.result && (step.mode === "read" || solved) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Resultado</p>
            <ExecutionBadge kind={step.result.kind} />
          </div>
          <pre className="overflow-x-auto rounded-lg border p-4 font-mono text-sm">{step.result.output}</pre>
        </div>
      )}
    </div>
  );
}
