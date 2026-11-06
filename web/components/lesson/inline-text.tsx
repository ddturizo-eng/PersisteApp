import { Fragment } from "react";
import { splitInlineCode } from "@/lib/inline-code";

/**
 * Lesson text with inline code: `ps.executeQuery()` written between backticks in the JSON
 * renders as <code>, so method and class names stand out from the prose.
 */
export function InlineText({ text }: { text: string }) {
  return splitInlineCode(text).map((part, i) =>
    part.code ? (
      <code key={i} className="inline-code">
        {part.text}
      </code>
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    )
  );
}
