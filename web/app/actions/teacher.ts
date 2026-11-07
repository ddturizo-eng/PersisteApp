"use server";

import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateRoomCode } from "@/lib/room";
import { getSupabase } from "@/lib/supabase-server";
import { checkPasscode, isTeacher, TEACHER_COOKIE, TEACHER_COOKIE_MAX_AGE } from "@/lib/teacher";

/**
 * Teacher panel actions (REQ-28 CA4–CA5, REQ-31, REQ-35 CA4). Every action checks the teacher
 * cookie on the server: hiding a button in the UI is not access control.
 */

export type FormState = { status: "idle" } | { status: "error"; message: string };

export async function teacherLogin(_prev: FormState, form: FormData): Promise<FormState> {
  const value = checkPasscode(String(form.get("passcode") ?? ""));
  if (!value) return { status: "error", message: "Clave incorrecta." };
  (await cookies()).set(TEACHER_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEACHER_COOKIE_MAX_AGE,
  });
  redirect("/docente");
}

export async function teacherLogout(): Promise<void> {
  (await cookies()).delete(TEACHER_COOKIE);
  redirect("/docente");
}

async function db() {
  if (!(await isTeacher())) throw new Error("No autorizado");
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase no está configurado");
  return supabase;
}

const uuid = z.uuid();

const newRoomCode = () => generateRoomCode((n) => randomInt(n));

export async function createRoom(_prev: FormState, form: FormData): Promise<FormState> {
  const label = z.string().trim().min(1).max(60).safeParse(String(form.get("label") ?? ""));
  if (!label.success) return { status: "error", message: "Escribe un nombre de 1 a 60 caracteres, por ejemplo «Grupo 8:00»." };
  const supabase = await db();
  // A clash among 32^6 codes is unlikely; retry a few times on the unique constraint.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.from("rooms").insert({ code: newRoomCode(), label: label.data }).select("code").single();
    if (!error && data) redirect(`/docente/${data.code}`);
    if (error && error.code !== "23505") return { status: "error", message: "No se pudo crear la sala." };
  }
  return { status: "error", message: "No se pudo generar un código libre. Inténtalo de nuevo." };
}

async function updateRoom(id: string, patch: Record<string, string | null>) {
  if (!uuid.safeParse(id).success) return;
  const supabase = await db();
  await supabase.from("rooms").update(patch).eq("id", id);
  refresh();
}

/** Everyone starts at once (REQ-29 CA1b). Reopening clears the close time. */
export async function openQuiz(id: string) {
  await updateRoom(id, { quiz_opened_at: new Date().toISOString(), quiz_closed_at: null });
}

/** Closing shows the explanations and the final band to students (REQ-29 CA3, CA5). */
export async function closeQuiz(id: string) {
  await updateRoom(id, { quiz_closed_at: new Date().toISOString() });
}

export async function closeRoom(id: string) {
  await updateRoom(id, { closed_at: new Date().toISOString() });
}

export async function reopenRoom(id: string) {
  await updateRoom(id, { closed_at: null });
}

/** Unblocks a student; one warning is already used, so the next exit blocks again (REQ-35 CA4). */
export async function rehabilitate(participantId: string) {
  if (!uuid.safeParse(participantId).success) return;
  const supabase = await db();
  await supabase.from("participants").update({ blocked_at: null, exits: 1 }).eq("id", participantId);
  refresh();
}

/** Removes a fake or duplicated participant and their answers (REQ-28 CA5). */
export async function deleteParticipant(participantId: string) {
  if (!uuid.safeParse(participantId).success) return;
  const supabase = await db();
  await supabase.from("participants").delete().eq("id", participantId);
  refresh();
}
