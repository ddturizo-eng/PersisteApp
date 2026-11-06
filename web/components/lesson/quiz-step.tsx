"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { cn } from "cn";
import { submitQuizAnswer } from "@/app/actions/quiz";
import { Context } from "@/components/code/exercises";
import { Button } from "@/components/ui/button";
import { optionOrder } from "@/lib/exercises";
import type { GradeResult, PublicQuizStep } from "@/lib/quiz";

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
  headingRef,
}: {
  step: PublicQuizStep;
  lessonId: string;
  stepKey: string;
  onComplete: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const id = useId();
  const total = step.questions.length;
  const [current, setCurrent] = useState(0);
  const [graded, setGraded] = useState<Record<string, Graded>>({});
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const focusTarget = useRef<"question" | "next" | null>(null);

  useEffect(() => {
    if (focusTarget.current === "question") questionHeading.current?.focus();
    if (focusTarget.current === "next") nextButton.current?.focus();
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
      focusTarget.current = "next";
      if (Object.keys(next).length === total) onComplete();
    } catch {
      setError("No se pudo calificar la respuesta. Revisa la conexión y vuelve a elegir.");
    } finally {
      setPending(null);
    }
  }

  function advance() {
    setCurrent((n) => n + 1);
    focusTarget.current = "question";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">Quiz</p>
        <span className="rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
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
            {question.prompt}
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
                      "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors",
                      !result && pending === null && "cursor-pointer hover:border-primary hover:bg-accent",
                      (result || pending !== null) && "cursor-default",
                      pending === index && "border-primary",
                      isCorrect && "border-success/50 bg-success-soft text-success",
                      chosen && !isCorrect && "border-danger/40 bg-danger-soft text-danger",
                      result && !chosen && !isCorrect && "opacity-60"
                    )}
                  >
                    <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border">
                      {isCorrect && <Check className="size-3.5" />}
                      {chosen && !isCorrect && <X className="size-3.5" />}
                    </span>
                    <span>
                      {option.text}
                      {chosen && <span className="sr-only"> (tu respuesta)</span>}
                      {isCorrect && <span className="sr-only"> (correcta)</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div id={`${id}-feedback`} aria-live="polite" className="max-w-prose space-y-3">
            {pending !== null && <p className="text-sm text-muted-foreground">Calificando…</p>}
            {error && (
              <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-danger">
                {error}
              </p>
            )}
            {result && (
              <div
                className={cn(
                  "rounded-lg border p-4",
                  result.correct ? "border-success/40 bg-success-soft text-success" : "border-danger/40 bg-danger-soft text-danger"
                )}
              >
                <p className="font-semibold">{result.correct ? "Correcto" : "Incorrecto"}</p>
                <p className="mt-1">{result.explanation}</p>
                {!result.correct && (
                  <p className="mt-2">
                    <span className="font-medium">La correcta: </span>
                    {question.options[result.correctIndex].text}. {result.correctExplanation}
                  </p>
                )}
              </div>
            )}
          </div>

          {result && (
            <Button ref={nextButton} variant="secondary" onPress={advance}>
              {current + 1 < total ? "Siguiente pregunta" : "Ver resultado"}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          )}
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
                    {i + 1}. {q.prompt}
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
