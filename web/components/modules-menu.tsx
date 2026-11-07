"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ClipboardCheck, Menu, X } from "lucide-react";
import { cn } from "cn";

export type MenuModule = { module: number; title: string; minutes: number; href?: string };

/** A swipe counts when it moves this far sideways and stays mostly horizontal. */
const SWIPE_MIN_X = 60;
const SWIPE_MAX_Y = 45;

/** Where a leftward swipe must not open the menu: code, sliders, tabs and anything that scrolls sideways. */
function scrollsSideways(target: EventTarget | null): boolean {
  for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
    if (el.matches("input, textarea, select, pre, [role=tablist], dialog, [data-no-swipe]")) return true;
    if (el.scrollWidth > el.clientWidth + 1) {
      const overflow = getComputedStyle(el).overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
    }
  }
  return false;
}

/**
 * Mobile menu with the session's modules (author's request, 7 Nov 2026): the landing list is far
 * down the page, so on a phone a right-to-left swipe, or the button in the header, opens it from
 * the right. Swiping left-to-right or tapping outside closes it.
 */
export function ModulesMenu({ modules }: { modules: MenuModule[] }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);

  // Opening gesture: only on phone widths, starting on the right half, away from sideways scrollers.
  useEffect(() => {
    let start: { x: number; y: number } | null = null;
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const phone = window.matchMedia("(max-width: 767px)").matches;
      start =
        phone && event.touches.length === 1 && touch.clientX > window.innerWidth / 2 && !scrollsSideways(event.target)
          ? { x: touch.clientX, y: touch.clientY }
          : null;
    };
    const onEnd = (event: TouchEvent) => {
      if (!start || document.querySelector("dialog[open]")) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = Math.abs(touch.clientY - start.y);
      start = null;
      if (dx < -SWIPE_MIN_X && dy < SWIPE_MAX_Y) setOpen(true);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  // Closing gesture inside the panel: swipe left-to-right.
  const closeStart = useRef<{ x: number; y: number } | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir el menú de módulos"
        className="inline-flex size-9 items-center justify-center rounded-md text-foreground outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 md:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      <dialog
        ref={dialog}
        aria-label="Módulos de la sesión 1"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) setOpen(false);
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          closeStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = closeStart.current;
          closeStart.current = null;
          if (!start) return;
          const touch = event.changedTouches[0];
          if (touch.clientX - start.x > SWIPE_MIN_X && Math.abs(touch.clientY - start.y) < SWIPE_MAX_Y) setOpen(false);
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[min(86vw,22rem)] translate-x-0 overflow-hidden border-l bg-background p-0 text-foreground shadow-xl transition-transform duration-200 backdrop:bg-black/50 starting:translate-x-full"
      >
        <nav aria-label="Módulos" className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <p className="font-semibold">Sesión 1 · Módulos</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar el menú"
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {/* Buttons with just «Módulo N» (author, 7 Nov 2026); the full title is the accessible name. */}
          <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
            {modules.map((m) => {
              const current = m.href !== undefined && pathname === m.href;
              const base =
                "flex w-full items-center justify-center rounded-full border-2 px-4 py-3 text-base font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring/40";
              return (
                <li key={m.module}>
                  {m.href ? (
                    <Link
                      href={m.href}
                      onClick={() => setOpen(false)}
                      aria-current={current ? "page" : undefined}
                      aria-label={`Módulo ${m.module}: ${m.title}`}
                      title={m.title}
                      className={cn(
                        base,
                        current
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-foreground/80 bg-card hover:bg-muted"
                      )}
                    >
                      Módulo {m.module}
                    </Link>
                  ) : (
                    <span aria-label={`Módulo ${m.module}: próximamente`} className={cn(base, "border-dashed border-border text-muted-foreground")}>
                      Módulo {m.module}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="shrink-0 border-t p-3">
            <Link
              href="/s1/quiz"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
            >
              <ClipboardCheck aria-hidden="true" className="size-4" />
              Ir al quiz final
            </Link>
          </div>
        </nav>
      </dialog>
    </>
  );
}
