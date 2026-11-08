import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ModulesMenu } from "@/components/modules-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { lessonsForSession } from "@/lib/content";
import { courseStops } from "@/lib/course";
import { site } from "@/lib/site";

/**
 * Global header; hidden in exposition mode (REQ-05). «Ir al quiz» is a shortcut for students who
 * could not finish the modules in time: the quiz page asks for the room code, name and student code.
 */
export function SiteHeader() {
  const modules = courseStops(lessonsForSession(1))
    .filter((stop) => !stop.optional)
    .map((stop) => ({
      module: stop.module,
      title: stop.title,
      minutes: stop.minutes,
      href: stop.lessonId ? `/s1/${stop.lessonId}` : undefined,
      lessonId: stop.lessonId,
    }));
  return (
    <header className="exposition:hidden">
      <div className="mx-auto flex h-14 w-full max-w-lesson items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm text-lg font-semibold tracking-tight text-foreground"
        >
          <Image src="/logos/persisteapp.png" alt="" width={28} height={28} priority />
          {site.name}
        </Link>
        <div className="flex items-center gap-2">
          <LinkButton href="/s1/quiz" variant="outline" size="sm">
            <ClipboardCheck data-icon="inline-start" aria-hidden="true" />
            Ir al quiz
          </LinkButton>
          <ThemeToggle />
          <ModulesMenu modules={modules} />
        </div>
      </div>
    </header>
  );
}
