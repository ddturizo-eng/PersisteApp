"use client";

import { useEffect, useId, useState } from "react";
import { Check, RotateCcw, ShoppingCart, TriangleAlert, X, Zap } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ExecutionBadge } from "@/components/ui/execution-badge";
import {
  createDb,
  inconsistencies,
  runSale,
  type DbState,
  type SaleMode,
  type SaleRun,
  type SaleStep,
} from "@/lib/memory-db";

/** Pause between two statements so the student can follow them; instant with reduced motion. */
const STEP_MS = 900;

const money = (n: number) => `$${n.toLocaleString("es-CO")}`;

const outcomeText: Record<SaleRun["outcome"], (mode: SaleMode) => string> = {
  committed: (mode) =>
    mode === "transaction"
      ? "Commit: la venta y el stock se guardaron juntos."
      : "Las dos sentencias funcionaron, así que no se nota la falta de transacción.",
  "half-saved": () =>
    "Quedó a medias: la venta está guardada y el stock no bajó. Nadie puede deshacerlo, porque cada sentencia se confirmó sola.",
  "rolled-back": () => "Rollback: la base quedó igual que antes de vender. No hay venta sin stock.",
  rejected: () => "La venta no llegó a escribir nada en la base.",
};

/**
 * App ↔ database mirror (REQ-12, module 5): the sale of ProductService.registerSale replayed
 * statement by statement, with the Java line on the left and the tables on the right.
 * `mode="autocommit"` hides the transaction switch for the theory step. Labelled «Simulación».
 */
export function MirrorSimulator({ mode: fixedMode }: { mode?: SaleMode }) {
  const id = useId();
  /** Database before the sale being replayed; the replay's last snapshot is the database after it. */
  const [base, setBase] = useState<DbState>(() => createDb());
  const [productId, setProductId] = useState(4);
  const [quantity, setQuantity] = useState(3);
  const [mode, setMode] = useState<SaleMode>(fixedMode ?? "transaction");
  const [crash, setCrash] = useState(false);
  const [run, setRun] = useState<SaleRun | null>(null);
  const [shown, setShown] = useState(0);

  const running = run !== null && shown < run.steps.length;
  const done = run !== null && shown >= run.steps.length;
  const current: SaleStep | undefined = run && shown > 0 ? run.steps[shown - 1] : undefined;
  const visibleDb = current?.db ?? base;
  const pending = current?.pending ?? { saleIds: [], productIds: [] };

  useEffect(() => {
    if (!run || shown >= run.steps.length) return;
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setShown(instant ? run.steps.length : shown + 1), instant ? 0 : shown === 0 ? 150 : STEP_MS);
    return () => window.clearTimeout(t);
  }, [run, shown]);

  const sell = () => {
    const start = run?.db ?? base;
    setBase(start);
    setRun(runSale(start, { productId, quantity, mode, failAfterInsert: crash }));
    setShown(0);
  };
  const reset = () => {
    setBase(createDb());
    setRun(null);
    setShown(0);
  };

  // Mid-sale the INSERT is always ahead of the UPDATE: only judge the data once the sale is over.
  const broken = running ? [] : inconsistencies(visibleDb);

  return (
    <div className="space-y-5 rounded-3xl border-2 border-foreground bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Vender: guardar la venta y descontar el stock</p>
        <ExecutionBadge kind="simulated" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1.3fr]">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-product`} className="font-medium">Producto</label>
          <select
            id={`${id}-product`}
            value={productId}
            disabled={running}
            onChange={(e) => setProductId(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-input bg-background px-3"
          >
            {visibleDb.products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (hay {p.stock})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-qty`} className="font-medium">Cantidad</label>
          <input
            id={`${id}-qty`}
            type="number"
            min={1}
            max={20}
            value={quantity}
            disabled={running}
            onChange={(e) => setQuantity(Math.max(1, Math.min(20, Math.trunc(Number(e.target.value) || 1))))}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 tabular-nums"
          />
        </div>
        {fixedMode ? (
          <p className="self-end text-sm text-muted-foreground sm:col-span-2 lg:col-span-1">
            Cada sentencia se confirma sola: <code className="font-mono">autocommit</code> está encendido.
          </p>
        ) : (
          <fieldset className="space-y-1.5" disabled={running}>
            <legend className="mb-1.5 font-medium">Cómo se ejecuta</legend>
            <div className="grid grid-cols-2 rounded-lg border border-input p-0.5">
              {(["autocommit", "transaction"] as const).map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex h-9 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <input type="radio" name={`${id}-mode`} value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                  {m === "autocommit" ? "Sin transacción" : "Con transacción"}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onPress={sell} isDisabled={running} className="rounded-full">
          <ShoppingCart data-icon="inline-start" aria-hidden="true" />
          Vender {quantity}
        </Button>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={crash} disabled={running} onChange={(e) => setCrash(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          <Zap aria-hidden="true" className="size-4 text-sun-foreground" />
          Simular un corte después del INSERT
        </label>
        <Button variant="ghost" onPress={reset} isDisabled={running} className="ml-auto">
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Reiniciar la base
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Tu app Java" className="space-y-3 rounded-2xl border p-4">
          <div>
            <h3 className="font-semibold">Tu app <span className="font-mono text-sm font-medium break-all">ProductService.registerSale</span></h3>
            <p className="text-sm text-muted-foreground">Cada línea que ejecuta y el SQL que llega a la base.</p>
          </div>
          {run ? (
            <ol className="space-y-2">
              {run.steps.slice(0, shown).map((step, i) => (
                <StepRow key={i} step={step} active={i === shown - 1 && running} />
              ))}
            </ol>
          ) : (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Elige un producto y una cantidad, y pulsa «Vender». Prueba a vender más de lo que hay.
            </p>
          )}
        </section>

        <section aria-label="Base de datos" className="space-y-4 rounded-2xl border p-4">
          <div>
            <h3 className="font-semibold">Base de datos</h3>
            <p className="text-sm text-muted-foreground">Lo que está guardado. Lo rayado aún no está confirmado.</p>
          </div>
          <Table caption="products" head={["id", "name", "stock"]}>
            {visibleDb.products.map((p) => (
              <Row key={p.id} pending={pending.productIds.includes(p.id)} highlight={p.id === productId}>
                <td className="tabular-nums">{p.id}</td>
                <td>{p.name}</td>
                <td className="text-right font-semibold tabular-nums">{p.stock}</td>
              </Row>
            ))}
          </Table>
          <Table caption="sales" head={["id", "product_id", "quantity", "total"]}>
            {visibleDb.sales.length === 0 ? (
              <tr><td colSpan={4} className="py-2 text-muted-foreground">Sin ventas</td></tr>
            ) : (
              visibleDb.sales.map((s) => (
                <Row key={s.id} pending={pending.saleIds.includes(s.id)}>
                  <td className="tabular-nums">{s.id}</td>
                  <td className="tabular-nums">{s.productId}</td>
                  <td className="tabular-nums">{s.quantity}</td>
                  <td className="text-right tabular-nums">{money(s.total)}</td>
                </Row>
              ))
            )}
          </Table>
          {broken.length > 0 && (
            <p className="flex gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {broken.map((b) => {
                const name = visibleDb.products.find((p) => p.id === b.productId)?.name;
                return (
                  <span key={b.productId}>
                    Inconsistente: las ventas de «{name}» suman {b.sold} y el stock solo bajó {b.taken}.
                  </span>
                );
              })}
            </p>
          )}
        </section>
      </div>

      <p aria-live="polite" className="min-h-12 rounded-2xl bg-secondary p-4 leading-relaxed text-secondary-foreground">
        {done && run ? outcomeText[run.outcome](mode) : running ? "Ejecutando…" : fixedMode ? "Vende 3 memorias USB: solo hay 2." : "Vende más de lo que hay, primero sin transacción y luego con ella."}
      </p>
    </div>
  );
}

function StepRow({ step, active }: { step: SaleStep; active: boolean }) {
  const Icon = step.ok ? Check : X;
  return (
    <li
      className={cn(
        "rounded-xl border p-3 text-sm transition-colors",
        active && "border-primary",
        !step.ok && "border-danger/40 bg-danger-soft"
      )}
    >
      <div className="flex items-start gap-2">
        <Icon aria-label={step.ok ? "bien" : "falló"} className={cn("mt-0.5 size-4 shrink-0", step.ok ? "text-success" : "text-danger")} />
        <div className="min-w-0 space-y-1">
          <code className="block font-mono text-[0.8125rem] break-words">{step.java}</code>
          {step.sql && <code className="block font-mono text-xs break-words text-muted-foreground">{step.sql}</code>}
          <p className={cn(!step.ok && "text-danger")}>{step.message}</p>
        </div>
      </div>
    </li>
  );
}

function Table({ caption, head, children }: { caption: string; head: string[]; children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="mb-1 text-left font-mono text-xs font-semibold">{caption}</caption>
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            {head.map((h, i) => (
              <th key={h} scope="col" className={cn("py-1 pr-2 font-mono font-medium", i === head.length - 1 && "text-right")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({ pending, highlight, children }: { pending?: boolean; highlight?: boolean; children: React.ReactNode }) {
  return (
    <tr
      className={cn(
        "border-b last:border-0 [&>td]:py-1.5 [&>td]:pr-2",
        highlight && "bg-muted/60",
        pending && "bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_oklch,var(--sun),transparent_65%)_6px_12px)] italic"
      )}
    >
      {children}
      {pending && <td className="sr-only">sin confirmar</td>}
    </tr>
  );
}
