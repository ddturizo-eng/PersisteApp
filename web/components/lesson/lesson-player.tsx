"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ExpositionTimer, ExpositionToggle } from "@/components/exposition";
import { StageIndicator } from "@/components/lesson/stage-indicator";
import { StepOverview } from "@/components/lesson/step-overview";
import { TraceStep } from "@/components/lesson/trace-step";
import { SnippetsProvider } from "@/components/lesson/code-refs";
import { useMarkDone } from "@/components/progress";
import { laterUses, type SnippetMap } from "@/lib/snippets";
import { CodeStep, QuestionStep, TextStep, VisualStep } from "@/components/lesson/steps";
import type { StepNav } from "@/components/lesson/step-nav";
import type { Highlights } from "@/lib/highlight";
import { stageLabels, type Lesson } from "@/lib/lesson-schema";
import {
  canAdvance,
  clampIndex,
  isTypingTarget,
  stageStates,
  stepIndexFromParam,
  type Attempts,
  type SolvedExercises,
} from "@/lib/player";

/**
 * The URL never changes on its own, but React may keep the server snapshot (null) after
 * hydration until something else re-renders. One notification right after subscribing makes it
 * read ?step= at once (bug of 7 Nov 2026: links with ?step= opened at step 1).
 */
const subscribeOnce = (onChange: () => void) => {
  const timer = setTimeout(onChange, 0);
  return () => clearTimeout(timer);
};
const readStepParam = () => new URLSearchParams(window.location.search).get("step");

/**
 * Mounts the player at ?step= (1-based). The server and the first client render use step 1;
 * once the URL is known the player remounts at the requested step.
 */
export function LessonPlayerFromUrl({
  lesson,
  highlights,
  snippets = {},
  next,
}: {
  lesson: Lesson;
  highlights: Highlights;
  snippets?: SnippetMap;
  next: NextStop;
}) {
  const stepParam = useSyncExternalStore(subscribeOnce, readStepParam, () => null);
  const initialIndex = stepIndexFromParam(stepParam, lesson.steps.length);
  return (
    <SnippetsProvider value={{ snippets, highlights }}>
      <LessonPlayer key={stepParam ?? "server"} lesson={lesson} highlights={highlights} next={next} initialIndex={initialIndex} />
    </SnippetsProvider>
  );
}

/** Where the last step leads: the next module, or the final quiz after the last one (REQ-26 CA4). */
export type NextStop = { href: string; label: string };

/** One idea per screen with Continue/Back and ← → shortcuts (REQ-02, REQ-03). */
export function LessonPlayer({
  lesson,
  highlights,
  next: nextStop,
  initialIndex = 0,
}: {
  lesson: Lesson;
  highlights: Highlights;
  next: NextStop;
  initialIndex?: number;
}) {
  const total = lesson.steps.length;
  const [index, setIndex] = useState(initialIndex);
  const [attempts, setAttempts] = useState<Attempts>({});
  const [solved, setSolved] = useState<SolvedExercises>({});
  const [overviewOpen, setOverviewOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Steps with inner screens (trace moments) take over «Continuar» while they last.
  const [nav, setNav] = useState<{ index: number; nav: StepNav } | null>(null);
  const innerNav = nav?.index === index ? nav.nav : null;
  const onNav = useCallback((next: StepNav) => setNav({ index, nav: next }), [index]);

  const step = lesson.steps[index];
  const stepRefs = lesson.steps.map((s) => ({ refs: "refs" in s ? s.refs : undefined }));
  const isLast = index === total - 1;
  const stepDone = canAdvance(lesson, index, attempts, solved);
  const advanceAllowed = innerNav ? innerNav.canAdvance : stepDone;
  // Finished = reaching the last step, where «Siguiente módulo» appears (T-22: landing and menu marks).
  useMarkDone(lesson.id, isLast && !innerNav?.advance);

  const goTo = useCallback(
    (next: number) => {
      const target = clampIndex(next, total);
      setIndex(target);
      window.history.replaceState(null, "", `?step=${target + 1}`);
    },
    [total]
  );

  const next = useCallback(() => {
    if (innerNav?.advance) innerNav.advance();
    else goTo(index + 1);
  }, [goTo, index, innerNav]);

  // Move focus to the new step's heading so keyboard and screen-reader users start there.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: "nearest" });
  }, [index]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      // An open dialog («Ver código», overview) owns the keyboard: ← → must not change step behind it.
      if (isTypingTarget(event.target) || overviewOpen || document.querySelector("dialog[open]")) return;
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        setOverviewOpen(true);
        return;
      }
      if (event.key === "ArrowRight" && advanceAllowed && !(isLast && !innerNav?.advance)) {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        goTo(index - 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advanceAllowed, goTo, index, overviewOpen, next, isLast, innerNav]);

  function pick(option: number) {
    setAttempts((current) => {
      const picked = current[index] ?? [];
      return picked.includes(option) ? current : { ...current, [index]: [...picked, option] };
    });
  }

  return (
    <main data-lesson-player="" className="mx-auto flex w-full max-w-lesson flex-1 flex-col px-4 sm:px-6">
      <header className="space-y-2 border-b py-3 sm:space-y-4 sm:py-5 exposition:space-y-2 exposition:py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm text-muted-foreground">
            Sesión {lesson.session} · Módulo {lesson.module}
            {lesson.optional && " · Estudio autónomo"}
            {/* On phones the stage indicator is hidden: the current stage goes on this line. */}
            <span className="sm:hidden"> · {stageLabels[step.stage]}</span>
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOverviewOpen(true)}
              className="rounded-md text-sm font-medium tabular-nums underline-offset-4 hover:underline"
              aria-live="polite"
            >
              Paso {index + 1} de {total}
              <span className="sr-only">. Ver todos los pasos (tecla O)</span>
            </button>
            <ExpositionToggle className="hidden sm:inline-flex" />
          </div>
        </div>
        <h1 className="line-clamp-2 text-base font-semibold tracking-tight text-balance sm:text-lg exposition:sr-only">{lesson.title}</h1>
        <div className="hidden sm:block">
          <StageIndicator states={stageStates(lesson, index)} />
        </div>
        <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-muted exposition:hidden">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <section aria-label={`Paso ${index + 1}`} className="flex-1 py-6 sm:py-10 exposition:py-5">
        {step.kind === "text" && <TextStep key={index} step={step} headingRef={headingRef} />}
        {step.kind === "visual" && <VisualStep key={index} step={step} headingRef={headingRef} />}
        {step.kind === "question" && (
          <QuestionStep
            key={index}
            step={step}
            stepKey={`${lesson.id}-${index}`}
            picked={attempts[index] ?? []}
            onPick={pick}
            headingRef={headingRef}
          />
        )}
        {step.kind === "code" && (
          <CodeStep
            key={index}
            step={step}
            stepKey={`${lesson.id}-${index}`}
            highlights={highlights}
            solved={solved[index] === true}
            onSolved={() => setSolved((current) => ({ ...current, [index]: true }))}
            headingRef={headingRef}
            laterSteps={step.mode === "read" && step.snippet ? laterUses(stepRefs, index, step.snippet) : []}
          />
        )}
        {step.kind === "trace" && (
          <TraceStep
            key={index}
            step={step}
            highlights={highlights}
            solved={solved[index] === true}
            onSolved={() => setSolved((current) => ({ ...current, [index]: true }))}
            onNav={onNav}
            headingRef={headingRef}
          />
        )}
      </section>

      <footer className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 exposition:py-2">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" isDisabled={index === 0} onPress={() => goTo(index - 1)}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Volver
          </Button>
          <div className="hidden items-center gap-4 sm:flex">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Kbd>←</Kbd>
              <Kbd>→</Kbd>
              navegar
              <Kbd className="ml-2">O</Kbd>
              pasos
            </p>
            <ExpositionTimer />
          </div>
          <div className="flex flex-col items-end gap-1">
            {isLast && !innerNav?.advance ? (
              <LinkButton href={nextStop.href}>
                {nextStop.label}
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </LinkButton>
            ) : (
              <Button isDisabled={!advanceAllowed} onPress={next}>
                Continuar
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            )}
            {!advanceAllowed && (
              <p className="text-xs text-muted-foreground">
                {innerNav?.hint ??
                  (step.kind === "code" || step.kind === "trace"
                    ? "Resuelve el ejercicio para continuar"
                    : "Responde correctamente para continuar")}
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground exposition:hidden">
          Fuente:{" "}
          <a href={lesson.source.url} className="underline underline-offset-2" target="_blank" rel="noreferrer">
            {lesson.source.label}
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </p>
      </footer>
      <StepOverview
        lesson={lesson}
        current={index}
        open={overviewOpen}
        onClose={() => setOverviewOpen(false)}
        onJump={goTo}
      />
    </main>
  );
}
