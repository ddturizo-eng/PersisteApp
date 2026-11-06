"use client";

import { useSyncExternalStore } from "react";
import type { Engine } from "@/lib/lesson-schema";

/** Engine chosen in any code block applies to every block (docs/ui-research.md §3). */
const STORAGE_KEY = "persisteapp.engine";
const EVENT = "persisteapp:engine";

function read(): Engine {
  try {
    return localStorage.getItem(STORAGE_KEY) === "oracle" ? "oracle" : "postgresql";
  } catch {
    return "postgresql";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** PostgreSQL is the default: live practice uses PostgreSQL (constitution). */
export function useEngine(): [Engine, (engine: Engine) => void] {
  const engine = useSyncExternalStore(subscribe, read, () => "postgresql" as const);
  const setEngine = (next: Engine) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies until reload.
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [engine, setEngine];
}
