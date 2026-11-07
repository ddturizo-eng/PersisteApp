import { Suspense } from "react";
import type { Metadata } from "next";
import { JoinRoomForm } from "@/components/join-room-form";
import { LiveQuiz } from "@/components/quiz/live-quiz";
import { AutoRefresh, BlockedNotice, PracticeQuiz, QuizResult, QuizRules } from "@/components/quiz/quiz-screens";
import { loadQuiz } from "@/lib/content";
import { getCurrentParticipant } from "@/lib/participant";
import { practiceQuiz, toPublicQuiz } from "@/lib/quiz";
import { loadLiveState } from "@/lib/quiz-room";
import { displayName, maskDocument, roomTitle } from "@/lib/room";
import { roomsEnabled } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Prepárate para el quiz · PersisteApp",
  description: "Quiz final de la sesión 1: diez preguntas con nota de 0 a 5.",
};

/**
 * «Prepárate para el quiz» and the final quiz of session 1 (REQ-29, REQ-34, REQ-35; design §12.5).
 * The participant cookie decides the screen, so it streams inside Suspense (Cache Components).
 */
export default function FinalQuizPage() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy="true" />}>
      <QuizGate />
    </Suspense>
  );
}

function Shell({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-lesson flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-prose space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Sesión 1 · Quiz final</p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          {lead && <p className="text-lg text-muted-foreground">{lead}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}

async function QuizGate() {
  const quiz = loadQuiz(1);
  const publicQuiz = toPublicQuiz(quiz);
  const minutes = Math.round(publicQuiz.questions.reduce((sum, q) => sum + q.seconds, 0) / 60);
  const rules = <QuizRules questions={quiz.questions.length} minutes={minutes} />;
  const participant = roomsEnabled() ? await getCurrentParticipant() : null;

  if (!participant) {
    return (
      <Shell title="Prepárate para el quiz" lead="Entra a la sala de tu grupo con el código que proyecta el docente.">
        {rules}
        {roomsEnabled() && (
          <section aria-labelledby="entrar" className="space-y-4 rounded-2xl border p-5">
            <h2 id="entrar" className="text-xl font-semibold">
              Entrar a la sala
            </h2>
            <JoinRoomForm />
          </section>
        )}
        <section aria-labelledby="practica" className="space-y-3">
          <h2 id="practica" className="font-semibold">
            ¿Quieres conocer la mecánica antes?
          </h2>
          <p className="text-muted-foreground">
            Haz el calentamiento: {quiz.practice.length} preguntas sencillas, distintas a las del quiz. Ves la explicación al
            instante y no cuenta para la nota.
          </p>
          <PracticeQuiz quiz={toPublicQuiz(practiceQuiz(quiz))} />
        </section>
      </Shell>
    );
  }

  const state = await loadLiveState(participant, quiz);
  const greeting = `${roomTitle(participant.room.label)} · ${displayName(participant.name)}`;

  if (state.status === "unavailable") {
    return (
      <Shell title="Prepárate para el quiz" lead={greeting}>
        <p role="alert" className="rounded-2xl bg-danger-soft p-4">
          {state.message}
        </p>
        {rules}
      </Shell>
    );
  }

  if (state.result) {
    const waitingClose = state.result.provisional;
    return (
      <Shell title={waitingClose ? "¡Terminaste el quiz!" : "Resultado del quiz"} lead={greeting}>
        <QuizResult result={state.result} />
        {waitingClose && <AutoRefresh />}
      </Shell>
    );
  }

  if (state.roomClosed) {
    return (
      <Shell title="La sala está cerrada" lead={greeting}>
        <p>El docente cerró esta sala, así que el quiz ya no recibe respuestas.</p>
      </Shell>
    );
  }

  if (state.phase === "waiting") {
    return (
      <Shell title="Prepárate para el quiz" lead={greeting}>
        <p aria-live="polite" className="rounded-2xl bg-secondary p-4 font-medium text-secondary-foreground">
          Esperando a que el docente abra el quiz. Esta página se actualiza sola.
        </p>
        {rules}
        <AutoRefresh />
      </Shell>
    );
  }

  if (state.blocked) {
    return (
      <Shell title="Quiz bloqueado" lead={greeting}>
        <BlockedNotice />
        <AutoRefresh />
      </Shell>
    );
  }

  return (
    <>
      <LiveQuiz
        order={state.order}
        answered={state.answered}
        exits={state.exits}
        watermark={`${participant.name} · ${maskDocument(participant.studentCode)}`}
      />
      {/* Picks up the teacher closing the quiz, or a block, while a question is on screen. */}
      <AutoRefresh />
    </>
  );
}
