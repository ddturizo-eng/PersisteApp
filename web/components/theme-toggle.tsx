"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nextTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Switches between light and dark theme and remembers the choice. */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);

  function toggle() {
    const root = document.documentElement;
    const target = nextTheme(readTheme());
    // Switch colors in one frame; otherwise every transition-colors element fades separately.
    root.classList.add("theme-switching");
    root.classList.toggle("dark", target === "dark");
    // Flush styles, then re-enable transitions. setTimeout also runs in background tabs, unlike rAF.
    void window.getComputedStyle(root).color;
    window.setTimeout(() => root.classList.remove("theme-switching"), 1);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, target);
    } catch {
      // Storage can be blocked; the theme still applies for this visit.
    }
  }

  // Icons switch with CSS (.dark), so they are right before hydration too.
  // The pressed state is only announced once the real theme is known.
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Tema oscuro"
      aria-pressed={theme === null ? undefined : theme === "dark"}
      onPress={toggle}
    >
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
    </Button>
  );
}
