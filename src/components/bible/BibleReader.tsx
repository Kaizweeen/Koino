"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BIBLE_SECTIONS, TRANSLATION, type BibleBook } from "@/lib/bible/books";
import { getBook } from "@/lib/bible/refs";
import { ChapterView } from "@/components/bible/ChapterView";
import { Icon } from "@/components/Icon";

/** A span of verses picked out of the chapter on screen. */
interface VerseSpan {
  from: number;
  to: number;
}

/**
 * The Bible reader.
 *
 * Where it is in the text lives in the query string (?b=PSA&c=46&v=10) rather than in the route,
 * for two reasons: the app is exported as static files, so a route per chapter would mean
 * prerendering 1,189 pages into the bundle and the iOS shell; and a query string keeps every
 * position linkable, which is what lets a devotion hand the reader a verse to open at.
 */
export function BibleReader() {
  const router = useRouter();
  const params = useSearchParams();

  const book = getBook(params.get("b") ?? "");
  const chapterParam = Number.parseInt(params.get("c") ?? "", 10);
  const chapter =
    book && Number.isFinite(chapterParam) && chapterParam >= 1 && chapterParam <= book.chapters
      ? chapterParam
      : null;

  const highlight = useMemo(() => {
    const raw = params.get("v");
    if (!raw) return undefined;
    const [fromText, toText] = raw.split("-");
    const from = Number.parseInt(fromText, 10);
    if (!Number.isFinite(from) || from < 1) return undefined;
    const to = Number.parseInt(toText ?? "", 10);
    return { from, to: Number.isFinite(to) && to >= from ? to : from };
  }, [params]);

  const go = useCallback(
    (next: { b?: string; c?: number; v?: string }) => {
      const search = new URLSearchParams();
      if (next.b) search.set("b", next.b);
      if (next.c) search.set("c", String(next.c));
      if (next.v) search.set("v", next.v);
      const query = search.toString();
      router.push(query ? `/app/bible?${query}` : "/app/bible");
    },
    [router],
  );

  if (book && chapter) {
    return (
      <ChapterReading
        book={book}
        chapter={chapter}
        highlight={highlight}
        onBack={() => go({ b: book.id })}
        onChapter={(next) => go({ b: book.id, c: next })}
      />
    );
  }

  if (book) {
    return <ChapterPicker book={book} onBack={() => go({})} onPick={(c) => go({ b: book.id, c })} />;
  }

  return <BookList onPick={(picked) => go({ b: picked.id })} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in mx-auto flex w-full max-w-3xl flex-col gap-5 p-5 pb-6 lg:gap-8 lg:px-10 lg:py-12">
      {children}
    </div>
  );
}

function BookList({ onPick }: { onPick: (book: BibleBook) => void }) {
  const testaments = [
    { key: "ot", label: "Old Testament" },
    { key: "nt", label: "New Testament" },
  ] as const;

  return (
    <Shell>
      <header>
        <h1 className="font-serif text-3xl text-ink lg:text-4xl">Bible</h1>
        <p className="mt-1 max-w-[22rem] text-xs text-ink-muted lg:mt-2 lg:max-w-[34rem] lg:text-sm">
          The whole {TRANSLATION}, here when you want to sit with more than a day&apos;s verse.
        </p>
      </header>

      {testaments.map(({ key, label }) => (
        <section key={key} className="flex flex-col gap-4">
          <h2
            className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest2 text-ink-muted"
            id={`testament-${key}`}
          >
            {label}
            <span className="h-px flex-1" style={{ background: "var(--hairline)" }} aria-hidden="true" />
          </h2>

          {/*
            Grouped by traditional division rather than listed flat: 39 names in one grid is a
            scan, while "it's a minor prophet" narrows it to twelve at a glance.
          */}
          {BIBLE_SECTIONS.filter((s) => s.testament === key).map((section) => (
            <section key={section.name} className="flex flex-col gap-2" aria-labelledby={`section-${section.name}`}>
              <h3 className="font-serif text-sm text-ink-secondary" id={`section-${section.name}`}>
                {section.name}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {section.books.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onPick(b)}
                    className="group flex items-baseline justify-between gap-2 rounded-2xl border bg-paper px-3.5 py-3 text-left shadow-card transition-transform active:scale-[0.99]"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <span className="truncate font-serif text-[0.9375rem] text-ink">{b.name}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-ink-muted">{b.chapters}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </section>
      ))}
    </Shell>
  );
}

function ChapterPicker({
  book,
  onBack,
  onPick,
}: {
  book: BibleBook;
  onBack: () => void;
  onPick: (chapter: number) => void;
}) {
  return (
    <Shell>
      <header className="flex flex-col gap-3">
        <BackLink label="All books" onClick={onBack} />
        <h1 className="font-serif text-3xl text-ink lg:text-4xl">{book.name}</h1>
      </header>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            aria-label={`${book.name} ${c}`}
            className="flex h-11 items-center justify-center rounded-xl border bg-paper text-sm tabular-nums text-ink-secondary shadow-card transition-transform active:scale-[0.97]"
            style={{ borderColor: "var(--hairline)" }}
          >
            {c}
          </button>
        ))}
      </div>
    </Shell>
  );
}

function ChapterReading({
  book,
  chapter,
  highlight,
  onBack,
  onChapter,
}: {
  book: BibleBook;
  chapter: number;
  highlight?: { from: number; to: number };
  onBack: () => void;
  onChapter: (chapter: number) => void;
}) {
  const [selected, setSelected] = useState<VerseSpan | null>(null);

  // Turning the page is a fresh chapter, and a selection left over from the last one would offer
  // to reflect on a verse that is no longer on screen.
  useEffect(() => setSelected(null), [book.id, chapter]);

  /**
   * Tapping builds the span: the first tap takes a verse, a tap outside it stretches the span to
   * reach, a tap inside a span narrows back to that one verse, and tapping the single selected
   * verse again lets it go.
   */
  const pick = useCallback((verse: number) => {
    setSelected((current) => {
      if (!current) return { from: verse, to: verse };
      if (current.from === verse && current.to === verse) return null;
      if (verse >= current.from && verse <= current.to) return { from: verse, to: verse };
      return { from: Math.min(current.from, verse), to: Math.max(current.to, verse) };
    });
  }, []);

  return (
    <Shell>
      <header className="flex flex-col gap-3">
        <BackLink label={book.name} onClick={onBack} />
        <h1 className="font-serif text-3xl text-ink lg:text-4xl">
          {book.name} {chapter}
        </h1>
        {!selected && (
          <p className="text-xs text-ink-muted lg:text-sm">Tap any verse to sit with it in Scripture, Observation, Application, Prayer.</p>
        )}
      </header>

      {selected && <ReflectBar book={book} chapter={chapter} span={selected} onClear={() => setSelected(null)} />}

      <ChapterView
        bookId={book.id}
        bookName={book.name}
        chapter={chapter}
        highlight={selected ?? highlight}
        scrollToHighlight={selected === null && highlight !== undefined}
        onSelectVerse={pick}
      />

      <nav className="flex items-center justify-between gap-3 border-t pt-5" style={{ borderColor: "var(--hairline)" }}>
        <ChapterStep
          direction="previous"
          label={`${book.name} ${chapter - 1}`}
          disabled={chapter <= 1}
          onClick={() => onChapter(chapter - 1)}
        />
        <ChapterStep
          direction="next"
          label={`${book.name} ${chapter + 1}`}
          disabled={chapter >= book.chapters}
          onClick={() => onChapter(chapter + 1)}
        />
      </nav>
    </Shell>
  );
}

/**
 * What a reader can do with the verse they just tapped.
 *
 * Sticks to the top of the chapter rather than floating over the bottom: below lg the TabBar
 * already owns the bottom edge, and a bar that has to dodge it would be guessing at its height.
 * The top edge is free on every size, and the reference stays in view while the chapter scrolls
 * under it.
 */
function ReflectBar({
  book,
  chapter,
  span,
  onClear,
}: {
  book: BibleBook;
  chapter: number;
  span: VerseSpan;
  onClear: () => void;
}) {
  const verses = span.to > span.from ? `${span.from}-${span.to}` : `${span.from}`;
  return (
    <div
      className="fade-in sticky top-0 z-30 -mx-5 flex items-center gap-3 border-b px-5 py-3 backdrop-blur-md lg:-mx-10 lg:px-10"
      style={{
        background: "color-mix(in srgb, var(--paper) 97%, transparent)",
        borderColor: "var(--hairline)",
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[0.9375rem] text-ink">
          {book.name} {chapter}:{verses}
        </p>
        <p className="text-[11px] text-ink-muted">Tap another to extend</p>
      </div>
      <Link
        href={`/app/soap?b=${book.id}&c=${chapter}&v=${verses}`}
        className="btn-primary inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium"
      >
        Reflect on this
      </Link>
      <button
        onClick={onClear}
        aria-label="Clear selection"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink"
        style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)" }}
      >
        <Icon name="x" />
      </button>
    </div>
  );
}

function ChapterStep({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  if (disabled) return <span aria-hidden="true" />;
  const isNext = direction === "next";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink ${
        isNext ? "ml-auto" : ""
      }`}
    >
      {!isNext && <Icon name="chevron-left" />}
      {label}
      {isNext && <Icon name="chevron-right" />}
    </button>
  );
}

function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex w-fit items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
    >
      <Icon name="chevron-left" />
      {label}
    </button>
  );
}
