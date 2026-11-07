import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { leaveRoom } from "@/app/actions/room";
import { JoinRoomForm } from "@/components/join-room-form";
import { getCurrentParticipant } from "@/lib/participant";
import { maskDocument, shortName } from "@/lib/room";
import { site } from "@/lib/site";
import { roomsEnabled } from "@/lib/supabase-server";

export const metadata: Metadata = { title: `Entrar a una sala · ${site.name}` };

/** /sala: join the group's room to score in the quiz ranking (REQ-28). */
export default function RoomPage() {
  return (
    <main className="mx-auto w-full max-w-lesson flex-1 px-4 py-12 sm:px-6">
      <div className="max-w-md space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Entrar a una sala</h1>
          <p className="text-lg text-muted-foreground">
            Con sala, tus respuestas del quiz cuentan para el ranking de tu grupo. Sin sala, practicas igual pero sin puntaje.
          </p>
        </header>
        {roomsEnabled() ? (
          <Suspense fallback={<p className="text-muted-foreground">Buscando tu sala…</p>}>
            <RoomContent />
          </Suspense>
        ) : (
          <p className="rounded-lg border px-4 py-3">
            Las salas no están disponibles en este momento. Puedes seguir las lecciones en modo práctica.{" "}
            <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
              Ir a las lecciones
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

async function RoomContent() {
  const participant = await getCurrentParticipant();
  if (!participant) return <JoinRoomForm />;

  return (
    <div className="space-y-8">
      <section aria-labelledby="sala-actual" className="space-y-4 rounded-lg border p-4">
        <h2 id="sala-actual" className="font-semibold">
          Ya estás en la sala {participant.room.label}
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Código</dt>
          <dd className="font-mono tracking-widest">{participant.room.code}</dd>
          <dt className="text-muted-foreground">En el ranking</dt>
          <dd>{shortName(participant.name)}</dd>
          <dt className="text-muted-foreground">Documento</dt>
          <dd className="font-mono">{maskDocument(participant.studentCode)}</dd>
        </dl>
        {participant.room.closed && <p className="text-sm">El docente cerró esta sala: tus respuestas ya no suman puntos.</p>}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ir a las lecciones
          </Link>
          <form action={leaveRoom}>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Salir de la sala
            </button>
          </form>
        </div>
      </section>
      <section aria-labelledby="otra-sala" className="space-y-4">
        <h2 id="otra-sala" className="font-semibold">
          Entrar a otra sala
        </h2>
        <JoinRoomForm />
      </section>
    </div>
  );
}
