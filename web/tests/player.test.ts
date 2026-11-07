import { describe, expect, it } from "vitest";
import type { Lesson } from "@/lib/lesson-schema";
import { canAdvance, isTypingTarget, stageStates, stepIndexFromParam } from "@/lib/player";

const lesson = {
  id: "s1-m1-demo",
  session: 1,
  module: 1,
  title: "Demo",
  summary: "x",
  estimatedMinutes: 5,
  source: { label: "x", url: "https://example.com" },
  steps: [
    { kind: "text", stage: "theory", body: "a" },
    {
      kind: "question",
      stage: "theory",
      prompt: "p",
      options: [
        { text: "no", correct: false, explanation: "e" },
        { text: "sí", correct: true, explanation: "e" },
      ],
    },
    { kind: "code", stage: "practice", mode: "pick-line", language: "java", prompt: "p", variants: { java: "x" }, options: [] },
    { kind: "text", stage: "practice", body: "b" },
  ],
} as unknown as Lesson;

describe("stepIndexFromParam", () => {
  it("maps 1-based ?step= to a clamped 0-based index", () => {
    expect(stepIndexFromParam("2", 3)).toBe(1);
    expect(stepIndexFromParam("99", 3)).toBe(2);
    expect(stepIndexFromParam("0", 3)).toBe(0);
    expect(stepIndexFromParam("abc", 3)).toBe(0);
    expect(stepIndexFromParam(null, 3)).toBe(0);
  });
});

describe("canAdvance", () => {
  it("allows continuing from a text step", () => {
    expect(canAdvance(lesson, 0, {})).toBe(true);
  });

  it("blocks a question until the correct option is picked", () => {
    expect(canAdvance(lesson, 1, {})).toBe(false);
    expect(canAdvance(lesson, 1, { 1: [0] })).toBe(false);
    expect(canAdvance(lesson, 1, { 1: [0, 1] })).toBe(true);
  });

  it("blocks a code exercise until it is solved", () => {
    expect(canAdvance(lesson, 2, {})).toBe(false);
    expect(canAdvance(lesson, 2, {}, { 2: true })).toBe(true);
  });

  it("never advances past the last step", () => {
    expect(canAdvance(lesson, 3, {})).toBe(false);
  });
});

describe("stageStates", () => {
  it("marks earlier stages complete and the step's stage current", () => {
    const states = stageStates(lesson, 2);
    expect(states.map((s) => s.state)).toEqual(["complete", "current"]);
  });
});

describe("isTypingTarget", () => {
  it("ignores non-element targets", () => {
    expect(isTypingTarget(null)).toBe(false);
  });

  it("detects text fields", () => {
    expect(isTypingTarget({ tagName: "TEXTAREA" } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON", closest: () => null } as unknown as EventTarget)).toBe(false);
  });
});
