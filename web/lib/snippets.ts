import { z } from "zod";
import type { CodeToken, TokenLines } from "@/lib/highlight";

/**
 * Code snippets a lesson step can open in the «Ver código» modal (refs) or show as a read step
 * (snippet). They live in content/<session>/snippets.json so one piece of code is written once and
 * shared by every step and module that asks about it.
 *
 * Snippets with `file` are copied from the Java CRUD (crud/…); tests/snippets.test.ts checks that
 * their lines still appear, in order and contiguous, in that file. Others are lesson examples.
 */

export const SNIPPETS_FILE = "snippets.json";

const text = z.string().trim().min(1, "no puede estar vacío");

export const snippetSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+\/[a-zA-Z0-9.-]+$/, "formato esperado grupo/nombre, por ejemplo crud-v1/ProductService.registerSale"),
    title: text,
    /** Where the code comes from, shown in the modal: «CRUD v1 · ProductService.java». */
    origin: text,
    language: z.enum(["java", "sql", "xml", "properties"]),
    variants: z
      .object({ java: text.optional(), oracle: text.optional(), postgresql: text.optional() })
      .refine((v) => Boolean(v.java ?? v.oracle ?? v.postgresql), "necesita al menos una variante de código"),
    /** Source file in the repository (from the repo root) when the snippet is an exact excerpt. */
    file: z.string().regex(/^crud\//, "debe empezar por crud/").optional(),
  })
  .superRefine((snippet, ctx) => {
    if (snippet.file && !snippet.variants.java) {
      ctx.addIssue({ code: "custom", path: ["variants"], message: "un fragmento del CRUD va en la variante java" });
    }
  });

export const snippetsFileSchema = z.object({
  snippets: z
    .array(snippetSchema)
    .refine((list) => new Set(list.map((s) => s.id)).size === list.length, "los id de los fragmentos deben ser únicos"),
});

export type Snippet = z.infer<typeof snippetSchema>;
export type SnippetMap = Record<string, Snippet>;

/** Class names a step can mention only with refs: the files the CRUD snippets come from. */
export function crudClassNames(snippets: Snippet[]): string[] {
  const names = snippets
    .map((s) => s.file?.match(/([A-Za-z0-9]+)\.java$/)?.[1])
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)];
}

/** Code to show for a snippet: Java, or the engine the student picked, or whichever exists. */
export function snippetCode(snippet: Snippet, engine: "oracle" | "postgresql"): string {
  const v = snippet.variants;
  return v.java ?? v[engine] ?? v.postgresql ?? v.oracle ?? "";
}

/**
 * Steps after `index` whose refs include `id` (1-based numbers), for the «mantén la atención»
 * note on the step that first shows that code.
 */
export function laterUses(steps: { refs?: string[] }[], index: number, id: string): number[] {
  return steps.flatMap((step, i) => (i > index && step.refs?.includes(id) ? [i + 1] : []));
}

/** «los pasos 5 y 9», «el paso 7». */
export function stepList(numbers: number[]): string {
  if (numbers.length === 1) return `el paso ${numbers[0]}`;
  return `los pasos ${numbers.slice(0, -1).join(", ")} y ${numbers.at(-1)}`;
}

/**
 * Halves the leading indentation (4 spaces to 2) so the modal needs less sideways scrolling on a
 * phone. Only the display changes: the snippet text stays exact.
 */
export function compactIndent(lines: TokenLines): TokenLines {
  return lines.map((line) => {
    let leading = 0;
    for (const [text] of line) {
      const spaces = text.length - text.trimStart().length;
      leading += spaces;
      if (spaces < text.length) break;
    }
    let remove = leading - Math.floor(leading / 2);
    const out: CodeToken[] = [];
    for (const token of line) {
      if (remove > 0) {
        const spaces = token[0].length - token[0].trimStart().length;
        const cut = Math.min(spaces, remove);
        remove -= cut;
        if (cut === token[0].length) continue;
        out.push([token[0].slice(cut), token[1], token[2]]);
      } else out.push(token);
    }
    return out;
  });
}

/** Same as compactIndent for plain text (the fallback before highlighting). */
export function compactIndentText(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const leading = line.length - line.trimStart().length;
      return line.slice(leading - Math.floor(leading / 2));
    })
    .join("\n");
}
