import { z } from "zod";

/**
 * Room rules shared by the join form, the Server Actions and the tests (REQ-28).
 * Codes use A-Z and 2-9 without I, O, 0 and 1 so they are not confused when projected.
 */

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

/** Participant cookie: httpOnly, holds only the opaque token (design §11.3). */
export const PARTICIPANT_COOKIE = "pa_participant";
export const PARTICIPANT_COOKIE_MAX_AGE = 12 * 60 * 60;

/** Uppercases and drops spaces and dashes, so «abc 234» and «ABC-234» both work. */
export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, "");
}

export function isRoomCode(code: string): boolean {
  return ROOM_CODE_PATTERN.test(code);
}

/** Drops spaces, dots and dashes: «1.065.123.456» → «1065123456». */
export function normalizeDocument(raw: string): string {
  return raw.replace(/[\s.-]/g, "");
}

/** Last 4 digits only (REQ-35 CA6): enough to tell whose screenshot it is without exposing the document. */
export function maskDocument(document: string): string {
  return `doc. …${document.slice(-4)}`;
}

/** Trims and collapses inner spaces: «  Ana   María » → «Ana María». */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export const joinRoomInput = z.object({
  code: z
    .string()
    .transform(normalizeRoomCode)
    .refine(isRoomCode, "El código tiene 6 caracteres: letras y números del 2 al 9, sin I ni O."),
  name: z
    .string()
    .transform(normalizeName)
    .pipe(z.string().min(2, "Escribe tu nombre (mínimo 2 letras).").max(60, "El nombre admite hasta 60 caracteres.")),
  /**
   * Identity document number (cédula or tarjeta de identidad), stored in student_code (REQ-28 CA2).
   * Students know it by heart and the teacher records grades with it; no roster needed.
   */
  studentCode: z
    .string()
    .transform(normalizeDocument)
    .pipe(z.string().regex(/^\d{6,12}$/, "Escribe tu número de documento: solo números, entre 6 y 12 dígitos.")),
});

export type JoinRoomField = keyof z.input<typeof joinRoomInput>;

export type JoinRoomState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fields?: Partial<Record<JoinRoomField, string>>;
      values: Record<JoinRoomField, string>;
    };

/** «Daniel Turizo Pérez» → «Daniel T.»: what the room bar and the projected ranking show (REQ-30 CA3). */
export function shortName(name: string): string {
  const [first, second] = normalizeName(name).split(" ");
  if (!second) return first;
  return `${first} ${second.charAt(0).toLocaleUpperCase("es")}.`;
}

export type RankingRow = { participant_id: string; score: number; correct_seconds: number };

/** Ranking order (REQ-30 CA1): more correct answers first, then less time spent on them. */
export function compareRanking(a: RankingRow, b: RankingRow): number {
  return b.score - a.score || a.correct_seconds - b.correct_seconds;
}

/** 1-based position of a participant; ties share the position («1, 1, 3»). */
export function positionOf(rows: RankingRow[], participantId: string): number | undefined {
  const sorted = [...rows].sort(compareRanking);
  const index = sorted.findIndex((row) => row.participant_id === participantId);
  if (index === -1) return undefined;
  const me = sorted[index];
  return sorted.findIndex((row) => compareRanking(row, me) === 0) + 1;
}

/** «Grupo 8:00» → «Sala Grupo 8:00», but «Sala de prueba» stays as is. */
export function roomTitle(label: string): string {
  return /^sala\b/i.test(label) ? label : `Sala ${label}`;
}

/**
 * First name and first surname for the student's own screen: «Ana María Pérez Gómez» → «Ana Pérez».
 * With four or more words the usual Colombian order is two names and two surnames; with three it is
 * ambiguous, so the first two words are kept. The projected ranking still uses shortName (REQ-30 CA3).
 */
export function displayName(name: string): string {
  const words = normalizeName(name).split(" ");
  if (words.length >= 4) return `${words[0]} ${words[2]}`;
  return words.slice(0, 2).join(" ");
}
