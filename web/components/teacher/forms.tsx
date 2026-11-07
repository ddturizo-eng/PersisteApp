"use client";

import { useActionState, useId } from "react";
import { createRoom, teacherLogin, type FormState } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";

const idle: FormState = { status: "idle" };
const inputClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

/** Teacher passcode (REQ-31). The server compares it in constant time. */
export function TeacherLoginForm() {
  const [state, action, pending] = useActionState(teacherLogin, idle);
  const id = useId();
  const error = state.status === "error" ? state.message : null;
  return (
    <form action={action} className="max-w-sm space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={id} className="block font-medium">
          Clave del docente
        </label>
        <input
          id={id}
          name="passcode"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClass}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" isDisabled={pending}>
        {pending ? "Entrando…" : "Entrar al panel"}
      </Button>
    </form>
  );
}

/** New room with a 6-character code (REQ-28 CA1). */
export function CreateRoomForm() {
  const [state, action, pending] = useActionState(createRoom, idle);
  const id = useId();
  const error = state.status === "error" ? state.message : null;
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <label htmlFor={id} className="block font-medium">
          Nombre de la sala
        </label>
        <input
          id={id}
          name="label"
          required
          maxLength={60}
          placeholder="Grupo 8:00"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClass}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" isDisabled={pending}>
        {pending ? "Creando…" : "Crear sala"}
      </Button>
    </form>
  );
}
