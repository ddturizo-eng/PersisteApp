import Link from "next/link";
import { lessonsForSession } from "@/lib/content";
import { site } from "@/lib/site";

/** Provisional home: course index without styling polish (full home in PA-22). */
export default function Home() {
  const lessons = lessonsForSession(1);

  return (
    <main className="mx-auto w-full max-w-lesson flex-1 px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">{site.name}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{site.tagline}</p>

      <section aria-labelledby="sesion-1" className="mt-12 space-y-4">
        <h2 id="sesion-1" className="text-xl font-semibold">
          Sesión 1 · De SELECT en el repositorio a una capa de datos bien hecha
        </h2>
        <ol className="divide-y rounded-lg border">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/s1/${lesson.id}`}
                className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-muted"
              >
                <span>
                  <span className="mr-2 text-sm text-muted-foreground tabular-nums">Módulo {lesson.module}</span>
                  {lesson.title}
                </span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {lesson.estimatedMinutes} min
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
