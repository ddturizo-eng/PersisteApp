/** How a practice result was produced (constitution P1, REQ-07). */
export type ExecutionKind = "real" | "simulated";

/** Visible label and screen-reader description for each execution kind. */
export const executionLabels: Record<
  ExecutionKind,
  { label: string; description: string }
> = {
  real: {
    label: "Ejecución real",
    description: "Resultado producido por una base de datos PostgreSQL real.",
  },
  simulated: {
    label: "Simulación",
    description:
      "Resultado predefinido con fines educativos; no se ejecutó contra una base de datos.",
  },
};
