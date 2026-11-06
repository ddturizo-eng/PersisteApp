import { describe, expect, it } from "vitest";
import { lessonSchema } from "@/lib/lesson-schema";
import {
  currentEventIndex,
  feedbackFor,
  isTraceComplete,
  locationLabel,
  pickLocation,
  type TraceStep,
} from "@/lib/trace";

const step = {
  kind: "trace",
  stage: "practice",
  title: "Recorrido",
  intro: "x",
  locations: [
    { id: "env", label: ".env", kind: "file" },
    { id: "pool", label: "ConnectionPool.java", kind: "class" },
    { id: "repo", label: "Repository.java", kind: "class" },
  ],
  events: [
    { moment: "Antes", description: "credenciales", options: ["env", "pool", "repo"], answer: "env", why: { pool: "no pool", repo: "no repo" }, explanation: "env ok" },
    { moment: "Arranca", description: "pool", options: ["env", "pool", "repo"], answer: "pool", why: { env: "no env", repo: "no repo" }, explanation: "pool ok" },
    { moment: "Consulta", description: "sql", options: ["env", "pool", "repo"], answer: "repo", why: { env: "no env", pool: "no pool" }, explanation: "repo ok" },
  ],
} as TraceStep;

describe("trace walkthrough", () => {
  it("advances one event at a time, only on the right location", () => {
    let picks = {};
    expect(currentEventIndex(step, picks)).toBe(0);
    picks = pickLocation(step, picks, 0, "pool");
    expect(currentEventIndex(step, picks)).toBe(0);
    picks = pickLocation(step, picks, 0, "env");
    expect(currentEventIndex(step, picks)).toBe(1);
  });

  it("explains a wrong pick and confirms a right one", () => {
    expect(feedbackFor(step.events[0], ["repo"])).toEqual({ correct: false, text: "no repo" });
    expect(feedbackFor(step.events[0], ["repo", "env"])).toEqual({ correct: true, text: "env ok" });
    expect(feedbackFor(step.events[0], [])).toBeUndefined();
  });

  it("ignores picks once an event is solved and repeated picks", () => {
    const solved = pickLocation(step, {}, 0, "env");
    expect(pickLocation(step, solved, 0, "pool")).toBe(solved);
    const once = pickLocation(step, {}, 1, "env");
    expect(pickLocation(step, once, 1, "env")).toBe(once);
  });

  it("completes when every event is solved", () => {
    const picks = { 0: ["env"], 1: ["pool"], 2: ["repo"] };
    expect(isTraceComplete(step, picks)).toBe(true);
    expect(locationLabel(step, "pool")).toBe("ConnectionPool.java");
  });
});

describe("trace schema", () => {
  const lessonWith = (trace: unknown) => ({
    id: "s1-m1-x",
    session: 1,
    module: 1,
    title: "t",
    summary: "s",
    estimatedMinutes: 5,
    optional: true,
    source: { label: "x", url: "https://example.com" },
    steps: [trace],
  });

  it("accepts a valid walkthrough", () => {
    expect(lessonSchema.safeParse(lessonWith(step)).success).toBe(true);
  });

  it("rejects unknown locations, answers outside the options and missing reasons", () => {
    const broken = structuredClone(step) as TraceStep;
    broken.events[0].options = ["env", "pool", "nowhere"];
    broken.events[1].answer = "db";
    delete (broken.events[2].why as Record<string, string>).env;
    const result = lessonSchema.safeParse(lessonWith(broken));
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => i.message).join(" | ");
    expect(messages).toContain("lugar desconocido: nowhere");
    expect(messages).toContain("la respuesta debe estar entre las opciones");
    expect(messages).toContain("falta explicar por qué no es env");
  });
});
