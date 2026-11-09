import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Clock, PencilLine, Star } from "lucide-react";
import { cn } from "cn";
import SplitText from "@/components/bits/SplitText";
import TextType from "@/components/bits/TextType";
import Threads from "@/components/bits/Threads";
import { TableAnatomy } from "@/components/db/table-anatomy";
import { DoneBadge, ProgressSummary } from "@/components/progress";
import { Reveal } from "@/components/landing/reveal";
import { SystemMap } from "@/components/landing/system-map";
import { lessonsForSession } from "@/lib/content";
import { courseStops } from "@/lib/course";
import { site } from "@/lib/site";

const stopColors = ["bg-secondary", "bg-accent text-accent-foreground", "bg-sun text-sun-foreground"];

function Logos({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Image src="/logos/unicesar.png" alt={site.institution} width={1000} height={369} sizes="110px" className="h-10 w-auto dark:hidden" priority />
      <Image src="/logos/unicesar-dark.png" alt={site.institution} width={1000} height={369} sizes="110px" className="hidden h-10 w-auto dark:block" priority />
      <span aria-hidden="true" className="h-8 w-0.5 rounded-full bg-border" />
      <Image src="/logos/ingesistemas.png" alt={`Programa de ${site.program}`} width={600} height={620} sizes="44px" className="h-11 w-auto" priority />
    </div>
  );
}

/** GitHub mark (lucide-react 1.x dropped brand icons). */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function SectionHeading({ id, title, accent, children }: { id: string; title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl space-y-3">
      <h2 id={id} className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title} <span className="text-primary">{accent}</span>
      </h2>
      <p className="text-lg leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

/** Landing of session 1 (REQ-33): key concepts first, then the path through the class. */
export default function Home() {
  const stops = courseStops(lessonsForSession(1));
  const first = stops.find((s) => s.lessonId);
  const startHref = first?.lessonId ? `/s1/${first.lessonId}` : "#recorrido";
  const core = stops.filter((s) => !s.optional).length;

  return (
    <main className="flex-1">
      {/* Hero */}
      <section aria-labelledby="titulo" className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black_55%,transparent)] exposition:hidden">
          <Threads color="#1E7B34" amplitude={0.8} distance={0.2} enableMouseInteraction={false} />
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-12 lg:pb-24">
          <div className="space-y-7">
            <Logos />
            <ul className="flex flex-wrap gap-2 text-sm font-medium">
              <li className="rounded-full border-2 border-foreground bg-card px-3 py-1">{site.course}</li>
              <li className="rounded-full bg-sun px-3 py-1 text-sun-foreground">Sesión 1</li>
              <li className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground px-3 py-1">
                <BookOpen aria-hidden="true" className="size-3.5" /> {core} módulos de apoyo
              </li>
            </ul>
            <h1 id="titulo" className="text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-[4.25rem]">
              <SplitText tag="span" text="Entiende la base de datos" textAlign="left" splitType="words" trigger="load" delay={60} />{" "}
              <SplitText tag="span" text="y úsala desde Java" textAlign="left" splitType="words" trigger="load" delay={60} className="text-primary" />
            </h1>
            <TextType
              as="p"
              text="Qué es una base de datos y cómo la usa Java, sin ORM"
              loop={false}
              typingSpeed={45}
              initialDelay={700}
              showCursor
              cursorStyle="bar"
              className="font-mono text-lg text-muted-foreground"
            />
            <p className="max-w-xl text-lg leading-relaxed">
              Empieza con las tablas estudiante y matricula. Practica SQL y luego sigue el camino de una consulta hasta convertir una fila en un objeto Java. Seis módulos para aprender a tu ritmo, sin nota.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={startHref}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-4 focus-visible:ring-ring/40"
              >
                Empezar por el módulo 1 <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a
                href="#conceptos"
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-foreground px-6 font-medium outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40"
              >
                Ver los conceptos <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            </div>
            <dl className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <dt className="shrink-0">Docente:</dt>
                <dd>{site.teacher.title} {site.teacher.name}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="shrink-0">Autor:</dt>
                <dd className="min-w-0">
                  <a
                    href={site.author.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-2xl border border-primary/20 bg-card/80 px-3 py-2 font-medium text-foreground outline-none transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:ring-4 focus-visible:ring-ring/40"
                  >
                    <GithubMark className="size-4 shrink-0 text-primary" />
                    <span>{site.author.name}</span>
                    <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 -rotate-45 text-primary" />
                    <span className="sr-only"> — GitHub (se abre en otra pestaña)</span>
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md">
            <Image
              src="/ilustraciones/hero-conexion.webp"
              alt="Una estudiante trabaja en su portátil sentada sobre una base de datos, conectada por un cable."
              width={878}
              height={974}
              sizes="(min-width: 1024px) 448px, (min-width: 640px) 384px, 320px"
              priority
              className="relative w-full"
            />
          </div>
        </div>
      </section>

      {/* First concept: a table students can explore. */}
      <section id="conceptos" aria-labelledby="tabla" className="scroll-mt-6 bg-card/60 py-16 lg:py-24">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 sm:px-6">
          <Reveal>
            <SectionHeading id="tabla" title="Primero, conoce" accent="la tabla">
              La tabla estudiante guarda una fila por persona. Toca una columna, una fila o una celda para descubrir cómo se organizan los datos.
            </SectionHeading>
          </Reveal>
          <Reveal>
            <TableAnatomy />
          </Reveal>
        </div>
      </section>

      {/* The system journey follows the database basics. */}
      <section aria-labelledby="piezas" className="py-16 lg:py-24">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 sm:px-6">
          <Reveal className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <SectionHeading id="piezas" title="Después, sigue" accent="la consulta">
              Java pide datos de estudiante. El driver lleva la petición al motor y trae las filas de vuelta. Envía una consulta para ver el recorrido.
            </SectionHeading>
          </Reveal>
          <Reveal>
            <SystemMap />
          </Reveal>
        </div>
      </section>

      {/* How the class goes */}
      <section id="recorrido" aria-labelledby="clase" className="scroll-mt-6 py-16 lg:py-24">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-4 sm:px-6">
          <Reveal className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <SectionHeading id="clase" title="Así va" accent="la clase">
                Son seis módulos de 10 a 18 minutos. Primero entiendes una idea y luego la pruebas. Las actividades te ayudan a aprender; no se califican.
              </SectionHeading>
              <ol className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: BookOpen, title: "Teoría", text: "Conceptos con ejemplos y preguntas de repaso." },
                  { icon: PencilLine, title: "Práctica", text: "Ejercicios guiados, con pistas y sin nota." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className="space-y-2 rounded-3xl border-2 border-foreground bg-card p-4">
                    <span className="flex items-center justify-between">
                      <Icon aria-hidden="true" className="size-5 text-primary" />
                      <span className="text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                    </span>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <Image
              src="/estudiantes_en-campus.webp"
              alt="Cuatro estudiantes sentados en el césped frente al letrero «Yo amo UPC»."
              width={2560}
              height={1707}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="aspect-[4/3] w-full rounded-[2rem] border-2 border-foreground object-cover"
            />
          </Reveal>

          <ProgressSummary lessonIds={stops.flatMap((s) => (s.lessonId && !s.optional ? [s.lessonId] : []))} />
          <Reveal>
            <ol aria-label="Módulos de la sesión 1" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stops.map((stop, i) => {
                const body = (
                  <>
                    <span className="flex items-center justify-between text-sm font-medium">
                      <span>Módulo {stop.module}</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock aria-hidden="true" className="size-3.5" /> {stop.minutes} min
                      </span>
                    </span>
                    <span className="block text-lg leading-snug font-semibold text-balance">{stop.title}</span>
                    <span className="mt-auto flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {stop.lessonId ? (
                          <>
                            Abrir módulo <ArrowRight aria-hidden="true" className="size-4" />
                          </>
                        ) : stop.optional ? (
                          "Opcional · estudio autónomo"
                        ) : (
                          "Próximamente"
                        )}
                      </span>
                      {stop.lessonId && <DoneBadge lessonId={stop.lessonId} />}
                    </span>
                  </>
                );
                const card = cn(
                  "flex h-full min-h-44 flex-col gap-3 rounded-3xl border-2 border-foreground p-5",
                  stop.lessonId ? stopColors[stops.slice(0, i).filter((s) => s.lessonId).length % stopColors.length] : "border-dashed bg-background text-muted-foreground"
                );
                return (
                  <li key={stop.module}>
                    {stop.lessonId ? (
                      <Link
                        href={`/s1/${stop.lessonId}`}
                        className={cn(card, "outline-none transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-ring/40")}
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className={card}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Reveal>

        </div>
      </section>

      {/* Final call to action */}
      <section aria-labelledby="empezar" className="px-4 pb-16 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem]">
          <Image src="/campus-pasillo.jpg" alt="" fill sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-[oklch(0.22_0.035_160/0.78)]" />
          <div className="relative flex flex-col items-start gap-6 p-8 text-[oklch(0.98_0.01_110)] sm:p-14">
            <h2 id="empezar" className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
              El recorrido empieza en el módulo 1
            </h2>
            <p className="max-w-lg text-lg leading-relaxed">Doce minutos para conocer filas, columnas y la llave que identifica a cada estudiante.</p>
            <Link
              href={startHref}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-sun px-6 font-medium text-sun-foreground outline-none hover:brightness-95 focus-visible:ring-4 focus-visible:ring-sun/60"
            >
              Empezar ahora <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Star the repository (author's request, 7 Nov 2026). */}
      <section aria-labelledby="estrella" className="px-4 pb-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 rounded-[2.5rem] border-2 border-foreground bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl space-y-2">
            <h2 id="estrella" className="text-2xl font-semibold tracking-tight">
              ¿Te sirvió {site.name}? <span className="text-primary">Dale una estrella</span>
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              El código es abierto. Una estrella en GitHub ayuda a que más estudiantes lo encuentren y le da visibilidad al proyecto.
            </p>
          </div>
          <a
            href={site.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-foreground px-6 font-medium text-background outline-none hover:bg-foreground/85 focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <Star aria-hidden="true" className="size-4 fill-sun text-sun" />
            Dar una estrella en GitHub
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </div>
      </section>

      <footer className="border-t-2 border-foreground/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Logos />
          <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">Asignatura</dt>
            <dd>{site.course} · {site.program}</dd>
            <dt className="text-muted-foreground">Docente</dt>
            <dd>
              {site.teacher.title} {site.teacher.name}
            </dd>
            <dt className="text-muted-foreground">Autor de {site.name}</dt>
            <dd>{site.author.name}</dd>
            <dt className="text-muted-foreground">GitHub</dt>
            <dd>
              <a
                href={site.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-4 focus-visible:ring-ring/40"
              >
                <GithubMark className="size-4" />
                {site.author.github.replace("https://", "")}
              </a>
            </dd>
            <dt className="text-muted-foreground">Código</dt>
            <dd>
              <a
                href={site.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-4 focus-visible:ring-ring/40"
              >
                <Star aria-hidden="true" className="size-4" />
                {site.repo.replace("https://github.com/", "")}
              </a>
            </dd>
          </dl>
        </div>
      </footer>
    </main>
  );
}
