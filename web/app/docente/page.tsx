import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Activity, DoorOpen, ShieldCheck, Trophy } from "lucide-react";
import { CreateRoomForm, TeacherLoginForm } from "@/components/teacher/forms";
import { LogoutButton } from "@/components/teacher/logout-button";
import { phaseLabels } from "@/components/teacher/labels";
import { roomTitle } from "@/lib/room";
import { site } from "@/lib/site";
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

const features = [
  { icon: DoorOpen, text: "Abre y cierra el quiz para tu sala: todos empiezan a la vez." },
  { icon: Activity, text: "Sigue el avance en vivo, las salidas de pestaña y rehabilita a quien lo necesite." },
  { icon: Trophy, text: "Proyecta el ranking y descarga las notas de 0 a 5 en CSV." },
];

/** Passcode screen with the UPC identity of the landing (REQ-31, REQ-33). */
function TeacherLogin() {
  return (
    <div className="grid overflow-hidden rounded-[2rem] border bg-card shadow-sm lg:grid-cols-[1.1fr_1fr]">
      <section aria-label={`${site.course} · ${site.institution}`} className="relative isolate overflow-hidden text-[oklch(0.98_0.01_110)]">
        <Image src="/campus-pasillo.jpg" alt="" fill priority sizes="(min-width: 1024px) 560px, 100vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[oklch(0.22_0.035_160/0.82)]" />
        <div className="flex h-full flex-col gap-8 p-7 sm:p-10">
          <div className="flex items-center gap-3">
            <Image src="/logos/unicesar-dark.png" alt={site.institution} width={1000} height={369} className="h-9 w-auto" />
            <span aria-hidden="true" className="h-8 w-px bg-white/30" />
            <Image src="/logos/ingesistemas.png" alt={`Programa de ${site.program}`} width={600} height={619} className="h-10 w-auto" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium tracking-wide text-balance text-sun uppercase">{site.course}</p>
            <p className="max-w-sm text-2xl leading-snug font-semibold text-balance sm:text-3xl">
              Tu clase en vivo: quiz, ranking y notas en un solo lugar.
            </p>
          </div>
          <ul role="list" className="hidden space-y-4 sm:block">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/12">
                  <Icon className="size-4 text-sun" />
                </span>
                <span className="pt-1.5 leading-relaxed text-white/90">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-auto text-sm text-white/70">
            {site.teacher.title} {site.teacher.name}
          </p>
        </div>
      </section>

      <section aria-labelledby="acceso" className="flex flex-col justify-center gap-8 p-7 sm:p-10 lg:p-12">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Acceso solo para el docente
          </span>
          <h1 id="acceso" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Panel docente
          </h1>
          <p className="text-muted-foreground">Entra con la clave de la asignatura para administrar las salas de tu grupo.</p>
        </div>
        <TeacherLoginForm />
        <p className="border-t pt-5 text-sm text-muted-foreground">
          ¿Eres estudiante?{" "}
          <Link href="/s1/quiz" className="font-medium text-primary underline-offset-4 hover:underline">
            Ve a «Prepárate para el quiz»
          </Link>
        </p>
      </section>
    </div>
  );
}

async function TeacherHome() {
  if (!teacherEnabled() || !roomsEnabled()) {
    return <p className="rounded-lg border p-4">El panel docente no está configurado en este servidor.</p>;
  }
  if (!(await isTeacher())) return <TeacherLogin />;

  const rooms = await listRooms();
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {site.teacher.title} {site.teacher.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Panel docente</h1>
        </div>
        <LogoutButton />
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
