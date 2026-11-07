import { describe, expect, it } from "vitest";
import { loadQuiz } from "@/lib/content";
import { gradeAnswer, gradeOf, practiceQuiz, quizLessonId, toPublicQuiz } from "@/lib/quiz";
import { codeLines, questionSeconds, QUIZ_TIME } from "@/lib/quiz-time";

const quiz = loadQuiz(1);

describe("toPublicQuiz (P10)", () => {
  it("sends no answer or explanation to the browser", () => {
    const serialized = JSON.stringify(toPublicQuiz(quiz));
    for (const question of quiz.questions) {
      for (const option of question.options) {
        expect(serialized).not.toContain(JSON.stringify(option.explanation));
      }
    }
    expect(serialized).not.toContain('"correct"');
    expect(serialized).not.toContain('"reserve"');
    for (const spare of quiz.reserve ?? []) expect(serialized).not.toContain(JSON.stringify(spare.prompt));
    expect(serialized).not.toContain('"explanation"');
  });

  it("keeps prompts, contexts, modules and option texts", () => {
    const publicQuiz = toPublicQuiz(quiz);
    const [original, sent] = [quiz.questions[0], publicQuiz.questions[0]];
    expect(sent.prompt).toBe(original.prompt);
    expect(sent.module).toBe(original.module);
    expect(sent.context).toBe(original.context);
    expect(sent.options.map((o) => o.text)).toEqual(original.options.map((o) => o.text));
    expect(Object.keys(sent.options[0])).toEqual(["text"]);
  });
});

describe("gradeAnswer", () => {
  const question = quiz.questions[0];
  const right = question.options.findIndex((o) => o.correct);
  const wrong = question.options.findIndex((o) => !o.correct);

  it("grades the right option", () => {
    expect(gradeAnswer(quiz, question.id, right)).toMatchObject({ ok: true, correct: true, correctIndex: right });
  });

  it("grades a wrong option and reveals the right one", () => {
    expect(gradeAnswer(quiz, question.id, wrong)).toMatchObject({ ok: true, correct: false, correctIndex: right });
  });

  it("rejects unknown questions and options", () => {
    expect(gradeAnswer(quiz, "no-existe", 0)).toEqual({ ok: false, error: "Pregunta no encontrada." });
    expect(gradeAnswer(quiz, question.id, 9)).toEqual({ ok: false, error: "Opción inválida." });
  });
});

describe("warm-up (REQ-29 CA4)", () => {
  const warmUp = practiceQuiz(quiz);

  it("never grades a real question in practice mode", () => {
    for (const real of quiz.questions) {
      expect(gradeAnswer(warmUp, real.id, 0)).toEqual({ ok: false, error: "Pregunta no encontrada." });
    }
  });

  it("sends only warm-up questions and keeps them out of the real quiz payload", () => {
    const sentWarmUp = JSON.stringify(toPublicQuiz(warmUp));
    for (const real of quiz.questions) expect(sentWarmUp).not.toContain(JSON.stringify(real.prompt));
    const sentReal = JSON.stringify(toPublicQuiz(quiz));
    for (const q of quiz.practice) expect(sentReal).not.toContain(JSON.stringify(q.prompt));
  });
});

describe("gradeOf (REQ-29 CA6)", () => {
  it("maps correct answers to a 0–5 grade", () => {
    expect(gradeOf(10, 10)).toBe(5);
    expect(gradeOf(6, 10)).toBe(3);
    expect(gradeOf(7, 10)).toBe(3.5);
    expect(gradeOf(0, 10)).toBe(0);
    expect(gradeOf(2, 3)).toBe(3.3);
  });
});

describe("quizLessonId", () => {
  it("stores final quiz answers as s1-quiz (design §12.1)", () => {
    expect(quizLessonId(1)).toBe("s1-quiz");
  });
});

describe("questionSeconds (REQ-35 CA1)", () => {
  const option = (text: string) => ({ text });

  it("gives short questions the minimum and caps long ones", () => {
    expect(questionSeconds({ prompt: "¿Sí?", options: [option("a"), option("b")] })).toBe(QUIZ_TIME.minSeconds);
    const long = "palabra ".repeat(400);
    expect(questionSeconds({ prompt: long, options: [option("a")] })).toBe(QUIZ_TIME.maxSeconds);
  });

  it("adds time for code lines and inline code", () => {
    const base = { prompt: "uno dos tres ".repeat(10), options: [option("a b c d"), option("e f g h")] };
    const withCode = { ...base, context: "Aparece:\n\nlínea uno\nlínea dos\nlínea tres" };
    const withInline = { ...base, options: [option("`a.b()` c d"), option("`e.f()` g h")] };
    expect(questionSeconds(withCode)).toBeGreaterThan(questionSeconds(base));
    expect(questionSeconds(withInline)).toBeGreaterThanOrEqual(questionSeconds(base));
    expect(codeLines(withCode.context)).toBe(3);
  });

  it("keeps every real question between 30 and 90 s, in steps of 5", () => {
    for (const question of quiz.questions) {
      const seconds = questionSeconds(question);
      expect(seconds % 5).toBe(0);
      expect(seconds).toBeGreaterThanOrEqual(30);
      expect(seconds).toBeLessThanOrEqual(90);
    }
  });
});
