import { Database, FlaskConical } from "lucide-react";
import { cn } from "cn";
import { executionLabels, type ExecutionKind } from "@/lib/execution";

/**
 * Mandatory label on every practice output (REQ-07).
 * Text and icon carry the meaning, never color alone (REQ-07 CA2): a soft pill, no outline.
 */
export function ExecutionBadge({
  kind,
  className,
}: {
  kind: ExecutionKind;
  className?: string;
}) {
  const { label, description } = executionLabels[kind];
  const Icon = kind === "real" ? Database : FlaskConical;

  return (
    <span
      data-slot="execution-badge"
      data-kind={kind}
      title={description}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        kind === "real" ? "bg-real-soft text-real" : "bg-simulated-soft text-simulated",
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
      <span className="sr-only">. {description}</span>
    </span>
  );
}
