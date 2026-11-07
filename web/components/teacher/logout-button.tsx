"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { teacherLogout } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";

function Submit({ compact }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size={compact ? "sm" : "default"}
      isDisabled={pending}
      className="rounded-full hover:border-destructive/40 hover:bg-danger-soft hover:text-destructive"
    >
      <LogOut data-icon="inline-start" aria-hidden="true" />
      {pending ? "Cerrando…" : "Cerrar sesión"}
    </Button>
  );
}

/** Ends the teacher session on this browser (deletes the pa_teacher cookie). */
export function LogoutButton({ compact }: { compact?: boolean }) {
  return (
    <form action={teacherLogout}>
      <Submit compact={compact} />
    </form>
  );
}
