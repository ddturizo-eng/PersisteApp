import type { Quiz } from "@/lib/lesson-schema";

/**
 * Final quiz rules (REQ-29, constitution P10): correct answers and explanations stay on the server.
 * The browser receives a PublicQuiz; grading runs in a Server Action that calls gradeAnswer.
 */

/** `lesson_id` of the final quiz in quiz_answers (design §12.1). */
export const quizLessonId = (session: number) => `s${session}-quiz`;

/** What the browser may see of the quiz: prompts and option texts only. */
export type PublicQuizQuestion = { id: string; module: number; context?: string; prompt: string; options: { text: string }[] };
export type PublicQuiz = Omit<Quiz, "questions"> & { questions: PublicQuizQuestion[] };

/** Removes `correct` and `explanation` from every option before sending the quiz to the client. */
export function toPublicQuiz(quiz: Quiz): PublicQuiz {
  return {
    ...quiz,
    questions: quiz.questions.map(({ id, module, context, prompt, options }) => ({
      id,
      module,
      ...(context ? { context } : {}),
      prompt,
      options: options.map(({ text }) => ({ text })),
    })),
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

/** Grades one quiz answer on the server. */
export function gradeAnswer(quiz: Quiz, questionId: string, optionIndex: number): GradeResult {
  const question = quiz.questions.find((q) => q.id === questionId);
  if (!question) return { ok: false, error: "Pregunta no encontrada." };
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
