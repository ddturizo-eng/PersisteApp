"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CircleCheck } from "lucide-react";
import { cn } from "cn";
import { PROGRESS_EVENT, PROGRESS_STORAGE_KEY, parseProgress, withLesson } from "@/lib/progress";

function readRaw(): string | null {
  try {
    return localStorage.getItem(PROGRESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === PROGRESS_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(PROGRESS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PROGRESS_EVENT, onChange);
  };
}

/** Marks a lesson as finished in this browser. */
export function markLessonDone(lessonId: string) {
  try {
    const next = withLesson(localStorage.getItem(PROGRESS_STORAGE_KEY), lessonId);
    if (next === null) return;
    localStorage.setItem(PROGRESS_STORAGE_KEY, next);
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Storage blocked: progress is a convenience, the lesson still works.
  }
}

/** Finished lesson ids; empty on the server and before hydration. */
export function useCompletedLessons(): string[] {
  // The raw string is the snapshot (stable between reads); parsing happens per render.
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return parseProgress(raw);
}

/** Calls markLessonDone once when `done` turns true. */
export function useMarkDone(lessonId: string, done: boolean) {
  useEffect(() => {
    if (done) markLessonDone(lessonId);
  }, [lessonId, done]);
}

/** «Terminado» badge for a landing card; renders nothing until the module is finished. */
export function DoneBadge({ lessonId, className }: { lessonId: string; className?: string }) {
  const done = useCompletedLessons().includes(lessonId);
  if (!done) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground", className)}>
      <CircleCheck aria-hidden="true" className="size-3.5 text-primary" />
      Terminado
    </span>
  );
}

/** «N de M módulos terminados» line; hidden while nothing is finished. */
export function ProgressSummary({ lessonIds }: { lessonIds: string[] }) {
  const done = useCompletedLessons().filter((id) => lessonIds.includes(id)).length;
  if (done === 0) return null;
  const all = done === lessonIds.length;
  return (
    <p role="status" className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 py-1.5 text-sm font-medium">
      <CircleCheck aria-hidden="true" className="size-4 text-primary" />
      {all ? "Terminaste los módulos: ya puedes ir al quiz final" : `${done} de ${lessonIds.length} módulos terminados en este navegador`}
    </p>
  );
}
