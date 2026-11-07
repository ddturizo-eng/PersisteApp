import type { Quiz } from "@/lib/lesson-schema";
import { gradeOf } from "@/lib/quiz";
import { compareRanking, shortName } from "@/lib/room";

/**
 * Teacher reports (REQ-30, REQ-31): pure functions over the room's participants and answers, so
 * the panel, the projector and the CSV agree and are unit-tested.
 */

export type ParticipantInput = {
  id: string;
  name: string;
  student_code: string;
  exits: number;
  blocked_at: string | null;
};

export type AnswerInput = {
  participant_id: string;
  question_id: string;
  option_index: number | null;
  correct: boolean | null;
  timed_out: boolean;
  shown_at: string;
  answered_at: string | null;
  limit_seconds: number;
};

export type StudentAnswer = { questionId: string; option: number | null; correct: boolean; timedOut: boolean; seconds: number };

export type StudentRow = {
  id: string;
  name: string;
  short: string;
  document: string;
  answered: number;
  correct: number;
  grade: number;
  /** Seconds spent on correct answers: the ranking tie-break (REQ-30 CA1). */
  correctSeconds: number;
  position: number;
  exits: number;
  blocked: boolean;
  answers: StudentAnswer[];
};

export type QuestionRow = {
  id: string;
  module: number;
  prompt: string;
  answered: number;
  correct: number;
  timedOut: number;
  /** 0–100, or null when nobody answered yet. */
  percent: number | null;
  averageSeconds: number | null;
  /** Fewer than half got it right (REQ-31 CA3). */
  hard: boolean;
  options: { text: string; correct: boolean; students: string[] }[];
};

export type RoomReport = { students: StudentRow[]; questions: QuestionRow[]; total: number };

function secondsOf(answer: AnswerInput): number {
  if (!answer.answered_at) return 0;
  const elapsed = (new Date(answer.answered_at).getTime() - new Date(answer.shown_at).getTime()) / 1000;
  return Math.max(0, Math.min(answer.limit_seconds, elapsed));
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export function buildReport(quiz: Quiz, participants: ParticipantInput[], answers: AnswerInput[]): RoomReport {
  const total = quiz.questions.length;
  const done = answers.filter((a) => a.answered_at);

  const unsorted = participants.map((p) => {
    const mine = done.filter((a) => a.participant_id === p.id);
    const studentAnswers: StudentAnswer[] = mine.map((a) => ({
      questionId: a.question_id,
      option: a.option_index,
      correct: a.correct === true,
      timedOut: a.timed_out,
      seconds: round1(secondsOf(a)),
    }));
    const correct = studentAnswers.filter((a) => a.correct).length;
    return {
      id: p.id,
      name: p.name,
      short: shortName(p.name),
      document: p.student_code,
      answered: studentAnswers.length,
      correct,
      grade: gradeOf(correct, total),
      correctSeconds: round1(studentAnswers.filter((a) => a.correct).reduce((sum, a) => sum + a.seconds, 0)),
      position: 0,
      exits: p.exits,
      blocked: p.blocked_at !== null,
      answers: studentAnswers,
    };
  });

  const key = (s: (typeof unsorted)[number]) => ({ participant_id: s.id, score: s.correct, correct_seconds: s.correctSeconds });
  const sorted = [...unsorted].sort((a, b) => compareRanking(key(a), key(b)) || a.name.localeCompare(b.name, "es"));
  const students = sorted.map((s) => ({
    ...s,
    // Ties share the position («1, 1, 3»).
    position: sorted.findIndex((other) => compareRanking(key(other), key(s)) === 0) + 1,
  }));

  const nameOf = new Map(participants.map((p) => [p.id, p.name]));
  const questions = quiz.questions.map((q) => {
    const rows = done.filter((a) => a.question_id === q.id);
    const correct = rows.filter((a) => a.correct).length;
    const percent = rows.length ? Math.round((correct / rows.length) * 100) : null;
    return {
      id: q.id,
      module: q.module,
      prompt: q.prompt,
      answered: rows.length,
      correct,
      timedOut: rows.filter((a) => a.timed_out).length,
      percent,
      averageSeconds: rows.length ? round1(rows.reduce((sum, a) => sum + secondsOf(a), 0) / rows.length) : null,
      hard: percent !== null && percent < 50,
      options: q.options.map((option, index) => ({
        text: option.text,
        correct: option.correct,
        students: rows.filter((a) => a.option_index === index).map((a) => nameOf.get(a.participant_id) ?? "?"),
      })),
    };
  });

  return { students, questions, total };
}

const LETTERS = "ABCDEFGH";

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV for the grade sheet (REQ-30 CA4): «;» separator and decimal comma, as Excel expects in
 * Spanish, with a UTF-8 BOM so accents open correctly. Per question: chosen letter and ✓/✗, or
 * «⏱» when time ran out.
 */
export function reportCsv(quiz: Quiz, report: RoomReport): string {
  const header = [
    "Puesto",
    "Nombre",
    "Documento",
    "Respondidas",
    "Aciertos",
    "Nota",
    "Tiempo en aciertos (s)",
    "Salidas",
    "Bloqueado",
    ...quiz.questions.map((q, i) => `P${i + 1} (${q.id})`),
  ];
  const decimal = (n: number) => String(n).replace(".", ",");
  const lines = report.students.map((s) => [
    s.position,
    s.name,
    s.document,
    s.answered,
    s.correct,
    decimal(s.grade),
    decimal(s.correctSeconds),
    s.exits,
    s.blocked ? "Sí" : "No",
    ...quiz.questions.map((q) => {
      const a = s.answers.find((x) => x.questionId === q.id);
      if (!a) return "";
      if (a.timedOut || a.option === null) return "⏱";
      return `${LETTERS[a.option]} ${a.correct ? "✓" : "✗"}`;
    }),
  ]);
  return "﻿" + [header, ...lines].map((row) => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
}
