import type { Quiz } from "@/lib/lesson-schema";
import { questionSeconds } from "@/lib/quiz-time";

/**
 * Final quiz rules (REQ-29, constitution P10): correct answers and explanations stay on the server.
 * The browser receives a PublicQuiz; grading runs in a Server Action that calls gradeAnswer.
 */

/** `lesson_id` of the final quiz in quiz_answers (design §12.1). */
export const quizLessonId = (session: number) => `s${session}-quiz`;

/** What the browser may see of the quiz: prompts and option texts only. */
export type PublicQuizQuestion = {
  id: string;
  module: number;
  context?: string;
  prompt: string;
  options: { text: string }[];
  /** Time limit computed from the question's length (REQ-35 CA1). */
  seconds: number;
};
export type PublicQuiz = Pick<Quiz, "session" | "title"> & { questions: PublicQuizQuestion[] };

/**
 * Removes `correct`, `explanation` and the reserve before sending the quiz to the client, and
 * adds each question's time limit.
 */
export function toPublicQuiz(quiz: Quiz): PublicQuiz {
  return {
    session: quiz.session,
    title: quiz.title,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      module: question.module,
      ...(question.context ? { context: question.context } : {}),
      prompt: question.prompt,
      options: question.options.map(({ text }) => ({ text })),
      seconds: questionSeconds(question),
    })),
  };
}

/** Practice mode works on the warm-up only (REQ-29 CA4): never on the real questions. */
export function practiceQuiz(quiz: Quiz): Quiz {
  return { session: quiz.session, title: "Calentamiento", questions: quiz.practice, practice: quiz.practice };
}

/** Grade on a 0–5 scale: every question weighs the same (REQ-29 CA6). One decimal. */
export function gradeOf(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 50) / 10;
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
