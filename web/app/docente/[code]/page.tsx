import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AutoRefresh } from "@/components/quiz/quiz-screens";
import { RoomPanel } from "@/components/teacher/room-panel";
import { loadRoom } from "@/lib/teacher-data";
import { isTeacher } from "@/lib/teacher";

export const metadata: Metadata = { title: "Sala · Panel docente · PersisteApp", robots: { index: false } };

/** One room: code to project, quiz controls and reports, refreshed every 5 s (REQ-31). */
export default function TeacherRoomPage({ params }: PageProps<"/docente/[code]">) {
  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/docente" className="rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        ← Todas las salas
      </Link>
      <div className="mt-6">
        <Suspense fallback={<p className="text-muted-foreground">Cargando la sala…</p>}>
          <Room params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Room({ params }: Pick<PageProps<"/docente/[code]">, "params">) {
  if (!(await isTeacher())) redirect("/docente");
  const detail = await loadRoom((await params).code.toUpperCase());
  if (!detail) notFound();
  return (
    <>
      <RoomPanel room={detail.room} report={detail.report} />
      <AutoRefresh />
    </>
  );
}
