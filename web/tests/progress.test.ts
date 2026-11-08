import { describe, expect, it } from "vitest";
import { parseProgress, withLesson } from "@/lib/progress";

describe("local progress", () => {
  it("reads nothing from empty or malformed values", () => {
    expect(parseProgress(null)).toEqual([]);
    expect(parseProgress("")).toEqual([]);
    expect(parseProgress("{oops")).toEqual([]);
    expect(parseProgress('{"a":1}')).toEqual([]);
  });

  it("keeps only non-empty strings, without duplicates", () => {
    expect(parseProgress('["m1", 2, "", "m1", null, "m2"]')).toEqual(["m1", "m2"]);
  });

  it("adds a lesson once", () => {
    const first = withLesson(null, "m1");
    expect(parseProgress(first)).toEqual(["m1"]);
    expect(withLesson(first, "m1")).toBeNull();
    expect(parseProgress(withLesson(first, "m2"))).toEqual(["m1", "m2"]);
  });

  it("recovers from a corrupted value", () => {
    expect(parseProgress(withLesson("not json", "m3"))).toEqual(["m3"]);
  });
});
