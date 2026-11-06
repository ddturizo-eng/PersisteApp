import { describe, expect, it } from "vitest";
import { executionLabels } from "@/lib/execution";
import { nextTheme, themeInitScript, THEME_STORAGE_KEY } from "@/lib/theme";

describe("executionLabels", () => {
  it("labels both execution kinds in Spanish", () => {
    expect(executionLabels.real.label).toBe("Ejecución real");
    expect(executionLabels.simulated.label).toBe("Simulación");
  });
});

describe("theme", () => {
  it("toggles between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });

  it("init script reads the same storage key the toggle writes", () => {
    expect(themeInitScript).toContain(THEME_STORAGE_KEY);
  });
});
