import { describe, expect, it } from "vitest";
import { courseStops, sessionOneOutline } from "@/lib/course";

describe("courseStops", () => {
  const lessons = [
    { id: "s1-m1-mapa-del-sistema", module: 1, title: "Título real del módulo 1", estimatedMinutes: 15 },
    { id: "s1-m4-consultas-seguras", module: 4, title: "Título real del módulo 4", estimatedMinutes: 20 },
  ];

  it("lists every planned module in order", () => {
    expect(courseStops(lessons).map((s) => s.module)).toEqual(sessionOneOutline.map((m) => m.module));
  });

  it("links published modules with their own title and minutes", () => {
    const m4 = courseStops(lessons).find((s) => s.module === 4)!;
    expect(m4).toMatchObject({ lessonId: "s1-m4-consultas-seguras", title: "Título real del módulo 4", minutes: 20 });
  });

  it("keeps unpublished modules without a link, and module 8 as optional", () => {
    const stops = courseStops(lessons);
    expect(stops.find((s) => s.module === 2)?.lessonId).toBeUndefined();
    expect(stops.find((s) => s.module === 8)?.optional).toBe(true);
  });
});
