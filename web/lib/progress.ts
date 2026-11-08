/**
 * Local progress (REQ-06, T-22): which modules this browser finished. Stored only in
 * localStorage, never sent to the server; a blocked or cleared storage just shows no marks.
 */
export const PROGRESS_STORAGE_KEY = "persisteapp.progress.s1";

/** Event fired in this tab after a change; other tabs get the native «storage» event. */
export const PROGRESS_EVENT = "persisteapp:progress";

/** Lesson ids from the stored value; anything malformed reads as no progress. */
export function parseProgress(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))];
  } catch {
    return [];
  }
}

/** Stored value after finishing a lesson, or null when it was already marked. */
export function withLesson(raw: string | null, lessonId: string): string | null {
  const done = parseProgress(raw);
  if (done.includes(lessonId)) return null;
  return JSON.stringify([...done, lessonId]);
}
