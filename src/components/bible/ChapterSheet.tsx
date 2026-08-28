"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BibleRef } from "@/lib/bible/refs";
import { ChapterView } from "@/components/bible/ChapterView";
import { Icon } from "@/components/Icon";

/**
 * The chapter around a devotion's verse, opened over the devotion rather than navigated to.
 *
 * This is deliberately a sheet and not a link. The SOAP flow keeps the step and everything typed
 * into it in component state (see DevotionFlow), so routing away to the reader mid-devotion would
 * silently discard whatever the person had written. Opening the chapter in place also keeps the
 * arc intact: the context is a glance aside, and closing it puts them back exactly where they were.
 */
export function ChapterSheet({
  reference,
  accent,
  onClose,
}: {
  reference: BibleRef;
  accent: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // The chapter scrolls inside the sheet; the devotion behind it should stay put.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const { book, chapter, verse, endVerse } = reference;

  if (!mounted) return null;

  /**
   * Rendered into document.body rather than in place. The devotion flow animates its step
   * container, and a transformed ancestor becomes the containing block for `position: fixed` —
   * which both traps the sheet inside that box and scopes its z-index, letting the tab bar paint
   * over the bottom of the chapter. A portal puts the sheet above the whole app, where it belongs.
   */
  const sheet = (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center lg:p-10" style={{ ["--accent" as string]: accent }}>
      <button
        aria-label="Close chapter"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/25 backdrop-blur-[2px]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${book.name} ${chapter}`}
        /* A bottom sheet on a phone; on desktop the same panel centres as a dialog rather
           than stretching a chapter of scripture across the whole screen. */
        className="fade-in relative flex max-h-[88dvh] flex-col rounded-t-well bg-paper shadow-lift lg:max-h-full lg:w-full lg:max-w-3xl lg:rounded-well"
      >
        <header
          className="flex shrink-0 items-center justify-between gap-3 border-b px-6 py-4"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div className="min-w-0">
            <h2 className="truncate font-serif text-xl text-ink">
              {book.name} {chapter}
            </h2>
            <p className="text-[11px] text-ink-muted">The chapter around today&apos;s verse</p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close chapter"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink"
            style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)" }}
          >
            <Icon name="x" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <ChapterView
            bookId={book.id}
            bookName={book.name}
            chapter={chapter}
            highlight={{ from: verse, to: endVerse }}
            scrollToHighlight
          />
        </div>
      </section>
    </div>
  );

  return createPortal(sheet, document.body);
}
