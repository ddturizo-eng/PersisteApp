"use server";

import { z } from "zod";
import { findLesson } from "@/lib/content";
import { gradeAnswer, type GradeResult } from "@/lib/quiz";

const input = z.object({
  lessonId: z.string().regex(/^s[12]-m\d+-[a-z0-9-]+$/),
  questionId: z.string().regex(/^[a-z0-9-]+$/),
  optionIndex: z.number().int().min(0).max(10),
});

/**
 * Grades a quiz answer on the server (REQ-29 CA2). In practice mode nothing is stored;
 * T-41 adds the room: first attempt, timing and score.
 */
export async function submitQuizAnswer(lessonId: string, questionId: string, optionIndex: number): Promise<GradeResult> {
  const parsed = input.safeParse({ lessonId, questionId, optionIndex });
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };
  const lesson = findLesson(parsed.data.lessonId);
  if (!lesson) return { ok: false, error: "Lección no encontrada." };
  return gradeAnswer(lesson, parsed.data.questionId, parsed.data.optionIndex);
}
