"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Presentation, X } from "lucide-react";
import { cn } from "cn";
import { Kbd } from "@/components/ui/kbd";
import { EXPOSITION_STARTED_KEY, EXPOSITION_STORAGE_KEY, formatElapsed } from "@/lib/exposition";
import { isTypingTarget } from "@/lib/player";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-exposition"] });
  return () => observer.disconnect();
}

const readActive = () => document.documentElement.hasAttribute("data-exposition");

/** Turns exposition mode on or off and remembers it (REQ-05 CA1, CA2). */
export function setExposition(on: boolean) {
  const root = document.documentElement;
  root.toggleAttribute("data-exposition", on);
  try {
    localStorage.setItem(EXPOSITION_STORAGE_KEY, on ? "on" : "off");
    if (on && !sessionStorage.getItem(EXPOSITION_STARTED_KEY)) {
      sessionStorage.setItem(EXPOSITION_STARTED_KEY, String(Date.now()));
    }
    if (!on) sessionStorage.removeItem(EXPOSITION_STARTED_KEY);
  } catch {
    // Storage blocked: the mode still applies for this page.
  }
}

/** null until hydrated, then whether exposition mode is on. */
export function useExposition(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, readActive, () => null);
}

/** Global P shortcut, active on every page (REQ-05 CA1). */
export function ExpositionShortcut() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "p" && event.key !== "P") return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      setExposition(!readActive());
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return null;
}

/** Toggle button shown in the lesson header. */
export function ExpositionToggle({ className }: { className?: string }) {
  const active = useExposition();
  return (
    <button
      type="button"
      onClick={() => setExposition(!readActive())}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted aria-pressed:border-primary aria-pressed:text-primary",
        className
      )}
    >
      <Presentation aria-hidden="true" className="size-4" />
      {active ? "Salir de exposición" : "Exposición"}
      <Kbd aria-hidden="true">P</Kbd>
    </button>
  );
}

/** Always-visible exit while presenting, because the site header is hidden then. */
export function ExpositionExit() {
  return (
    <button
      type="button"
      data-exposition-exit=""
      onClick={() => setExposition(false)}
      className="fixed right-3 top-3 z-40 hidden items-center gap-1.5 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur hover:text-foreground exposition:inline-flex"
    >
      <X aria-hidden="true" className="size-3.5" />
      Salir de exposición
    </button>
  );
}

function readStartedAt(): number | null {
  try {
    const value = Number(sessionStorage.getItem(EXPOSITION_STARTED_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Elapsed time since exposition started, for pacing the 100-minute session. */
export function ExpositionTimer() {
  const active = useExposition();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 1000);
    const first = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [active]);

  const startedAt = active ? readStartedAt() : null;
  if (!active || startedAt === null || now === null) return null;
  return (
    <p className="text-sm text-muted-foreground tabular-nums">
      <span className="sr-only">Tiempo de exposición: </span>
      {formatElapsed(now - startedAt)}
    </p>
  );
}
