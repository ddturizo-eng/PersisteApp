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
  studentCode: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(3, "El código estudiantil tiene al menos 3 caracteres.")
        .max(20, "El código estudiantil admite hasta 20 caracteres.")
        .regex(/^[A-Za-z0-9-]+$/, "Usa solo letras, números y guiones.")
    ),
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
