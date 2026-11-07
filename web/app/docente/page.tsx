import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { teacherLogout } from "@/app/actions/teacher";
import { CreateRoomForm, TeacherLoginForm } from "@/components/teacher/forms";
import { phaseLabels } from "@/components/teacher/labels";
import { roomTitle } from "@/lib/room";
import { listRooms } from "@/lib/teacher-data";
import { isTeacher, teacherEnabled } from "@/lib/teacher";
import { roomsEnabled } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Panel docente · PersisteApp", robots: { index: false } };

/** /docente: passcode, rooms and a new room (REQ-28, REQ-31 CA1). */
export default function TeacherPage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <TeacherHome />
      </Suspense>
    </main>
  );
}

async function TeacherHome() {
  if (!teacherEnabled() || !roomsEnabled()) {
    return <p className="rounded-lg border p-4">El panel docente no está configurado en este servidor.</p>;
  }
  if (!(await isTeacher())) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Panel docente</h1>
        <TeacherLoginForm />
      </div>
    );
  }

  const rooms = await listRooms();
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Panel docente</h1>
        <form action={teacherLogout}>
          <button type="submit" className="rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Cerrar sesión
          </button>
        </form>
      </header>

      <section aria-labelledby="nueva" className="space-y-4 rounded-2xl border p-5">
        <h2 id="nueva" className="text-xl font-semibold">
          Nueva sala
        </h2>
        <CreateRoomForm />
      </section>

      <section aria-labelledby="salas" className="space-y-4">
        <h2 id="salas" className="text-xl font-semibold">
          Salas
        </h2>
        {!rooms ? (
          <p role="alert">No se pudieron leer las salas.</p>
        ) : rooms.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay salas. Crea una para tu grupo.</p>
        ) : (
          <ul role="list" className="grid gap-3 sm:grid-cols-2">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/docente/${room.code}`}
                  className="flex h-full flex-col gap-2 rounded-2xl border-2 p-4 outline-none transition-colors hover:border-foreground/50 focus-visible:ring-4 focus-visible:ring-ring/40"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{roomTitle(room.label)}</span>
                    <span className="font-mono text-lg tracking-[0.2em]">{room.code}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {room.participants} {room.participants === 1 ? "participante" : "participantes"} ·{" "}
                    {room.closed ? "Sala cerrada" : phaseLabels[room.phase]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
