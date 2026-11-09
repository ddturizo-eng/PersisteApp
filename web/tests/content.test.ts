import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ContentError, loadLessons, loadQuiz, nextAfter } from "@/lib/content";
import { courseStops, MODULES_BUDGET_MINUTES, modulesMinutes } from "@/lib/course";
import { lengthGiveaway, lessonSchema } from "@/lib/lesson-schema";
import { hasUnclosedCode, plainText, splitInlineCode } from "@/lib/inline-code";

/** Real content must always be valid: this test also runs as `prebuild`. */
describe("content/ lessons", () => {
  it("are all valid", () => {
    const lessons = loadLessons();
    expect(lessons.length).toBeGreaterThan(0);
  });

  it("keeps six modules under the 90-minute budget, published and planned", () => {
    expect(modulesMinutes(courseStops(loadLessons()))).toBeLessThanOrEqual(MODULES_BUDGET_MINUTES);
    expect(courseStops(loadLessons())).toHaveLength(6);
  });

  it("include a valid final quiz for session 1 (REQ-29)", () => {
    expect(loadQuiz(1).questions).toHaveLength(10);
  });

  it("ends module 6 at the landing and keeps one interactive step per module", () => {
    const lessons = loadLessons();
    const session = lessons.filter((l) => l.session === 1);
    expect(session.map((l) => l.module)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(nextAfter(session[5])).toEqual({ href: "/", label: "Volver al inicio" });
    for (const lesson of session) {
      expect(lesson.steps[0].stage).toBe("theory");
      expect(lesson.steps.some((step) => step.kind === "visual" || step.kind === "trace" || (step.kind === "code" && step.mode !== "read"))).toBe(true);
    }
  });

  it("close every inline code span (`…`)", () => {
    const unclosed: string[] = [];
    const walk = (value: unknown, where: string) => {
      if (typeof value === "string") {
        if (hasUnclosedCode(value)) unclosed.push(where);
      } else if (Array.isArray(value)) value.forEach((item, i) => walk(item, `${where}[${i}]`));
      else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, `${where}.${k}`);
    };
    for (const lesson of loadLessons()) walk(lesson, lesson.id);
    walk(loadQuiz(1), "quiz");
    expect(unclosed).toEqual([]);
  });
});

describe("inline code", () => {
  it("splits backtick spans and keeps the prose", () => {
    expect(splitInlineCode("llama a `rs.next()` y sigue")).toEqual([
      { text: "llama a ", code: false },
      { text: "rs.next()", code: true },
      { text: " y sigue", code: false },
    ]);
    expect(plainText("`a` y `b`")).toBe("a y b");
  });

  it("does not count backticks when comparing option lengths", () => {
    const options = [
      { text: "`setString` asigna texto", correct: true },
      { text: "`getString` lee el texto", correct: false },
    ];
    expect(lengthGiveaway(options)).toBeUndefined();
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
  ],
};

const clone = () => structuredClone(validLesson) as Record<string, unknown> & typeof validLesson;

describe("lessonSchema", () => {
  it("accepts a lesson covering both stages", () => {
    expect(lessonSchema.safeParse(validLesson).success).toBe(true);
  });

  it("rejects stages that go backwards", () => {
    const lesson = clone();
    lesson.steps[4].stage = "theory";
    const result = lessonSchema.safeParse(lesson);
    expect(result.success).toBe(false);
  });

  it("rejects the old quiz stage inside a lesson (REQ-26)", () => {
    const lesson = clone();
    lesson.steps[5].stage = "quiz";
    expect(lessonSchema.safeParse(lesson).success).toBe(false);
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

  const question = (id: string, module: number) => ({
    id,
    module,
    prompt: "¿Cuál?",
    options: [
      { text: "esta", correct: true, explanation: "x" },
      { text: "otra", correct: false, explanation: "y" },
    ],
  });
  const quiz = (modules: number[]) => ({
    session: 1,
    title: "Quiz final",
    questions: modules.map((m, i) => ({ ...question(`q${i}`, m), prompt: `¿Cuál ${i}?` })),
    practice: [1, 2, 3].map((n) => ({ ...question(`cal-${n}`, 1), prompt: `¿Calentamiento ${n}?` })),
  });

  it("rejects a warm-up that repeats a real question (REQ-29 CA4)", () => {
    dir = mkdtempSync(path.join(tmpdir(), "lessons-"));
    write("s1-m1-demo.json", validLesson);
    const leaky = quiz(Array(10).fill(1));
    leaky.practice[0].prompt = leaky.questions[3].prompt;
    write("quiz.json", leaky);
    expect(problemsOf(() => loadQuiz(1, dir)).join("\n")).toContain("no puede repetir");
  });

  it("does not read quiz.json as a lesson and validates it apart (design §12.1)", () => {
    dir = mkdtempSync(path.join(tmpdir(), "lessons-"));
    write("s1-m1-demo.json", validLesson);
    write("quiz.json", quiz(Array(10).fill(1)));
    expect(loadLessons(dir)).toHaveLength(1);
    expect(loadQuiz(1, dir).questions).toHaveLength(10);
  });

  it("keeps the retained quiz schema without requiring coverage of new modules", () => {
    dir = mkdtempSync(path.join(tmpdir(), "lessons-"));
    write("s1-m1-demo.json", validLesson);
    write("s1-m2-demo.json", { ...validLesson, id: "s1-m2-demo", module: 2 });
    write("quiz.json", quiz(Array(9).fill(1)));
    expect(problemsOf(() => loadQuiz(1, dir)).join("\n")).toContain("exactamente 10 preguntas");
    write("quiz.json", quiz(Array(10).fill(1)));
    expect(problemsOf(() => loadQuiz(1, dir))).toEqual([]);
  });

  it("sends each module to the next one and the last to the landing", () => {
    dir = mkdtempSync(path.join(tmpdir(), "lessons-"));
    write("s1-m1-demo.json", validLesson);
    write("s1-m4-demo.json", { ...validLesson, id: "s1-m4-demo", module: 4 });
    write("s1-m6-demo.json", { ...validLesson, id: "s1-m6-demo", module: 6 });
    const [m1, m4, m6] = loadLessons(dir);
    expect(nextAfter(m1, dir)).toEqual({ href: "/s1/s1-m4-demo", label: "Siguiente módulo" });
    expect(nextAfter(m4, dir)).toEqual({ href: "/s1/s1-m6-demo", label: "Siguiente módulo" });
    expect(nextAfter(m6, dir)).toEqual({ href: "/", label: "Volver al inicio" });
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
