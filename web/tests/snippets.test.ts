import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT_DIR, loadLessons, loadSnippets } from "@/lib/content";
import type { TokenLines } from "@/lib/highlight";
import { compactIndent, compactIndentText, crudClassNames, laterUses, stepList } from "@/lib/snippets";

const REPO = path.join(process.cwd(), "..");
const snippets = loadSnippets(path.join(CONTENT_DIR, "s1"));

/** Lines without indentation: the modal may dedent, but every line must be the real one. */
const trimmed = (text: string) => text.split("\n").map((line) => line.trim());

function containsContiguous(haystack: string[], needle: string[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

describe("snippets.json (proposal of 7 Nov 2026)", () => {
  const fromCrud = snippets.filter((s) => s.file);

  it("has CRUD excerpts", () => {
    expect(fromCrud.length).toBeGreaterThan(5);
  });

  for (const snippet of fromCrud) {
    it.skipIf(!existsSync(path.join(REPO, snippet.file!)))(`${snippet.id} is copied exactly from ${snippet.file}`, () => {
      const file = trimmed(readFileSync(path.join(REPO, snippet.file!), "utf8").replace(/\r\n/g, "\n"));
      expect(containsContiguous(file, trimmed(snippet.variants.java!))).toBe(true);
    });
  }

  it("names the CRUD classes a step may only mention with refs", () => {
    expect(crudClassNames(snippets)).toEqual(expect.arrayContaining(["ProductService", "ConsoleMenu", "UserRepository"]));
  });

  it("every lesson loads with its refs resolved", () => {
    expect(() => loadLessons()).not.toThrow();
  });
});

describe("compact indentation in the modal", () => {
  it("halves leading spaces and keeps the code", () => {
    expect(compactIndentText("a {\n    b;\n        c;\n}")).toBe("a {\n  b;\n    c;\n}");
    const lines: TokenLines = [[["        ", "x", "y"], ["return", "k", "k"], [" sale;", "p", "p"]], [["    }", "p", "p"]]];
    expect(compactIndent(lines)).toEqual([[["    ", "x", "y"], ["return", "k", "k"], [" sale;", "p", "p"]], [["  }", "p", "p"]]]);
  });
});

describe("attention note", () => {
  it("lists the later steps that open a snippet", () => {
    const steps = [{}, { refs: ["a"] }, { refs: ["b"] }, { refs: ["a", "b"] }];
    expect(laterUses(steps, 0, "a")).toEqual([2, 4]);
    expect(laterUses(steps, 1, "a")).toEqual([4]);
    expect(stepList([7])).toBe("el paso 7");
    expect(stepList([5, 9])).toBe("los pasos 5 y 9");
    expect(stepList([3, 5, 9])).toBe("los pasos 3, 5 y 9");
  });
});
