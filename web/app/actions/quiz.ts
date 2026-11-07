"use server";

import { z } from "zod";
import { loadQuiz } from "@/lib/content";
import { gradeAnswer, type GradeResult } from "@/lib/quiz";

const input = z.object({
  questionId: z.string().regex(/^[a-z0-9-]+$/),
  optionIndex: z.number().int().min(0).max(10),
});

/**
 * Grades an answer of the session 1 final quiz on the server (REQ-29 CA2). In practice mode
 * nothing is stored; T-41 adds the room: first attempt, timing and score.
 */
export async function submitQuizAnswer(questionId: string, optionIndex: number): Promise<GradeResult> {
  const parsed = input.safeParse({ questionId, optionIndex });
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };
  return gradeAnswer(loadQuiz(1), parsed.data.questionId, parsed.data.optionIndex);
}
