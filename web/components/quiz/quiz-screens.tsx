"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Copy, Eye, Hourglass, ShieldAlert, Trophy, X } from "lucide-react";
import { cn } from "cn";
import { Context } from "@/components/code/exercises";
import { InlineText } from "@/components/lesson/inline-text";
import { FinalQuizPlayer } from "@/components/quiz/final-quiz-player";
import { Button } from "@/components/ui/button";
import { bandLabels } from "@/lib/live-quiz";
import type { PublicQuiz } from "@/lib/quiz";
import type { LiveResult } from "@/lib/quiz-room";

/** Re-renders the server page every 5 s while the tab is visible (design §12.2). */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(timer);
  }, [router, seconds]);
  return null;
}

/** Rules shown before the quiz (REQ-34 CA1, REQ-35 CA7). */
export function QuizRules({ questions, minutes }: { questions: number; minutes: number }) {
  const rules = [
    { icon: Trophy, text: `${questions} preguntas de opción única. Cada acierto vale ${5 / questions} en una nota de 0 a 5.` },
    { icon: Clock, text: `Cada pregunta tiene su propio tiempo, según lo que hay que leer (unos ${minutes} minutos en total). Si se acaba, cuenta como incorrecta.` },
    { icon: Check, text: "Solo cuenta tu primera respuesta. Verás si acertaste y la explicación cuando el docente cierre el quiz." },
    { icon: Eye, text: "Si sales de esta pestaña o de la aplicación, recibes un aviso. La segunda vez el quiz se bloquea y solo el docente puede rehabilitarlo." },
    { icon: Copy, text: "No se puede copiar el texto de las preguntas, y cada pantalla lleva tu nombre y los últimos dígitos de tu documento de forma tenue." },
    { icon: Hourglass, text: "Con empate en aciertos, en el ranking gana quien respondió más rápido sus aciertos. El tiempo no cambia tu nota." },
  ];
  return (
    <ul role="list" className="space-y-3">
      {rules.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-3">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <Icon className="size-4" />
          </span>
          <span className="pt-1.5 leading-relaxed">{text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Warm-up without a room (REQ-29 CA4): different, simpler questions; immediate feedback, nothing stored. */
export function PracticeQuiz({ quiz }: { quiz: PublicQuiz }) {
  const [open, setOpen] = useState(false);
  if (open) return <FinalQuizPlayer quiz={quiz} />;
  return (
    <Button variant="outline" onPress={() => setOpen(true)}>
      Hacer el calentamiento
    </Button>
  );
}

/** Grade, band and, once the teacher closes the quiz, the detail with explanations (REQ-29 CA5). */
export function QuizResult({ result }: { result: LiveResult }) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="nota" className="space-y-4 rounded-3xl bg-secondary p-6 text-secondary-foreground">
        <h2 id="nota" className="text-sm font-medium">
          Tu nota
        </h2>
        <p className="text-6xl font-semibold tracking-tight tabular-nums">{result.grade.toFixed(1)}</p>
        <p className="tabular-nums">
          {result.correct} de {result.total} aciertos
          {result.band && (
            <>
              {" · "}
              <span className="font-semibold">{bandLabels[result.band]}</span> del grupo
            </>
          )}
        </p>
        {result.provisional && (
          <p className="text-sm">
            Resultado provisional: tu franja puede cambiar mientras tus compañeros terminan. Las explicaciones aparecen cuando el
            docente cierre el quiz.
          </p>
        )}
      </section>

      {result.detail && (
        <section aria-labelledby="detalle" className="space-y-4">
          <h2 id="detalle" className="text-xl font-semibold">
            Pregunta por pregunta
          </h2>
          <ol className="space-y-4">
            {result.detail.map((row, i) => (
              <li key={row.id} className="space-y-3 rounded-2xl border p-4">
                <p className="flex items-start gap-2 font-medium">
                  {row.correct ? (
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
                  )}
                  <span>
                    <span className="sr-only">{row.correct ? "Correcta. " : "Incorrecta. "}</span>
                    {i + 1}. <InlineText text={row.prompt} />
                  </span>
                </p>
                {row.context && <Context text={row.context} />}
                <dl className="grid gap-1 text-sm">
                  <dt className="text-muted-foreground">Tu respuesta</dt>
                  <dd className={cn(!row.correct && "text-danger")}>
                    {row.chosen ? <InlineText text={row.chosen} /> : "Sin responder: se acabó el tiempo"}
                    {row.seconds !== undefined && <span className="text-muted-foreground"> · {row.seconds} s</span>}
                  </dd>
                  {!row.correct && (
                    <>
                      <dt className="mt-2 text-muted-foreground">La correcta</dt>
                      <dd>
                        <InlineText text={row.correctText} />
                      </dd>
                    </>
                  )}
                </dl>
                <p className="leading-relaxed">
                  <InlineText text={row.explanation} />
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/** Shown while the quiz is blocked after the second exit (REQ-35 CA3, CA4). */
export function BlockedNotice() {
  return (
    <section role="alert" className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-foreground">
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
      <div className="space-y-1">
        <p className="font-semibold">Tu quiz está bloqueado</p>
        <p>Saliste de la pestaña dos veces. Pide al docente que te rehabilite; esta página se actualiza sola cuando lo haga.</p>
      </div>
    </section>
  );
}
