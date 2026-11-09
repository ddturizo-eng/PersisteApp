"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { cn } from "cn";

export type ExplainedLine = { code: string; say: string };

/**
 * Code that is never left alone (specs/04 §7 rule 1): every line can be touched and says, in plain
 * words, what it does. «Anterior / Siguiente» walks the lines like a presenter.
 */
export function CodeExplain({ lines, language = "java" }: { lines: ExplainedLine[]; language?: "java" | "sql" }) {
  const explained = lines.map((l, i) => (l.say.trim() ? i : -1)).filter((i) => i >= 0);
  const [at, setAt] = useState(explained[0] ?? 0);
  const pos = explained.indexOf(at);
  const go = (delta: number) => setAt(explained[Math.min(explained.length - 1, Math.max(0, pos + delta))]);

  return (
    <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-[1.25fr_1fr] lg:items-start">
      <div className="overflow-x-auto rounded-2xl border-2 border-foreground bg-code py-3 font-mono text-sm text-code-foreground">
        <p className="px-4 pb-2 text-xs uppercase tracking-wide opacity-60">{language === "sql" ? "SQL" : "Java"}</p>
        <ol>
          {lines.map((line, i) => {
            const can = line.say.trim().length > 0;
            const active = i === at;
            const n = explained.indexOf(i) + 1;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={!can}
                  aria-pressed={active}
                  onClick={() => setAt(i)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-1 text-left whitespace-pre outline-none focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-inset",
                    can && "hover:bg-white/10",
                    active && "bg-sun text-sun-foreground hover:bg-sun"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                      !can && "invisible",
                      active ? "bg-sun-foreground text-sun" : "bg-white/15"
                    )}
                  >
                    {n || ""}
                  </span>
                  <span>{line.code || " "}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="space-y-3 lg:sticky lg:top-4">
        <div aria-live="polite" className="rounded-3xl border-2 border-foreground bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <MessageCircle aria-hidden="true" className="size-4" /> Línea {pos + 1} de {explained.length}
          </p>
          <p className="mt-2 font-mono text-sm break-words">{lines[at]?.code.trim()}</p>
          <p className="mt-3 text-lg leading-relaxed">{lines[at]?.say}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={pos <= 0}
            className="inline-flex h-10 items-center gap-1 rounded-full border-2 border-foreground bg-card px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="size-4" /> Anterior
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={pos >= explained.length - 1}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-40"
          >
            Siguiente línea <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
