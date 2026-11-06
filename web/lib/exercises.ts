import type { Engine, Step } from "@/lib/lesson-schema";

/** Pure rules for code exercises (REQ-04). No React, so they are unit-tested. */

type CodeStep = Extract<Step, { kind: "code" }>;
export type Variant = "java" | Engine;

/** Placeholder that replaces {{n}} before highlighting; it tokenizes as a plain identifier. */
export const GAP_SENTINEL = /__GAP_(\d+)__/g;
export const toSentinels = (code: string) => code.replace(/\{\{(\d+)\}\}/g, "__GAP_$1__");

/** Variants present in a code step, in display order. */
export function variantsOf(step: CodeStep): Variant[] {
  return (["java", "oracle", "postgresql"] as const).filter((v) => Boolean(step.variants[v]));
}

/** Picks the code to show: Java, or the chosen engine when the step has engine variants. */
export function codeFor(step: CodeStep, engine: Engine): { variant: Variant; code: string } {
  if (step.variants.java) return { variant: "java", code: step.variants.java };
  const variant = step.variants[engine] ? engine : (variantsOf(step)[0] as Engine);
  return { variant, code: step.variants[variant] ?? "" };
}

/** Deterministic PRNG so server and client shuffle identically (no hydration mismatch). */
function seededRandom(seed: string) {
  let h = 2166136261;
  for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Shuffles items with a seed and guarantees the result is not already the original order. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = seededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.length > 1 && result.every((item, i) => item === items[i])) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}

/** A block in the order exercise; ids keep identity when two blocks have the same text. */
export type OrderBlock = { id: string; text: string };

export function orderPool(blocks: string[], distractors: string[] = [], seed: string): OrderBlock[] {
  const all = [
    ...blocks.map((text, i) => ({ id: `b${i}`, text })),
    ...distractors.map((text, i) => ({ id: `d${i}`, text })),
  ];
  const shuffled = seededShuffle(all, seed);
  // Identical lines can make a shuffle look solved; rotate so the exercise never starts solved.
  if (shuffled.length > 1 && shuffled.every((block, i) => block.text === blocks[i])) {
    shuffled.push(shuffled.shift()!);
  }
  return shuffled;
}

/** Moves the item at `from` one position up (-1) or down (+1). */
export function move<T>(items: readonly T[], from: number, delta: -1 | 1): T[] {
  const to = from + delta;
  if (to < 0 || to >= items.length) return [...items];
  const result = [...items];
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}

/**
 * Order check: the kept blocks must match the correct blocks, in order. Compared by text,
 * so two identical lines (e.g. two closing braces) are interchangeable.
 */
export function checkOrder(kept: OrderBlock[], blocks: string[]) {
  const inPlace = kept.filter((block, i) => block.text === blocks[i]).length;
  const solved = kept.length === blocks.length && inPlace === blocks.length;
  const hasDistractor = kept.some((block) => block.id.startsWith("d"));
  return { solved, inPlace, hasDistractor };
}

/** Fill check: answers are compared trimmed and case-sensitive (Java is case-sensitive). */
export function checkGaps(
  gaps: { id: number; answers: string[] }[],
  values: Record<number, string>
): { solved: boolean; results: Record<number, boolean> } {
  const results: Record<number, boolean> = {};
  for (const gap of gaps) {
    const value = (values[gap.id] ?? "").trim();
    results[gap.id] = gap.answers.some((answer) => answer.trim() === value);
  }
  return { solved: Object.values(results).every(Boolean), results };
}

/** Steps that must be solved before Continue: code exercises (not `read`) and the trace walkthrough. */
export const isExercise = (step: Step) => (step.kind === "code" && step.mode !== "read") || step.kind === "trace";

/** Failed checks after which «Ver solución» appears (REQ-04 CA5). */
export const SOLUTION_AFTER_FAILURES = 2;

export const canShowSolution = (failures: number) => failures >= SOLUTION_AFTER_FAILURES;

/** Hint to show after `failures` failed checks: one more hint per failure, the last one repeats. */
export function hintFor(hints: string[] | undefined, failures: number): string | undefined {
  if (!hints?.length || failures < 1) return undefined;
  return hints[Math.min(failures, hints.length) - 1];
}
