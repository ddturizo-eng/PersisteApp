import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { lessonSchema, quizSchema, type Lesson, type Quiz } from "@/lib/lesson-schema";

/** The session's final quiz lives next to the lessons but is not a lesson (design §12.1). */
export const QUIZ_FILE = "quiz.json";

/** Root folder for lesson JSON files: content/<session folder>/<lesson id>.json */
export const CONTENT_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "content");

/** Thrown when one or more lesson files are invalid; lists every problem found. */
export class ContentError extends Error {
  constructor(readonly problems: string[]) {
    super(`Contenido inválido (${problems.length}):\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "ContentError";
  }
}

function formatPath(issuePath: PropertyKey[]): string {
  return issuePath
    .map((part, i) => (typeof part === "number" ? `[${part}]` : `${i === 0 ? "" : "."}${String(part)}`))
    .join("");
}

function describeIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => `${file} → ${formatPath(issue.path) || "(raíz)"}: ${issue.message}`);
}

/**
 * Reads and validates every lesson under `dir` (REQ-01 CA1, CA2).
 * Fails with all problems at once so the author fixes them in one pass.
 */
export function loadLessons(dir: string = CONTENT_DIR): Lesson[] {
  const problems: string[] = [];
  const lessons: Lesson[] = [];
  const seen = new Map<string, string>();

  const sessionDirs = readdirSync(/* turbopackIgnore: true */ dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const sessionDir of sessionDirs) {
    const folder = path.join(/* turbopackIgnore: true */ dir, sessionDir.name);
    for (const fileName of readdirSync(/* turbopackIgnore: true */ folder).filter((f) => f.endsWith(".json") && f !== QUIZ_FILE).sort()) {
      const file = `${sessionDir.name}/${fileName}`;
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(/* turbopackIgnore: true */ path.join(folder, fileName), "utf8"));
      } catch (error) {
        problems.push(`${file} → JSON mal formado: ${(error as Error).message}`);
        continue;
      }

      const result = lessonSchema.safeParse(raw);
      if (!result.success) {
        problems.push(...describeIssues(file, result.error));
        continue;
      }

      const lesson = result.data;
      const expectedName = `${lesson.id}.json`;
      if (fileName !== expectedName) {
        problems.push(`${file} → id: el archivo debe llamarse ${expectedName}`);
      }
      const duplicate = seen.get(lesson.id);
      if (duplicate) {
        problems.push(`${file} → id: "${lesson.id}" ya existe en ${duplicate}`);
      }
      seen.set(lesson.id, file);
      lessons.push(lesson);
    }
  }

  if (problems.length > 0) throw new ContentError(problems);

  return lessons.sort((a, b) => a.session - b.session || a.module - b.module || a.id.localeCompare(b.id));
}

/** Lessons of one session in course order. */
export function lessonsForSession(session: 1 | 2, dir?: string): Lesson[] {
  return loadLessons(dir).filter((lesson) => lesson.session === session);
}

/** One lesson by id, or undefined. */
export function findLesson(id: string, dir?: string): Lesson | undefined {
  return loadLessons(dir).find((lesson) => lesson.id === id);
}

/**
 * Reads and validates the final quiz of a session (REQ-29 CA1): exactly 12 questions and at
 * least one for every published core module, so no module goes unchecked.
 */
export function loadQuiz(session: 1 | 2, dir: string = CONTENT_DIR): Quiz {
  const file = `s${session}/${QUIZ_FILE}`;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(/* turbopackIgnore: true */ path.join(dir, `s${session}`, QUIZ_FILE), "utf8"));
  } catch (error) {
    throw new ContentError([`${file} → no se pudo leer: ${(error as Error).message}`]);
  }

  const result = quizSchema.safeParse(raw);
  if (!result.success) throw new ContentError(describeIssues(file, result.error));

  const quiz = result.data;
  const problems: string[] = [];
  if (quiz.session !== session) problems.push(`${file} → session: debe ser ${session}`);
  const covered = new Set(quiz.questions.map((q) => q.module));
  for (const lesson of lessonsForSession(session, dir)) {
    if (!lesson.optional && !covered.has(lesson.module)) {
      problems.push(`${file} → questions: falta al menos una pregunta del módulo ${lesson.module}`);
    }
  }
  if (problems.length > 0) throw new ContentError(problems);
  return quiz;
}

/** Where «Continuar» leads after a module: the next core module, then the final quiz (REQ-26 CA4). */
export function nextAfter(lesson: Lesson, dir?: string): { href: string; label: string } {
  if (lesson.optional) return { href: "/", label: "Volver al inicio" };
  const next = lessonsForSession(lesson.session, dir).find((l) => !l.optional && l.module > lesson.module);
  return next
    ? { href: `/s${lesson.session}/${next.id}`, label: "Siguiente módulo" }
    : { href: `/s${lesson.session}/quiz`, label: "Prepárate para el quiz" };
}
