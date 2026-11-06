"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import { Check, X } from "lucide-react";
import { cn } from "cn";
import { submitQuizAnswer } from "@/app/actions/quiz";
import { Context } from "@/components/code/exercises";
import { optionOrder } from "@/lib/exercises";
import type { GradeResult, PublicQuizStep } from "@/lib/quiz";
import { InlineText } from "@/components/lesson/inline-text";
import type { StepNav } from "@/components/lesson/step-nav";

type Graded = Extract<GradeResult, { ok: true }> & { chosen: number };

/**
 * Module quiz (REQ-29): one question per screen, graded by the server, first answer is final.
 * Practice mode for now: nothing is stored and it is labelled «Sin puntaje» (CA4).
 */
export function QuizStep({
  step,
  lessonId,
  stepKey,
  onComplete,
  onNav,
  headingRef,
}: {
  step: PublicQuizStep;
  lessonId: string;
  stepKey: string;
  onComplete: () => void;
  onNav: (nav: StepNav) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const id = useId();
  const total = step.questions.length;
  const [current, setCurrent] = useState(0);
  const [graded, setGraded] = useState<Record<string, Graded>>({});
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const focusTarget = useRef<"question" | "feedback" | null>(null);

  useEffect(() => {
    if (focusTarget.current === "question") questionHeading.current?.focus();
    if (focusTarget.current === "feedback") feedbackRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    focusTarget.current = null;
  });

  const done = current >= total;
  const question = step.questions[current];
  const result = question ? graded[question.id] : undefined;
  const score = Object.values(graded).filter((g) => g.correct).length;

  async function answer(optionIndex: number) {
    if (!question || result || pending !== null) return;
    setPending(optionIndex);
    setError(null);
    try {
      const outcome = await submitQuizAnswer(lessonId, question.id, optionIndex);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      const next = { ...graded, [question.id]: { ...outcome, chosen: optionIndex } };
      setGraded(next);
      focusTarget.current = "feedback";
      if (Object.keys(next).length === total) onComplete();
    } catch {
      setError("No se pudo calificar la respuesta. Revisa la conexión y vuelve a elegir.");
    } finally {
      setPending(null);
    }
  }

  // The footer «Continuar» goes to the next question, then to the result, then out of the step.
  useEffect(() => {
    onNav({
      canAdvance: done || Boolean(result),
      advance: done ? null : () => {
        setCurrent((n) => n + 1);
        focusTarget.current = "question";
      },
      hint: "Elige una respuesta para continuar",
    });
  }, [done, result, onNav]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">Quiz</p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Sin puntaje · modo práctica
        </span>
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance focus:outline-none">
        {step.title ?? "Quiz del módulo"}
      </h2>

      {!done && question && (
        <section aria-labelledby={`${id}-q`} className="space-y-5">
          <p className="text-sm text-muted-foreground tabular-nums">
            Pregunta {current + 1} de {total}
          </p>
          {question.context && <Context text={question.context} />}
          <h3 id={`${id}-q`} ref={questionHeading} tabIndex={-1} className="max-w-prose text-xl font-semibold focus:outline-none">
            <InlineText text={question.prompt} />
          </h3>
          <ul role="list" aria-labelledby={`${id}-q`} className="max-w-prose space-y-3">
            {optionOrder(question.options.length, `${stepKey}-${question.id}`).map((index) => {
              const option = question.options[index];
              const chosen = result?.chosen === index;
              const isCorrect = result?.correctIndex === index;
              return (
                <li key={index}>
                  <button
                    type="button"
                    aria-disabled={Boolean(result) || pending !== null}
                    aria-describedby={result ? `${id}-feedback` : undefined}
                    onClick={() => answer(index)}
                    className={cn(
                      "flex min-h-14 w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base outline-none transition-colors focus-visible:ring-4 focus-visible:ring-ring/40",
                      !result && pending === null && "cursor-pointer border-border bg-card hover:border-foreground/50",
                      (result || pending !== null) && "cursor-default",
                      pending === index && "border-primary",
                      isCorrect && "border-success bg-success-soft",
                      chosen && !isCorrect && "border-destructive/50 bg-danger-soft",
                      result && !chosen && !isCorrect && "opacity-60"
                    )}
                  >
                    <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border">
                      {isCorrect && <Check className="size-3.5" />}
                      {chosen && !isCorrect && <X className="size-3.5" />}
                    </span>
                    <span>
                      <InlineText text={option.text} />
                      {chosen && <span className="sr-only"> (tu respuesta)</span>}
                      {isCorrect && <span className="sr-only"> (correcta)</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div ref={feedbackRef} id={`${id}-feedback`} aria-live="polite" className="max-w-prose scroll-mb-40 space-y-3">
            {pending !== null && <p className="text-sm text-muted-foreground">Calificando…</p>}
            {error && (
              <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-danger">
                {error}
              </p>
            )}
            {result && (
              <div
                className={cn(
                  "rounded-2xl p-4",
                  result.correct ? "bg-success-soft text-success" : "bg-danger-soft text-destructive"
                )}
              >
                <p className="flex items-center gap-2 font-semibold">
                  {result.correct ? <Check aria-hidden="true" className="size-4" /> : <X aria-hidden="true" className="size-4" />}
                  {result.correct ? "¡Correcto!" : "Incorrecto"}
                </p>
                <p className="mt-1 leading-relaxed text-foreground">
                  <InlineText text={result.explanation} />
                </p>
                {!result.correct && (
                  <p className="mt-2 leading-relaxed text-foreground">
                    <span className="font-medium">La correcta: </span>
                    {question.options[result.correctIndex].text}. {result.correctExplanation}
                  </p>
                )}
              </div>
            )}
          </div>

        </section>
      )}

      {done && (
        <section aria-labelledby={`${id}-summary`} className="max-w-prose space-y-4">
          <h3 id={`${id}-summary`} ref={questionHeading} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
            Acertaste {score} de {total}
          </h3>
          <ol className="space-y-2">
            {step.questions.map((q, i) => {
              const g = graded[q.id];
              return (
                <li key={q.id} className="flex items-start gap-2">
                  {g?.correct ? (
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
                  )}
                  <span>
                    <span className="sr-only">{g?.correct ? "Correcta: " : "Incorrecta: "}</span>
                    {i + 1}. <InlineText text={q.prompt} />
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-sm text-muted-foreground">
            Este intento no suma al ranking. Para sumar puntos, entra a la sala de tu grupo con el código que proyecta el docente.
          </p>
        </section>
      )}
    </div>
  );
}
