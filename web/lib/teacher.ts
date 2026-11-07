import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Teacher access (REQ-31, design §11.3): one shared passcode in TEACHER_PASSCODE. The cookie holds an
 * HMAC of a fixed label keyed by the passcode, never the passcode itself; changing the passcode
 * signs every teacher out.
 */

export const TEACHER_COOKIE = "pa_teacher";
export const TEACHER_COOKIE_MAX_AGE = 12 * 60 * 60;

function passcode(): string | null {
  return process.env.TEACHER_PASSCODE?.trim() || null;
}

function token(secret: string): string {
  return createHmac("sha256", secret).update("persisteapp-teacher-v1").digest("hex");
}

/** Constant-time comparison so the response time does not leak how much of the value matched. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function teacherEnabled(): boolean {
  return passcode() !== null;
}

/** Checks the typed passcode; on success returns the cookie value to set. */
export function checkPasscode(typed: string): string | null {
  const secret = passcode();
  if (!secret) return null;
  return safeEqual(typed.trim(), secret) ? token(secret) : null;
}

export async function isTeacher(): Promise<boolean> {
  const secret = passcode();
  if (!secret) return false;
  const value = (await cookies()).get(TEACHER_COOKIE)?.value;
  return Boolean(value) && safeEqual(value!, token(secret));
}
