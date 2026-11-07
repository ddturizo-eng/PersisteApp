import type { Metadata } from "next";
import { FinalQuizPlayer } from "@/components/quiz/final-quiz-player";
import { loadQuiz } from "@/lib/content";
import { toPublicQuiz } from "@/lib/quiz";

export const metadata: Metadata = {
  title: "Quiz final · PersisteApp",
  description: "Doce preguntas sobre los módulos de la sesión 1.",
};

/**
 * Final quiz of session 1 (REQ-29, design §12.1). Practice mode for now; T-41 adds the rules,
 * the room and server timing.
 */
export default function FinalQuizPage() {
  // Quiz answers never reach the browser (constitution P10, REQ-29 CA2).
  return <FinalQuizPlayer quiz={toPublicQuiz(loadQuiz(1))} />;
}
