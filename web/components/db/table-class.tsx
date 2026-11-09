"use client";

import { useState } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { cn } from "cn";
import { ExplainBox, TableCard } from "@/components/db/table-card";
import { tables, type Cell, type Column, type TableName } from "@/lib/sample-db";

const javaLiteral = (column: Column, value: Cell) => {
  if (value === null) return "null";
  if (column.javaType === "String") return `"${value}"`;
  if (column.javaType === "LocalDate") return `LocalDate.parse("${value}")`;
  return String(value);
};

function explainColumn(c: Column, javaClass: string): { title: string; text: string } {
  const base = `${c.sqlType} → ${c.javaType}. `;
  if (c.pk) return { title: `${c.name} (PK) → atributo ${c.javaField}`, text: `${base}La llave primaria se vuelve el atributo id: así sabes qué fila representa cada objeto ${javaClass}. Con SERIAL lo genera la base, así que al crear un objeto nuevo todavía no lo tienes.` };
  if (c.fk)
    return {
      title: `${c.name} (FK) → atributo ${c.javaField}`,
      text: `${base}Sin ORM, tú decides cómo representar la llave foránea. Lo más simple: guardar el número (int ${c.javaField}). La alternativa: un objeto ${c.fk.table === "curso" ? "Curso curso" : "Estudiante estudiante"} que tú mismo cargas con otra consulta. Un ORM haría ese segundo paso por ti; aquí lo escribes tú.`,
    };
  return { title: `${c.name} → atributo ${c.javaField}`, text: `${base}${c.note} Nombres: en SQL se usa snake_case (curso_id) y en Java camelCase (cursoId).` };
}

/**
 * Module 5: a table card and a Java class card side by side (REQ-45). Touch a column or a field
 * to see its pair; pick a row to turn it into an object.
 */
export function TableClass({ table = "estudiante" }: { table?: TableName }) {
  const t = tables[table];
  const [column, setColumn] = useState<string | null>(null);
  const [row, setRow] = useState<number | null>(null);
  const selected = t.columns.find((c) => c.name === column);
  const info = selected
    ? explainColumn(selected, t.javaClass)
    : row !== null
      ? { title: `Fila ${row + 1} → un objeto ${t.javaClass}`, text: "Cada fila se convierte en un objeto, y cada celda en el valor de un atributo. Al revés, un objeto nuevo se convierte en un INSERT." }
      : { title: `Tabla ${t.name} ↔ clase ${t.javaClass}`, text: "Tabla = clase · columna = atributo · fila = objeto. Toca una columna o un atributo para ver su pareja, o toca el número de una fila." };
  const r = row === null ? null : t.rows[row];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_auto_1fr] xl:items-start">
        <TableCard
          name={t.name}
          compact
          columns={t.columns.map((c) => ({ name: c.name, type: c.sqlType, pk: c.pk, fk: c.fk ? `${c.fk.table}(${c.fk.column})` : undefined }))}
          rows={t.rows}
          activeColumn={column}
          activeRows={row === null ? [] : [row]}
          onColumn={(name) => setColumn((v) => (v === name ? null : name))}
          onRow={(i) => setRow((v) => (v === i ? null : i))}
        />
        <div aria-hidden="true" className="grid place-items-center text-muted-foreground xl:pt-16">
          <ArrowRight className="hidden size-6 xl:block" />
          <ArrowDown className="size-6 xl:hidden" />
        </div>
        <figure className="min-w-0">
          <div className="inline-flex rounded-t-2xl border-2 border-b-0 border-foreground bg-primary px-4 py-1.5 font-mono text-sm font-semibold text-primary-foreground">
            {t.javaClass}.java
          </div>
          <div className="overflow-x-auto rounded-tr-2xl rounded-b-2xl border-2 border-foreground bg-code p-3 font-mono text-sm text-code-foreground">
            <p>
              <span className="text-muted-foreground">public class</span> {t.javaClass} {"{"}
            </p>
            <ul className="my-1">
              {t.columns.map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    aria-pressed={column === c.name}
                    onClick={() => setColumn((v) => (v === c.name ? null : c.name))}
                    className={cn(
                      "w-full rounded-lg px-4 py-0.5 text-left whitespace-nowrap outline-none hover:bg-secondary/30 focus-visible:ring-4 focus-visible:ring-ring/40",
                      column === c.name && "bg-sun text-sun-foreground hover:bg-sun"
                    )}
                  >
                    private {c.javaType} {c.javaField};{c.pk && <span className="opacity-70">{" // PK"}</span>}
                    {c.fk && <span className="opacity-70">{" // FK"}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <p className="px-4 text-muted-foreground">{"// constructor, getters y setters"}</p>
            <p>{"}"}</p>
          </div>
        </figure>
      </div>

      {r && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 rounded-3xl border-2 border-dashed border-foreground p-4 duration-300">
          <p className="text-sm font-semibold">Fila → objeto (lo que hará tu código Java)</p>
          <pre className="overflow-x-auto rounded-2xl bg-code p-3 font-mono text-sm text-code-foreground">
            {`${t.javaClass} obj = new ${t.javaClass}(\n${t.columns.map((c) => `    ${javaLiteral(c, r[c.name] ?? null)}`).join(",\n")}\n);`}
          </pre>
          <div className="flex flex-wrap gap-2">
            {t.columns.map((c) => (
              <span key={c.name} className="rounded-full border-2 border-foreground bg-card px-3 py-1 font-mono text-xs">
                {c.javaField} = {javaLiteral(c, r[c.name] ?? null)}
              </span>
            ))}
          </div>
          <p className="text-sm font-semibold">Objeto → fila (al guardarlo)</p>
          <pre className="overflow-x-auto rounded-2xl bg-code p-3 font-mono text-sm text-code-foreground">
            {`INSERT INTO ${t.name} (${t.columns.filter((c) => !c.pk).map((c) => c.name).join(", ")})\nVALUES (${t.columns.filter((c) => !c.pk).map(() => "?").join(", ")});  -- el id lo pone SERIAL`}
          </pre>
        </div>
      )}

      <ExplainBox title={info.title}>{info.text}</ExplainBox>
    </div>
  );
}
