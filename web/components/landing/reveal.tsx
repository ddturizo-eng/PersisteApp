"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import AnimatedContent from "@/components/bits/AnimatedContent";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-exposition"] });
  return () => observer.disconnect();
};
const inExposition = () => document.documentElement.hasAttribute("data-exposition");

/**
 * Reveals a landing section once on scroll (React Bits AnimatedContent, design §12.4).
 * Plain content in exposition mode; AnimatedContent itself respects prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const exposition = useSyncExternalStore(subscribe, inExposition, () => false);
  if (exposition) return <div className={className}>{children}</div>;
  return (
    <AnimatedContent distance={40} duration={0.7} delay={delay} ease="power3.out" threshold={0.15} className={className}>
      {children}
    </AnimatedContent>
  );
}
