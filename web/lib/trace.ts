import type { Step } from "@/lib/lesson-schema";

/** Pure rules for the «¿Dónde ocurre?» walkthrough (REQ-27). */

export type TraceStep = Extract<Step, { kind: "trace" }>;
export type TraceEvent = TraceStep["events"][number];
/** Location ids the student picked, per event index. */
export type TracePicks = Record<number, string[]>;

export const isEventSolved = (event: TraceEvent, picked: string[] = []) => picked.includes(event.answer);

/** Index of the first unsolved event, or events.length when the walkthrough is complete. */
export function currentEventIndex(step: TraceStep, picks: TracePicks): number {
  const index = step.events.findIndex((event, i) => !isEventSolved(event, picks[i]));
  return index === -1 ? step.events.length : index;
}

export const isTraceComplete = (step: TraceStep, picks: TracePicks) =>
  currentEventIndex(step, picks) === step.events.length;

/** Records a pick; picks after the event is solved are ignored. */
export function pickLocation(step: TraceStep, picks: TracePicks, eventIndex: number, location: string): TracePicks {
  const event = step.events[eventIndex];
  const picked = picks[eventIndex] ?? [];
  if (!event || isEventSolved(event, picked) || picked.includes(location)) return picks;
  return { ...picks, [eventIndex]: [...picked, location] };
}

/** Feedback for the last pick of an event: the explanation if right, the reason if wrong. */
export function feedbackFor(event: TraceEvent, picked: string[] = []) {
  const last = picked.at(-1);
  if (last === undefined) return undefined;
  return last === event.answer
    ? { correct: true as const, text: event.explanation }
    : { correct: false as const, text: event.why[last] ?? "Ahí no ocurre. Prueba otro lugar." };
}

/** Label for a location id. */
export const locationLabel = (step: TraceStep, id: string) =>
  step.locations.find((location) => location.id === id)?.label ?? id;
