"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ExecutionBadge } from "@/components/ui/execution-badge";
import { POOL_DEFAULTS, POOL_SIZE_RANGE, simulatePool, type PoolResult } from "@/lib/pool-model";

const { requests: REQUESTS, connectMs, queryMs } = POOL_DEFAULTS;

/** How long the bars take to appear after «Lanzar»: one request every ~30 ms. */
const REVEAL_MS = 1500;

function verdict(size: number, pooled: PoolResult, none: PoolResult): string {
  if (pooled.meanMs > none.meanMs) {
    return `Con ${size} ${size === 1 ? "conexión" : "conexiones"} las peticiones hacen fila (hasta ${pooled.peakQueue} esperando): el pool es más lento que no tenerlo.`;
  }
  if (pooled.peakQueue > 0) {
    return `Con ${size} conexiones todavía hay fila (hasta ${pooled.peakQueue} esperando), pero ya es más rápido que abrir una conexión por petición.`;
  }
  const idle = size - pooled.peakInUse;
  if (idle > 2) {
    return `Nadie espera y cada respuesta tarda ${pooled.meanMs} ms, pero solo se usan ${pooled.peakInUse} a la vez: las otras ${idle} ocupan lugares en la base sin hacer nada.`;
  }
  return `Nadie espera: cada respuesta tarda ${pooled.meanMs} ms en vez de ${none.meanMs} ms, porque la conexión ya estaba abierta.`;
}

/**
 * Pool simulator (REQ-10): pool size 1–20, a burst of 50 requests, and the same burst without a
 * pool side by side. Numbers come from lib/pool-model.ts and are labelled «Simulación» (CA4).
 */
export function PoolSimulator() {
  const id = useId();
  const [size, setSize] = useState(4);
  const [launched, setLaunched] = useState(false);
  const [shown, setShown] = useState(0);

  const none = useMemo(() => simulatePool({ pooled: false, poolSize: size }), [size]);
  const pooled = useMemo(() => simulatePool({ pooled: true, poolSize: size }), [size]);
  const scale = Math.max(none.maxMs, pooled.maxMs);

  // Reveal the requests one after another; instant with reduced motion.
  useEffect(() => {
    if (!launched || shown >= REQUESTS) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = window.setTimeout(() => setShown(REQUESTS), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setShown((n) => Math.min(REQUESTS, n + 2)), (REVEAL_MS / REQUESTS) * 2);
    return () => window.clearTimeout(t);
  }, [launched, shown]);

  const done = launched && shown >= REQUESTS;

  return (
    <div className="space-y-5 rounded-3xl border-2 border-foreground bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Ráfaga de {REQUESTS} peticiones seguidas</p>
        <ExecutionBadge kind="simulated" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor={`${id}-size`} className="flex items-baseline justify-between font-medium">
            Tamaño del pool
            <span className="text-2xl font-semibold tabular-nums">{size}</span>
          </label>
          <input
            id={`${id}-size`}
            type="range"
            min={POOL_SIZE_RANGE.min}
            max={POOL_SIZE_RANGE.max}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            aria-valuetext={`${size} ${size === 1 ? "conexión" : "conexiones"}`}
            className="h-2 w-full cursor-pointer accent-[var(--primary)]"
          />
        </div>
        <Button
          size="lg"
          onPress={() => {
            setShown(0);
            setLaunched(true);
          }}
          className="rounded-full"
        >
          <Play data-icon="inline-start" aria-hidden="true" />
          {launched ? "Lanzar otra vez" : `Lanzar ${REQUESTS} peticiones`}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Sin pool" note="Cada petición abre su conexión y la cierra." result={none} scale={scale} shown={launched ? shown : 0} connect />
        <Panel title={`Con pool de ${size}`} note="Las conexiones se abrieron al arrancar y se prestan." result={pooled} scale={scale} shown={launched ? shown : 0} />
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground" aria-label="Leyenda">
        <li className="flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-sm bg-accent-foreground/70" />Abrir conexión (~{connectMs} ms)</li>
        <li className="flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-sm bg-sun" />Espera en la fila</li>
        <li className="flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-sm bg-primary" />Consulta (~{queryMs} ms)</li>
      </ul>

      <p aria-live="polite" className="min-h-12 rounded-2xl bg-secondary p-4 leading-relaxed text-secondary-foreground">
        {done ? verdict(size, pooled, none) : launched ? "Llegando peticiones…" : "Elige un tamaño y lanza la ráfaga. Prueba con 1, con 3 y con 20."}
      </p>
    </div>
  );
}

function Panel({
  title,
  note,
  result,
  scale,
  shown,
  connect,
}: {
  title: string;
  note: string;
  result: PoolResult;
  scale: number;
  shown: number;
  connect?: boolean;
}) {
  const complete = shown >= result.requests.length;
  return (
    <section aria-label={title} className="space-y-3 rounded-2xl border p-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      <div aria-hidden="true" className="flex h-28 items-end gap-px rounded-lg bg-muted/60 p-1">
        {result.requests.map((r, i) => {
          const visible = i < shown;
          const pct = (ms: number) => `${(ms / scale) * 100}%`;
          const connectPart = connect ? connectMs : 0;
          return (
            <div key={r.id} className={cn("flex h-full flex-1 flex-col justify-end transition-opacity duration-200", !visible && "opacity-0")}>
              <div className="rounded-t-[1px] bg-primary" style={{ height: pct(queryMs) }} />
              {r.waitedMs > 0 && <div className="bg-sun" style={{ height: pct(r.waitedMs) }} />}
              {connectPart > 0 && <div className="bg-accent-foreground/70" style={{ height: pct(connectPart) }} />}
            </div>
          );
        })}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Metric label="Tiempo medio" value={complete ? `${result.meanMs} ms` : "—"} strong />
        <Metric label="Peor tiempo" value={complete ? `${result.maxMs} ms` : "—"} />
        <Metric label="Máximo en fila" value={complete ? String(result.peakQueue) : "—"} />
        <Metric label="Conexiones abiertas en la base" value={complete ? String(result.connectionsOpened) : "—"} />
      </dl>
    </section>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", strong ? "text-2xl font-semibold" : "text-lg font-medium")}>{value}</dd>
    </div>
  );
}
