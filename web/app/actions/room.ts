"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase-server";
import {
  joinRoomInput,
  PARTICIPANT_COOKIE,
  PARTICIPANT_COOKIE_MAX_AGE,
  type JoinRoomField,
  type JoinRoomState,
} from "@/lib/room";

/**
 * Join a room with its code, a name and the student code (REQ-28 CA1–CA3).
 * Entering again with the same student code reuses the participant, so the score is kept.
 */
export async function joinRoom(_prev: JoinRoomState, form: FormData): Promise<JoinRoomState> {
  const values: Record<JoinRoomField, string> = {
    code: String(form.get("code") ?? ""),
    name: String(form.get("name") ?? ""),
    studentCode: String(form.get("studentCode") ?? ""),
  };
  const fail = (message: string, fields?: Partial<Record<JoinRoomField, string>>): JoinRoomState => ({
    status: "error",
    message,
    fields,
    values,
  });

  const parsed = joinRoomInput.safeParse(values);
  if (!parsed.success) {
    const fields: Partial<Record<JoinRoomField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as JoinRoomField;
      fields[field] ??= issue.message;
    }
    return fail("Revisa los campos marcados.", fields);
  }

  const supabase = getSupabase();
  if (!supabase) return fail("Las salas no están disponibles ahora. Puedes seguir en modo práctica.");

  const { code, name, studentCode } = parsed.data;
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, closed_at")
    .eq("code", code)
    .maybeSingle();
  if (roomError) return fail("No se pudo consultar la sala. Inténtalo de nuevo.");
  if (!room) return fail(`No existe una sala con el código ${code}.`, { code: "Revisa el código que proyecta el docente." });
  if (room.closed_at) return fail(`La sala ${code} está cerrada. Pide al docente el código de la sala activa.`, { code: "Sala cerrada." });

  // Upsert by (room_id, student_code): the token column is not sent, so it is kept on conflict.
  const { data: participant, error } = await supabase
    .from("participants")
    .upsert({ room_id: room.id, name, student_code: studentCode }, { onConflict: "room_id,student_code" })
    .select("token")
    .single();
  if (error || !participant) return fail("No se pudo entrar a la sala. Inténtalo de nuevo.");

  (await cookies()).set(PARTICIPANT_COOKIE, participant.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PARTICIPANT_COOKIE_MAX_AGE,
  });
  // Joining is for the final quiz (design §12.3): go back to «Prepárate para el quiz».
  redirect("/s1/quiz");
}

/** Leave the room on this device; the answers stay in the room. */
export async function leaveRoom(): Promise<void> {
  (await cookies()).delete(PARTICIPANT_COOKIE);
  redirect("/sala");
}
