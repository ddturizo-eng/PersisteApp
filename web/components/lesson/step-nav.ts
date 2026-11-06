/**
 * How a step with inner screens (the trace moments, the quiz questions) drives the player's footer.
 * The footer «Continuar» is the only way forward: there is no second «Siguiente» button inside a step.
 */
export type StepNav = {
  /** Whether «Continuar» is enabled right now. */
  canAdvance: boolean;
  /** Moves to the next inner screen; null when the next press should leave the step. */
  advance: (() => void) | null;
  /** Shown under a disabled «Continuar»: what to do to move on. */
  hint?: string;
};
