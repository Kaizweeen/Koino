"use client";

import { useEffect, useRef, useState } from "react";
import { loadChapter, type BibleChapter } from "@/lib/bible/chapter";
import { TRANSLATION } from "@/lib/bible/books";

interface ChapterViewProps {
  bookId: string;
  bookName: string;
  chapter: number;
  /** Verse span to mark as the one being read, e.g. the verse a devotion quotes. */
  highlight?: { from: number; to: number };
  /** Scroll the highlighted verse into view once the chapter has loaded. */
  scrollToHighlight?: boolean;
  className?: string;
}

/**
 * Renders one chapter of the bundled World English Bible.
 *
 * Verse numbers are set quietly beside the text rather than inline with it: this is a reading
 * view, not a study view, and the numbers should be available for finding a place without
 * interrupting the sentence. The highlighted span exists so a reader arriving from a devotion can
 * see at a glance where the verse they were given sits in its chapter.
 */
export function ChapterView({
  bookId,
  bookName,
  chapter,
  highlight,
  scrollToHighlight = false,
  className = "",
}: ChapterViewProps) {
  const [data, setData] = useState<BibleChapter | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const highlightRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setFailed(false);

    loadChapter(bookId, chapter)
      .then((chapterData) => {
        if (active) setData(chapterData);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [bookId, chapter, attempt]);

  useEffect(() => {
    if (!data || !scrollToHighlight || !highlightRef.current) return;
    highlightRef.current.scrollIntoView({ block: "center", behavior: "auto" });
  }, [data, scrollToHighlight]);

  if (failed) {
    return (
      <div className={`flex flex-col items-center gap-3 py-12 text-center ${className}`}>
        <p className="text-sm text-ink-secondary">This chapter didn&apos;t load.</p>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="rounded-full px-4 py-2 text-sm font-medium text-brand"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`flex justify-center py-16 ${className}`} aria-live="polite">
        <span className="sr-only">Loading {bookName} {chapter}</span>
        <span
          className="breathe h-10 w-10 rounded-full"
          style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        {data.verses.map((verse) => {
          const marked = highlight ? verse.n >= highlight.from && verse.n <= highlight.to : false;
          return (
            <p
              key={verse.n}
              ref={marked && verse.n === highlight?.from ? highlightRef : undefined}
              className={`font-serif text-[1.0625rem] leading-[1.85] transition-colors ${
                marked ? "rounded-2xl px-3.5 py-2.5 text-ink" : "text-ink-secondary"
              }`}
              style={marked ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)" } : undefined}
            >
              <span
                className="mr-2 select-none align-baseline text-[0.6875rem] font-medium tabular-nums text-ink-muted"
                aria-hidden="true"
              >
                {verse.n}
              </span>
              {verse.t}
            </p>
          );
        })}
      </div>
      <p className="mt-8 text-center text-[11px] text-ink-muted">{TRANSLATION} (public domain)</p>
    </div>
  );
}
