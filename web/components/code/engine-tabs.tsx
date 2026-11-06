"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "cn";
import type { Engine } from "@/lib/lesson-schema";

const labels: Record<Engine, string> = { postgresql: "PostgreSQL", oracle: "Oracle" };
const order: Engine[] = ["postgresql", "oracle"];

/**
 * Engine tabs following the W3C APG tabs pattern with automatic activation:
 * roving tabindex, ← → with wrap-around, Home/End, aria-selected and aria-controls.
 */
export function EngineTabs({
  engine,
  onChange,
  children,
}: {
  engine: Engine;
  onChange: (engine: Engine) => void;
  children: ReactNode;
}) {
  const id = useId();
  const tabs = useRef<Record<Engine, HTMLButtonElement | null>>({ postgresql: null, oracle: null });

  function select(next: Engine) {
    onChange(next);
    tabs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const current = order.indexOf(engine);
    const keys: Record<string, number> = {
      ArrowRight: (current + 1) % order.length,
      ArrowLeft: (current - 1 + order.length) % order.length,
      Home: 0,
      End: order.length - 1,
    };
    const target = keys[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(order[target]);
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div role="tablist" aria-label="Motor de base de datos" className="flex border-b bg-muted/60">
        {order.map((option) => {
          const selected = option === engine;
          return (
            <button
              key={option}
              ref={(el) => {
                tabs.current[option] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${option}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(option)}
              onKeyDown={onKeyDown}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        tabIndex={0}
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${engine}`}
        className="[&_pre]:rounded-none"
      >
        {children}
      </div>
    </div>
  );
}
