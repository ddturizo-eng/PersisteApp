"use client";

import { Fragment, useId, type Ref } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { cn } from "cn";
import { CodeView } from "@/components/code/code-view";
import { useEngine } from "@/components/code/engine";
import { EngineTabs } from "@/components/code/engine-tabs";
import { Context, FillGaps, OrderBlocks, PickLine } from "@/components/code/exercises";
import { ExecutionBadge } from "@/components/ui/execution-badge";
import { SpringMap } from "@/components/lesson/spring-map";
import { codeFor, optionOrder, toSentinels } from "@/lib/exercises";
import { highlightKey, type Highlights } from "@/lib/highlight";
import { stageLabels, type Step } from "@/lib/lesson-schema";
import { correctOptionIndex } from "@/lib/player";
import { InlineText } from "@/components/lesson/inline-text";
import { PoolDemo } from "@/components/landing/pool-demo";
import { PoolSimulator } from "@/components/lesson/pool-simulator";
import { MirrorSimulator } from "@/components/lesson/mirror-simulator";
import { AttentionNote, CodeRefs } from "@/components/lesson/code-refs";
import { SafeQueryDemo } from "@/components/landing/safe-query-demo";
import { SystemMap } from "@/components/landing/system-map";
import { TableAnatomy } from "@/components/db/table-anatomy";
import { SqlLab } from "@/components/db/sql-lab";
import { RelationsMap } from "@/components/db/relations-map";
import { TableClass } from "@/components/db/table-class";
import { RowMapper } from "@/components/db/row-mapper";
import { CrudDemo } from "@/components/db/crud-demo";
import { CodeExplain, type ExplainedLine } from "@/components/db/code-explain";
import { SplitTables } from "@/components/db/split-tables";
import { AllOrNothing, EngineCompare, MemoryVsDisk } from "@/components/db/db-basics";
import type { TableName } from "@/lib/sample-db";
import { illustrations, illustrationSrc, type IllustrationName } from "@/lib/illustrations";

type StepOf<K extends Step["kind"]> = Extract<Step, { kind: K }>;

/** Heading that receives focus on every step change, so screen readers start there. */
function StepHeading({ children, headingRef }: { children: React.ReactNode; headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance focus:outline-none">
      {children}
    </h2>
  );
}

/**
 * Body text. An illustration floats to the right from the second paragraph on, so the text wraps
 * around it instead of pushing the reading below the fold on a phone.
 */
function Paragraphs({ text, figure }: { text: string; figure?: React.ReactNode }) {
  const paragraphs = text.split(/\n{2,}/);
  const at = paragraphs.length > 1 ? 1 : 0;
  return (
    <div className="flow-root max-w-prose space-y-4 text-lg leading-relaxed">
      {paragraphs.map((paragraph, i) => (
        <Fragment key={i}>
          {figure && i === at && figure}
          <p>
            <InlineText text={paragraph} />
          </p>
        </Fragment>
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

/** Illustration floated to the right of the text: about 40 % of a phone's width, 15rem on wider screens. */
function StepIllustration({ name }: { name: IllustrationName }) {
  const { width, height, alt } = illustrations[name];
  return (
    <Image
      src={illustrationSrc(name)}
      alt={alt}
      width={width}
      height={height}
      sizes="(min-width: 640px) 15rem, 40vw"
      className="float-right mt-1 mb-3 ml-4 h-auto w-[40%] max-w-60 sm:ml-6 sm:w-60"
    />
  );
}

/** Text step; with `reflection` it shows the teacher's AI log template (REQ-16 CA3). */
export function TextStep({ step, headingRef }: { step: StepOf<"text">; headingRef: Ref<HTMLHeadingElement> }) {
  const id = useId();
  return (
    <div className="space-y-6">
      <StepHeading headingRef={headingRef}>{step.title ?? stageLabels[step.stage]}</StepHeading>
      <Paragraphs text={step.body} figure={step.image && <StepIllustration name={step.image} />} />
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

/** Visual step: the interactive pieces shared with the landing; the rest arrive in PA-13..PA-16. */
export function VisualStep({ step, headingRef }: { step: StepOf<"visual">; headingRef: Ref<HTMLHeadingElement> }) {
  const simulator =
    step.component === "system-map" ? (
      <SystemMap />
    ) : step.component === "pool" ? (
      <PoolDemo />
    ) : step.component === "pool-simulator" ? (
      <PoolSimulator />
    ) : step.component === "mirror" ? (
      <MirrorSimulator mode={step.props?.mode === "autocommit" ? "autocommit" : undefined} />
    ) : step.component === "sql-lab" ? (
      <SqlLab
        queries={Array.isArray(step.props?.queries) ? (step.props.queries as string[]) : undefined}
        table={typeof step.props?.table === "string" ? (step.props.table as TableName) : undefined}
      />
    ) : step.component === "relations" ? (
      <RelationsMap />
    ) : step.component === "table-class" ? (
      <TableClass table={typeof step.props?.table === "string" ? (step.props.table as TableName) : undefined} />
    ) : step.component === "code-explain" ? (
      <CodeExplain lines={(step.props?.lines as ExplainedLine[]) ?? []} language={step.props?.language === "sql" ? "sql" : "java"} />
    ) : step.component === "memory-disk" ? (
      <MemoryVsDisk />
    ) : step.component === "engines" ? (
      <EngineCompare />
    ) : step.component === "transaction" ? (
      <AllOrNothing />
    ) : step.component === "split-tables" ? (
      <SplitTables />
    ) : step.component === "crud-demo" ? (
      <CrudDemo />
    ) : step.component === "row-mapper" ? (
      <RowMapper />
    ) : step.component === "table-anatomy" ? (
      <TableAnatomy />
    ) : step.component === "spring-map" ? (
      <SpringMap />
    ) : step.component === "injection" ? (
      <SafeQueryDemo mode={step.props?.mode === "vulnerable" ? "vulnerable" : "both"} />
    ) : (
      <div className="flex min-h-48 items-center justify-center rounded-3xl bg-muted p-6 text-center text-muted-foreground">
        Simulador «{step.component}» en construcción.
      </div>
    );
  return (
    <div className="space-y-6">
      <StepHeading headingRef={headingRef}>{step.title ?? stageLabels[step.stage]}</StepHeading>
      <Paragraphs text={step.caption} />
      {simulator}
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
      <CodeRefs refs={step.refs} />
      <div id={promptId}>
        <StepHeading headingRef={headingRef}>
          <InlineText text={step.prompt} />
        </StepHeading>
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
                  "flex min-h-14 w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base outline-none transition-colors focus-visible:ring-4 focus-visible:ring-ring/40",
                  !tried && !solved && "cursor-pointer border-border bg-card hover:border-foreground/50",
                  (solved || isWrong) && "cursor-default",
                  isRight && "border-success bg-success-soft",
                  isWrong && "border-destructive/50 bg-danger-soft",
                  solved && !tried && "opacity-60"
                )}
              >
                <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border">
                  {isRight && <Check className="size-3.5" />}
                  {isWrong && <X className="size-3.5" />}
                </span>
                <span>
                  <InlineText text={option.text} />
                  {isRight && <span className="sr-only"> (correcta)</span>}
                  {isWrong && <span className="sr-only"> (incorrecta)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div id={`${promptId}-fb`} aria-live="polite" className="max-w-prose scroll-mb-40" ref={(el) => { if (el && feedback) el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }}>
        {feedback && (
          <div
            className={cn(
              "rounded-2xl p-4",
              feedback.correct ? "bg-success-soft text-success" : "bg-danger-soft text-destructive"
            )}
          >
            <p className="flex items-center gap-2 font-semibold">
              {feedback.correct ? <Check aria-hidden="true" className="size-4" /> : <X aria-hidden="true" className="size-4" />}
              {feedback.correct ? "¡Correcto!" : "No exactamente"}
            </p>
            <p className="mt-1 leading-relaxed text-foreground">
              <InlineText text={feedback.explanation} />
            </p>
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
  laterSteps = [],
}: {
  step: StepOf<"code">;
  stepKey: string;
  highlights: Highlights;
  solved: boolean;
  onSolved: () => void;
  headingRef: Ref<HTMLHeadingElement>;
  /** Later steps that ask about this read step's code: shows the attention note. */
  laterSteps?: number[];
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
      {step.mode === "read" && <AttentionNote steps={laterSteps} />}
      {step.mode !== "read" && <CodeRefs refs={step.refs} />}
      {(step.mode === "fill" || step.mode === "order") && step.context && <Context text={step.context} />}

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
