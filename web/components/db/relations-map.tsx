"use client";

import { useState } from "react";
import { ExplainBox, TableCard } from "@/components/db/table-card";
import { tables, type Row, type TableName } from "@/lib/sample-db";

type Pick = { table: TableName; index: number } | null;

const est = tables.estudiante;
const cur = tables.curso;
const mat = tables.matricula;

const idx = (rows: Row[], id: unknown) => rows.findIndex((r) => r.id === id);

function related(pick: Pick): Record<TableName, number[]> {
  const none = { estudiante: [], curso: [], matricula: [] };
  if (!pick) return none;
  if (pick.table === "matricula") {
    const m = mat.rows[pick.index];
    return { matricula: [pick.index], estudiante: [idx(est.rows, m.estudiante_id)], curso: [idx(cur.rows, m.curso_id)] };
  }
  const key = pick.table === "estudiante" ? "estudiante_id" : "curso_id";
  const id = tables[pick.table].rows[pick.index].id;
  const ms = mat.rows.flatMap((m, i) => (m[key] === id ? [i] : []));
  const other = pick.table === "estudiante" ? "curso" : "estudiante";
  const otherKey = other === "curso" ? "curso_id" : "estudiante_id";
  const others = [...new Set(ms.map((i) => idx(tables[other].rows, mat.rows[i][otherKey])))];
  return { ...none, [pick.table]: [pick.index], matricula: ms, [other]: others } as Record<TableName, number[]>;
}

function explain(pick: Pick): { title: string; text: string } {
  if (!pick) return { title: "Toca una fila", text: "Empieza por una matrícula del centro: verás a qué estudiante y a qué curso señalan sus dos llaves foráneas." };
  if (pick.table === "matricula") {
    const m = mat.rows[pick.index];
    const e = est.rows[idx(est.rows, m.estudiante_id)];
    const c = cur.rows[idx(cur.rows, m.curso_id)];
    return {
      title: `Matrícula ${m.id}`,
      text: `estudiante_id = ${m.estudiante_id} → la fila de estudiante con id ${m.estudiante_id} (${e.nombre}). curso_id = ${m.curso_id} → el curso con id ${m.curso_id} (${c.nombre}). La matrícula no copia nombres: solo guarda números que señalan.`,
    };
  }
  const row = tables[pick.table].rows[pick.index];
  const n = related(pick).matricula.length;
  return {
    title: `${pick.table === "estudiante" ? "Estudiante" : "Curso"} ${row.id} · ${row.nombre}`,
    text: `${n} ${n === 1 ? "matrícula lo señala" : "matrículas lo señalan"} con ${pick.table}_id = ${row.id}. Es una relación uno a muchos: una fila aquí, muchas en matricula. Por eso el motor no te deja borrarlo mientras alguien lo señale.`,
  };
}

/** Module 3: foreign keys as arrows you can follow both ways (REQ-43 CA1, CA2). */
export function RelationsMap() {
  const [pick, setPick] = useState<Pick>(null);
  const on = related(pick);
  const { title, text } = explain(pick);
  const fkActive = pick ? (pick.table === "curso" ? "curso_id" : pick.table === "estudiante" ? "estudiante_id" : null) : null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-[1fr_1.4fr_1fr] lg:items-start">
        <TableCard
          compact
          name="estudiante"
          columns={[{ name: "id", pk: true }, { name: "nombre" }]}
          rows={est.rows}
          activeRows={on.estudiante}
          activeColumn={pick?.table === "matricula" ? "id" : null}
          onRow={(index) => setPick({ table: "estudiante", index })}
        />
        <TableCard
          compact
          name="matricula"
          columns={mat.columns.map((c) => ({ name: c.name, pk: c.pk, fk: c.fk ? `${c.fk.table}(${c.fk.column})` : undefined }))}
          rows={mat.rows}
          activeRows={on.matricula}
          activeColumn={fkActive}
          onRow={(index) => setPick({ table: "matricula", index })}
        />
        <TableCard
          compact
          name="curso"
          columns={[{ name: "id", pk: true }, { name: "nombre" }]}
          rows={cur.rows}
          activeRows={on.curso}
          activeColumn={pick?.table === "matricula" ? "id" : null}
          onRow={(index) => setPick({ table: "curso", index })}
        />
      </div>
      <ExplainBox title={title}>{text}</ExplainBox>
    </div>
  );
}
