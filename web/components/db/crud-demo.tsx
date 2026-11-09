"use client";

import { useState } from "react";
import { KeyRound, Play, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { ExecutionBadge } from "@/components/ui/execution-badge";

type R = { id: number; nombre: string; semestre: number };
const start: R[] = [
  { id: 1, nombre: "Ana", semestre: 3 },
  { id: 2, nombre: "Luis", semestre: 5 },
  { id: 3, nombre: "Sara", semestre: 3 },
];

type Verb = "SELECT" | "INSERT" | "UPDATE" | "DELETE";

const verbs: Record<Verb, { sql: string; say: string; crud: string; run: (rows: R[]) => { rows: R[]; touched: number[]; result?: R[]; message: string } }> = {
  SELECT: {
    crud: "Read · leer",
    sql: "SELECT * FROM estudiante WHERE semestre = 3;",
    say: "«Dame los estudiantes de tercer semestre»",
    run: (rows) => {
      const result = rows.filter((r) => r.semestre === 3);
      return { rows, touched: result.map((r) => r.id), result, message: `${result.length} filas leídas. La tabla no cambia.` };
    },
  },
  INSERT: {
    crud: "Create · crear",
    sql: "INSERT INTO estudiante (nombre, semestre) VALUES ('Mario', 1);",
    say: "«Agrega a Mario, de primer semestre»",
    run: (rows) => {
      const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
      return { rows: [...rows, { id, nombre: "Mario", semestre: 1 }], touched: [id], message: `1 fila nueva. El id ${id} lo puso el motor.` };
    },
  },
  UPDATE: {
    crud: "Update · cambiar",
    sql: "UPDATE estudiante SET semestre = 4 WHERE id = 1;",
    say: "«Pasa a Ana (id 1) a cuarto semestre»",
    run: (rows) => ({ rows: rows.map((r) => (r.id === 1 ? { ...r, semestre: 4 } : r)), touched: rows.some((r) => r.id === 1) ? [1] : [], message: "1 fila cambiada. WHERE eligió cuál." }),
  },
  DELETE: {
    crud: "Delete · borrar",
    sql: "DELETE FROM estudiante WHERE id = 2;",
    say: "«Borra al estudiante con id 2»",
    run: (rows) => ({ rows: rows.filter((r) => r.id !== 2), touched: [], message: rows.some((r) => r.id === 2) ? "1 fila borrada." : "0 filas: ya no existía." }),
  },
};

const order: Verb[] = ["SELECT", "INSERT", "UPDATE", "DELETE"];

/** The four SQL verbs on a tiny table, animated (CRUD). Simulated: no engine involved. */
export function CrudDemo() {
  const [verb, setVerb] = useState<Verb>("SELECT");
  const [rows, setRows] = useState<R[]>(start);
  const [touched, setTouched] = useState<number[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [result, setResult] = useState<R[] | undefined>();
  const [message, setMessage] = useState<string>("");
  const v = verbs[verb];

  const run = () => {
    const out = v.run(rows);
    if (verb === "DELETE") {
      setRemoved(rows.filter((r) => !out.rows.some((o) => o.id === r.id)).map((r) => r.id));
      setTimeout(() => {
        setRows(out.rows);
        setRemoved([]);
      }, 600);
    } else setRows(out.rows);
    setTouched(out.touched);
    setResult(out.result);
    setMessage(out.message);
  };

  const reset = () => {
    setRows(start);
    setTouched([]);
    setRemoved([]);
    setResult(undefined);
    setMessage("");
  };

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Verbos de SQL" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {order.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={verb === name}
            onClick={() => {
              setVerb(name);
              setTouched([]);
              setResult(undefined);
              setMessage("");
            }}
            className={cn(
              "rounded-2xl border-2 border-foreground px-3 py-2 text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              verb === name ? "bg-sun text-sun-foreground" : "bg-card hover:bg-muted"
            )}
          >
            <span className="block font-mono text-sm font-bold">{name}</span>
            <span className={cn("block text-xs", verb === name ? "text-sun-foreground/80" : "text-muted-foreground")}>{verbs[name].crud}</span>
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{v.say}</p>
        <pre className="overflow-x-auto rounded-2xl bg-code px-4 py-3 font-mono text-sm text-code-foreground">{v.sql}</pre>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={run}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <Play aria-hidden="true" className="size-4" /> Ejecutar
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <RotateCcw aria-hidden="true" className="size-4" /> Reiniciar
        </button>
        <ExecutionBadge kind="simulated" className="ml-auto" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MiniTable title="estudiante" rows={rows} touched={touched} removed={removed} />
        {result && <MiniTable title="resultado" rows={result} touched={[]} removed={[]} />}
      </div>
      <p aria-live="polite" className="min-h-6 text-sm font-medium">
        {message}
      </p>
    </div>
  );
}

function MiniTable({ title, rows, touched, removed }: { title: string; rows: R[]; touched: number[]; removed: number[] }) {
  return (
    <figure className="min-w-0">
      <figcaption className="inline-flex rounded-t-xl border-2 border-b-0 border-foreground bg-sun px-3 py-0.5 font-mono text-xs font-semibold text-sun-foreground">{title}</figcaption>
      <table className="w-full overflow-hidden rounded-tr-xl rounded-b-xl border-2 border-foreground bg-card text-left font-mono text-sm">
        <thead>
          <tr className="border-b-2 border-foreground bg-muted">
            <th className="px-3 py-1.5">
              <span className="inline-flex items-center gap-1">
                <KeyRound aria-label="llave primaria" className="size-3.5" /> id
              </span>
            </th>
            <th className="px-3 py-1.5">nombre</th>
            <th className="px-3 py-1.5">semestre</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={cn(
                "border-b border-border transition-all duration-500 last:border-b-0",
                touched.includes(r.id) && "bg-sun text-sun-foreground",
                removed.includes(r.id) && "bg-destructive/30 line-through opacity-40"
              )}
            >
              <td className="px-3 py-1.5">{r.id}</td>
              <td className="px-3 py-1.5">{r.nombre}</td>
              <td className="px-3 py-1.5">{r.semestre}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
