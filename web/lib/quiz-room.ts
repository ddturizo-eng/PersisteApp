import "server-only";
import type { Quiz } from "@/lib/lesson-schema";
import { bandFor, isLate, optionSeed, questionOrderFor, quizPhase, type Band, type QuizPhase } from "@/lib/live-quiz";
import type { CurrentParticipant } from "@/lib/participant";
import { gradeOf, quizLessonId } from "@/lib/quiz";
import { getSupabase } from "@/lib/supabase-server";
import { optionOrder } from "@/lib/exercises";

/**
 * Live final quiz on Supabase (design §12.5): room phase, the student's answers, expired
 * questions and the result. Needs web/supabase/002_quiz_live.sql.
 */

export const LESSON_ID = quizLessonId(1);

export type AnswerRow = {
  question_id: string;
  option_index: number | null;
  correct: boolean | null;
  timed_out: boolean;
  shown_at: string;
  answered_at: string | null;
  limit_seconds: number;
};

export type DetailRow = {
  id: string;
  context?: string;
  prompt: string;
  chosen?: string;
  timedOut: boolean;
  correct: boolean;
  correctText: string;
  explanation: string;
  seconds?: number;
};

export type LiveResult = {
  correct: number;
  total: number;
  grade: number;
  band?: Band;
  /** The teacher has not closed the quiz: the band can still change and explanations are hidden. */
  provisional: boolean;
  detail?: DetailRow[];
};

export type LiveState =
  | { status: "unavailable"; message: string }
  | {
      status: "ok";
      phase: QuizPhase;
      roomClosed: boolean;
      blocked: boolean;
      exits: number;
      order: string[];
      answered: string[];
      result?: LiveResult;
    };

type RoomRow = { closed_at: string | null; quiz_opened_at: string | null; quiz_closed_at: string | null };
type IntegrityRow = { exits: number; blocked_at: string | null };

const MIGRATION_MESSAGE = "El quiz en vivo aún no está listo en el servidor (falta la migración 002). Avísale al docente.";

/** Room phase and the participant's integrity state. Null when the migration is missing. */
export async function readRoomState(participant: CurrentParticipant) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const [room, me] = await Promise.all([
    supabase.from("rooms").select("closed_at, quiz_opened_at, quiz_closed_at").eq("id", participant.room.id).single<RoomRow>(),
    supabase.from("participants").select("exits, blocked_at").eq("id", participant.id).single<IntegrityRow>(),
  ]);
  if (room.error || me.error || !room.data || !me.data) return null;
  return {
    phase: quizPhase(room.data),
    roomClosed: room.data.closed_at !== null,
    exits: me.data.exits,
    blocked: me.data.blocked_at !== null,
  };
}

export async function readAnswers(participantId: string): Promise<AnswerRow[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("quiz_answers")
    .select("question_id, option_index, correct, timed_out, shown_at, answered_at, limit_seconds")
    .eq("participant_id", participantId)
    .eq("lesson_id", LESSON_ID);
  return error ? null : (data as AnswerRow[]);
}

/** Closes questions whose limit passed while the page was away, so a reload never adds time. */
async function closeExpired(participantId: string, rows: AnswerRow[], now: Date): Promise<AnswerRow[]> {
  const supabase = getSupabase();
  if (!supabase) return rows;
  return Promise.all(
    rows.map(async (row) => {
      if (row.answered_at || !isLate(new Date(row.shown_at), row.limit_seconds, now)) return row;
      const answeredAt = new Date(new Date(row.shown_at).getTime() + row.limit_seconds * 1000).toISOString();
      const patch = { answered_at: answeredAt, timed_out: true, correct: false, option_index: null };
      await supabase
        .from("quiz_answers")
        .update(patch)
        .eq("participant_id", participantId)
        .eq("lesson_id", LESSON_ID)
        .eq("question_id", row.question_id)
        .is("answered_at", null);
      return { ...row, ...patch };
    })
  );
}

async function bandOfParticipant(participant: CurrentParticipant): Promise<Band | undefined> {
  const supabase = getSupabase();
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from("room_ranking")
    .select("participant_id, score, correct_seconds")
    .eq("room_id", participant.room.id);
  if (error || !data) return undefined;
  const rows = data.map((row) => ({
    participant_id: row.participant_id as string,
    score: Number(row.score),
    correct_seconds: Number(row.correct_seconds),
  }));
  return bandFor(rows, participant.id);
}

function detailOf(quiz: Quiz, order: string[], rows: AnswerRow[]): DetailRow[] {
  return order.map((id) => {
    const question = quiz.questions.find((q) => q.id === id)!;
    const row = rows.find((r) => r.question_id === id && r.answered_at);
    const right = question.options.find((o) => o.correct)!;
    const chosen = row?.option_index != null ? question.options[row.option_index] : undefined;
    const seconds = row?.answered_at
      ? Math.min(row.limit_seconds, (new Date(row.answered_at).getTime() - new Date(row.shown_at).getTime()) / 1000)
      : undefined;
    return {
      id,
      ...(question.context ? { context: question.context } : {}),
      prompt: question.prompt,
      ...(chosen ? { chosen: chosen.text } : {}),
      timedOut: Boolean(row?.timed_out) || !row,
      correct: row?.correct === true,
      correctText: right.text,
      explanation: chosen && !chosen.correct ? `${chosen.explanation} ${right.explanation}` : right.explanation,
      ...(seconds !== undefined ? { seconds: Math.round(seconds) } : {}),
    };
  });
}

/** Everything /s1/quiz needs to decide which screen to show (design §12.5). */
export async function loadLiveState(participant: CurrentParticipant, quiz: Quiz): Promise<LiveState> {
  const room = await readRoomState(participant);
  const stored = await readAnswers(participant.id);
  if (!room || !stored) return { status: "unavailable", message: MIGRATION_MESSAGE };

  const rows = await closeExpired(participant.id, stored, new Date());
  const order = questionOrderFor(
    quiz.questions.map((q) => q.id),
    participant.id
  );
  const answered = rows.filter((r) => r.answered_at).map((r) => r.question_id);
  const finished = order.every((id) => answered.includes(id));

  let result: LiveResult | undefined;
  if (finished || room.phase === "closed") {
    const correct = rows.filter((r) => r.correct).length;
    const total = quiz.questions.length;
    const closed = room.phase === "closed";
    result = {
      correct,
      total,
      grade: gradeOf(correct, total),
      band: await bandOfParticipant(participant),
      provisional: !closed,
      ...(closed ? { detail: detailOf(quiz, order, rows) } : {}),
    };
  }

  return { status: "ok", ...room, order, answered, ...(result ? { result } : {}) };
}

/** Options of a question in this student's order, with their original index (REQ-29 CA7). */
export function orderedOptions(quiz: Quiz, questionId: string, participantId: string) {
  const question = quiz.questions.find((q) => q.id === questionId);
  if (!question) return undefined;
  return optionOrder(question.options.length, optionSeed(participantId, questionId)).map((index) => ({
    index,
    text: question.options[index].text,
  }));
}
