"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { QuizStep } from "@/components/lesson/quiz-step";
import type { StepNav } from "@/components/lesson/step-nav";
import type { PublicQuiz } from "@/lib/quiz";

/**
 * Practice run of the final quiz (REQ-29 CA4): the quiz takes over the single footer «Continuar» like any step with
 * inner screens (step-nav pattern); after the summary it leads back to the start.
 */
export function FinalQuizPlayer({ quiz }: { quiz: PublicQuiz }) {
  const [nav, setNav] = useState<StepNav | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const finished = nav !== null && !nav.advance;

  return (
    <div className="flex flex-col">
      <section aria-label="Quiz de práctica" className="py-4">
        <QuizStep quiz={quiz} stepKey={`s${quiz.session}-quiz`} onNav={setNav} headingRef={headingRef} />
      </section>
      <footer className="sticky bottom-0 border-t bg-background/95 py-4 backdrop-blur">
        <div className="flex flex-col items-end gap-1">
          {finished ? (
            <LinkButton href="/">Volver al inicio</LinkButton>
          ) : (
            <Button isDisabled={!nav?.canAdvance} onPress={() => nav?.advance?.()}>
              Continuar
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          )}
          {!finished && !nav?.canAdvance && nav?.hint && <p className="text-xs text-muted-foreground">{nav.hint}</p>}
        </div>
      </footer>
    </div>
  );
}
