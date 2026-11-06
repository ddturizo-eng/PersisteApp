import { Check } from "lucide-react";
import { cn } from "cn";
import { stageLabels } from "@/lib/lesson-schema";
import type { StageState } from "@/lib/player";
import type { Stage } from "@/lib/lesson-schema";

/**
 * The six lesson stages (constitution P6). Pattern from USWDS step indicator:
 * counters, aria-current on the active stage, hidden "completada" text.
 * On narrow screens only the current stage shows its label.
 */
export function StageIndicator({ states }: { states: { stage: Stage; state: StageState }[] }) {
  return (
    <ol aria-label="Etapas de la lección" className="flex items-center gap-1 sm:gap-2">
      {states.map(({ stage, state }, position) => (
        <li
          key={stage}
          aria-current={state === "current" ? "step" : undefined}
          className="flex min-w-0 items-center gap-1.5"
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
              state === "complete" && "border-primary bg-primary text-primary-foreground",
              state === "current" && "border-primary text-primary ring-2 ring-primary/25",
              state === "upcoming" && "text-muted-foreground"
            )}
          >
            {state === "complete" ? <Check className="size-3.5" /> : position + 1}
          </span>
          <span
            className={cn(
              "truncate text-sm",
              state === "current" ? "font-medium text-foreground" : "sr-only text-muted-foreground md:not-sr-only"
            )}
          >
            {stageLabels[stage]}
            {state === "complete" && <span className="sr-only"> (completada)</span>}
          </span>
          {position < states.length - 1 && (
            <span aria-hidden="true" className="hidden h-px w-3 bg-border md:block lg:w-6" />
          )}
        </li>
      ))}
    </ol>
  );
}
