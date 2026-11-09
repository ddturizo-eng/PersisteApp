"use client";

import { KeyRound, Link2 } from "lucide-react";
import { cn } from "cn";
import type { Cell } from "@/lib/sample-db";

export type CardColumn = { name: string; type?: string; pk?: boolean; fk?: string };

/**
 * A table drawn as a card (REQ-41): name tab, header with PK/FK marks and rows. Every part can be
 * a button so the visuals can explain or link it; highlighting is driven by the parent.
 */
export function TableCard({
  name,
  columns,
  rows,
  caption,
  activeColumn,
  activeRows,
  onColumn,
  onRow,
  onCell,
  activeCell,
  className,
  compact,
}: {
  name: string;
  columns: CardColumn[];
  rows: Record<string, Cell>[];
  caption?: string;
  activeColumn?: string | null;
  activeRows?: number[];
  activeCell?: { row: number; column: string } | null;
  onColumn?: (column: string) => void;
  onRow?: (index: number) => void;
  onCell?: (index: number, column: string) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <figure className={cn("min-w-0", className)}>
      <div className="inline-flex items-center gap-2 rounded-t-2xl border-2 border-b-0 border-foreground bg-sun px-4 py-1.5 font-mono text-sm font-semibold text-sun-foreground">
        {name}
      </div>
      <div className="overflow-x-auto rounded-tr-2xl rounded-b-2xl border-2 border-foreground bg-card">
        <table className={cn("w-full border-collapse text-left font-mono", compact ? "text-xs" : "text-sm")}>
          <thead>
            <tr className="border-b-2 border-foreground bg-muted">
              {onRow && <th className="w-8 px-2" aria-label="Fila" />}
              {columns.map((c) => {
                const active = activeColumn === c.name;
                const label = (
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    {c.pk && <KeyRound aria-label="llave primaria" className="size-3.5 text-sun-foreground dark:text-sun" />}
                    {c.fk && <Link2 aria-label={`llave foránea a ${c.fk}`} className="size-3.5 text-real" />}
                    <span className="font-semibold">{c.name}</span>
                    {c.type && <span className="font-normal text-muted-foreground">{c.type}</span>}
                  </span>
                );
                return (
                  <th key={c.name} scope="col" className={cn("p-0 transition-colors", active && "bg-secondary")}>
                    {onColumn ? (
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => onColumn(c.name)}
                        className={cn("w-full outline-none hover:bg-secondary/60 focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-inset", compact ? "px-2 py-1.5" : "px-3 py-2")}
                      >
                        {label}
                      </button>
                    ) : (
                      <div className={compact ? "px-2 py-1.5" : "px-3 py-2"}>{label}</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rowActive = activeRows?.includes(i);
              return (
                <tr key={i} className={cn("border-b border-border transition-colors last:border-b-0", rowActive && "bg-sun/30")}>
                  {onRow && (
                    <td className="p-0">
                      <button
                        type="button"
                        aria-pressed={rowActive}
                        aria-label={`Fila ${i + 1}`}
                        onClick={() => onRow(i)}
                        className="grid h-full w-8 place-items-center py-2 text-xs text-muted-foreground outline-none hover:bg-secondary/60 focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-inset"
                      >
                        {i + 1}
                      </button>
                    </td>
                  )}
                  {columns.map((c) => {
                    const value = row[c.name];
                    const cellActive = activeCell?.row === i && activeCell.column === c.name;
                    const content = value === null || value === undefined ? <span className="text-muted-foreground italic">NULL</span> : String(value);
                    return (
                      <td
                        key={c.name}
                        className={cn(
                          "p-0 whitespace-nowrap transition-colors",
                          activeColumn === c.name && !rowActive && "bg-secondary/50",
                          cellActive && "bg-sun text-sun-foreground"
                        )}
                      >
                        {onCell ? (
                          <button
                            type="button"
                            onClick={() => onCell(i, c.name)}
                            className={cn("w-full text-left outline-none hover:bg-secondary/60 focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-inset", compact ? "px-2 py-1.5" : "px-3 py-2")}
                          >
                            {content}
                          </button>
                        ) : (
                          <div className={compact ? "px-2 py-1.5" : "px-3 py-2"}>{content}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onRow ? 1 : 0)} className="px-3 py-4 text-center text-muted-foreground">
                  (sin filas)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {caption && <figcaption className="mt-2 text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/** Explanation box under a visual; aria-live so screen readers hear the change. */
export function ExplainBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div aria-live="polite" className="rounded-3xl border-2 border-foreground bg-card p-5">
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </div>
  );
}
