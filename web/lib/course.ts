import { FINAL_QUIZ_QUESTIONS } from "@/lib/lesson-schema";
/**
 * Session 1 outline for the landing (REQ-33 CA3, REQ-06 CA1). Published lessons come from
 * content/; modules not written yet appear as «Próximamente» with their planned title.
 */

export type PlannedModule = { module: number; title: string; minutes: number; optional?: boolean };

/** Planned modules (specs/03-tasks.md). Titles are replaced by the lesson's own title once it exists. */
export const sessionOneOutline: PlannedModule[] = [
  { module: 1, title: "Qué viaja entre tu código y la tabla", minutes: 15 },
  { module: 2, title: "Tu primera conexión: URL, driver y variables de entorno", minutes: 12 },
  { module: 3, title: "Por qué abrir una conexión por consulta es lento: el pool", minutes: 15 },
  { module: 4, title: "Por qué tu login deja entrar a cualquiera", minutes: 15 },
  { module: 5, title: "Todo o nada: transacciones con commit y rollback", minutes: 12 },
  { module: 6, title: "Del clic a la fila: las capas de tu aplicación", minutes: 12 },
  { module: 7, title: "Lo que ves es lo que se guarda: el CRUD completo", minutes: 12 },
  { module: 8, title: "Qué hace Spring Boot por ti", minutes: 15, optional: true },
];

/** Final quiz (REQ-29): 10 questions of 30–90 s each, about 8 min plus instructions. */
export const finalQuiz = { questions: FINAL_QUIZ_QUESTIONS, minutes: 10 } as const;

/**
 * Time budget of the core modules 1–7 (decision of 6 Nov 2026): under 100 minutes, so the
 * two-hour class keeps room for the final quiz and does not overload students. The build fails
 * if the published and planned minutes add up to more.
 */
export const MODULES_BUDGET_MINUTES = 100;

export type CourseStop = {
  module: number;
  title: string;
  minutes: number;
  optional: boolean;
  /** Lesson id when the module is published; undefined while it is «Próximamente». */
  lessonId?: string;
};

export function courseStops(lessons: { id: string; module: number; title: string; estimatedMinutes: number; optional?: boolean }[]): CourseStop[] {
  return sessionOneOutline.map((planned) => {
    const lesson = lessons.find((l) => l.module === planned.module);
    return lesson
      ? { module: planned.module, title: lesson.title, minutes: lesson.estimatedMinutes, optional: Boolean(lesson.optional ?? planned.optional), lessonId: lesson.id }
      : { module: planned.module, title: planned.title, minutes: planned.minutes, optional: Boolean(planned.optional) };
  });
}

/** Minutes of the core modules 1–7 (no optional module, no quiz). */
export function modulesMinutes(stops: CourseStop[]): number {
  return stops.filter((s) => !s.optional).reduce((sum, s) => sum + s.minutes, 0);
}

/** Minutes of the core path (modules 1–7 plus the final quiz). */
export function coreMinutes(stops: CourseStop[]): number {
  return stops.filter((s) => !s.optional).reduce((sum, s) => sum + s.minutes, 0) + finalQuiz.minutes;
}
