import { isExercise } from "@/lib/exercises";
import { stages, type Lesson, type Stage, type Step } from "@/lib/lesson-schema";

/**
 * Pure lesson-player rules (REQ-02, REQ-03), kept out of React so they can be tested.
 * Step numbers in the URL are 1-based (?step=3); indexes in code are 0-based.
 */

/** Converts the ?step= value to a valid 0-based index. */
export function stepIndexFromParam(value: string | null, total: number): number {
  const number = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(number)) return 0;
  return clampIndex(number - 1, total);
}

export function clampIndex(index: number, total: number): number {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

/** Option indexes the student picked, per step index. */
export type Attempts = Record<number, number[]>;

/** Index of the correct option for steps that have options, otherwise undefined. */
export function correctOptionIndex(step: Step): number | undefined {
  if (step.kind === "question") return step.options.findIndex((o) => o.correct);
  return undefined;
}

/** True when the student solved the question in this step. */
export function isSolved(step: Step, picked: number[] = []): boolean {
  const correct = correctOptionIndex(step);
  return correct === undefined || picked.includes(correct);
}

/** Code exercises the student solved, per step index. */
export type SolvedExercises = Record<number, boolean>;

/**
 * Continue stays disabled until the question is answered correctly or the code exercise
 * is solved (REQ-02 CA4, REQ-03 CA2, REQ-04).
 */
export function canAdvance(
  lesson: Lesson,
  index: number,
  attempts: Attempts,
  solved: SolvedExercises = {}
): boolean {
  const step = lesson.steps[index];
  // From the last step, «Terminar módulo» leads to the closing screen once the step is solved.
  if (step === undefined) return false;
  if (isExercise(step)) return solved[index] === true;
  return isSolved(step, attempts[index]);
}

export type StageState = "complete" | "current" | "upcoming";

/** State of each stage (Teoría, Práctica) for the stage indicator. */
export function stageStates(lesson: Lesson, index: number): { stage: Stage; state: StageState }[] {
  const current = stages.indexOf(lesson.steps[index]?.stage ?? "theory");
  return stages.map((stage, position) => ({
    stage,
    state: position < current ? "complete" : position === current ? "current" : "upcoming",
  }));
}

/** Keyboard shortcuts must not steal arrows from text fields or widgets. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object" || !("tagName" in target)) return false;
  const element = target as HTMLElement;
  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) ||
    element.isContentEditable === true ||
    element.closest?.('[role="radiogroup"],[role="tablist"],[role="listbox"],[role="slider"]') != null
  );
}
