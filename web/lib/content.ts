import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { lessonSchema, type Lesson } from "@/lib/lesson-schema";

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
    for (const fileName of readdirSync(/* turbopackIgnore: true */ folder).filter((f) => f.endsWith(".json")).sort()) {
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
