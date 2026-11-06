"use client";

import { useActionState, useId } from "react";
import { cn } from "cn";
import { joinRoom } from "@/app/actions/room";
import { ROOM_CODE_LENGTH, type JoinRoomField, type JoinRoomState } from "@/lib/room";

const initial: JoinRoomState = { status: "idle" };

const fields: {
  name: JoinRoomField;
  label: string;
  help: string;
  autoComplete: string;
  inputMode?: "text" | "numeric";
  maxLength: number;
  mono?: boolean;
}[] = [
  {
    name: "code",
    label: "Código de la sala",
    help: "Los 6 caracteres que proyecta el docente.",
    autoComplete: "off",
    maxLength: ROOM_CODE_LENGTH + 1,
    mono: true,
  },
  { name: "name", label: "Nombre y apellido", help: "En el ranking apareces con tu nombre y una inicial, por ejemplo «Daniel T.».", autoComplete: "name", maxLength: 60 },
  {
    name: "studentCode",
    label: "Código estudiantil",
    help: "Si vuelves a entrar con el mismo código, conservas tus puntos.",
    autoComplete: "off",
    maxLength: 20,
  },
];

/** Join form for /sala (REQ-28 CA1). Validation runs on the server; errors are announced. */
export function JoinRoomForm() {
  const [state, formAction, pending] = useActionState(joinRoom, initial);
  const id = useId();
  const error = state.status === "error" ? state : null;

  return (
    <form action={formAction} noValidate className="space-y-5" aria-describedby={error ? `${id}-error` : undefined}>
      {fields.map((field) => {
        const fieldError = error?.fields?.[field.name];
        const inputId = `${id}-${field.name}`;
        return (
          <div key={field.name} className="space-y-1.5">
            <label htmlFor={inputId} className="block font-medium">
              {field.label}
            </label>
            <input
              id={inputId}
              name={field.name}
              required
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              maxLength={field.maxLength}
              spellCheck={false}
              autoCapitalize={field.name === "code" ? "characters" : field.name === "name" ? "words" : "none"}
              defaultValue={error?.values[field.name]}
              // A new key re-applies defaultValue after each failed attempt.
              key={error ? `${field.name}-${error.values[field.name]}` : field.name}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={`${inputId}-help${fieldError ? ` ${inputId}-error` : ""}`}
              className={cn(
                "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
                field.mono && "font-mono tracking-[0.3em] uppercase"
              )}
            />
            <p id={`${inputId}-help`} className="text-sm text-muted-foreground">
              {field.help}
            </p>
            {fieldError && (
              <p id={`${inputId}-error`} className="text-sm font-medium text-destructive">
                {fieldError}
              </p>
            )}
          </div>
        );
      })}

      <div aria-live="polite">
        {error && (
          <p id={`${id}-error`} role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            {error.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar a la sala"}
      </button>
    </form>
  );
}
