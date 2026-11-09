"use client";

import { useState } from "react";
import { AlertTriangle, Check, Pencil, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { TableCard } from "@/components/db/table-card";

const OLD = "Bases de Datos";
const NEW = "Bases de Datos I";

type Mode = "one" | "split";

/**
 * Why split data into tables (specs/04 §7 rule 4): rename a course in one big table and in
 * separate tables, and see how many rows each one has to change.
 */
export function SplitTables() {
  const [mode, setMode] = useState<Mode>("one");
  const [edits, setEdits] = useState(0);

  const big = [
    { estudiante: "Ana Torres", curso: edits >= 1 ? NEW : OLD, creditos: 4, nota: 4.5 },
    { estudiante: "Luis Pérez", curso: edits >= 2 ? NEW : OLD, creditos: 4, nota: 4.0 },
    { estudiante: "Ana Torres", curso: "Programación II", creditos: 3, nota: 3.8 },
  ];
  const cursos = [
    { id: 1, nombre: edits >= 1 ? NEW : OLD, creditos: 4 },
    { id: 2, nombre: "Programación II", creditos: 3 },
  ];
  const matriculas = [
    { estudiante: "Ana Torres", curso_id: 1, nota: 4.5 },
    { estudiante: "Luis Pérez", curso_id: 1, nota: 4.0 },
    { estudiante: "Ana Torres", curso_id: 2, nota: 3.8 },
  ];

  const pending = mode === "one" ? 2 - edits : 1 - edits;
  const broken = mode === "one" && edits === 1;

  const message =
    mode === "one"
      ? edits === 0
        ? `El curso «${OLD}» cambia de nombre. Aquí el nombre está copiado en 2 filas.`
        : edits === 1
          ? "¡Ahora la tabla se contradice! El mismo curso tiene dos nombres. Falta corregir otra fila."
          : "Listo, pero hiciste 2 cambios para UN dato. Con 500 estudiantes serían 500 cambios."
      : edits === 0
        ? "El nombre vive en UNA fila de curso. Las matrículas solo guardan su id (curso_id = 1)."
        : "1 cambio y listo: todas las matrículas apuntan al id 1, así que ya ven el nombre nuevo.";

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Forma de guardar" className="inline-flex rounded-full border-2 border-foreground bg-card p-1">
        {(
          [
            ["one", "Una sola tabla"],
            ["split", "Tablas separadas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setEdits(0);
            }}
            className={cn("rounded-full px-4 py-1.5 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/40", mode === value ? "bg-sun text-sun-foreground" : "hover:bg-muted")}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "one" ? (
        <TableCard
          name="todo_junto"
          columns={[{ name: "estudiante" }, { name: "curso" }, { name: "creditos" }, { name: "nota" }]}
          rows={big}
          activeColumn="curso"
          activeRows={big.flatMap((r, i) => (r.curso === NEW ? [i] : []))}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 md:grid-cols-2">
          <TableCard name="curso" columns={[{ name: "id", pk: true }, { name: "nombre" }, { name: "creditos" }]} rows={cursos} activeRows={edits ? [0] : []} activeColumn="nombre" />
          <TableCard name="matricula" columns={[{ name: "estudiante" }, { name: "curso_id", fk: "curso(id)" }, { name: "nota" }]} rows={matriculas} activeColumn="curso_id" />
        </div>
      )}

      <p
        aria-live="polite"
        className={cn("flex items-start gap-2 rounded-2xl p-3 font-medium", broken ? "bg-danger-soft text-destructive" : pending === 0 ? "bg-primary/10" : "bg-muted")}
      >
        {broken ? <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" /> : pending === 0 ? <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" /> : null}
        {message}
      </p>

      <div className="flex flex-wrap gap-2">
        {pending > 0 && (
          <button
            type="button"
            onClick={() => setEdits((e) => e + 1)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <Pencil aria-hidden="true" className="size-4" /> {edits === 0 ? `Renombrar a «${NEW}»` : "Corregir la otra fila"}
          </button>
        )}
        {edits > 0 && (
          <button
            type="button"
            onClick={() => setEdits(0)}
            className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <RotateCcw aria-hidden="true" className="size-4" /> Otra vez
          </button>
        )}
      </div>
    </div>
  );
}
