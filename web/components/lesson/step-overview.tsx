"use client";

import { useEffect, useRef } from "react";
import { cn } from "cn";
import { plainText } from "@/lib/inline-code";
import { stageLabels } from "@/lib/lesson-schema";
import type { PublicLesson as Lesson, PublicStep as Step } from "@/lib/quiz";

function stepTitle(step: Step): string {
  if (step.kind === "question") return plainText(step.prompt);
  if (step.kind === "visual") return plainText(step.caption);
  if (step.kind === "code") return step.title ?? "Código";
  if (step.kind === "trace") return step.title;
  if (step.kind === "quiz") return step.title ?? "Quiz";
  return step.title ?? stageLabels[step.stage];
}

/**
 * Overview of every step to jump around while presenting (reveal.js pattern, key O).
 * Native <dialog>: focus is trapped and Esc closes it.
 */
export function StepOverview({
  lesson,
  current,
  open,
  onClose,
  onJump,
}: {
  lesson: Lesson;
  current: number;
  open: boolean;
  onClose: () => void;
  onJump: (index: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const currentButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      currentButton.current?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      aria-labelledby="overview-title"
      className="m-auto w-[min(92vw,48rem)] rounded-xl border bg-popover p-0 text-popover-foreground backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 id="overview-title" className="font-semibold">
          Pasos de la lección
        </h2>
        <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted">
          Cerrar <span className="sr-only">vista general</span>(Esc)
        </button>
      </div>
      <ol className="max-h-[70vh] overflow-y-auto p-2">
        {lesson.steps.map((step, index) => (
          <li key={index}>
            <button
              ref={index === current ? currentButton : undefined}
              type="button"
              aria-current={index === current ? "step" : undefined}
              onClick={() => {
                onJump(index);
                onClose();
              }}
              className={cn(
                "flex w-full items-baseline gap-3 rounded-md px-3 py-2 text-left hover:bg-muted",
                index === current && "bg-accent text-accent-foreground"
              )}
            >
              <span className="w-6 shrink-0 text-right text-sm text-muted-foreground tabular-nums">{index + 1}</span>
              <span className="w-24 shrink-0 text-sm text-muted-foreground">{stageLabels[step.stage]}</span>
              <span className="min-w-0 truncate">{stepTitle(step)}</span>
            </button>
          </li>
        ))}
      </ol>
    </dialog>
  );
}
