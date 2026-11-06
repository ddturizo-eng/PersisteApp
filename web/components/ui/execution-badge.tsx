import { Database, FlaskConical } from "lucide-react";
import { cn } from "cn";
import { executionLabels, type ExecutionKind } from "@/lib/execution";

/**
 * Mandatory label on every practice output (REQ-07).
 * Uses text, icon and border style, never color alone (REQ-07 CA2).
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
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        kind === "real"
          ? "border-real/40 bg-real-soft text-real"
          : "border-dashed border-simulated/60 bg-simulated-soft text-simulated",
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
      <span className="sr-only">. {description}</span>
    </span>
  );
}
