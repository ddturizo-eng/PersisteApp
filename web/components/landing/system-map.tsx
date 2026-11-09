"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Coffee, Database, Network, Pause, Play, Plug, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { ExecutionBadge } from "@/components/ui/execution-badge";

type PieceId = "app" | "driver" | "red" | "motor";

const pieces: { id: PieceId; name: string; short: string; icon: typeof Coffee; detail: string; example: string }[] = [
  {
    id: "app",
    name: "Tu programa Java",
    short: "Pide los datos",
    icon: Coffee,
    detail: "El programa de la Unicesar pide los nombres guardados en estudiante. También decide cómo mostrarlos cuando vuelven.",
    example: "Pide: nombres de estudiante",
  },
  {
    id: "driver",
    name: "Driver de la base de datos",
    short: "Hace de traductor",
    icon: Plug,
    detail: "El driver es una pieza de software que traduce lo que pide Java al idioma de PostgreSQL u Oracle, como un intérprete entre dos personas.",
    example: "Traduce la petición de Java",
  },
  {
    id: "red",
    name: "Red",
    short: "Transporta",
    icon: Network,
    detail: "La red lleva la petición hasta el computador que guarda la base de datos. Después trae la respuesta de vuelta, como una carretera de ida y regreso.",
    example: "Lleva la petición y trae las filas",
  },
  {
    id: "motor",
    name: "Motor de base de datos",
    short: "Ejecuta",
    icon: Database,
    detail: "PostgreSQL u Oracle guarda las tablas. Busca las filas de estudiante que se pidieron y prepara la respuesta, como quien consulta un archivo.",
    example: "Busca filas en estudiante",
  },
];

/** The round trip of one query: where it is and what travels (REQ-33 CA2). */
const trip: { at: PieceId; carrying: string; text: string; back?: boolean }[] = [
  { at: "app", carrying: "petición →", text: "Java pide los nombres de la tabla estudiante." },
  { at: "driver", carrying: "petición →", text: "El driver traduce la petición para que la base de datos la entienda." },
  { at: "red", carrying: "petición →", text: "La red lleva la petición al computador de la base de datos." },
  { at: "motor", carrying: "filas", text: "PostgreSQL busca los nombres en estudiante y prepara las filas." },
  { at: "red", carrying: "← filas", text: "Las filas vuelven por la misma conexión.", back: true },
  { at: "driver", carrying: "← filas", text: "El driver entrega las filas en una forma que Java puede leer.", back: true },
  { at: "app", carrying: "← nombres", text: "Java lee las filas y muestra los nombres de los estudiantes.", back: true },
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
        {/* The trip is an animation, not a real query (REQ-07, T-25). */}
        <ExecutionBadge kind="simulated" className="ml-auto" />
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
            <p className="justify-self-start rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground md:justify-self-end">{piece.example}</p>
          </>
        )}
      </div>
    </div>
  );
}
