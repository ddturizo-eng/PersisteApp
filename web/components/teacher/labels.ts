import type { QuizPhase } from "@/lib/live-quiz";

export const phaseLabels: Record<QuizPhase, string> = {
  waiting: "Quiz sin abrir",
  open: "Quiz abierto",
  closed: "Quiz cerrado",
};
