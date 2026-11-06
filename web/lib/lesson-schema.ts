import { z } from "zod";
import { plainText } from "@/lib/inline-code";
import { illustrationNames } from "@/lib/illustrations";

/**
 * Lesson content schema (REQ-01, REQ-02, REQ-04, REQ-16).
 * Lessons live as JSON under content/<session>/ and are validated at build time.
 */

export const engines = ["oracle", "postgresql"] as const;
/** Theory first, then practice, then the scored quiz (constitution P6, REQ-26). */
export const stages = ["theory", "practice", "quiz"] as const;
export const simulators = ["pool", "injection", "mirror", "system-map", "request-tracer"] as const;

export const stageLabels: Record<(typeof stages)[number], string> = {
  theory: "Teoría",
  practice: "Práctica",
  quiz: "Quiz",
};

const text = z.string().trim().min(1, "no puede estar vacío");
const stage = z.enum(stages);

const executionResult = z.object({
  kind: z.enum(["real", "simulated"]),
  output: text,
});

const textStep = z.object({
  kind: z.literal("text"),
  stage,
  title: text.optional(),
  body: text,
  /** Glossary term ids highlighted inside the body (REQ-08 CA3). */
  glossary: z.array(text).optional(),
  /** Renders the teacher's AI log template: reason, problem, prompt, solution (REQ-16 CA3). */
  reflection: z.boolean().optional(),
  /** Illustration next to the text (docs/ilustraciones.md), so a theory step is not a wall of text. */
  image: z.enum(illustrationNames).optional(),
});

const visualStep = z.object({
  kind: z.literal("visual"),
  stage,
  component: z.enum(simulators),
  props: z.record(z.string(), z.unknown()).optional(),
  title: text.optional(),
  caption: text,
});

const choice = z.object({
  text,
  correct: z.boolean(),
  explanation: text,
});

const exactlyOneCorrect = (options: { correct: boolean }[]) =>
  options.filter((option) => option.correct).length === 1;

/** Situation or code shown before the prompt so the question is explicit (REQ-32 CA1). */
const questionContext = text.optional();

/**
 * REQ-32 CA3: the right option must not stand out by length — at most 20 % longer than the
 * longest wrong option and at most 20 % shorter than the shortest wrong one.
 */
export function lengthGiveaway(options: { text: string; correct: boolean }[]): string | undefined {
  const correct = options.find((option) => option.correct);
  const wrong = options.filter((option) => !option.correct).map((option) => plainText(option.text).trim().length);
  if (!correct || wrong.length === 0) return undefined;
  const length = plainText(correct.text).trim().length;
  if (length > Math.max(...wrong) * 1.2) return `la opción correcta es demasiado larga (${length} caracteres frente a ${Math.max(...wrong)}): se adivina por la longitud`;
  if (length < Math.min(...wrong) * 0.8) return `la opción correcta es demasiado corta (${length} caracteres frente a ${Math.min(...wrong)}): se adivina por la longitud`;
  return undefined;
}

const balancedChoices = <T extends { text: string; correct: boolean }>(options: T[], ctx: z.RefinementCtx) => {
  const problem = lengthGiveaway(options);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
};

const questionStep = z.object({
  kind: z.literal("question"),
  stage,
  context: questionContext,
  prompt: text,
  options: z
    .array(choice)
    .min(2, "necesita al menos 2 opciones")
    .refine(exactlyOneCorrect, "debe tener exactamente una opción correcta")
    .superRefine(balancedChoices),
});

/** Code per variant: Java for application code, or one entry per engine for SQL/driver code. */
const codeVariants = z
  .object({
    java: text.optional(),
    oracle: text.optional(),
    postgresql: text.optional(),
  })
  .refine((v) => Boolean(v.java ?? v.oracle ?? v.postgresql), "necesita al menos una variante de código");

const codeBase = {
  kind: z.literal("code"),
  stage,
  title: text.optional(),
  language: z.enum(["java", "sql"]),
  variants: codeVariants,
  result: executionResult.optional(),
};

const readCode = z.object({ ...codeBase, mode: z.literal("read") });

const pickLineCode = z.object({
  ...codeBase,
  mode: z.literal("pick-line"),
  context: questionContext,
  prompt: text,
  options: z
    .array(z.object({ line: text, correct: z.boolean(), explanation: text }))
    .min(2, "necesita al menos 2 líneas")
    .refine(exactlyOneCorrect, "debe tener exactamente una línea correcta")
    .superRefine((options, ctx) => balancedChoices(options.map((o) => ({ text: o.line, correct: o.correct })), ctx)),
});

const orderCode = z.object({
  ...codeBase,
  mode: z.literal("order"),
  prompt: text,
  /** Blocks in the correct order; the player shuffles them. */
  blocks: z.array(text).min(3, "necesita al menos 3 bloques"),
  /** Shown one per failed check; after 2 failures «Ver solución» appears (REQ-04 CA5). */
  hints: z.array(text).optional(),
  distractors: z.array(text).optional(),
});

const GAP_PATTERN = /\{\{(\d+)\}\}/g;

const fillCode = z
  .object({
    ...codeBase,
    mode: z.literal("fill"),
    prompt: text,
    /** Shown one per failed check; after 2 failures «Ver solución» appears (REQ-04 CA5). */
    hints: z.array(text).optional(),
    /** Gaps are written as {{n}} inside the code variants. */
    gaps: z
      .array(
        z.object({
          id: z.number().int().positive(),
          label: text,
          answers: z.array(text).min(1),
          /** When present, the gap is a selector with these options (REQ-04 CA7). */
          choices: z.array(text).min(2, "al menos 2 opciones").max(6, "máximo 6 opciones").optional(),
          hint: text.optional(),
        })
      )
      .min(1, "necesita al menos 1 hueco"),
  })
  .superRefine((step, ctx) => {
    step.gaps.forEach((gap, i) => {
      if (gap.choices && !gap.answers.some((answer) => gap.choices!.includes(answer))) {
        ctx.addIssue({ code: "custom", path: ["gaps", i, "choices"], message: "la respuesta debe estar entre las opciones" });
      }
    });
    const code = [step.variants.java, step.variants.oracle, step.variants.postgresql].join("\n");
    const used = new Set([...code.matchAll(GAP_PATTERN)].map((m) => Number(m[1])));
    const declared = new Set(step.gaps.map((gap) => gap.id));
    for (const id of used) {
      if (!declared.has(id)) ctx.addIssue({ code: "custom", path: ["gaps"], message: `falta el hueco {{${id}}}` });
    }
    for (const id of declared) {
      if (!used.has(id)) ctx.addIssue({ code: "custom", path: ["gaps"], message: `el hueco ${id} no aparece en el código` });
    }
  });

const codeStep = z.discriminatedUnion("mode", [readCode, pickLineCode, orderCode, fillCode]);

/** Where something happens in the app: a file, a class, the network or the database (REQ-27). */
const traceLocation = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id en minúsculas, números y guiones"),
  label: text,
  kind: z.enum(["file", "class", "network", "db"]),
});

/**
 * «¿Dónde ocurre?» walkthrough (REQ-27): chronological events, one decision per screen.
 */
const traceStep = z
  .object({
    kind: z.literal("trace"),
    stage,
    title: text,
    intro: text,
    locations: z.array(traceLocation).min(3, "necesita al menos 3 lugares"),
    events: z
      .array(
        z.object({
          moment: text,
          description: text,
          options: z.array(z.string()).min(3, "entre 3 y 4 opciones").max(4, "entre 3 y 4 opciones"),
          answer: z.string(),
          /** Why each wrong option is not the place. */
          why: z.record(z.string(), text),
          explanation: text,
          code: z
            .object({ language: z.enum(["java", "sql", "properties"]), source: text })
            .optional(),
        })
      )
      .min(3, "necesita al menos 3 eventos"),
  })
  .superRefine((step, ctx) => {
    const ids = new Set(step.locations.map((l) => l.id));
    step.events.forEach((event, i) => {
      for (const option of event.options) {
        if (!ids.has(option)) ctx.addIssue({ code: "custom", path: ["events", i, "options"], message: `lugar desconocido: ${option}` });
      }
      if (!event.options.includes(event.answer)) {
        ctx.addIssue({ code: "custom", path: ["events", i, "answer"], message: "la respuesta debe estar entre las opciones" });
      }
      for (const option of event.options) {
        if (option !== event.answer && !event.why[option]) {
          ctx.addIssue({ code: "custom", path: ["events", i, "why"], message: `falta explicar por qué no es ${option}` });
        }
      }
    });
  });

/** Scored quiz (REQ-29). Correct answers stay on the server; see toPublicQuiz. */
const quizStep = z
  .object({
    kind: z.literal("quiz"),
    stage: z.literal("quiz"),
    title: text.optional(),
    questions: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/, "id en minúsculas, números y guiones"),
          context: questionContext,
          prompt: text,
          options: z
            .array(choice)
            .min(2, "necesita al menos 2 opciones")
            .refine(exactlyOneCorrect, "debe tener exactamente una opción correcta")
            .superRefine(balancedChoices),
        })
      )
      .min(3, "entre 3 y 8 preguntas")
      .max(8, "entre 3 y 8 preguntas"),
  })
  .refine((step) => new Set(step.questions.map((q) => q.id)).size === step.questions.length, {
    message: "los id de las preguntas deben ser únicos",
    path: ["questions"],
  });

export const stepSchema = z.union([textStep, visualStep, questionStep, codeStep, traceStep, quizStep]);

export const lessonSchema = z
  .object({
    id: z.string().regex(/^s[12]-m\d+-[a-z0-9-]+$/, "formato esperado s<sesión>-m<módulo>-<slug>"),
    session: z.union([z.literal(1), z.literal(2)]),
    module: z.number().int().min(1).max(8),
    /** Curiosity-hook title (Gurwi pattern). */
    title: text,
    summary: text,
    estimatedMinutes: z.number().int().positive(),
    /** Self-study module, e.g. Spring Boot (REQ-06 CA3). */
    optional: z.boolean().optional(),
    source: z.object({ label: text, url: z.url("debe ser una URL válida") }),
    steps: z.array(stepSchema).min(1, "necesita al menos 1 paso"),
  })
  .superRefine((lesson, ctx) => {
    // Stages must move forward: Teoría → Práctica → Quiz (constitution P6, REQ-26).
    let last = -1;
    lesson.steps.forEach((step, index) => {
      const position = stages.indexOf(step.stage);
      if (position < last) {
        ctx.addIssue({
          code: "custom",
          path: ["steps", index, "stage"],
          message: `la etapa "${step.stage}" no puede ir después de "${stages[last]}"`,
        });
      }
      last = Math.max(last, position);
    });
    // Core lessons must cover the three stages (REQ-26 CA1).
    if (!lesson.optional) {
      const covered = new Set(lesson.steps.map((step) => step.stage));
      const missing = stages.filter((s) => !covered.has(s));
      if (missing.length > 0) {
        ctx.addIssue({ code: "custom", path: ["steps"], message: `faltan las etapas: ${missing.join(", ")}` });
      }
    }
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Stage = (typeof stages)[number];
export type Engine = (typeof engines)[number];
