import { describe, expect, it } from "vitest";
import type { Quiz } from "@/lib/lesson-schema";
import { buildReport, reportCsv, type AnswerInput, type ParticipantInput } from "@/lib/report";

const option = (text: string, correct = false) => ({ text, correct, explanation: "x" });
const quiz: Quiz = {
  session: 1,
  title: "Quiz",
  questions: [
    { id: "q1", module: 1, prompt: "Uno", options: [option("a", true), option("b")] },
    { id: "q2", module: 2, prompt: "Dos", options: [option("a"), option("b", true)] },
  ],
  practice: [],
};

const people: ParticipantInput[] = [
  { id: "p1", name: "Ana María Pérez", student_code: "1065123456", exits: 0, blocked_at: null },
  { id: "p2", name: "Luis Gómez", student_code: "1002003004", exits: 2, blocked_at: "2026-11-09T13:05:00Z" },
  { id: "p3", name: "Eva Díaz", student_code: "1009998887", exits: 1, blocked_at: null },
];

const t0 = "2026-11-09T13:00:00.000Z";
const after = (s: number) => new Date(new Date(t0).getTime() + s * 1000).toISOString();
const answer = (participant: string, question: string, optionIndex: number | null, correct: boolean, seconds: number, timedOut = false): AnswerInput => ({
  participant_id: participant,
  question_id: question,
  option_index: optionIndex,
  correct,
  timed_out: timedOut,
  shown_at: t0,
  answered_at: after(seconds),
  limit_seconds: 45,
});

const answers: AnswerInput[] = [
  answer("p1", "q1", 0, true, 10),
  answer("p1", "q2", 1, true, 20),
  answer("p2", "q1", 0, true, 8),
  answer("p2", "q2", 1, true, 30),
  answer("p3", "q1", 1, false, 5),
  answer("p3", "q2", null, false, 45, true),
  // Pending question: shown but not answered, it must not count.
  { ...answer("p3", "q1", null, false, 0), question_id: "q9", answered_at: null, correct: null },
];

describe("buildReport (REQ-30, REQ-31)", () => {
  const report = buildReport(quiz, people, answers);

  it("ranks by correct answers, then by time on them", () => {
    expect(report.students.map((s) => [s.short, s.position, s.correct, s.grade])).toEqual([
      ["Ana M.", 1, 2, 5],
      ["Luis G.", 2, 2, 5],
      ["Eva D.", 3, 0, 0],
    ]);
    expect(report.students[0].correctSeconds).toBe(30);
    expect(report.students[1].correctSeconds).toBe(38);
  });

  it("keeps exits and blocks for the live view", () => {
    expect(report.students.find((s) => s.id === "p2")).toMatchObject({ exits: 2, blocked: true });
  });

  it("summarizes each question with option choices and hard ones flagged", () => {
    const [q1, q2] = report.questions;
    expect(q1).toMatchObject({ answered: 3, correct: 2, percent: 67, hard: false });
    expect(q1.options[1].students).toEqual(["Eva Díaz"]);
    expect(q2).toMatchObject({ answered: 3, correct: 2, timedOut: 1 });
  });

  it("flags questions under 50 %", () => {
    const hard = buildReport(quiz, people, [answer("p1", "q1", 1, false, 5), answer("p2", "q1", 1, false, 5)]);
    expect(hard.questions[0]).toMatchObject({ percent: 0, hard: true });
    expect(hard.questions[1]).toMatchObject({ percent: null, hard: false });
  });
});

describe("reportCsv (REQ-30 CA4)", () => {
  const csv = reportCsv(quiz, buildReport(quiz, people, answers));

  it("starts with a UTF-8 BOM and uses ; with decimal comma", () => {
    expect(csv.startsWith("﻿Puesto;Nombre;Documento")).toBe(true);
    expect(csv).toContain("1;Ana María Pérez;1065123456;2;2;5;30;0;No;A ✓;B ✓");
    expect(csv).toContain("3;Eva Díaz;1009998887;2;0;0;0;1;No;B ✗;⏱");
  });
});
