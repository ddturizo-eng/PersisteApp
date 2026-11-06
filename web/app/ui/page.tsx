import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ExecutionBadge } from "@/components/ui/execution-badge";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export const metadata: Metadata = {
  title: "Muestrario de componentes",
  robots: { index: false },
};

const swatches = [
  ["bg-background", "background"],
  ["bg-card", "card"],
  ["bg-muted", "muted"],
  ["bg-primary", "primary"],
  ["bg-success-soft", "success-soft"],
  ["bg-danger-soft", "danger-soft"],
  ["bg-simulated-soft", "simulated-soft"],
  ["bg-real-soft", "real-soft"],
  ["bg-code", "code"],
] as const;

/** Internal page to review PA-4 tokens and base components in both themes. */
export default function UiShowcase() {
  return (
    <main className="mx-auto w-full max-w-lesson space-y-10 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Muestrario de componentes</h1>
        <p className="text-muted-foreground">
          Página interna para revisar tokens y componentes base en tema claro y oscuro.
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="botones">
        <h2 id="botones" className="text-lg font-semibold">Botones</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Continuar</Button>
          <Button variant="outline">Volver</Button>
          <Button variant="secondary">Comprobar</Button>
          <Button variant="ghost">Ver pista</Button>
          <Button variant="destructive">Forzar fallo</Button>
          <Button isDisabled>Responde para continuar</Button>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="rotulos">
        <h2 id="rotulos" className="text-lg font-semibold">Rótulos de ejecución</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ExecutionBadge kind="simulated" />
          <ExecutionBadge kind="real" />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="teclas">
        <h2 id="teclas" className="text-lg font-semibold">Atajos</h2>
        <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <Kbd>←</Kbd> <Kbd>→</Kbd> navegar · <Kbd>P</Kbd> exposición ·
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          buscar
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="retro">
        <h2 id="retro" className="text-lg font-semibold">Retroalimentación</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="rounded-lg border border-success/30 bg-success-soft p-4 text-success">
            <strong>Correcto.</strong> PreparedStatement envía el valor como dato, no como SQL.
          </p>
          <p className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-danger">
            <strong>No exactamente.</strong> Concatenar el texto deja que la comilla cierre la
            cadena.
          </p>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="codigo">
        <h2 id="codigo" className="text-lg font-semibold">Código</h2>
        <pre className="overflow-x-auto rounded-lg bg-code p-4 font-mono text-sm text-code-foreground">
          <code>{`String sql = "SELECT * FROM users WHERE name = ?";
try (PreparedStatement ps = connection.prepareStatement(sql)) {
    ps.setString(1, name);
}`}</code>
        </pre>
      </section>

      <section className="space-y-3" aria-labelledby="tokens">
        <h2 id="tokens" className="text-lg font-semibold">Superficies</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {swatches.map(([className, name]) => (
            <li key={name} className="overflow-hidden rounded-lg border">
              <div className={`h-12 ${className}`} />
              <p className="px-3 py-2 font-mono text-xs text-muted-foreground">{name}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
