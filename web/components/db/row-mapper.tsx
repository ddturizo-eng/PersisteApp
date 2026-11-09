"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { cn } from "cn";
import { TableCard } from "@/components/db/table-card";
import { ExecutionBadge } from "@/components/ui/execution-badge";
import { tables } from "@/lib/sample-db";

const t = tables.estudiante;
const rows = t.rows.slice(0, 3);

const code = [
  "ResultSet rs = ps.executeQuery();",
  "List<Estudiante> lista = new ArrayList<>();",
  "while (rs.next()) {",
  '  int id = rs.getInt("id");',
  '  String nombre = rs.getString("nombre");',
  '  String correo = rs.getString("correo");',
  '  LocalDate nac = rs.getObject("nacimiento", LocalDate.class);',
  "  lista.add(new Estudiante(id, nombre, correo, nac));",
  "}",
];

/** Column read by each code line 3–6. */
const readLines: Record<number, { column: string; variable: string }> = {
  3: { column: "id", variable: "id" },
  4: { column: "nombre", variable: "nombre" },
  5: { column: "correo", variable: "correo" },
  6: { column: "nacimiento", variable: "nac" },
};

type Frame = { line: number; row: number | null; text: string; done: number; vars: Record<string, string> };

/** Every frame of the walk: the cursor moves, each getter reads one cell, the object joins the list. */
function buildFrames(): Frame[] {
  const frames: Frame[] = [
    { line: 0, row: null, text: "executeQuery() trae las filas. El cursor del ResultSet empieza ANTES de la primera fila.", done: 0, vars: {} },
    { line: 1, row: null, text: "Una lista vacía donde irán los objetos.", done: 0, vars: {} },
  ];
  rows.forEach((r, i) => {
    frames.push({ line: 2, row: i, text: `rs.next() mueve el cursor a la fila ${i + 1} y devuelve true.`, done: i, vars: {} });
    const vars: Record<string, string> = {};
    for (let line = 3; line <= 6; line++) {
      const { column, variable } = readLines[line];
      vars[variable] = String(r[column]);
      frames.push({ line, row: i, text: `Lee la columna «${column}» de la fila actual: ${String(r[column])}. El nombre en el getter es el de la columna SQL.`, done: i, vars: { ...vars } });
    }
    frames.push({ line: 7, row: i, text: `Con los cuatro valores arma un objeto Estudiante y lo agrega a la lista.`, done: i + 1, vars: { ...vars } });
  });
  frames.push({ line: 2, row: null, text: "rs.next() ya no encuentra filas y devuelve false: el ciclo termina. Tienes una lista de objetos.", done: rows.length, vars: {} });
  return frames;
}

const frames = buildFrames();
const STEP_MS = 1100;

/** Module 6: how a ResultSet becomes objects without an ORM, step by step (REQ-46 CA2). */
export function RowMapper() {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const f = frames[at];
  const last = at >= frames.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (last) {
      timer.current = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setAt((a) => a + 1), STEP_MS);
    return () => clearTimeout(timer.current);
  }, [playing, at, last]);

  const reading = readLines[f.line];

  return (
    <div className="space-y-4 rounded-[2rem] border-2 border-foreground bg-muted/40 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Del ResultSet a objetos Java</p>
        <ExecutionBadge kind="simulated" />
      </div>

      <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-2 lg:items-start">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">ResultSet (filas que devolvió el motor)</p>
          <TableCard
            compact
            name="rs"
            columns={t.columns.map((c) => ({ name: c.name }))}
            rows={rows}
            activeRows={f.row === null ? [] : [f.row]}
            activeCell={f.row !== null && reading ? { row: f.row, column: reading.column } : null}
          />
        </div>
        <pre aria-label="Código Java" className="overflow-x-auto rounded-2xl border-2 border-foreground bg-code py-3 font-mono text-[13px] leading-relaxed text-code-foreground">
          {code.map((line, i) => (
            <div key={i} className={cn("px-3 whitespace-pre transition-colors", i === f.line && "bg-sun text-sun-foreground")}>
              {line}
            </div>
          ))}
        </pre>
      </div>

      <p aria-live="polite" className="min-h-12 rounded-2xl bg-card p-3 text-sm">
        <span className="font-semibold tabular-nums">
          {at + 1}/{frames.length} ·{" "}
        </span>
        {f.text}
      </p>

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-40 space-y-1">
          <p className="text-xs text-muted-foreground">Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(f.vars).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
            {Object.entries(f.vars).map(([k, v]) => (
              <span key={k} className="rounded-full border-2 border-foreground bg-card px-2.5 py-0.5 font-mono text-xs">
                {k} = {v}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs text-muted-foreground">lista ({f.done})</p>
          <div className="flex flex-wrap gap-2">
            {rows.slice(0, f.done).map((r) => (
              <span key={String(r.id)} className="animate-in fade-in zoom-in-95 rounded-2xl border-2 border-foreground bg-secondary px-3 py-1.5 font-mono text-xs duration-300">
                Estudiante{"{"}id={String(r.id)}, {String(r.nombre)}{"}"}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (last) setAt(0);
            setPlaying((p) => !p);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
          {playing ? "Pausar" : last ? "Repetir" : "Reproducir"}
        </button>
        <button
          type="button"
          disabled={last}
          onClick={() => {
            setPlaying(false);
            setAt((a) => Math.min(a + 1, frames.length - 1));
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 font-medium outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50"
        >
          <StepForward aria-hidden="true" className="size-4" /> Paso
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setAt(0);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <RotateCcw aria-hidden="true" className="size-4" /> Reiniciar
        </button>
      </div>
    </div>
  );
}
