"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Coffee, Database, Network, Pause, Play, Plug, RotateCcw } from "lucide-react";
import { cn } from "cn";

type PieceId = "app" | "driver" | "red" | "motor";

const pieces: { id: PieceId; name: string; short: string; icon: typeof Coffee; detail: string; example: string }[] = [
  {
    id: "app",
    name: "Tu aplicación Java",
    short: "Decide qué pedir",
    icon: Coffee,
    detail: "Tus clases (Main, ProductRepository…) deciden qué datos pedir y qué hacer con ellos. Solo conocen la API de JDBC: Connection, PreparedStatement y ResultSet.",
    example: "ResultSet rs = ps.executeQuery();",
  },
  {
    id: "driver",
    name: "Driver JDBC",
    short: "Traduce",
    icon: Plug,
    detail: "Un .jar del fabricante del motor (postgresql.jar, ojdbc11.jar). Traduce cada llamada de JDBC al protocolo propio de ese motor, como un adaptador de enchufe.",
    example: "jdbc:postgresql://localhost:5432/tienda",
  },
  {
    id: "red",
    name: "Red",
    short: "Transporta",
    icon: Network,
    detail: "Una conexión TCP entre tu equipo y el servidor. PostgreSQL escucha en el puerto 5432 y Oracle en el 1521. Aunque todo esté en tu portátil, los datos viajan por TCP.",
    example: "localhost:52114 → localhost:5432 (TCP)",
  },
  {
    id: "motor",
    name: "Motor de base de datos",
    short: "Ejecuta",
    icon: Database,
    detail: "El servidor PostgreSQL u Oracle: comprueba usuario y clave, ejecuta el SQL, lee y escribe las tablas en disco y devuelve las filas.",
    example: "SELECT name FROM products;",
  },
];

/** The round trip of one query: where it is and what travels (REQ-33 CA2). */
const trip: { at: PieceId; carrying: string; text: string; back?: boolean }[] = [
  { at: "app", carrying: "executeQuery()", text: "Tu código llama a executeQuery()." },
  { at: "driver", carrying: "mensaje", text: "El driver convierte la llamada en un mensaje del protocolo del motor." },
  { at: "red", carrying: "bytes →", text: "El mensaje viaja por TCP hasta el servidor." },
  { at: "motor", carrying: "SELECT …", text: "El motor ejecuta el SQL y arma las filas." },
  { at: "red", carrying: "← filas", text: "Las filas vuelven por la misma conexión.", back: true },
  { at: "driver", carrying: "ResultSet", text: "El driver las entrega como un ResultSet.", back: true },
  { at: "app", carrying: "rs.next()", text: "Tu código recorre el resultado fila por fila.", back: true },
];

const STEP_MS = 1400;

export function SystemMap() {
  const id = useId();
  const [selected, setSelected] = useState<PieceId>("app");
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!playing || step === null) return;
    if (step >= trip.length - 1) {
      timer.current = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setStep((s) => (s ?? 0) + 1), STEP_MS);
    return () => clearTimeout(timer.current);
  }, [playing, step]);

  const current = step === null ? null : trip[step];
  const piece = pieces.find((p) => p.id === (current?.at ?? selected))!;

  const play = () => {
    if (step === null || step >= trip.length - 1) setStep(0);
    setPlaying(true);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Cable behind the pieces: what joins them is the connection. */}
        <div aria-hidden="true" className="absolute top-1/2 right-[12%] left-[12%] hidden h-1 -translate-y-1/2 rounded-full bg-foreground/80 md:block" />
        <ol className="relative grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6" aria-label="Las cuatro piezas">
          {pieces.map((p, i) => {
            const Icon = p.icon;
            const active = current ? current.at === p.id : selected === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-controls={`${id}-detail`}
                  onClick={() => {
                    setPlaying(false);
                    setStep(null);
                    setSelected(p.id);
                  }}
                  className={cn(
                    "group relative flex w-full flex-col items-start gap-3 rounded-3xl border-2 border-foreground bg-card p-4 text-left transition-[background-color,transform] duration-300 outline-none hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-ring/40 md:p-5",
                    active && "bg-secondary"
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className={cn("grid size-11 place-items-center rounded-2xl border-2 border-foreground", active ? "bg-sun text-sun-foreground" : "bg-background")}>
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                  </span>
                  <span>
                    <span className="block font-semibold leading-tight">{p.name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{p.short}</span>
                  </span>
                  {current?.at === p.id && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 font-mono text-xs text-background">
                      {current.back ? <ArrowLeft aria-hidden="true" className="size-3" /> : <ArrowRight aria-hidden="true" className="size-3" />}
                      {current.carrying}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={playing ? () => setPlaying(false) : play}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
          {playing ? "Pausar" : step === null ? "Enviar una consulta" : step >= trip.length - 1 ? "Repetir el viaje" : "Continuar"}
        </button>
        <button
          type="button"
          disabled={step !== null && step >= trip.length - 1}
          onClick={() => {
            setPlaying(false);
            setStep((s) => (s === null ? 0 : Math.min(s + 1, trip.length - 1)));
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-foreground px-5 font-medium outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50"
        >
          Paso a paso
        </button>
        {step !== null && (
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStep(null);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Reiniciar
          </button>
        )}
      </div>

      <div id={`${id}-detail`} aria-live="polite" className="grid gap-4 rounded-3xl bg-card p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
        {current ? (
          <>
            <div>
              <p className="text-sm font-medium text-muted-foreground tabular-nums">
                Paso {step! + 1} de {trip.length} · {current.back ? "vuelta" : "ida"} · {piece.name}
              </p>
              <p className="mt-1 text-xl font-semibold text-balance">{current.text}</p>
            </div>
            <ol aria-hidden="true" className="flex gap-1.5">
              {trip.map((_, i) => (
                <li key={i} className={cn("h-2 w-6 rounded-full", i <= step! ? "bg-primary" : "bg-muted")} />
              ))}
            </ol>
          </>
        ) : (
          <>
            <div>
              <p className="text-xl font-semibold">{piece.name}</p>
              <p className="mt-1 max-w-prose leading-relaxed text-muted-foreground">{piece.detail}</p>
            </div>
            <code className="justify-self-start rounded-xl bg-code px-3 py-2 font-mono text-sm text-code-foreground md:justify-self-end">{piece.example}</code>
          </>
        )}
      </div>
    </div>
  );
}
