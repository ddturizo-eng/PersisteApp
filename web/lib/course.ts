/**
 * Session 1 outline for the landing (REQ-33 CA3, REQ-06 CA1). Published lessons come from
 * content/; modules not written yet appear as «Próximamente» with their planned title.
 */

export type PlannedModule = { module: number; title: string; minutes: number; optional?: boolean };

/** Planned modules (specs/04-rumbo-teoria-bd.md §3). */
export const sessionOneOutline: PlannedModule[] = [
  { module: 1, title: "Dónde viven los datos cuando apagas el programa", minutes: 12 },
  { module: 2, title: "Cuatro verbos para hablarle a una tabla", minutes: 18 },
  { module: 3, title: "Tablas que se señalan: llaves y relaciones", minutes: 15 },
  { module: 4, title: "El viaje de una consulta", minutes: 10 },
  { module: 5, title: "De la tabla a la clase", minutes: 15 },
  { module: 6, title: "Sin ORM: tú escribes el puente", minutes: 15 },
];

/** Maximum class time for the six modules; enforced by content validation. */
export const MODULES_BUDGET_MINUTES = 90;

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

/** Minutes of the six modules. */
export function modulesMinutes(stops: CourseStop[]): number {
  return stops.filter((s) => !s.optional).reduce((sum, s) => sum + s.minutes, 0);
}

/** Minutes of the core path. */
export function coreMinutes(stops: CourseStop[]): number {
  return modulesMinutes(stops);
}
