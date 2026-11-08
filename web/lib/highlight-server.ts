import "server-only";
import { cacheLife } from "next/cache";
import { codeToTokens } from "shiki";
import { toSentinels } from "@/lib/exercises";
import { highlightKey, type Highlights, type TokenLines } from "@/lib/highlight";
import type { Lesson } from "@/lib/lesson-schema";
import type { Snippet } from "@/lib/snippets";

const themes = { light: "github-light-default", dark: "github-dark-default" } as const;

/**
 * github-light-default paints comments #6E7781 (4.05:1) and functions #8250DF (4.49:1) on our code
 * background #f0f3eb, below WCAG AA 4.5:1 (axe, T-24). Darker shades of the same hues: 5.7:1 and 5.8:1.
 */
const lightOverrides: Record<string, string> = { "#6e7781": "#57606A", "#8250df": "#6F42C1" };
const lightColor = (color: string) => lightOverrides[color.toLowerCase()] ?? color;

/** Every code string a lesson shows: variants, pick-line options, order blocks and trace snippets. */
type Language = "java" | "sql" | "properties" | "xml";

function codeStrings(lesson: Lesson): { language: Language; code: string }[] {
  const found: { language: Language; code: string }[] = [];
  for (const step of lesson.steps) {
    if (step.kind === "trace") {
      for (const event of step.events) {
        if (event.code) found.push({ language: event.code.language, code: event.code.source });
      }
      continue;
    }
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
export async function highlightLesson(lesson: Lesson, snippets: Snippet[] = []): Promise<Highlights> {
  "use cache";
  // Content only changes with a new deploy, so the result never expires.
  cacheLife("max");
  const highlights: Highlights = {};
  const snippetCode = snippets.flatMap((snippet) =>
    Object.values(snippet.variants).flatMap((code) => (code ? [{ language: snippet.language, code }] : []))
  );
  for (const { language, code } of [...codeStrings(lesson), ...snippetCode]) {
    const key = highlightKey(language, code);
    if (highlights[key]) continue;
    const { tokens } = await codeToTokens(code, { lang: language, themes });
    highlights[key] = tokens.map((line) =>
      line.map((token) => {
        const style = (token.htmlStyle ?? {}) as Record<string, string>;
        return [token.content, lightColor(style.color ?? ""), style["--shiki-dark"] ?? ""];
      })
    ) satisfies TokenLines;
  }
  return highlights;
}
