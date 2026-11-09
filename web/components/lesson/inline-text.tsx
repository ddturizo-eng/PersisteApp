import { Fragment } from "react";
import { splitInlineCode } from "@/lib/inline-code";

const EMPHASIS = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;

/** **bold** and *italic* outside code spans, so key terms stand out in theory steps. */
function Emphasis({ text }: { text: string }) {
  return text.split(EMPHASIS).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

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
      <Emphasis key={i} text={part.text} />
    )
  );
}
