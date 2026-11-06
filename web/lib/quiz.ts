import type { Lesson, Step } from "@/lib/lesson-schema";

/**
 * Quiz rules (REQ-29, constitution P10): correct answers and explanations stay on the server.
 * The browser receives a PublicLesson; grading runs in a Server Action that calls gradeAnswer.
 */

type QuizStep = Extract<Step, { kind: "quiz" }>;

/** What the browser may see of a quiz: prompts and option texts only. */
export type PublicQuizStep = Omit<QuizStep, "questions"> & {
  questions: { id: string; context?: string; prompt: string; options: { text: string }[] }[];
};
export type PublicStep = Exclude<Step, { kind: "quiz" }> | PublicQuizStep;
export type PublicLesson = Omit<Lesson, "steps"> & { steps: PublicStep[] };

/** Removes `correct` and `explanation` from every quiz option before sending the lesson to the client. */
export function toPublicLesson(lesson: Lesson): PublicLesson {
  return {
    ...lesson,
    steps: lesson.steps.map((step) =>
      step.kind !== "quiz"
        ? step
        : {
            ...step,
            questions: step.questions.map(({ id, context, prompt, options }) => ({
              id,
              ...(context ? { context } : {}),
              prompt,
              options: options.map(({ text }) => ({ text })),
            })),
          }
    ),
  };
}

export type GradeResult =
  | {
      ok: true;
      correct: boolean;
      /** Explanation of the option the student chose. */
      explanation: string;
      correctIndex: number;
      correctExplanation: string;
    }
  | { ok: false; error: string };

/** Grades one quiz answer against the lesson on the server. */
export function gradeAnswer(lesson: Lesson, questionId: string, optionIndex: number): GradeResult {
  for (const step of lesson.steps) {
    if (step.kind !== "quiz") continue;
    const question = step.questions.find((q) => q.id === questionId);
    if (!question) continue;
    const chosen = question.options[optionIndex];
    if (!chosen) return { ok: false, error: "Opción inválida." };
    const correctIndex = question.options.findIndex((option) => option.correct);
    return {
      ok: true,
      correct: chosen.correct,
      explanation: chosen.explanation,
      correctIndex,
      correctExplanation: question.options[correctIndex].explanation,
    };
  }
  return { ok: false, error: "Pregunta no encontrada." };
}
