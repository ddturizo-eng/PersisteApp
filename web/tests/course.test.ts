import { describe, expect, it } from "vitest";
import { coreMinutes, courseStops, MODULES_BUDGET_MINUTES, sessionOneOutline } from "@/lib/course";

describe("courseStops", () => {
  const lessons = [
    { id: "s1-m1-que-es-una-base-de-datos", module: 1, title: "Título real del módulo 1", estimatedMinutes: 12 },
    { id: "s1-m4-el-viaje", module: 4, title: "Título real del módulo 4", estimatedMinutes: 10 },
  ];

  it("lists every planned module in order", () => {
    expect(courseStops(lessons).map((s) => s.module)).toEqual(sessionOneOutline.map((m) => m.module));
  });

  it("links published modules with their own title and minutes", () => {
    const m4 = courseStops(lessons).find((s) => s.module === 4)!;
    expect(m4).toMatchObject({ lessonId: "s1-m4-el-viaje", title: "Título real del módulo 4", minutes: 10 });
  });

  it("keeps unpublished modules without a link and has no optional module", () => {
    const stops = courseStops(lessons);
    expect(stops.find((s) => s.module === 2)?.lessonId).toBeUndefined();
    expect(stops).toHaveLength(6);
    expect(stops.every((s) => !s.optional)).toBe(true);
    expect(coreMinutes(stops)).toBe(85);
    expect(coreMinutes(stops)).toBeLessThanOrEqual(MODULES_BUDGET_MINUTES);
  });
});
