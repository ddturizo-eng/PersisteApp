import "server-only";
import { loadQuiz } from "@/lib/content";
import { quizPhase, type QuizPhase } from "@/lib/live-quiz";
import { quizLessonId } from "@/lib/quiz";
import { buildReport, type AnswerInput, type ParticipantInput, type RoomReport } from "@/lib/report";
import { getSupabase } from "@/lib/supabase-server";

/** Reads for the teacher panel. Callers must check isTeacher() first. */

export type RoomSummary = {
  id: string;
  code: string;
  label: string;
  closed: boolean;
  phase: QuizPhase;
  participants: number;
  createdAt: string;
};

type RoomRow = {
  id: string;
  code: string;
  label: string;
  closed_at: string | null;
  quiz_opened_at: string | null;
  quiz_closed_at: string | null;
  created_at: string;
  participants?: { count: number }[];
};

const summary = (r: RoomRow): RoomSummary => ({
  id: r.id,
  code: r.code,
  label: r.label,
  closed: r.closed_at !== null,
  phase: quizPhase(r),
  participants: r.participants?.[0]?.count ?? 0,
  createdAt: r.created_at,
});

export async function listRooms(): Promise<RoomSummary[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("rooms")
    .select("id, code, label, closed_at, quiz_opened_at, quiz_closed_at, created_at, participants(count)")
    .order("created_at", { ascending: false });
  return error ? null : (data as RoomRow[]).map(summary);
}

export type RoomDetail = { room: RoomSummary; report: RoomReport };

export async function loadRoom(code: string): Promise<RoomDetail | null> {
  const supabase = getSupabase();
  if (!supabase || !/^[A-HJ-NP-Z2-9]{6}$/.test(code)) return null;
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, label, closed_at, quiz_opened_at, quiz_closed_at, created_at, participants(count)")
    .eq("code", code)
    .maybeSingle<RoomRow>();
  if (!room) return null;

  const { data: people } = await supabase
    .from("participants")
    .select("id, name, student_code, exits, blocked_at")
    .eq("room_id", room.id);
  const participants = (people ?? []) as ParticipantInput[];
  const ids = participants.map((p) => p.id);
  const { data: rows } = ids.length
    ? await supabase
        .from("quiz_answers")
        .select("participant_id, question_id, option_index, correct, timed_out, shown_at, answered_at, limit_seconds")
        .eq("lesson_id", quizLessonId(1))
        .in("participant_id", ids)
    : { data: [] };

  return { room: summary(room), report: buildReport(loadQuiz(1), participants, (rows ?? []) as AnswerInput[]) };
}
