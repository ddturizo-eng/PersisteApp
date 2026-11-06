import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ContentError, loadLessons } from "@/lib/content";
import { lengthGiveaway, lessonSchema } from "@/lib/lesson-schema";

/** Real content must always be valid: this test also runs as `prebuild`. */
describe("content/ lessons", () => {
  it("are all valid", () => {
    const lessons = loadLessons();
    expect(lessons.length).toBeGreaterThan(0);
  });
});

const validLesson = {
  id: "s1-m1-demo",
  session: 1,
  module: 1,
  title: "Demo",
  summary: "Lección de prueba",
  estimatedMinutes: 5,
  source: { label: "JDBC", url: "https://docs.oracle.com/javase/tutorial/jdbc/" },
  steps: [
    { kind: "text", stage: "theory", body: "a" },
    { kind: "visual", stage: "theory", component: "pool", caption: "b" },
    {
      kind: "question",
      stage: "theory",
      prompt: "c",
      options: [
        { text: "sí", correct: true, explanation: "x" },
        { text: "no", correct: false, explanation: "y" },
      ],
    },
    {
      kind: "code",
      stage: "practice",
      mode: "order",
      language: "java",
      prompt: "ordena",
      variants: { java: "x" },
      blocks: ["a", "b", "c"],
    },
    {
      kind: "code",
      stage: "practice",
      mode: "read",
      language: "sql",
      variants: { oracle: "SELECT 1 FROM dual", postgresql: "SELECT 1" },
      result: { kind: "simulated", output: "1" },
    },
    { kind: "text", stage: "practice", body: "d", reflection: true },
    {
      kind: "quiz",
      stage: "quiz",
      questions: [
        { id: "q1", prompt: "uno", options: [{ text: "a", correct: true, explanation: "x" }, { text: "b", correct: false, explanation: "y" }] },
        { id: "q2", prompt: "dos", options: [{ text: "a", correct: true, explanation: "x" }, { text: "b", correct: false, explanation: "y" }] },
        { id: "q3", prompt: "tres", options: [{ text: "a", correct: true, explanation: "x" }, { text: "b", correct: false, explanation: "y" }] },
      ],
    },
  ],
};

const clone = () => structuredClone(validLesson) as Record<string, unknown> & typeof validLesson;

describe("lessonSchema", () => {
  it("accepts a lesson covering the three stages", () => {
    expect(lessonSchema.safeParse(validLesson).success).toBe(true);
  });

  it("rejects stages that go backwards", () => {
    const lesson = clone();
    lesson.steps[1].stage = "quiz";
    const result = lessonSchema.safeParse(lesson);
    expect(result.success).toBe(false);
  });

  it("rejects a core lesson missing a stage", () => {
    const lesson = clone();
    lesson.steps = lesson.steps.filter((s) => s.stage !== "practice");
    expect(lessonSchema.safeParse(lesson).success).toBe(false);
  });

  it("allows an optional lesson without all stages", () => {
    const lesson = { ...clone(), optional: true, steps: [validLesson.steps[0]] };
    expect(lessonSchema.safeParse(lesson).success).toBe(true);
  });

  it("requires exactly one correct option", () => {
    const lesson = clone();
    const question = lesson.steps[2] as { options: { correct: boolean }[] };
    question.options[1].correct = true;
    expect(lessonSchema.safeParse(lesson).success).toBe(false);
  });

  it("requires every {{n}} gap to be declared and used", () => {
    const lesson = clone();
    lesson.steps[3] = {
      kind: "code",
      stage: "practice",
      mode: "fill",
      language: "java",
      prompt: "completa",
      variants: { java: "ps.{{1}}(1, x); ps.{{2}}();" },
      gaps: [{ id: 1, label: "uno", answers: ["setString"] }],
    } as unknown as (typeof lesson.steps)[number];
    const result = lessonSchema.safeParse(lesson);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes("{{2}}"))).toBe(true);
  });
});

describe("loadLessons", () => {
  let dir: string;

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  function write(file: string, content: unknown) {
    const target = path.join(dir, "s1", file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, typeof content === "string" ? content : JSON.stringify(content));
  }

  function problemsOf(fn: () => unknown): string[] {
    try {
      fn();
    } catch (error) {
      if (error instanceof ContentError) return error.problems;
      throw error;
    }
    return [];
  }

  it("reports the file and the invalid field (REQ-01 CA2)", () => {
    dir = mkdtempSync(path.join(tmpdir(), "lessons-"));
    const lesson = clone();
    (lesson.steps[2] as { prompt: string }).prompt = "";
    write("s1-m1-demo.json", lesson);
    const problems = problemsOf(() => loadLessons(dir));
    expect(problems).toEqual([expect.stringContaining("s1/s1-m1-demo.json → steps[2].prompt")]);
  });

  it("reports malformed JSON and file names that do not match the id", () => {
    dir = mkdtempSync(path.join(tmpdir(), "lessons-"));
    write("roto.json", "{ no es json");
    write("otro-nombre.json", validLesson);
    const problems = problemsOf(() => loadLessons(dir));
    expect(problems).toHaveLength(2);
    expect(problems.join("\n")).toContain("JSON mal formado");
    expect(problems.join("\n")).toContain("debe llamarse s1-m1-demo.json");
  });

  it("picks up a new file without code changes (REQ-01 CA1)", () => {
    dir = mkdtempSync(path.join(tmpdir(), "lessons-"));
    write("s1-m1-demo.json", validLesson);
    expect(loadLessons(dir).map((l) => l.id)).toEqual(["s1-m1-demo"]);
  });
});

describe("question quality (REQ-32)", () => {
  const options = (correct: string, ...wrong: string[]) => [
    { text: correct, correct: true },
    ...wrong.map((text) => ({ text, correct: false })),
  ];

  it("flags a right answer that is much longer or shorter than the rest", () => {
    expect(lengthGiveaway(options("a".repeat(60), "b".repeat(40), "c".repeat(45)))).toContain("demasiado larga");
    expect(lengthGiveaway(options("a".repeat(20), "b".repeat(40), "c".repeat(45)))).toContain("demasiado corta");
  });

  it("accepts balanced options", () => {
    expect(lengthGiveaway(options("a".repeat(50), "b".repeat(46), "c".repeat(55)))).toBeUndefined();
  });

  it("requires the gap answer to be one of its choices", () => {
    const lesson = clone();
    lesson.steps[3] = {
      kind: "code",
      stage: "practice",
      mode: "fill",
      language: "java",
      prompt: "elige",
      variants: { java: "ps.{{1}}(1, x);" },
      gaps: [{ id: 1, label: "uno", answers: ["setString"], choices: ["setInt", "getString"] }],
    } as unknown as (typeof lesson.steps)[number];
    const result = lessonSchema.safeParse(lesson);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain("la respuesta debe estar entre las opciones");
  });
});
