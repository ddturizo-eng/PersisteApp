"use client";

import { useCallback, useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { reportExit, startQuestion, submitLiveAnswer, type StartedQuestion } from "@/app/actions/quiz";
import { Context } from "@/components/code/exercises";
import { InlineText } from "@/components/lesson/inline-text";
import { Button } from "@/components/ui/button";

type Question = Extract<StartedQuestion, { ok: true }>;
type Saved = { option: number | null; timedOut: boolean };

/** Exits closer than this count once (REQ-35 CA3). */
const EXIT_DEBOUNCE_MS = 5000;

/** Blocks copy, cut and the context menu over the question (REQ-35 CA5). */
const block = (event: SyntheticEvent) => event.preventDefault();

/**
 * Live final quiz (REQ-29, REQ-35): one question per screen with a server-measured countdown.
 * The answer is stored but not graded on screen; results appear when the teacher closes the quiz.
 */
export function LiveQuiz({
  order,
  answered,
  exits: initialExits,
  watermark,
}: {
  order: string[];
  answered: string[];
  exits: number;
  watermark: string;
}) {
  const router = useRouter();
  const id = useId();
  const total = order.length;
  const pendingIds = order.filter((q) => !answered.includes(q));
  const [position, setPosition] = useState(0);
  const currentId = pendingIds[position];
  const number = total - pendingIds.length + position + 1;

  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [sending, setSending] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [warning, setWarning] = useState<{ exits: number; limit: number } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const savedRef = useRef<Saved | null>(null);

  // Load the current question from the server; the countdown uses the server's remaining time.
  useEffect(() => {
    if (!currentId) {
      router.refresh();
      return;
    }
    let cancelled = false;
    startQuestion(currentId)
      .then((started) => {
        if (cancelled) return;
        if (!started.ok) {
          setError(started.error);
          if (started.blocked) router.refresh();
          return;
        }
        setQuestion(started);
        setDeadline(Date.now() + started.remainingMs);
        if (started.answered) {
          savedRef.current = { option: null, timedOut: false };
          setSaved(savedRef.current);
        }
        headingRef.current?.focus();
      })
      .catch(() => !cancelled && setError("No se pudo cargar la pregunta. Revisa la conexión y recarga la página."));
    return () => {
      cancelled = true;
    };
  }, [currentId, router]);

  const send = useCallback(
    async (option: number | null) => {
      if (!question || savedRef.current) return;
      setSending(option ?? -1);
      setError(null);
      try {
        const outcome = await submitLiveAnswer(question.id, option);
        if (!outcome.ok) {
          setError(outcome.error);
          if (outcome.blocked) router.refresh();
          return;
        }
        savedRef.current = { option, timedOut: outcome.timedOut };
        setSaved(savedRef.current);
      } catch {
        setError("No se pudo guardar la respuesta. Revisa la conexión y vuelve a elegir.");
      } finally {
        setSending(null);
      }
    },
    [question, router]
  );

  // Countdown; at zero the question is sent as unanswered (REQ-35 CA2).
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const ms = Math.max(0, deadline - Date.now());
      setLeft(Math.ceil(ms / 1000));
      if (ms === 0 && !savedRef.current) void send(null);
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [deadline, send]);

  const next = useCallback(() => {
    savedRef.current = null;
    setSaved(null);
    setQuestion(null);
    setDeadline(null);
    setLeft(null);
    setError(null);
    setPosition((p) => p + 1);
  }, []);

  // When time runs out, move on by itself after a short pause.
  useEffect(() => {
    if (!saved?.timedOut) return;
    const timer = window.setTimeout(next, 2000);
    return () => window.clearTimeout(timer);
  }, [saved, next]);

  // Leaving the tab or the app is recorded; the second time blocks the quiz (REQ-35 CA3).
  // Only visibilitychange: blur also fires for notifications and split screen (false positives).
  useEffect(() => {
    let lastExit = 0;
    function onVisibility() {
      if (document.visibilityState !== "hidden") return;
      // One flicker of the screen (an incoming-call banner, the OS switcher) can fire twice in a row.
      if (Date.now() - lastExit < EXIT_DEBOUNCE_MS) return;
      lastExit = Date.now();
      reportExit()
        .then((result) => {
          if (!result.ok) return;
          if (result.blocked) router.refresh();
          else setWarning({ exits: result.exits, limit: result.limit });
        })
        .catch(() => {});
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);

  const urgent = left !== null && left <= 10;
  const exitsShown = warning?.exits ?? initialExits;

  return (
    <main className="mx-auto flex w-full max-w-lesson flex-1 flex-col px-4 sm:px-6">
      <div
        className="relative flex-1 select-none py-6 sm:py-10"
        onCopy={block}
        onCut={block}
        onContextMenu={block}
        onDragStart={block}
      >
        <Watermark text={watermark} />

        <div className="relative space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium tabular-nums text-muted-foreground">
              Pregunta {Math.min(number, total)} de {total}
            </p>
            {left !== null && !saved && (
              <p
                role="timer"
                aria-live={urgent ? "assertive" : "off"}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tabular-nums",
                  urgent ? "bg-danger-soft text-destructive" : "bg-muted text-foreground"
                )}
              >
                <Clock aria-hidden="true" className="size-4" />
                {left} s<span className="sr-only"> restantes</span>
              </p>
            )}
          </div>

          {left !== null && question && !saved && (
            <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-[width] duration-300 ease-linear", urgent ? "bg-destructive" : "bg-primary")}
                style={{ width: `${(left / question.seconds) * 100}%` }}
              />
            </div>
          )}

          {(warning || exitsShown > 0) && (
            <p role="alert" className="flex items-start gap-2 rounded-2xl bg-sun p-3 text-sm text-sun-foreground">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                Saliste del quiz {exitsShown} {exitsShown === 1 ? "vez" : "veces"}. Si vuelves a salir de esta pestaña o de la
                aplicación, el quiz se bloquea y tendrás que pedir al docente que te rehabilite.
              </span>
            </p>
          )}

          {!question && !error && <p className="text-muted-foreground">Cargando la pregunta…</p>}

          {question && (
            <section aria-labelledby={`${id}-q`} className="space-y-5">
              {question.context && <Context text={question.context} />}
              <h2 id={`${id}-q`} ref={headingRef} tabIndex={-1} className="max-w-prose text-xl font-semibold focus:outline-none">
                <InlineText text={question.prompt} />
              </h2>
              <ul role="list" aria-labelledby={`${id}-q`} className="max-w-prose space-y-3">
                {question.options.map((option) => {
                  const chosen = saved?.option === option.index || sending === option.index;
                  const locked = Boolean(saved) || sending !== null;
                  return (
                    <li key={option.index}>
                      <button
                        type="button"
                        aria-disabled={locked}
                        aria-pressed={chosen}
                        onClick={() => !locked && void send(option.index)}
                        className={cn(
                          "flex min-h-14 w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base outline-none transition-colors focus-visible:ring-4 focus-visible:ring-ring/40",
                          !locked && "cursor-pointer border-border bg-card hover:border-foreground/50",
                          locked && "cursor-default",
                          chosen ? "border-foreground bg-muted" : locked && "opacity-60"
                        )}
                      >
                        <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border">
                          {chosen && <Check className="size-3.5" />}
                        </span>
                        <span>
                          <InlineText text={option.text} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div aria-live="polite" className="max-w-prose scroll-mb-40 space-y-3">
            {sending !== null && <p className="text-sm text-muted-foreground">Guardando…</p>}
            {error && (
              <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-danger">
                {error}
              </p>
            )}
            {saved && !saved.timedOut && (
              <p className="flex items-center gap-2 rounded-2xl bg-secondary p-4 font-medium">
                <Check aria-hidden="true" className="size-4" />
                Respuesta guardada. Verás si acertaste cuando el docente cierre el quiz.
              </p>
            )}
            {saved?.timedOut && (
              <p className="flex items-center gap-2 rounded-2xl bg-danger-soft p-4 font-medium text-destructive">
                <Clock aria-hidden="true" className="size-4" />
                Se acabó el tiempo: esta pregunta cuenta como incorrecta.
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col items-end gap-1">
          <Button isDisabled={!saved} onPress={next}>
            {position + 1 >= pendingIds.length ? "Ver mi resultado" : "Siguiente pregunta"}
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
          {!saved && <p className="text-xs text-muted-foreground">Elige una respuesta para continuar</p>}
        </div>
      </footer>
    </main>
  );
}

/** Faint repeated name and student code behind the question (REQ-35 CA6). */
function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -inset-1/2 flex rotate-[-24deg] flex-wrap content-start gap-x-16 gap-y-14 text-sm font-semibold whitespace-nowrap text-foreground/[0.06]">
        {Array.from({ length: 80 }, (_, i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
}
