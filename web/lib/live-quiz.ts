import { optionOrder } from "@/lib/exercises";
import { QUIZ_TIME } from "@/lib/quiz-time";
import { compareRanking, type RankingRow } from "@/lib/room";

/**
 * Pure rules of the live final quiz (design §12.5). No React or Supabase, so they are unit-tested.
 */

/** Room quiz state: not opened yet, open, or closed by the teacher (design §12.2). */
export type QuizPhase = "waiting" | "open" | "closed";

export function quizPhase(room: { quiz_opened_at: string | null; quiz_closed_at: string | null }): QuizPhase {
  if (room.quiz_closed_at) return "closed";
  return room.quiz_opened_at ? "open" : "waiting";
}

/** Question ids in this student's order (REQ-29 CA7): same seed, same order, on every reload. */
export function questionOrderFor(questionIds: string[], participantId: string): string[] {
  return optionOrder(questionIds.length, participantId).map((index) => questionIds[index]);
}

/** Seed of the option order of one question for one student. */
export const optionSeed = (participantId: string, questionId: string) => `${participantId}-${questionId}`;

/** Exits that block the quiz (REQ-35 CA3): the first one only warns. */
export const EXITS_TO_BLOCK = 2;

/** Milliseconds left to answer, measured with the server clock (REQ-30 CA1b). */
export function remainingMs(shownAt: Date, limitSeconds: number, now: Date): number {
  // Clamped to the limit: the database clock can run slightly ahead of the app server.
  return Math.min(limitSeconds * 1000, Math.max(0, shownAt.getTime() + limitSeconds * 1000 - now.getTime()));
}

/** True when an answer arrives after the limit plus the network grace (REQ-35 CA2). */
export function isLate(shownAt: Date, limitSeconds: number, now: Date): boolean {
  return now.getTime() > shownAt.getTime() + (limitSeconds + QUIZ_TIME.graceSeconds) * 1000;
}

/** Where a student stands without revealing the exact position (REQ-29 CA5). */
export type Band = "top10" | "top25" | "upperHalf" | "keepPracticing";

export const bandLabels: Record<Band, string> = {
  top10: "Top 10 %",
  top25: "Top 25 %",
  upperHalf: "Mitad superior",
  keepPracticing: "Sigue practicando",
};

export function bandOf(position: number, total: number): Band {
  if (position <= Math.ceil(total * 0.1)) return "top10";
  if (position <= Math.ceil(total * 0.25)) return "top25";
  if (position <= Math.ceil(total * 0.5)) return "upperHalf";
  return "keepPracticing";
}

/** 1-based position with shared ties, as in the teacher's ranking (REQ-30 CA1). */
export function bandFor(rows: RankingRow[], participantId: string): Band | undefined {
  const sorted = [...rows].sort(compareRanking);
  const index = sorted.findIndex((row) => row.participant_id === participantId);
  if (index === -1) return undefined;
  const position = sorted.findIndex((row) => compareRanking(row, sorted[index]) === 0) + 1;
  // No correct answers is never a top band, even when alone or tied at the top.
  if (sorted[index].score === 0) return "keepPracticing";
  return bandOf(position, rows.length);
}
