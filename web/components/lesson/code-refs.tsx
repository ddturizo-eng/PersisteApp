"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { Eye, FileCode2, X } from "lucide-react";
import { cn } from "cn";
import { CodeView } from "@/components/code/code-view";
import { useEngine } from "@/components/code/engine";
import { highlightKey, type Highlights } from "@/lib/highlight";
import { compactIndent, compactIndentText, snippetCode, stepList, type SnippetMap } from "@/lib/snippets";

type SnippetsValue = { snippets: SnippetMap; highlights: Highlights };

const SnippetsContext = createContext<SnippetsValue>({ snippets: {}, highlights: {} });

/** Gives every step access to the lesson's snippets and their highlighted code. */
export function SnippetsProvider({ value, children }: { value: SnippetsValue; children: React.ReactNode }) {
  return <SnippetsContext.Provider value={value}>{children}</SnippetsContext.Provider>;
}

/**
 * «Ver código» (proposal of 7 Nov 2026): opens the exact code a question is about in a modal, so
 * nobody has to leave the step to look for it. Several refs become tabs. Renders nothing without refs.
 */
export function CodeRefs({ refs }: { refs?: string[] }) {
  const { snippets, highlights } = useContext(SnippetsContext);
  const [engine] = useEngine();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const list = (refs ?? []).map((id) => snippets[id]).filter((s) => s !== undefined);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);

  if (list.length === 0) return null;
  const current = list[Math.min(tab, list.length - 1)];
  const code = snippetCode(current, engine);
  const tokens = highlights[highlightKey(current.language, code)];
  const label = list.length === 1 ? `Ver código: ${current.title}` : `Ver el código (${list.length})`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-foreground/80 bg-card px-4 py-2 text-left text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        <FileCode2 aria-hidden="true" className="size-4 shrink-0" />
        <span className="min-w-0">{label}</span>
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) setOpen(false);
        }}
        aria-labelledby={titleId}
        className="m-auto max-h-[90vh] w-[min(94vw,56rem)] overflow-hidden rounded-2xl border bg-popover p-0 text-popover-foreground backdrop:bg-black/60"
      >
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-3">
            <div className="min-w-0">
              <h2 id={titleId} className="font-semibold [overflow-wrap:anywhere]">{current.title}</h2>
              <p className="text-sm text-muted-foreground">{current.origin}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              <X aria-hidden="true" className="size-4" />
              Cerrar <span className="sr-only">el código</span>(Esc)
            </button>
          </div>
          {list.length > 1 && (
            <div role="tablist" aria-label="Fragmentos" className="flex shrink-0 gap-1 overflow-x-auto border-b px-3 pt-2 [scrollbar-width:none]">
              {list.map((snippet, i) => (
                <button
                  key={snippet.id}
                  type="button"
                  role="tab"
                  aria-selected={i === tab}
                  onClick={(event) => {
                    setTab(i);
                    event.currentTarget.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
                  }}
                  className={cn(
                    "shrink-0 border-b-2 px-3 py-2 text-sm font-medium",
                    i === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {snippet.title}
                </button>
              ))}
            </div>
          )}
          <SideScroll key={current.id}>
            <CodeView
              lines={tokens && compactIndent(tokens)}
              fallback={compactIndentText(code)}
              className="code-nowrap w-max min-w-full text-[0.75rem] sm:text-sm"
            />
          </SideScroll>
        </div>
      </dialog>
    </>
  );
}

/**
 * Code area that scrolls both ways. Phones hide native scrollbars, so when the code is wider than
 * the modal a slider at the bottom moves it sideways (author's request, 7 Nov 2026).
 */
function SideScroll({ children }: { children: React.ReactNode }) {
  const area = useRef<HTMLDivElement>(null);
  const [max, setMax] = useState(0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const measure = () => setMax(Math.max(element.scrollWidth - element.clientWidth, 0));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={area}
        onScroll={(event) => setLeft(event.currentTarget.scrollLeft)}
        className="min-h-0 flex-1 overflow-auto p-4"
      >
        {children}
      </div>
      {max > 0 && (
        <div className="flex shrink-0 items-center gap-3 border-t px-5 pt-3 pb-5">
          <span aria-hidden="true" className="text-xs whitespace-nowrap text-muted-foreground">← →</span>
          <input
            type="range"
            min={0}
            max={max}
            value={Math.min(left, max)}
            onChange={(event) => {
              const value = Number(event.target.value);
              setLeft(value);
              if (area.current) area.current.scrollLeft = value;
            }}
            aria-label="Mover el código a los lados"
            className="h-8 w-full cursor-pointer accent-primary"
          />
        </div>
      )}
    </>
  );
}

/** Short note on a read step whose code later questions depend on (proposal of 7 Nov 2026). */
export function AttentionNote({ steps }: { steps: number[] }) {
  if (steps.length === 0) return null;
  return (
    <p className="flex max-w-prose items-start gap-2 rounded-xl border border-sun/60 bg-sun/15 px-4 py-2.5 text-sm font-medium">
      <Eye aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>Mantén la atención en este código: lo usarás en {stepList(steps)}.</span>
    </p>
  );
}
