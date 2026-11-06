"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import { ArrowRight, Check, Database, FileCode2, FileKey2, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/code/code-view";
import { highlightKey, type Highlights } from "@/lib/highlight";
import { stageLabels } from "@/lib/lesson-schema";
import {
  currentEventIndex,
  feedbackFor,
  isEventSolved,
  locationLabel,
  pickLocation,
  type TracePicks,
  type TraceStep as TraceStepData,
} from "@/lib/trace";

const kindIcon = { file: FileKey2, class: FileCode2, db: Database } as const;

/**
 * «¿Dónde ocurre?» (REQ-27): chronological events, one decision per screen.
 * Left: the timeline so far. Right: the current event. Ends with a summary table.
 */
export function TraceStep({
  step,
  highlights,
  solved,
  onSolved,
  headingRef,
}: {
  step: TraceStepData;
  highlights: Highlights;
  solved: boolean;
  onSolved: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const id = useId();
  const total = step.events.length;
  const [picks, setPicks] = useState<TracePicks>(() =>
    solved ? Object.fromEntries(step.events.map((event, i) => [i, [event.answer]])) : {}
  );
  const [view, setView] = useState(solved ? total : 0);
  const eventHeading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<"heading" | "next" | null>(null);

  const frontier = currentEventIndex(step, picks);
  const event = step.events[view];
  const picked = picks[view] ?? [];
  const eventSolved = event ? isEventSolved(event, picked) : true;
  const feedback = event ? feedbackFor(event, picked) : undefined;

  useEffect(() => {
    if (focusNext.current === "heading") eventHeading.current?.focus();
    if (focusNext.current === "next") nextButton.current?.focus();
    focusNext.current = null;
  });

  function choose(location: string) {
    if (!event || eventSolved || picked.includes(location)) return;
    const next = pickLocation(step, picks, view, location);
    setPicks(next);
    if (location === event.answer) {
      focusNext.current = "next";
      if (currentEventIndex(step, next) === total) onSolved();
    }
  }

  function goTo(index: number) {
    setView(index);
    focusNext.current = "heading";
  }

  const lookup = (language: string, source: string) => highlights[highlightKey(language, source)];

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-muted-foreground">{stageLabels[step.stage]}</p>
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance focus:outline-none">
        {step.title}
      </h2>
      <p className="max-w-prose text-lg leading-relaxed">{step.intro}</p>

      <div className="grid gap-6 md:grid-cols-[15rem_1fr]">
        {/* Timeline */}
        <nav aria-label="Línea de tiempo del recorrido" className="md:border-r md:pr-4">
          <ol className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:gap-0 md:overflow-visible">
            {step.events.map((item, i) => {
              const done = isEventSolved(item, picks[i]);
              const reachable = i <= frontier;
              const isView = i === view;
              return (
                <li key={i} className="shrink-0 md:shrink">
                  <button
                    type="button"
                    aria-current={isView ? "step" : undefined}
                    aria-disabled={!reachable}
                    onClick={() => reachable && goTo(i)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                      isView && "bg-accent text-accent-foreground",
                      !isView && reachable && "hover:bg-muted",
                      !reachable && "cursor-default text-muted-foreground"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
                        done && "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span className="hidden min-w-0 md:block">
                      <span className="block">{item.moment}</span>
                      {done && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {locationLabel(step, item.answer)}
                        </span>
                      )}
                    </span>
                    <span className="sr-only md:hidden">
                      Momento {i + 1}: {item.moment}
                      {done ? `, ${locationLabel(step, item.answer)}` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
            <li className="shrink-0 md:mt-1 md:shrink">
              <button
                type="button"
                aria-current={view === total ? "step" : undefined}
                aria-disabled={frontier < total}
                onClick={() => frontier === total && goTo(total)}
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm",
                  view === total && "bg-accent text-accent-foreground",
                  frontier < total && "cursor-default text-muted-foreground",
                  frontier === total && view !== total && "hover:bg-muted"
                )}
              >
                Resumen
              </button>
            </li>
          </ol>
        </nav>

        {/* Current event or summary */}
        {event ? (
          <section aria-labelledby={`${id}-event`} className="min-w-0 space-y-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground tabular-nums">
                Momento {view + 1} de {total} · {event.moment}
              </p>
              <h3 id={`${id}-event`} ref={eventHeading} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
                {event.description}
              </h3>
            </div>

            <fieldset className="min-w-0 space-y-2">
              <legend className="mb-2 font-medium">¿Dónde ocurre?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {event.options.map((option) => {
                  const location = step.locations.find((l) => l.id === option);
                  const Icon = kindIcon[location?.kind ?? "class"];
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
                        "flex items-center gap-3 rounded-lg border px-4 py-3 text-left font-mono text-sm",
                        !locked && "cursor-pointer hover:border-primary hover:bg-accent",
                        locked && "cursor-default",
                        right && "border-success/60 bg-success-soft text-success",
                        wrong && "border-danger/40 bg-danger-soft text-danger",
                        eventSolved && !tried && "opacity-50"
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">{location?.label ?? option}</span>
                      {right && <Check aria-hidden="true" className="ml-auto size-4 shrink-0" />}
                      {wrong && <X aria-hidden="true" className="ml-auto size-4 shrink-0" />}
                      <span className="sr-only">{right ? " (correcto)" : wrong ? " (incorrecto)" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div id={`${id}-feedback`} aria-live="polite" className="space-y-4">
              {feedback && (
                <div
                  className={cn(
                    "rounded-lg border p-4",
                    feedback.correct
                      ? "border-success/40 bg-success-soft text-success"
                      : "border-danger/40 bg-danger-soft text-danger"
                  )}
                >
                  <p className="font-semibold">{feedback.correct ? "Correcto" : "Ahí no ocurre"}</p>
                  <p className="mt-1">{feedback.text}</p>
                  {!feedback.correct && <p className="mt-2 text-sm">Prueba otro lugar.</p>}
                </div>
              )}
              {eventSolved && event.code && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">
                    Así se ve en <span className="font-mono">{locationLabel(step, event.answer)}</span>
                  </p>
                  <CodeView lines={lookup(event.code.language, event.code.source)} fallback={event.code.source} />
                </div>
              )}
            </div>

            {eventSolved && (
              <Button ref={nextButton} variant="secondary" onPress={() => goTo(view + 1)}>
                {view + 1 < total ? "Siguiente momento" : "Ver resumen"}
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            )}
          </section>
        ) : (
          <section aria-labelledby={`${id}-summary`} className="min-w-0 space-y-4">
            <h3 id={`${id}-summary`} ref={eventHeading} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
              Resumen: el recorrido completo
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Cada momento del recorrido y dónde ocurre</caption>
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">#</th>
                    <th scope="col" className="px-3 py-2 font-medium">Qué pasa</th>
                    <th scope="col" className="px-3 py-2 font-medium">Dónde</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {step.events.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 align-top text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2 align-top">
                        <span className="block text-xs text-muted-foreground">{item.moment}</span>
                        {item.description}
                      </td>
                      <td className="px-3 py-2 align-top font-mono text-xs">{locationLabel(step, item.answer)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">Ya puedes continuar con el siguiente paso.</p>
          </section>
        )}
      </div>
    </div>
  );
}
