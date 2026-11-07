"use server";

import { z } from "zod";
import { loadQuiz } from "@/lib/content";
import { EXITS_TO_BLOCK, isLate, remainingMs } from "@/lib/live-quiz";
import { getCurrentParticipant, type CurrentParticipant } from "@/lib/participant";
import { gradeAnswer, practiceQuiz, type GradeResult } from "@/lib/quiz";
import { questionSeconds } from "@/lib/quiz-time";
import { LESSON_ID, orderedOptions, readRoomState, type AnswerRow } from "@/lib/quiz-room";
import { getSupabase } from "@/lib/supabase-server";

const questionId = z.string().regex(/^[a-z0-9-]+$/);
const optionIndex = z.number().int().min(0).max(10);

/**
 * Practice mode (REQ-29 CA4): grades only the warm-up questions, never the real quiz, so this
 * action cannot be used to read the real answers. Nothing is stored.
 */
export async function submitQuizAnswer(id: string, option: number): Promise<GradeResult> {
  const parsed = z.object({ id: questionId, option: optionIndex }).safeParse({ id, option });
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };
  return gradeAnswer(practiceQuiz(loadQuiz(1)), parsed.data.id, parsed.data.option);
}

type Fail = { ok: false; error: string; blocked?: boolean };

/** The participant may answer only in an open room, with the quiz open and not blocked (§12.2, REQ-35). */
async function liveGuard(): Promise<Fail | { ok: true; participant: CurrentParticipant }> {
  const participant = await getCurrentParticipant();
  if (!participant) return { ok: false, error: "Entra a la sala para que tus respuestas cuenten." };
  const room = await readRoomState(participant);
  if (!room) return { ok: false, error: "El quiz en vivo no está disponible. Avísale al docente." };
  if (room.roomClosed) return { ok: false, error: "La sala está cerrada." };
  if (room.phase === "waiting") return { ok: false, error: "El docente aún no abre el quiz." };
  if (room.phase === "closed") return { ok: false, error: "El docente ya cerró el quiz." };
  if (room.blocked) return { ok: false, error: "Tu quiz está bloqueado. Pide al docente que te rehabilite.", blocked: true };
  return { ok: true, participant };
}

async function answerRow(participantId: string, id: string): Promise<AnswerRow | null> {
  const { data } = await getSupabase()!
    .from("quiz_answers")
    .select("question_id, option_index, correct, timed_out, shown_at, answered_at, limit_seconds")
    .eq("participant_id", participantId)
    .eq("lesson_id", LESSON_ID)
    .eq("question_id", id)
    .maybeSingle<AnswerRow>();
  return data ?? null;
}

export type StartedQuestion =
  | {
      ok: true;
      id: string;
      context?: string;
      prompt: string;
      /** In this student's order, with the original index to send back. */
      options: { index: number; text: string }[];
      seconds: number;
      /** Measured with the server clock; reloading does not reset it (REQ-30 CA1b). */
      remainingMs: number;
      answered: boolean;
    }
  | Fail;

/**
 * Shows one question (design §12.5): stores shown_at and the limit the first time only, and returns
 * just this question, so the browser never holds the next ones in advance.
 */
export async function startQuestion(id: string): Promise<StartedQuestion> {
  if (!questionId.safeParse(id).success) return { ok: false, error: "Solicitud inválida." };
  const guard = await liveGuard();
  if (!guard.ok) return guard;
  const { participant } = guard;

  const quiz = loadQuiz(1);
  const question = quiz.questions.find((q) => q.id === id);
  if (!question) return { ok: false, error: "Pregunta no encontrada." };
  const seconds = questionSeconds(question);

  const { error } = await getSupabase()!
    .from("quiz_answers")
    .upsert(
      { participant_id: participant.id, lesson_id: LESSON_ID, question_id: id, limit_seconds: seconds },
      { onConflict: "participant_id,lesson_id,question_id", ignoreDuplicates: true }
    );
  if (error) return { ok: false, error: "No se pudo abrir la pregunta. Inténtalo de nuevo." };

  const row = await answerRow(participant.id, id);
  if (!row) return { ok: false, error: "No se pudo abrir la pregunta. Inténtalo de nuevo." };

  return {
    ok: true,
    id,
    ...(question.context ? { context: question.context } : {}),
    prompt: question.prompt,
    options: orderedOptions(quiz, id, participant.id)!,
    seconds: row.limit_seconds,
    remainingMs: remainingMs(new Date(row.shown_at), row.limit_seconds, new Date()),
    answered: row.answered_at !== null,
  };
}

export type LiveAnswer = { ok: true; timedOut: boolean } | Fail;

/**
 * Saves the first answer only (REQ-29 CA3). Late answers, or `null` when the countdown ends,
 * count as wrong (REQ-35 CA2). The result stays hidden until the teacher closes the quiz.
 */
export async function submitLiveAnswer(id: string, option: number | null): Promise<LiveAnswer> {
  if (!questionId.safeParse(id).success || (option !== null && !optionIndex.safeParse(option).success)) {
    return { ok: false, error: "Solicitud inválida." };
  }
  const guard = await liveGuard();
  if (!guard.ok) return guard;
  const { participant } = guard;

  const row = await answerRow(participant.id, id);
  if (!row) return { ok: false, error: "Esa pregunta no se ha mostrado." };
  if (row.answered_at) return { ok: true, timedOut: row.timed_out };

  const quiz = loadQuiz(1);
  const question = quiz.questions.find((q) => q.id === id);
  if (!question || (option !== null && !question.options[option])) return { ok: false, error: "Opción inválida." };

  const shownAt = new Date(row.shown_at);
  const now = new Date();
  const timedOut = option === null || isLate(shownAt, row.limit_seconds, now);
  const patch = timedOut
    ? {
        answered_at: new Date(Math.min(now.getTime(), shownAt.getTime() + row.limit_seconds * 1000)).toISOString(),
        option_index: null,
        correct: false,
        timed_out: true,
      }
    : { answered_at: now.toISOString(), option_index: option, correct: question.options[option!].correct, timed_out: false };

  const { error } = await getSupabase()!
    .from("quiz_answers")
    .update(patch)
    .eq("participant_id", participant.id)
    .eq("lesson_id", LESSON_ID)
    .eq("question_id", id)
    .is("answered_at", null);
  if (error) return { ok: false, error: "No se pudo guardar la respuesta. Revisa la conexión y vuelve a elegir." };
  return { ok: true, timedOut };
}

export type ExitResult = { ok: true; exits: number; blocked: boolean; limit: number } | Fail;

/** Records that the student left the quiz tab (REQ-35 CA3); the second exit blocks the quiz. */
export async function reportExit(): Promise<ExitResult> {
  const guard = await liveGuard();
  if (!guard.ok) return guard;
  const { data, error } = await getSupabase()!
    .rpc("register_exit", { p_participant: guard.participant.id })
    .single<{ exits: number; blocked: boolean }>();
  if (error || !data) return { ok: false, error: "No se pudo registrar la salida." };
  return { ok: true, exits: data.exits, blocked: data.blocked, limit: EXITS_TO_BLOCK };
}
