import { describe, expect, it } from "vitest";
import { site } from "@/lib/site";

describe("site", () => {
  it("exposes the platform name and tagline", () => {
    expect(site.name).toBe("PersisteApp");
    expect(site.tagline).toBe("Lo que registras, queda guardado");
  });
});
