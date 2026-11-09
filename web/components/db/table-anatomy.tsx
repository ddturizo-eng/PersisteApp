"use client";

import { useState } from "react";
import { ExplainBox, TableCard } from "@/components/db/table-card";
import { tables } from "@/lib/sample-db";

type Focus =
  | { kind: "table" }
  | { kind: "column"; column: string }
  | { kind: "row"; row: number }
  | { kind: "cell"; row: number; column: string };

const t = tables.estudiante;

function explain(focus: Focus): { title: string; text: string } {
  if (focus.kind === "column") {
    const c = t.columns.find((col) => col.name === focus.column)!;
    return {
      title: c.pk ? `Columna «${c.name}» · llave primaria (PK)` : `Columna «${c.name}»`,
      text: c.pk
        ? "Cada fila tiene un id distinto: 1, 2, 3… Así señalas UNA fila sin confundirla, aunque dos estudiantes se llamen igual. El motor lo pone solo."
        : `Una columna es un dato que TODAS las filas tienen. ${c.note}`,
    };
  }
  if (focus.kind === "row") {
    const r = t.rows[focus.row];
    return { title: `Fila ${focus.row + 1} · un registro`, text: `Una fila es un estudiante completo: ${r.nombre}, con id ${r.id}. Cuando la lleves a Java, cada fila será un objeto.` };
  }
  if (focus.kind === "cell") {
    const value = t.rows[focus.row][focus.column];
    return { title: `Celda · fila ${focus.row + 1}, columna «${focus.column}»`, text: `Un solo valor: ${String(value)}. Para encontrarlo basta con la PK y el nombre de la columna: «el correo del estudiante con id ${t.rows[focus.row].id}».` };
  }
  return { title: "Tabla «estudiante»", text: "Una tabla guarda datos de UNA cosa (estudiantes) en filas y columnas, como una hoja de Excel. Toca una columna, una fila o una celda." };
}

/** Module 1: touch any part of the table to learn its name (REQ-41). */
export function TableAnatomy() {
  const [focus, setFocus] = useState<Focus>({ kind: "table" });
  const { title, text } = explain(focus);
  return (
    <div className="space-y-4">
      <TableCard
        name={t.name}
        columns={t.columns.map((c) => ({ name: c.name, pk: c.pk }))}
        rows={t.rows}
        activeColumn={focus.kind === "column" ? focus.column : null}
        activeRows={focus.kind === "row" ? [focus.row] : []}
        activeCell={focus.kind === "cell" ? { row: focus.row, column: focus.column } : null}
        onColumn={(column) => setFocus({ kind: "column", column })}
        onRow={(row) => setFocus({ kind: "row", row })}
        onCell={(row, column) => setFocus({ kind: "cell", row, column })}
      />
      <ExplainBox title={title}>{text}</ExplainBox>
    </div>
  );
}
