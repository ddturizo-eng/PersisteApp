import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CodeView } from "@/components/code/code-view";
import type { TokenLines } from "@/lib/highlight";

/** Each gap's first occurrence must reach the visible code: that is where the selector goes. */
describe("CodeView gaps (REQ-04 CA7)", () => {
  const renderGap = (id: number, occurrence: number) => `[gap${id}#${occurrence}]`;
  const lines: TokenLines = [
    [["System.__GAP_1__(x);", "#000", "#fff"]],
    [["ps.__GAP_2__(1, a); ps.__GAP_2__(2, b);", "#000", "#fff"]],
  ];

  it("gives the block layout the first occurrence of every gap", () => {
    const html = renderToStaticMarkup(createElement(CodeView, { lines, fallback: "", renderGap }));
    expect(html).toContain("[gap1#0]");
    expect(html).toContain("[gap2#0]");
    expect(html).toContain("[gap2#1]");
    expect(html).not.toContain("[gap1#1]");
  });

  it("does the same for the inline layout and for the plain fallback", () => {
    const inline = renderToStaticMarkup(createElement(CodeView, { lines, fallback: "", renderGap, inline: true }));
    expect(inline).toContain("[gap1#0]");
    expect(inline).not.toContain("[gap1#1]");
    const plain = renderToStaticMarkup(createElement(CodeView, { lines: undefined, fallback: "a.__GAP_1__()", renderGap }));
    expect(plain).toContain("[gap1#0]");
  });
});
