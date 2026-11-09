"use client";

import { useState } from "react";
import { ArrowRight, Check, Coffee, Database, HardDrive, Power, Undo2, X } from "lucide-react";
import { cn } from "cn";
import { CrudDemo } from "@/components/db/crud-demo";

/** Card shell: number, title, one line, then the visual. Little text, always a visual. */
function Card({ n, title, line, children, className }: { n: number; title: string; line: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={cn("flex flex-col gap-4 rounded-[2rem] border-2 border-foreground bg-card p-5 sm:p-6", className)}>
      <header className="space-y-1">
        <p className="font-mono text-xs text-muted-foreground">{String(n).padStart(2, "0")}</p>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground">{line}</p>
      </header>
      <div className="flex-1">{children}</div>
    </article>
  );
}

/** 1 · Data in RAM dies with the program; data in a database stays. */
function MemoryVsDisk() {
  const [off, setOff] = useState(false);
  const names = ["Ana", "Luis", "Sara"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className={cn("rounded-2xl border-2 border-foreground p-3 transition-opacity duration-500", off && "opacity-40")}>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Coffee aria-hidden="true" className="size-4" /> Programa (RAM)
          </p>
          <ul className="mt-2 space-y-1 font-mono text-sm">
            {names.map((n, i) => (
              <li key={n} className={cn("rounded-lg bg-muted px-2 py-0.5 transition-all duration-500", off && "translate-y-2 opacity-0")} style={{ transitionDelay: `${i * 120}ms` }}>
                {n}
              </li>
            ))}
          </ul>
          {off && <p className="mt-2 text-xs font-medium text-destructive">Se perdió todo</p>}
        </div>
        <div className="rounded-2xl border-2 border-foreground bg-secondary/40 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <HardDrive aria-hidden="true" className="size-4" /> Base de datos (disco)
          </p>
          <ul className="mt-2 space-y-1 font-mono text-sm">
            {names.map((n) => (
              <li key={n} className="rounded-lg bg-card px-2 py-0.5">
                {n}
              </li>
            ))}
          </ul>
          {off && <p className="mt-2 text-xs font-medium text-primary">Sigue ahí</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOff((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-foreground px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        <Power aria-hidden="true" className="size-4" /> {off ? "Encender de nuevo" : "Apagar el programa"}
      </button>
    </div>
  );
}

const engines = [
  { name: "PostgreSQL", auto: "SERIAL", limit: "LIMIT 5" },
  { name: "Oracle", auto: "IDENTITY", limit: "FETCH FIRST 5 ROWS" },
  { name: "MySQL", auto: "AUTO_INCREMENT", limit: "LIMIT 5" },
];

/** 2 · SQL is the language; PostgreSQL, Oracle and MySQL are engines that speak it. */
function SqlVsEngine() {
  const [pick, setPick] = useState(0);
  const e = engines[pick];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl bg-code px-4 py-3 font-mono text-sm text-code-foreground">
        <span>SELECT * FROM estudiante;</span>
        <Check aria-label="igual en todos" className="ml-auto size-4 shrink-0 text-primary" />
      </div>
      <div role="group" aria-label="Motores" className="flex flex-wrap gap-2">
        {engines.map((en, i) => (
          <button
            key={en.name}
            type="button"
            aria-pressed={pick === i}
            onClick={() => setPick(i)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border-2 border-foreground px-3 py-1 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              pick === i ? "bg-sun text-sun-foreground" : "bg-card hover:bg-muted"
            )}
          >
            <Database aria-hidden="true" className="size-3.5" /> {en.name}
          </button>
        ))}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">id automático</dt>
        <dd className="font-mono">{e.auto}</dd>
        <dt className="text-muted-foreground">primeras 5 filas</dt>
        <dd className="font-mono">{e.limit}</dd>
      </dl>
    </div>
  );
}

/** 4 · PK identifies, FK points. */
function Keys() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
    >
      <div className="rounded-2xl border-2 border-foreground p-3 font-mono text-sm">
        <p className="text-xs font-semibold text-muted-foreground">matricula</p>
        <p>id 7</p>
        <p className={cn("rounded px-1 transition-colors", on && "bg-sun text-sun-foreground")}>estudiante_id 1</p>
        <p className="text-xs text-muted-foreground">FK</p>
      </div>
      <ArrowRight aria-hidden="true" className={cn("size-6 transition-transform duration-300", on && "translate-x-1 text-primary")} />
      <div className="rounded-2xl border-2 border-foreground p-3 font-mono text-sm">
        <p className="text-xs font-semibold text-muted-foreground">estudiante</p>
        <p className={cn("rounded px-1 transition-colors", on && "bg-sun text-sun-foreground")}>id 1</p>
        <p>Ana</p>
        <p className="text-xs text-muted-foreground">PK</p>
      </div>
      <span className="col-span-3 text-sm text-muted-foreground">{on ? "La FK guarda el id de otra fila: así se relacionan las tablas." : "Toca para seguir la flecha."}</span>
    </button>
  );
}

/** 5 · A transaction: both changes or none. */
function AllOrNothing() {
  const [state, setState] = useState<"pending" | "commit" | "rollback">("pending");
  const changes = ["Crear la matrícula de Ana", "Restar 1 cupo al curso"];
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {changes.map((c) => (
          <li
            key={c}
            className={cn(
              "flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm transition-colors duration-300",
              state === "pending" && "border-dashed border-foreground/40",
              state === "commit" && "border-primary bg-primary/10",
              state === "rollback" && "border-foreground/20 text-muted-foreground line-through"
            )}
          >
            {state === "commit" ? <Check aria-hidden="true" className="size-4 text-primary" /> : state === "rollback" ? <X aria-hidden="true" className="size-4" /> : <span className="size-4 rounded-full border-2 border-foreground/40" />}
            {c}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setState("commit")}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 font-mono text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <Check aria-hidden="true" className="size-4" /> COMMIT
        </button>
        <button
          type="button"
          onClick={() => setState("rollback")}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-foreground px-4 font-mono text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <Undo2 aria-hidden="true" className="size-4" /> ROLLBACK
        </button>
        {state !== "pending" && (
          <button type="button" onClick={() => setState("pending")} className="px-2 text-sm text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring/40">
            otra vez
          </button>
        )}
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {state === "commit" ? "Los dos cambios quedaron guardados." : state === "rollback" ? "Ninguno quedó: como si nada hubiera pasado." : "Dos cambios que van juntos, todavía sin confirmar."}
      </p>
    </div>
  );
}

/**
 * «Lo básico» (author, 8 Nov 2026): the database theory before the modules, as short cards that
 * each carry a visual — what a database is, SQL vs the engine, CRUD, keys and transactions.
 */
export function DbBasics() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card n={1} title="¿Qué es una base de datos?" line="Un lugar donde los datos sobreviven al programa, ordenados y con reglas.">
        <MemoryVsDisk />
      </Card>
      <Card n={2} title="SQL es el idioma; PostgreSQL, el motor" line="El motor es el programa que guarda los datos. Todos entienden SQL, con acentos distintos.">
        <SqlVsEngine />
      </Card>
      <Card n={3} title="Las cuatro consultas" line="Todo lo que haces con datos es leer, crear, cambiar o borrar (CRUD)." className="lg:col-span-2">
        <CrudDemo />
      </Card>
      <Card n={4} title="Llaves: PK y FK" line="La llave primaria identifica una fila. La foránea apunta a otra.">
        <Keys />
      </Card>
      <Card n={5} title="Transacción: todo o nada" line="Varios cambios que se guardan juntos o no se guarda ninguno.">
        <AllOrNothing />
      </Card>
    </div>
  );
}
