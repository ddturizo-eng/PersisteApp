"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { StageIndicator } from "@/components/lesson/stage-indicator";
import { CodeStep, QuestionStep, TextStep, VisualStep } from "@/components/lesson/steps";
import type { Lesson } from "@/lib/lesson-schema";
import {
  canAdvance,
  clampIndex,
  isTypingTarget,
  stageStates,
  stepIndexFromParam,
  type Attempts,
} from "@/lib/player";

const subscribeToNothing = () => () => {};
const readStepParam = () => new URLSearchParams(window.location.search).get("step");

/**
 * Mounts the player at ?step= (1-based). The server and the first client render use step 1;
 * once the URL is known the player remounts at the requested step.
 */
export function LessonPlayerFromUrl({ lesson }: { lesson: Lesson }) {
  const stepParam = useSyncExternalStore(subscribeToNothing, readStepParam, () => null);
  const initialIndex = stepIndexFromParam(stepParam, lesson.steps.length);
  return <LessonPlayer key={stepParam ?? "server"} lesson={lesson} initialIndex={initialIndex} />;
}

/** One idea per screen with Continue/Back and ← → shortcuts (REQ-02, REQ-03). */
export function LessonPlayer({ lesson, initialIndex = 0 }: { lesson: Lesson; initialIndex?: number }) {
  const total = lesson.steps.length;
  const [index, setIndex] = useState(initialIndex);
  const [attempts, setAttempts] = useState<Attempts>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const step = lesson.steps[index];
  const isLast = index === total - 1;
  const advanceAllowed = canAdvance(lesson, index, attempts);

  const goTo = useCallback(
    (next: number) => {
      const target = clampIndex(next, total);
      setIndex(target);
      window.history.replaceState(null, "", `?step=${target + 1}`);
    },
    [total]
  );

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
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight" && advanceAllowed) {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        goTo(index - 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advanceAllowed, goTo, index]);

  function pick(option: number) {
    setAttempts((current) => {
      const picked = current[index] ?? [];
      return picked.includes(option) ? current : { ...current, [index]: [...picked, option] };
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-lesson flex-1 flex-col px-4 sm:px-6">
      <header className="space-y-4 border-b py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm text-muted-foreground">
            Sesión {lesson.session} · Módulo {lesson.module}
            {lesson.optional && " · Estudio autónomo"}
          </p>
          <p className="text-sm font-medium tabular-nums" aria-live="polite">
            Paso {index + 1} de {total}
          </p>
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-balance">{lesson.title}</h1>
        <StageIndicator states={stageStates(lesson, index)} />
        <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <section aria-label={`Paso ${index + 1}`} className="flex-1 py-8 sm:py-10">
        {step.kind === "text" && <TextStep key={index} step={step} headingRef={headingRef} />}
        {step.kind === "visual" && <VisualStep key={index} step={step} headingRef={headingRef} />}
        {step.kind === "question" && (
          <QuestionStep key={index} step={step} picked={attempts[index] ?? []} onPick={pick} headingRef={headingRef} />
        )}
        {step.kind === "code" && <CodeStep key={index} step={step} headingRef={headingRef} />}
      </section>

      <footer className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" isDisabled={index === 0} onPress={() => goTo(index - 1)}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Volver
          </Button>
          <p className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
            para navegar
          </p>
          <div className="flex flex-col items-end gap-1">
            {isLast ? (
              <LinkButton href="/">Terminar lección</LinkButton>
            ) : (
              <Button isDisabled={!advanceAllowed} onPress={() => goTo(index + 1)}>
                Continuar
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            )}
            {!advanceAllowed && !isLast && (
              <p className="text-xs text-muted-foreground">Responde correctamente para continuar</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Fuente:{" "}
          <Link href={lesson.source.url} className="underline underline-offset-2" target="_blank" rel="noreferrer">
            {lesson.source.label}
          </Link>
        </p>
      </footer>
    </main>
  );
}
