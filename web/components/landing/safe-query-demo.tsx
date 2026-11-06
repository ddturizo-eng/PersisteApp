"use client";

import { useId, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { ExecutionBadge } from "@/components/ui/execution-badge";

const ATTACK = "' OR '1'='1";

/**
 * Concatenated SQL vs PreparedStatement (REQ-33 CA2): what the user types rewrites the first
 * query; with a parameter it only travels as data. Simulated: nothing reaches a database.
 */
export function SafeQueryDemo({ mode = "both" }: { mode?: "vulnerable" | "both" }) {
  const id = useId();
  const [user, setUser] = useState("ana");
  const injected = user.includes("'");

  return (
    <div className="space-y-5">
      {/* Phone: the field takes the whole row and the actions go below; wide screens: one row. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-1.5 sm:flex-1">
          <label htmlFor={`${id}-user`} className="block font-medium">
            Escribe un usuario
          </label>
          <input
            id={`${id}-user`}
            value={user}
            onChange={(e) => setUser(e.target.value)}
            maxLength={40}
            spellCheck={false}
            autoComplete="off"
            className="h-12 w-full rounded-2xl border-2 border-foreground bg-card px-4 font-mono text-base outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          />
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <button
            type="button"
            onClick={() => setUser(ATTACK)}
            className="inline-flex h-12 shrink-0 items-center rounded-full bg-sun px-5 font-medium whitespace-nowrap text-sun-foreground outline-none hover:brightness-95 focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            Probar <code className="ml-1.5 font-mono">{ATTACK}</code>
          </button>
          <ExecutionBadge kind="simulated" />
        </div>
      </div>

      <div className={mode === "both" ? "grid gap-4 md:grid-cols-2" : "grid gap-4"} aria-live="polite">
        <article className="space-y-3 rounded-3xl border-2 border-foreground bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            {injected && <ShieldAlert aria-hidden="true" className="size-5 text-destructive" />}
            SQL pegado con +
          </h3>
          <pre className="overflow-x-auto rounded-2xl bg-code p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-code-foreground">
            SELECT id FROM users{"\n"}WHERE name = &apos;<mark className="rounded bg-sun px-0.5 text-sun-foreground">{user}</mark>&apos;
          </pre>
          <p className={injected ? "font-medium text-destructive" : "text-muted-foreground"}>
            {injected
              ? "La comilla cerró el texto y lo demás pasó a ser SQL: la condición ya no es la que escribiste."
              : "Con datos normales funciona. Escribe una comilla y mira qué le pasa a la consulta."}
          </p>
        </article>

        {mode === "both" && (
        <article className="space-y-3 rounded-3xl border-2 border-foreground bg-secondary p-5 text-secondary-foreground">
          <h3 className="flex items-center gap-2 font-semibold">
            <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
            PreparedStatement
          </h3>
          <pre className="overflow-x-auto rounded-2xl bg-card p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-code-foreground">
            SELECT id FROM users{"\n"}WHERE name = ?{"\n\n"}
            <span className="text-muted-foreground">ps.setString(1, </span>
            <mark className="rounded bg-sun px-0.5 text-sun-foreground">&quot;{user}&quot;</mark>
            <span className="text-muted-foreground">);</span>
          </pre>
          <p>
            {injected
              ? "El texto viaja aparte, como dato: se busca un usuario que se llame literalmente así, y no existe."
              : "El SQL nunca cambia. El valor viaja separado y se usa solo como dato."}
          </p>
        </article>
        )}
      </div>
    </div>
  );
}
