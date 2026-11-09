import type { Ref } from "react";
import Link from "next/link";
import { ArrowRight, Check, Star } from "lucide-react";
import type { Lesson } from "@/lib/lesson-schema";
import type { NextStop } from "@/components/lesson/lesson-player";

const REPO_URL = "https://github.com/ddturizo-eng/PersisteApp";

/**
 * Closing screen of a module: says clearly that the module ended, recalls what it covered and
 * announces what comes next, so moving to another module never feels like an endless lesson.
 */
export function ModuleDone({
  lesson,
  next,
  headingRef,
}: {
  lesson: Lesson;
  next: NextStop;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const upcoming = next.upcoming;
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <div
        aria-hidden="true"
        className="mx-auto grid size-20 place-items-center rounded-full border-2 border-foreground bg-primary text-primary-foreground animate-in zoom-in-50 fade-in duration-500 exposition:size-24"
      >
        <Check className="size-10" strokeWidth={3} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {upcoming ? `Módulo ${lesson.module} terminado` : "Sesión terminada"}
        </p>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance outline-none sm:text-3xl">
          {upcoming ? "¡Bien hecho! Continuamos en el siguiente módulo" : "¡Terminaste los 6 módulos!"}
        </h2>
      </div>

      <div className="rounded-3xl border-2 border-foreground bg-card p-5 text-left">
        <p className="text-sm font-semibold text-muted-foreground">Lo que viste en «{lesson.title}»</p>
        <p className="mt-2 text-lg leading-relaxed">{lesson.summary}</p>
      </div>

      {upcoming ? (
        <Link
          href={next.href}
          className="flex items-center gap-4 rounded-3xl border-2 border-foreground bg-sun/40 p-5 text-left outline-none transition-colors hover:bg-sun/60 focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-foreground bg-background text-xl font-bold"
          >
            {upcoming.module}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-muted-foreground">
              Sigue · Módulo {upcoming.module} · {upcoming.minutes} min
            </p>
            <p className="text-lg font-semibold text-balance">{upcoming.title}</p>
          </div>
          <ArrowRight aria-hidden="true" className="hidden size-6 shrink-0 sm:block" />
        </Link>
      ) : (
        <div className="rounded-3xl border-2 border-foreground bg-sun/40 p-5 text-left">
          <p className="text-lg leading-relaxed">
            Ya sabes qué es una base de datos, cómo hablarle con SQL y cómo Java llega a ella sin ORM.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 font-semibold underline underline-offset-4"
          >
            <Star aria-hidden="true" className="size-4" /> Dale una estrella al proyecto en GitHub
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </div>
      )}
    </div>
  );
}
