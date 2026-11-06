import { describe, expect, it } from "vitest";
import { EXPOSITION_STORAGE_KEY, expositionInitScript, formatElapsed } from "@/lib/exposition";

describe("formatElapsed", () => {
  it("formats minutes and seconds", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(65_000)).toBe("1:05");
    expect(formatElapsed(100 * 60_000)).toBe("1:40:00");
  });

  it("never shows negative time", () => {
    expect(formatElapsed(-5000)).toBe("0:00");
  });
});

describe("expositionInitScript", () => {
  it("reads the key the toggle writes", () => {
    expect(expositionInitScript).toContain(EXPOSITION_STORAGE_KEY);
  });
});
