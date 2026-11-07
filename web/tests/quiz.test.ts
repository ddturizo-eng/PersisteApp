import { describe, expect, it } from "vitest";
import { loadQuiz } from "@/lib/content";
import { gradeAnswer, quizLessonId, toPublicQuiz } from "@/lib/quiz";

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

describe("quizLessonId", () => {
  it("stores final quiz answers as s1-quiz (design §12.1)", () => {
    expect(quizLessonId(1)).toBe("s1-quiz");
  });
});
