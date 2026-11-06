import { Suspense } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { getCurrentParticipant, getStanding } from "@/lib/participant";
import { shortName } from "@/lib/room";
import { roomsEnabled } from "@/lib/supabase-server";

const shell = "px-4 text-sm exposition:hidden sm:px-6";
const inner = "mx-auto flex min-h-10 w-full max-w-lesson items-center gap-3 rounded-xl bg-secondary px-4 py-2 text-secondary-foreground";

/**
 * Room bar under the header (design §11.4): «Sala Grupo 8:00 · Daniel T. · 3 aciertos · puesto 2 de 14».
 * Reads the participant cookie, so it streams inside Suspense (Cache Components).
 * Only shown once the student is in a room; hidden without Supabase (REQ-29 CA4).
 */
export function RoomBar() {
  if (!roomsEnabled()) return null;
  return (
    <Suspense fallback={<div aria-hidden="true" className="min-h-10 exposition:hidden" />}>
      <RoomBarContent />
    </Suspense>
  );
}

async function RoomBarContent() {
  const participant = await getCurrentParticipant();

  // Joining happens at «Prepárate para el quiz» (design §12.3): no invitation before that.
  if (!participant) return null;

  const standing = await getStanding(participant);
  const { room } = participant;

  return (
    <section aria-label="Tu sala" className={shell}>
      <div className={inner}>
        <Users aria-hidden="true" className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
        <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
          <span className="font-medium">Sala {room.label}</span>
          <span aria-hidden="true" className="text-muted-foreground">·</span>
          <span>{shortName(participant.name)}</span>
          {room.closed ? (
            <>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">sala cerrada: ya no suma puntos</span>
            </>
          ) : standing ? (
            <>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
              <span className="tabular-nums">
                {standing.score} {standing.score === 1 ? "acierto" : "aciertos"}
              </span>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
              <span className="tabular-nums">
                puesto {standing.position} de {standing.total}
              </span>
            </>
          ) : null}
        </p>
        <Link href="/sala" className="shrink-0 rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Cambiar<span className="sr-only sm:not-sr-only"> de sala</span>
        </Link>
      </div>
    </section>
  );
}
