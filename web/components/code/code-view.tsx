import { Fragment, type ReactNode } from "react";
import { cn } from "cn";
import { GAP_SENTINEL } from "@/lib/exercises";
import type { TokenLines } from "@/lib/highlight";

/**
 * Renders Shiki tokens. Dark colors come from --shiki-dark via CSS (.dark), so the
 * right palette shows before hydration. `renderGap` replaces __GAP_n__ placeholders.
 */
export function CodeView({
  lines,
  fallback,
  renderGap,
  className,
  inline = false,
}: {
  lines: TokenLines | undefined;
  fallback: string;
  renderGap?: (id: number, occurrence: number) => ReactNode;
  className?: string;
  inline?: boolean;
}) {
  const counts = new Map<number, number>();
  const gap = (id: number) => {
    const occurrence = counts.get(id) ?? 0;
    counts.set(id, occurrence + 1);
    return renderGap ? renderGap(id, occurrence) : "____";
  };

  const renderText = (text: string, key: string, style?: React.CSSProperties) => {
    const parts = text.split(GAP_SENTINEL);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <Fragment key={`${key}-g${i}`}>{gap(Number(part))}</Fragment>
      ) : part ? (
        <span key={`${key}-t${i}`} data-token="" style={style}>
          {part}
        </span>
      ) : null
    );
  };

  if (inline) {
    // Built only here: rendering both layouts would consume each gap's first occurrence, and
    // the visible copy would get the read-only mirrors instead of the selectors.
    const body = lines
      ? lines.map((line, l) => (
          <Fragment key={l}>
            {line.map(([text, light, dark], t) =>
              renderText(text, `${l}-${t}`, { color: light, ["--shiki-dark" as string]: dark })
            )}
            {l < lines.length - 1 && "\n"}
          </Fragment>
        ))
      : renderText(fallback, "plain");
    // Inline code wraps instead of scrolling so a whole line is readable on a phone.
    return (
      <code className={cn("font-mono text-sm whitespace-pre-wrap text-code-foreground [overflow-wrap:anywhere]", className)}>
        {body}
      </code>
    );
  }

  // Block code: one element per line, so a long line wraps with a hanging indent instead of
  // forcing sideways scrolling on a phone.
  const blockLines = lines
    ? lines.map((line, l) => (
        <span key={l} className="code-line">
          {line.length === 0
            ? "​"
            : line.map(([text, light, dark], t) =>
                renderText(text, `${l}-${t}`, { color: light, ["--shiki-dark" as string]: dark })
              )}
        </span>
      ))
    : fallback.split("\n").map((text, l) => (
        <span key={l} className="code-line">
          {text ? renderText(text, `plain-${l}`) : "​"}
        </span>
      ));

  return (
    <pre
      className={cn(
        "rounded-2xl bg-code p-3.5 font-mono text-[0.8125rem] leading-relaxed text-code-foreground sm:p-4 sm:text-sm",
        className
      )}
    >
      <code>{blockLines}</code>
    </pre>
  );
}
