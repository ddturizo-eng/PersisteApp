/** Inline code in lesson text is written between backticks: «llama a `rs.next()`». */

export type InlinePart = { text: string; code: boolean };

const INLINE_CODE = /`([^`\n]+)`/g;

export function splitInlineCode(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_CODE)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), code: false });
    parts.push({ text: match[1], code: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), code: false });
  return parts;
}

/** Text as the reader sees it, without the backticks (for lengths and aria-labels). */
export function plainText(text: string): string {
  return text.replace(INLINE_CODE, "$1");
}

/** An odd number of backticks means a code span was not closed. */
export function hasUnclosedCode(text: string): boolean {
  return (text.match(/`/g)?.length ?? 0) % 2 === 1;
}
