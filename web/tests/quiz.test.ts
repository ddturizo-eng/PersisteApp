import { describe, expect, it } from "vitest";
import { loadLessons } from "@/lib/content";
import { gradeAnswer, toPublicLesson } from "@/lib/quiz";

const lessons = loadLessons();
const withQuiz = lessons.filter((lesson) => lesson.steps.some((step) => step.kind === "quiz"));

describe("toPublicLesson (P10)", () => {
  it("has at least one real lesson with a quiz to check", () => {
    expect(withQuiz.length).toBeGreaterThan(0);
  });

  it.each(withQuiz.map((lesson) => [lesson.id, lesson] as const))(
    "%s sends no quiz answer or explanation to the browser",
    (_, lesson) => {
      const serialized = JSON.stringify(toPublicLesson(lesson));
      for (const step of lesson.steps) {
        if (step.kind !== "quiz") continue;
        for (const question of step.questions) {
          for (const option of question.options) {
            expect(serialized).not.toContain(JSON.stringify(option.explanation));
          }
        }
      }
      const publicQuizzes = JSON.stringify(toPublicLesson(lesson).steps.filter((step) => step.kind === "quiz"));
      expect(publicQuizzes).not.toContain('"correct"');
      expect(publicQuizzes).not.toContain('"explanation"');
    }
  );

  it("keeps prompts, contexts and option texts", () => {
    const lesson = withQuiz[0];
    const quiz = lesson.steps.find((step) => step.kind === "quiz")!;
    const publicQuiz = toPublicLesson(lesson).steps.find((step) => step.kind === "quiz")!;
    if (quiz.kind !== "quiz" || publicQuiz.kind !== "quiz") throw new Error("quiz expected");
    expect(publicQuiz.questions[0].prompt).toBe(quiz.questions[0].prompt);
    expect(publicQuiz.questions[0].options.map((o) => o.text)).toEqual(quiz.questions[0].options.map((o) => o.text));
    expect(Object.keys(publicQuiz.questions[0].options[0])).toEqual(["text"]);
  });
});

describe("gradeAnswer", () => {
  const lesson = withQuiz[0];
  const quiz = lesson.steps.find((step) => step.kind === "quiz");
  if (quiz?.kind !== "quiz") throw new Error("quiz expected");
  const question = quiz.questions[0];
  const right = question.options.findIndex((o) => o.correct);
  const wrong = question.options.findIndex((o) => !o.correct);

  it("grades the right option", () => {
    expect(gradeAnswer(lesson, question.id, right)).toMatchObject({ ok: true, correct: true, correctIndex: right });
  });

  it("grades a wrong option and reveals the right one", () => {
    const result = gradeAnswer(lesson, question.id, wrong);
    expect(result).toMatchObject({ ok: true, correct: false, correctIndex: right });
  });

  it("rejects unknown questions and options", () => {
    expect(gradeAnswer(lesson, "no-existe", 0)).toEqual({ ok: false, error: "Pregunta no encontrada." });
    expect(gradeAnswer(lesson, question.id, 9)).toEqual({ ok: false, error: "Opción inválida." });
  });
});
