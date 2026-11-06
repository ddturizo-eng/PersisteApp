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

  if (inline) {
    return <code className={cn("font-mono text-sm whitespace-pre text-code-foreground", className)}>{body}</code>;
  }

  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-lg bg-code p-4 font-mono text-sm leading-relaxed text-code-foreground",
        className
      )}
    >
      <code>{body}</code>
    </pre>
  );
}
