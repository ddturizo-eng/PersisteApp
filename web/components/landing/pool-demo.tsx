"use client";

import { useState } from "react";
import { cn } from "cn";
import { ExecutionBadge } from "@/components/ui/execution-badge";

const POOL_SIZE = 4;

/**
 * Pool vs no pool (REQ-33 CA2): with a pool, connections are lent and returned like shared bikes;
 * without it, every query opens a new connection (TCP + login) and closes it afterwards. Simulated.
 */
export function PoolDemo() {
  const [usePool, setUsePool] = useState(true);
  const [inUse, setInUse] = useState(0);
  const [opened, setOpened] = useState(POOL_SIZE);
  const [waiting, setWaiting] = useState(0);
  const [log, setLog] = useState("El pool abrió 4 conexiones al arrancar la app y las tiene listas.");

  const reset = (pool: boolean) => {
    setUsePool(pool);
    setInUse(0);
    setWaiting(0);
    setOpened(pool ? POOL_SIZE : 0);
    setLog(pool ? "El pool abrió 4 conexiones al arrancar la app y las tiene listas." : "Sin pool: no hay conexiones abiertas hasta que llega una consulta.");
  };

  const request = () => {
    if (!usePool) {
      setOpened((n) => n + 1);
      setInUse((n) => n + 1);
      setLog("Consulta nueva: se abre una conexión desde cero (TCP, protocolo y clave). Es lo más lento del viaje.");
      return;
    }
    if (inUse < POOL_SIZE) {
      setInUse((n) => n + 1);
      setLog("El pool presta una conexión que ya estaba abierta: no hay que conectarse otra vez.");
    } else {
      setWaiting((n) => n + 1);
      setLog("Las 4 están prestadas: esta consulta espera a que alguien devuelva una.");
    }
  };

  const release = () => {
    if (waiting > 0) {
      setWaiting((n) => n - 1);
      setLog("Se devolvió una conexión y la consulta que esperaba la toma enseguida.");
      return;
    }
    if (inUse === 0) return;
    setInUse((n) => n - 1);
    setLog(usePool ? "close() devuelve la conexión al pool, que la deja abierta para la siguiente." : "close() cierra la conexión de verdad: la próxima consulta tendrá que abrir otra.");
  };

  const slots = usePool ? POOL_SIZE : Math.max(inUse, 1);

  return (
    <div className="space-y-5 rounded-3xl border-2 border-foreground bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Modo" className="inline-flex rounded-full border-2 border-foreground p-1">
          {[true, false].map((pool) => (
            <button
              key={String(pool)}
              type="button"
              role="radio"
              aria-checked={usePool === pool}
              onClick={() => reset(pool)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                usePool === pool ? "bg-foreground text-background" : "hover:bg-muted"
              )}
            >
              {pool ? "Con pool" : "Sin pool"}
            </button>
          ))}
        </div>
        <ExecutionBadge kind="simulated" />
      </div>

      <ul aria-label="Conexiones" className="flex flex-wrap gap-2">
        {Array.from({ length: slots }, (_, i) => {
          const busy = i < inUse;
          return (
            <li
              key={i}
              className={cn(
                "flex h-16 w-20 flex-col items-center justify-center rounded-2xl border-2 border-foreground text-xs font-medium transition-colors duration-300",
                busy ? "bg-accent text-accent-foreground" : usePool ? "bg-secondary" : "border-dashed bg-background text-muted-foreground"
              )}
            >
              <span className="font-mono text-sm">#{i + 1}</span>
              {busy ? "prestada" : usePool ? "libre" : "sin abrir"}
            </li>
          );
        })}
      </ul>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">En uso</dt>
          <dd className="text-2xl font-semibold tabular-nums">{inUse}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Esperando</dt>
          <dd className="text-2xl font-semibold tabular-nums">{waiting}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Veces que se conectó</dt>
          <dd className="text-2xl font-semibold tabular-nums">{opened}</dd>
        </div>
      </dl>

      <p aria-live="polite" className="min-h-12 leading-relaxed">{log}</p>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={request} className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40">
          Llega una consulta
        </button>
        <button
          type="button"
          onClick={release}
          disabled={inUse === 0 && waiting === 0}
          className="inline-flex h-11 items-center rounded-full border-2 border-foreground px-5 font-medium outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50"
        >
          Termina una consulta
        </button>
      </div>
    </div>
  );
}
