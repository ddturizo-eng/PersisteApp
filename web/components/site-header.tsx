import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/lib/site";

/** Global header; hidden in exposition mode (REQ-05). */
export function SiteHeader() {
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
        <ThemeToggle />
      </div>
    </header>
  );
}
