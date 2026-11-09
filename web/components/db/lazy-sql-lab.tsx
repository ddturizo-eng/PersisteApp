"use client";

import { useState } from "react";
import { Power } from "lucide-react";
import { SqlLab } from "@/components/db/sql-lab";

/** The real SQL editor on the landing, started on demand so the page loads fast. */
export function LazySqlLab() {
  const [on, setOn] = useState(false);
  if (on) return <SqlLab queries={["select-all", "select-where", "insert", "update", "delete", "join"]} table="estudiante" />;
  return (
    <div className="flex flex-col items-start gap-4 rounded-[2rem] border-2 border-dashed border-foreground p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">Un PostgreSQL de verdad, dentro de tu navegador</p>
        <p className="text-muted-foreground">Con las tablas estudiante, curso y matrícula. Nada se instala y nada se daña: siempre puedes reiniciar.</p>
      </div>
      <button
        type="button"
        onClick={() => setOn(true)}
        className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        <Power aria-hidden="true" className="size-4" /> Abrir el editor SQL
      </button>
    </div>
  );
}
