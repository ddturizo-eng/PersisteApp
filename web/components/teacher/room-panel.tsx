"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Download, Maximize2, ShieldAlert, Trash2, TriangleAlert, X } from "lucide-react";
import { cn } from "cn";
import { closeQuiz, closeRoom, deleteParticipant, openQuiz, rehabilitate, reopenRoom } from "@/app/actions/teacher";
import { InlineText } from "@/components/lesson/inline-text";
import { phaseLabels } from "@/components/teacher/labels";
import { Button } from "@/components/ui/button";
import type { RoomReport, StudentRow } from "@/lib/report";
import { roomTitle } from "@/lib/room";
import type { RoomSummary } from "@/lib/teacher-data";

const tabs = [
  { id: "live", label: "En vivo" },
  { id: "questions", label: "Por pregunta" },
  { id: "students", label: "Por estudiante" },
  { id: "project", label: "Proyectar" },
] as const;
type Tab = (typeof tabs)[number]["id"];

const LETTERS = "ABCDEFGH";
const decimal = (n: number) => n.toFixed(1).replace(".", ",");

/** Runs a server action and keeps the button disabled meanwhile. */
function useAction() {
  const [pending, start] = useTransition();
  return { pending, run: (fn: () => Promise<unknown>) => start(async () => void (await fn())) };
}

export function RoomPanel({ room, report }: { room: RoomSummary; report: RoomReport }) {
  const [tab, setTab] = useState<Tab>("live");
  const { pending, run } = useAction();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{roomTitle(room.label)}</h1>
          <p className="text-muted-foreground">
            {room.participants} {room.participants === 1 ? "participante" : "participantes"} ·{" "}
            {room.closed ? "Sala cerrada" : phaseLabels[room.phase]}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary px-5 py-3 text-secondary-foreground">
          <p className="text-xs font-medium">Código de la sala</p>
          <p className="font-mono text-4xl font-semibold tracking-[0.25em] sm:text-5xl">{room.code}</p>
        </div>
      </header>

      <section aria-label="Controles" className="flex flex-wrap items-center gap-3">
        {room.phase !== "open" ? (
          <Button isDisabled={pending || room.closed} onPress={() => run(() => openQuiz(room.id))}>
            {room.phase === "closed" ? "Reabrir quiz" : "Abrir quiz"}
          </Button>
        ) : (
          <Button
            isDisabled={pending}
            onPress={() => {
              if (window.confirm("¿Cerrar el quiz? Los estudiantes verán sus resultados y las explicaciones, y ya no podrán responder.")) {
                run(() => closeQuiz(room.id));
              }
            }}
          >
            Cerrar quiz y mostrar resultados
          </Button>
        )}
        <a
          href={`/docente/${room.code}/csv`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Download aria-hidden="true" className="size-4" />
          Descargar CSV
        </a>
        {room.closed ? (
          <Button variant="outline" isDisabled={pending} onPress={() => run(() => reopenRoom(room.id))}>
            Reabrir sala
          </Button>
        ) : (
          <Button
            variant="outline"
            isDisabled={pending}
            onPress={() => {
              if (window.confirm("¿Cerrar la sala? Nadie más podrá entrar ni responder.")) run(() => closeRoom(room.id));
            }}
          >
            Cerrar sala
          </Button>
        )}
      </section>

      <div role="tablist" aria-label="Reportes" className="relative flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "live" && <LiveTable report={report} pending={pending} run={run} />}
        {tab === "questions" && <QuestionsView report={report} />}
        {tab === "students" && <StudentsView report={report} />}
        {tab === "project" && <ProjectView report={report} room={room} />}
      </section>
    </div>
  );
}

function Empty() {
  return <p className="text-muted-foreground">Aún no hay participantes. Proyecta el código para que entren.</p>;
}

/** En vivo (REQ-31 CA2, REQ-30 CA2, REQ-35 CA4). */
function LiveTable({ report, pending, run }: { report: RoomReport; pending: boolean; run: (fn: () => Promise<unknown>) => void }) {
  if (report.students.length === 0) return <Empty />;
  return (
    <div className="relative overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Puesto</th>
            <th scope="col" className="px-3 py-2 font-medium">Estudiante</th>
            <th scope="col" className="px-3 py-2 font-medium">Respondidas</th>
            <th scope="col" className="px-3 py-2 font-medium">Aciertos</th>
            <th scope="col" className="px-3 py-2 font-medium">Nota</th>
            <th scope="col" className="px-3 py-2 font-medium">Tiempo en aciertos</th>
            <th scope="col" className="px-3 py-2 font-medium">Salidas</th>
            <th scope="col" className="px-3 py-2 font-medium"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {report.students.map((s) => (
            <tr key={s.id} className={cn("border-t", s.position <= 3 && s.correct > 0 && "bg-secondary/40")}>
              <td className="px-3 py-2 font-semibold tabular-nums">{s.position}</td>
              <td className="px-3 py-2">
                <span className="block font-medium">{s.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{s.document}</span>
              </td>
              <td className="px-3 py-2 tabular-nums">
                {s.answered} de {report.total}
              </td>
              <td className="px-3 py-2 tabular-nums">{s.correct}</td>
              <td className="px-3 py-2 font-semibold tabular-nums">{decimal(s.grade)}</td>
              <td className="px-3 py-2 tabular-nums">{Math.round(s.correctSeconds)} s</td>
              <td className="px-3 py-2">
                {s.blocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                    <ShieldAlert aria-hidden="true" className="size-3.5" />
                    Bloqueado ({s.exits} salidas)
                  </span>
                ) : s.exits > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sun px-2 py-0.5 text-xs font-medium text-sun-foreground">
                    <TriangleAlert aria-hidden="true" className="size-3.5" />
                    {s.exits} {s.exits === 1 ? "salida" : "salidas"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-2">
                  {s.blocked && (
                    <Button size="sm" isDisabled={pending} onPress={() => run(() => rehabilitate(s.id))}>
                      Rehabilitar
                    </Button>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Eliminar a ${s.name}`}
                    isDisabled={pending}
                    onPress={() => {
                      if (window.confirm(`¿Eliminar a ${s.name} y todas sus respuestas?`)) run(() => deleteParticipant(s.id));
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Por pregunta (REQ-31 CA3, CA4): who chose each option, hard questions flagged. */
function QuestionsView({ report }: { report: RoomReport }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ol className="space-y-4">
      {report.questions.map((q, i) => (
        <li key={q.id} className={cn("space-y-3 rounded-2xl border p-4", q.hard && "border-destructive/50")}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">
              {i + 1}. <InlineText text={q.prompt} />
            </p>
            <p className="text-sm tabular-nums text-muted-foreground">
              Módulo {q.module} · {q.percent === null ? "sin respuestas" : `${q.percent} % de aciertos`}
              {q.averageSeconds !== null && ` · ${Math.round(q.averageSeconds)} s en promedio`}
              {q.timedOut > 0 && ` · ${q.timedOut} sin tiempo`}
            </p>
          </div>
          {q.hard && (
            <p className="flex items-center gap-2 text-sm font-medium text-danger">
              <TriangleAlert aria-hidden="true" className="size-4" />
              Menos de la mitad acertó: conviene repasarla.
            </p>
          )}
          <ul role="list" className="space-y-2">
            {q.options.map((o, index) => {
              const key = `${q.id}-${index}`;
              const share = q.answered ? (o.students.length / q.answered) * 100 : 0;
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-expanded={open === key}
                    onClick={() => setOpen(open === key ? null : key)}
                    className="relative w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span aria-hidden="true" className={cn("absolute inset-y-0 left-0", o.correct ? "bg-success-soft" : "bg-muted")} style={{ width: `${share}%` }} />
                    <span className="relative flex items-center justify-between gap-3">
                      <span className="flex items-start gap-2">
                        <span className="font-semibold">{LETTERS[index]}.</span>
                        <InlineText text={o.text} />
                        {o.correct && <Check aria-label="correcta" className="mt-0.5 size-4 shrink-0 text-success" />}
                      </span>
                      <span className="shrink-0 tabular-nums">{o.students.length}</span>
                    </span>
                  </button>
                  {open === key && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      {o.students.length ? o.students.join(", ") : "Nadie eligió esta opción."}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

/** Por estudiante (REQ-31 CA5). */
function StudentsView({ report }: { report: RoomReport }) {
  const [selected, setSelected] = useState<string | null>(report.students[0]?.id ?? null);
  if (report.students.length === 0) return <Empty />;
  const student = report.students.find((s) => s.id === selected) ?? report.students[0];
  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <ul role="list" className="space-y-1">
        {report.students.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              aria-current={s.id === student.id}
              onClick={() => setSelected(s.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                s.id === student.id ? "bg-secondary font-medium" : "hover:bg-muted"
              )}
            >
              <span>{s.name}</span>
              <span className="tabular-nums">{decimal(s.grade)}</span>
            </button>
          </li>
        ))}
      </ul>
      <StudentDetail student={student} report={report} />
    </div>
  );
}

function StudentDetail({ student, report }: { student: StudentRow; report: RoomReport }) {
  return (
    <div className="space-y-3">
      <p className="font-semibold">
        {student.name} · nota {decimal(student.grade)} · {student.correct} de {report.total}
      </p>
      <ol className="space-y-2">
        {report.questions.map((q, i) => {
          const a = student.answers.find((x) => x.questionId === q.id);
          return (
            <li key={q.id} className="flex items-start gap-3 rounded-xl border px-3 py-2 text-sm">
              {!a ? (
                <span className="mt-0.5 size-4 shrink-0 rounded-full border" aria-label="sin responder" />
              ) : a.correct ? (
                <Check aria-label="correcta" className="mt-0.5 size-4 shrink-0 text-success" />
              ) : a.timedOut ? (
                <Clock aria-label="se acabó el tiempo" className="mt-0.5 size-4 shrink-0 text-danger" />
              ) : (
                <X aria-label="incorrecta" className="mt-0.5 size-4 shrink-0 text-danger" />
              )}
              <span className="flex-1">
                {i + 1}. <InlineText text={q.prompt} />
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {a ? `${a.option === null ? "—" : LETTERS[a.option]} · ${Math.round(a.seconds)} s` : "pendiente"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Projected top 10 with first name and initial, never the document (REQ-30 CA3). */
function ProjectView({ report, room }: { report: RoomReport; room: RoomSummary }) {
  const top = report.students.filter((s) => s.correct > 0).slice(0, 10);
  function fullscreen() {
    document.getElementById("ranking-proyectado")?.requestFullscreen?.().catch(() => {});
  }
  return (
    <div className="space-y-4">
      <Button variant="outline" onPress={fullscreen}>
        <Maximize2 data-icon="inline-start" aria-hidden="true" />
        Pantalla completa
      </Button>
      <div id="ranking-proyectado" className="space-y-6 rounded-3xl bg-background p-6 sm:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Ranking · {roomTitle(room.label)}</h2>
          <p className="font-mono text-2xl tracking-[0.25em] text-muted-foreground">{room.code}</p>
        </div>
        {top.length === 0 ? (
          <p className="text-2xl text-muted-foreground">Esperando los primeros aciertos…</p>
        ) : (
          <ol className="space-y-3">
            {top.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-5 py-3 text-2xl sm:text-3xl",
                  s.position === 1 ? "bg-sun text-sun-foreground" : s.position <= 3 ? "bg-secondary text-secondary-foreground" : "bg-muted"
                )}
              >
                <span className="w-12 font-semibold tabular-nums">{s.position}</span>
                <span className="flex-1 font-medium">{s.short}</span>
                <span className="tabular-nums">
                  {s.correct}/{report.total}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
