import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonPlayerFromUrl } from "@/components/lesson/lesson-player";
import { findLesson, lessonsForSession } from "@/lib/content";

/** Every session 1 lesson is prerendered at build time. */
export function generateStaticParams() {
  return lessonsForSession(1).map((lesson) => ({ lessonId: lesson.id }));
}

export async function generateMetadata({ params }: PageProps<"/s1/[lessonId]">): Promise<Metadata> {
  const lesson = findLesson((await params).lessonId);
  return lesson ? { title: `${lesson.title} · PersisteApp`, description: lesson.summary } : {};
}

/** Params are read inside Suspense so the route keeps an instant static shell (Cache Components). */
export default function LessonPage({ params }: PageProps<"/s1/[lessonId]">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy="true" />}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: Pick<PageProps<"/s1/[lessonId]">, "params">) {
  const lesson = findLesson((await params).lessonId);
  if (!lesson || lesson.session !== 1) notFound();

  // ?step= is read on the client; the static HTML starts at step 1.
  return <LessonPlayerFromUrl lesson={lesson} />;
}
