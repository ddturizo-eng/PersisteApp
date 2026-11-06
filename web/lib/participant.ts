import "server-only";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase-server";
import { PARTICIPANT_COOKIE, positionOf, type RankingRow } from "@/lib/room";

export type CurrentParticipant = {
  id: string;
  name: string;
  studentCode: string;
  room: { id: string; code: string; label: string; closed: boolean };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ParticipantRow = {
  id: string;
  name: string;
  student_code: string;
  rooms: { id: string; code: string; label: string; closed_at: string | null } | null;
};

/** Who is answering, from the httpOnly cookie. Null without a room or without Supabase. */
export async function getCurrentParticipant(): Promise<CurrentParticipant | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const token = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  if (!token || !UUID.test(token)) return null;

  const { data, error } = await supabase
    .from("participants")
    .select("id, name, student_code, rooms!inner(id, code, label, closed_at)")
    .eq("token", token)
    .maybeSingle<ParticipantRow>();
  if (error || !data?.rooms) return null;

  return {
    id: data.id,
    name: data.name,
    studentCode: data.student_code,
    room: { id: data.rooms.id, code: data.rooms.code, label: data.rooms.label, closed: data.rooms.closed_at !== null },
  };
}

export type Standing = { score: number; answered: number; position: number; total: number };

/** Own score and position in the room (REQ-30 CA1b). */
export async function getStanding(participant: CurrentParticipant): Promise<Standing | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("room_ranking")
    .select("participant_id, score, correct_seconds, answered")
    .eq("room_id", participant.room.id);
  if (error || !data) return null;

  const rows = data.map((row) => ({
    participant_id: row.participant_id as string,
    score: Number(row.score),
    correct_seconds: Number(row.correct_seconds),
    answered: Number(row.answered),
  }));
  const mine = rows.find((row) => row.participant_id === participant.id);
  const position = positionOf(rows satisfies RankingRow[], participant.id);
  if (!mine || position === undefined) return null;
  return { score: mine.score, answered: mine.answered, position, total: rows.length };
}
