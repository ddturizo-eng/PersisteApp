"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import { Check, Database, FileCode2, FileKey2, Network, X } from "lucide-react";
import { cn } from "cn";
import { CodeRefs } from "@/components/lesson/code-refs";
import { CodeView } from "@/components/code/code-view";
import { highlightKey, type Highlights } from "@/lib/highlight";
import { stageLabels } from "@/lib/lesson-schema";
import { InlineText } from "@/components/lesson/inline-text";
import type { StepNav } from "@/components/lesson/step-nav";
import {
  currentEventIndex,
  feedbackFor,
  isEventSolved,
  locationLabel,
  pickLocation,
  type TracePicks,
  type TraceStep as TraceStepData,
} from "@/lib/trace";

const kindIcon = { file: FileKey2, class: FileCode2, network: Network, db: Database } as const;

/** «Aplicación Java (ProductRepository.java)» → name «Aplicación Java», detail «ProductRepository.java». */
function splitLabel(label: string): { name: string; detail?: string } {
  const match = /^(.*?)\s*\((.+)\)$/.exec(label);
  return match ? { name: match[1], detail: match[2] } : { name: label };
}

/**
 * «¿Dónde ocurre?» (REQ-27), mobile-first like the lesson apps students already know:
 * one moment per screen, a segmented progress bar, the situation in a card, big answer cards,
 * feedback right under the answers, and the footer «Continuar» as the only way forward.
 */
export function TraceStep({
  step,
  highlights,
  solved,
  onSolved,
  onNav,
  headingRef,
}: {
  step: TraceStepData;
  highlights: Highlights;
  solved: boolean;
  onSolved: () => void;
  onNav: (nav: StepNav) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const id = useId();
  const total = step.events.length;
  const [picks, setPicks] = useState<TracePicks>(() =>
    solved ? Object.fromEntries(step.events.map((event, i) => [i, [event.answer]])) : {}
  );
  const [view, setView] = useState(solved ? total : 0);
  const eventHeading = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const focusHeading = useRef(false);
  const revealFeedback = useRef(false);

  const frontier = currentEventIndex(step, picks);
  const event = step.events[view];
  const picked = picks[view] ?? [];
  const eventSolved = event ? isEventSolved(event, picked) : true;
  const feedback = event ? feedbackFor(event, picked) : undefined;

  useEffect(() => {
    if (focusHeading.current) eventHeading.current?.focus({ preventScroll: true });
    if (focusHeading.current) eventHeading.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    if (revealFeedback.current) feedbackRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    focusHeading.current = false;
    revealFeedback.current = false;
  });

  // The footer «Continuar» moves through the moments, then to the summary, then out of the step.
  useEffect(() => {
    onNav({
      canAdvance: eventSolved,
      advance: view < total ? () => goTo(view + 1) : null,
      hint: "Elige dónde ocurre para continuar",
    });
  }, [view, eventSolved, total, onNav]);

  function choose(location: string) {
    if (!event || eventSolved || picked.includes(location)) return;
    const next = pickLocation(step, picks, view, location);
    setPicks(next);
    revealFeedback.current = true;
    if (location === event.answer && currentEventIndex(step, next) === total) onSolved();
  }

  function goTo(index: number) {
    setView(index);
    focusHeading.current = true;
  }

  const lookup = (language: string, source: string) => highlights[highlightKey(language, source)];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{stageLabels[step.stage]}</p>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance focus:outline-none">
          {step.title}
        </h2>
        {/* The instructions matter once; after the first moment they only take space. */}
        {view === 0 && (
          <p className="max-w-prose text-lg leading-relaxed text-muted-foreground">
            <InlineText text={step.intro} />
          </p>
        )}
        <CodeRefs refs={step.refs} />
      </div>

      {/* Segmented progress: one segment per moment, then the summary. */}
      <div className="space-y-2">
        <ol aria-label="Progreso del recorrido" className="flex gap-1">
          {step.events.map((item, i) => {
            const done = isEventSolved(item, picks[i]);
            const reachable = i <= frontier;
            return (
              <li key={i} className="flex-1">
                <button
                  type="button"
                  aria-label={`Momento ${i + 1}: ${item.moment}${done ? ", resuelto" : ""}`}
                  aria-current={i === view ? "step" : undefined}
                  disabled={!reachable}
                  onClick={() => goTo(i)}
                  className="block h-6 w-full py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "block h-2 rounded-full transition-colors",
                      done ? "bg-primary" : i === view ? "bg-primary/40" : "bg-muted"
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-muted-foreground tabular-nums">
          {event ? (
            <>
              Momento {view + 1} de {total} · <span className="font-medium text-foreground">{event.moment}</span>
            </>
          ) : (
            "Recorrido completo"
          )}
        </p>
      </div>

      {event ? (
        <section aria-labelledby={`${id}-event`} className="space-y-5">
          {/* The situation: what is happening right now. */}
          <div className="rounded-3xl bg-card p-5 shadow-[0_1px_0_0_var(--border)]">
            <h3
              id={`${id}-event`}
              ref={eventHeading}
              tabIndex={-1}
              className="scroll-mt-24 text-xl leading-snug font-semibold [overflow-wrap:anywhere] focus:outline-none"
            >
              <InlineText text={event.description} />
            </h3>
          </div>

          <fieldset className="min-w-0 space-y-3">
            <legend className="mb-3 text-lg font-semibold">¿Dónde ocurre?</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {event.options.map((option) => {
                const location = step.locations.find((l) => l.id === option);
                const Icon = kindIcon[location?.kind ?? "class"];
                const { name, detail } = splitLabel(location?.label ?? option);
                const tried = picked.includes(option);
                const right = tried && option === event.answer;
                const wrong = tried && option !== event.answer;
                const locked = eventSolved || wrong;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-disabled={locked}
                    aria-describedby={tried ? `${id}-feedback` : undefined}
                    onClick={() => choose(option)}
                    className={cn(
                      "flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left outline-none transition-colors focus-visible:ring-4 focus-visible:ring-ring/40",
                      !locked && "border-border bg-card hover:border-foreground/50 active:scale-[0.99]",
                      locked && "cursor-default",
                      right && "border-success bg-success-soft",
                      wrong && "border-destructive/50 bg-danger-soft",
                      eventSolved && !tried && "border-border opacity-50"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        right ? "bg-success text-background" : wrong ? "bg-destructive text-background" : "bg-muted"
                      )}
                    >
                      {right ? <Check className="size-5" /> : wrong ? <X className="size-5" /> : <Icon className="size-5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{name}</span>
                      {detail && <span className="block font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{detail}</span>}
                    </span>
                    <span className="sr-only">{right ? " (correcto)" : wrong ? " (incorrecto)" : ""}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div ref={feedbackRef} id={`${id}-feedback`} aria-live="polite" className="scroll-mb-40 space-y-4">
            {feedback && (
              <div
                className={cn(
                  "space-y-1 rounded-2xl p-4",
                  feedback.correct ? "bg-success-soft text-success" : "bg-danger-soft text-destructive"
                )}
              >
                <p className="flex items-center gap-2 font-semibold">
                  {feedback.correct ? <Check aria-hidden="true" className="size-4" /> : <X aria-hidden="true" className="size-4" />}
                  {feedback.correct ? "¡Correcto!" : "Ahí no ocurre"}
                </p>
                <p className="leading-relaxed text-foreground">
                  <InlineText text={feedback.text} />
                </p>
                {!feedback.correct && <p className="text-sm">Prueba con otra opción.</p>}
              </div>
            )}
            {eventSolved && event.code && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Así se ve en {splitLabel(locationLabel(step, event.answer)).detail ?? locationLabel(step, event.answer)}</p>
                <CodeView lines={lookup(event.code.language, event.code.source)} fallback={event.code.source} />
              </div>
            )}
          </div>
        </section>
      ) : (
        <section aria-labelledby={`${id}-summary`} className="space-y-4">
          <h3 id={`${id}-summary`} ref={eventHeading} tabIndex={-1} className="scroll-mt-24 text-xl font-semibold focus:outline-none">
            El recorrido completo
          </h3>
          <ol className="space-y-2">
            {step.events.map((item, i) => {
              const { name, detail } = splitLabel(locationLabel(step, item.answer));
              return (
                <li key={i} className="flex gap-3 rounded-2xl bg-card p-4">
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="block text-sm text-muted-foreground">{item.moment}</span>
                    <span className="block leading-snug">
                      <InlineText text={item.description} />
                    </span>
                    <span className="block text-sm font-medium text-primary">
                      → {name}
                      {detail && <span className="font-mono text-xs text-muted-foreground"> · {detail}</span>}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
