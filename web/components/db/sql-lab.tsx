"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Loader2, Play, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { TableCard } from "@/components/db/table-card";
import { ExecutionBadge } from "@/components/ui/execution-badge";
import { presetById, presetQueries, seedSql, tables, type Cell, type PresetQuery, type Row, type TableName } from "@/lib/sample-db";

type Engine = {
  query: (sql: string) => Promise<{ rows: Record<string, unknown>[]; fields: { name: string }[]; affectedRows?: number }>;
  exec: (sql: string) => Promise<unknown>;
  close: () => Promise<void>;
};

type LogEntry = { sql: string; ok: boolean; message: string; result?: { columns: string[]; rows: Row[] } };

const tableNames: TableName[] = ["estudiante", "curso", "matricula"];

function toCell(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "bigint") return Number(value);
  return String(value);
}

const toRows = (rows: Record<string, unknown>[]): Row[] => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, toCell(v)])));

/** Splits a script on «;» at the end of a line, so each statement reports its own result. */
export function splitStatements(script: string): string[] {
  return script
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^--/.test(s));
}

function describe(sql: string, affected: number | undefined, rowCount: number, hasFields: boolean): string {
  const verb = sql.split(/\s+/)[0].toUpperCase();
  if (hasFields) return `${rowCount} ${rowCount === 1 ? "fila" : "filas"} en el resultado`;
  if (verb === "BEGIN") return "Transacción abierta: lo que sigue es todo o nada";
  if (verb === "COMMIT") return "COMMIT: cambios guardados de forma permanente";
  if (verb === "ROLLBACK") return "ROLLBACK: se deshizo todo desde BEGIN";
  const n = affected ?? 0;
  const what = verb === "INSERT" ? "insertada" : verb === "UPDATE" ? "actualizada" : verb === "DELETE" ? "borrada" : "afectada";
  return `${n} ${n === 1 ? "fila" : "filas"} ${n === 1 ? what : `${what}s`}`;
}

/** Engine error in Spanish first, original message kept so students can search it. */
function translate(message: string): string {
  if (/violates foreign key constraint/.test(message)) return `Llave foránea: la fila señala a otra que no existe o que otra fila todavía usa. (${message})`;
  if (/duplicate key value/.test(message)) return `Ese valor ya existe y no se puede repetir. (${message})`;
  if (/violates not-null constraint/.test(message)) return `Falta un dato obligatorio. (${message})`;
  if (/syntax error/.test(message)) return `Error de sintaxis SQL. (${message})`;
  if (/does not exist/.test(message)) return `Ese nombre no existe en la base de datos. (${message})`;
  return message;
}

/**
 * Real PostgreSQL in the browser (REQ-42): PGlite (Postgres compiled to WebAssembly) loads the
 * sample database; students run prepared or own SQL and see the table change.
 */
export function SqlLab({ queries, table }: { queries?: string[]; table?: TableName }) {
  const id = useId();
  const presets: PresetQuery[] = (queries?.length ? queries.map((q) => presetById[q]).filter(Boolean) : presetQueries) as PresetQuery[];
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [sql, setSql] = useState(presets[0]?.sql ?? "SELECT * FROM estudiante;");
  const [explain, setExplain] = useState(presets[0]?.explain ?? "");
  const [view, setView] = useState<TableName>(table ?? presets[0]?.shows ?? "estudiante");
  const [snapshot, setSnapshot] = useState<Row[]>(tables[table ?? presets[0]?.shows ?? "estudiante"].rows);
  const [changed, setChanged] = useState<number[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const engine = useRef<Engine | null>(null);

  const readTable = useCallback(async (name: TableName): Promise<Row[]> => {
    if (!engine.current) return tables[name].rows;
    const r = await engine.current.query(`SELECT * FROM ${name} ORDER BY id;`);
    return toRows(r.rows);
  }, []);

  const boot = useCallback(async () => {
    setStatus("loading");
    try {
      await engine.current?.close().catch(() => {});
      const { PGlite } = await import("@electric-sql/pglite");
      const db = (await PGlite.create()) as unknown as Engine;
      await db.exec(seedSql());
      engine.current = db;
      setStatus("ready");
    } catch (error) {
      console.error("PGlite no cargó", error);
      engine.current = null;
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    // Booting the engine is the external system this effect syncs with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void boot();
    return () => {
      void engine.current?.close().catch(() => {});
      engine.current = null;
    };
  }, [boot]);

  const show = useCallback(
    async (name: TableName, before?: Row[]) => {
      const rows = await readTable(name);
      setView(name);
      setSnapshot(rows);
      if (before) {
        const old = new Map(before.map((r) => [r.id, JSON.stringify(r)]));
        setChanged(rows.flatMap((r, i) => (old.get(r.id) === JSON.stringify(r) ? [] : [i])));
      } else setChanged([]);
    },
    [readTable]
  );

  const run = async () => {
    const db = engine.current;
    if (!db || running) return;
    setRunning(true);
    const statements = splitStatements(sql);
    const target = (tableNames.find((t) => new RegExp(`\\b(update|into|from)\\s+${t}\\b`, "i").test(sql)) ?? view) as TableName;
    const before = await readTable(target);
    const entries: LogEntry[] = [];
    let inTx = false;
    for (const statement of statements) {
      try {
        const r = await db.query(statement);
        const verb = statement.split(/\s+/)[0].toUpperCase();
        if (verb === "BEGIN") inTx = true;
        if (verb === "COMMIT" || verb === "ROLLBACK") inTx = false;
        const hasFields = r.fields.length > 0;
        entries.push({
          sql: statement,
          ok: true,
          message: describe(statement, r.affectedRows, r.rows.length, hasFields),
          result: hasFields ? { columns: r.fields.map((f) => f.name), rows: toRows(r.rows) } : undefined,
        });
      } catch (error) {
        entries.push({ sql: statement, ok: false, message: translate((error as Error).message) });
        if (inTx) {
          await db.query("ROLLBACK").catch(() => {});
          entries.push({ sql: "ROLLBACK", ok: true, message: "El laboratorio cerró la transacción con ROLLBACK: nada de lo anterior quedó guardado" });
        }
        break;
      }
    }
    setLog(entries);
    await show(target, before);
    setRunning(false);
  };

  const reset = async () => {
    setLog([]);
    await boot();
    setSnapshot(tables[view].rows);
    setChanged([]);
  };

  const columnsOf = (name: TableName) => tables[name].columns.map((c) => ({ name: c.name, pk: c.pk, fk: c.fk ? `${c.fk.table}(${c.fk.column})` : undefined }));

  return (
    <div className="space-y-4 rounded-[2rem] border-2 border-foreground bg-muted/40 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Laboratorio SQL · PostgreSQL en tu navegador</p>
        <ExecutionBadge kind={status === "failed" ? "simulated" : "real"} />
      </div>

      {presets.length > 1 && (
        <div role="group" aria-label="Consultas preparadas" className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={sql === p.sql}
              onClick={() => {
                setSql(p.sql);
                setExplain(p.explain);
                setLog([]);
                void show(p.shows);
              }}
              className={cn(
                "rounded-full border-2 border-foreground px-3 py-1.5 font-mono text-xs font-semibold outline-none hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/40",
                sql === p.sql ? "bg-foreground text-background hover:bg-foreground" : "bg-card"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div>
        <label htmlFor={`${id}-sql`} className="sr-only">
          Consulta SQL
        </label>
        <textarea
          id={`${id}-sql`}
          value={sql}
          spellCheck={false}
          onChange={(e) => {
            setSql(e.target.value);
            setExplain("");
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              void run();
            }
            e.stopPropagation();
          }}
          rows={Math.min(8, Math.max(3, sql.split("\n").length + 1))}
          className="w-full resize-y rounded-2xl border-2 border-foreground bg-code p-4 font-mono text-sm leading-relaxed text-code-foreground outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        />
        {explain && <p className="mt-1 text-sm text-muted-foreground">{explain}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={status !== "ready" || running}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50"
        >
          {status === "loading" || running ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Play aria-hidden="true" className="size-4" />}
          {status === "loading" ? "Encendiendo PostgreSQL…" : "Ejecutar"}
        </button>
        <button
          type="button"
          onClick={() => void reset()}
          disabled={status === "loading"}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50"
        >
          <RotateCcw aria-hidden="true" className="size-4" /> Reiniciar datos
        </button>
        <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl + Enter ejecuta</span>
      </div>

      {status === "failed" && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-soft p-3 text-sm">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          El motor no pudo cargar en este navegador. Abajo ves los datos iniciales (simulación); el docente puede mostrar la ejecución en su equipo.
        </p>
      )}

      {log.length > 0 && (
        <ol aria-live="polite" className="space-y-3">
          {log.map((entry, i) => (
            <li key={i} className={cn("space-y-2 rounded-2xl border-2 p-3", entry.ok ? "border-foreground/20 bg-card" : "border-destructive bg-danger-soft")}>
              <p className="truncate font-mono text-xs text-muted-foreground">{entry.sql.replace(/\s+/g, " ")}</p>
              <p className={cn("text-sm font-medium", !entry.ok && "text-destructive")}>{entry.ok ? "✓ " : "✗ "}{entry.message}</p>
              {entry.result && <TableCard name="resultado" compact columns={entry.result.columns.map((name) => ({ name }))} rows={entry.result.rows} />}
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-2">
        <div role="tablist" aria-label="Ver tabla" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Así está la tabla:</span>
          {tableNames.map((name) => (
            <button
              key={name}
              role="tab"
              type="button"
              aria-selected={view === name}
              onClick={() => void show(name)}
              className={cn("rounded-full px-3 py-1 font-mono outline-none focus-visible:ring-4 focus-visible:ring-ring/40", view === name ? "bg-secondary font-semibold" : "hover:bg-muted")}
            >
              {name}
            </button>
          ))}
        </div>
        <TableCard name={view} columns={columnsOf(view)} rows={snapshot} activeRows={changed} caption={changed.length > 0 ? `Resaltadas: ${changed.length} ${changed.length === 1 ? "fila nueva o cambiada" : "filas nuevas o cambiadas"}.` : undefined} />
      </div>
    </div>
  );
}
