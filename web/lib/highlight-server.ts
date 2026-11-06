import "server-only";
import { cacheLife } from "next/cache";
import { codeToTokens } from "shiki";
import { toSentinels } from "@/lib/exercises";
import { highlightKey, type Highlights, type TokenLines } from "@/lib/highlight";
import type { Lesson } from "@/lib/lesson-schema";

const themes = { light: "github-light-default", dark: "github-dark-default" } as const;

/** Every code string a lesson shows: variants, pick-line options and order blocks. */
function codeStrings(lesson: Lesson): { language: "java" | "sql"; code: string }[] {
  const found: { language: "java" | "sql"; code: string }[] = [];
  for (const step of lesson.steps) {
    if (step.kind !== "code") continue;
    const add = (code: string | undefined) => code && found.push({ language: step.language, code: toSentinels(code) });
    add(step.variants.java);
    add(step.variants.oracle);
    add(step.variants.postgresql);
    if (step.mode === "pick-line") step.options.forEach((o) => add(o.line));
    if (step.mode === "order") [...step.blocks, ...(step.distractors ?? [])].forEach(add);
  }
  return found;
}

/** Highlights a lesson's code with Shiki at build time (decision of 6 Nov 2026: Shiki, not Monaco). */
export async function highlightLesson(lesson: Lesson): Promise<Highlights> {
  "use cache";
  // Content only changes with a new deploy, so the result never expires.
  cacheLife("max");
  const highlights: Highlights = {};
  for (const { language, code } of codeStrings(lesson)) {
    const key = highlightKey(language, code);
    if (highlights[key]) continue;
    const { tokens } = await codeToTokens(code, { lang: language, themes });
    highlights[key] = tokens.map((line) =>
      line.map((token) => {
        const style = (token.htmlStyle ?? {}) as Record<string, string>;
        return [token.content, style.color ?? "", style["--shiki-dark"] ?? ""];
      })
    ) satisfies TokenLines;
  }
  return highlights;
}
