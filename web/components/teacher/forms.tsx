"use client";

import { useActionState, useId, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { cn } from "cn";
import { createRoom, teacherLogin, type FormState } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";

const idle: FormState = { status: "idle" };
const inputClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

/** Teacher passcode (REQ-31). The server compares it in constant time. */
export function TeacherLoginForm() {
  const [state, action, pending] = useActionState(teacherLogin, idle);
  const [visible, setVisible] = useState(false);
  const id = useId();
  const error = state.status === "error" ? state.message : null;
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor={id} className="block font-medium">
          Clave del docente
        </label>
        <div className="relative">
          <LockKeyhole aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={id}
            name="passcode"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : `${id}-help`}
            className={cn(inputClass, "h-12 rounded-xl pr-12 pl-10")}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "Ocultar la clave" : "Mostrar la clave"}
            className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
            {error} Revísala e inténtalo de nuevo.
          </p>
        ) : (
          <p id={`${id}-help`} className="text-sm text-muted-foreground">
            La sesión dura 12 horas en este navegador.
          </p>
        )}
      </div>
      <Button type="submit" size="lg" isDisabled={pending} className="w-full rounded-xl">
        {pending ? "Entrando…" : "Entrar al panel"}
        {!pending && <ArrowRight data-icon="inline-end" aria-hidden="true" />}
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
