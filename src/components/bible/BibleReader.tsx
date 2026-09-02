"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { BIBLE_SECTIONS, type BibleBook, type BibleVersion } from "@/lib/bible/books";
import { getBook } from "@/lib/bible/refs";
import { useBibleVersion } from "@/lib/bible/useBibleVersion";
import { ChapterView } from "@/components/bible/ChapterView";
import { VersionPills } from "@/components/bible/VersionPicker";
import { Icon } from "@/components/Icon";

/**
 * The Bible reader.
 *
 * Where it is in the text lives in the query string (?b=PSA&c=46&v=10) rather than in the route,
 * for two reasons: the app is exported as static files, so a route per chapter would mean
 * prerendering 1,189 pages into the bundle and the iOS shell; and a query string keeps every
 * position linkable, which is what lets a devotion hand the reader a verse to open at.
 *
 * The translation is deliberately *not* in the query string. It is a standing preference rather
 * than a position, so it should survive following a link into the reader and should match what the
 * chapter sheet shows mid-devotion, which no URL is handing a version to.
 */
export function BibleReader() {
  const router = useRouter();
  const params = useSearchParams();
  const { version, choose } = useBibleVersion();

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
        version={version}
        onVersion={choose}
        book={book}
        chapter={chapter}
        highlight={highlight}
        onBack={() => go({ b: book.id })}
        onChapter={(next) => go({ b: book.id, c: next })}
      />
    );
  }

  if (book) {
    return (
      <ChapterPicker
        version={version}
        onVersion={choose}
        book={book}
        onBack={() => go({})}
        onPick={(c) => go({ b: book.id, c })}
      />
    );
  }

  return <BookList version={version} onVersion={choose} onPick={(picked) => go({ b: picked.id })} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in mx-auto flex w-full max-w-3xl flex-col gap-5 p-5 pb-6 lg:gap-8 lg:px-10 lg:py-12">
      {children}
    </div>
  );
}

function BookList({
  version,
  onVersion,
  onPick,
}: {
  version: BibleVersion;
  onVersion: (id: string) => void;
  onPick: (book: BibleBook) => void;
}) {
  const testaments = [
    { key: "ot", label: "Old Testament" },
    { key: "nt", label: "New Testament" },
  ] as const;

  return (
    <Shell>
      <header>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-serif text-3xl text-ink lg:text-4xl">Bible</h1>
          <VersionPills value={version} onChange={onVersion} className="mt-1.5" />
        </div>
        <p className="mt-1 max-w-[22rem] text-xs text-ink-muted lg:mt-2 lg:max-w-[34rem] lg:text-sm">
          The whole {version.name}, here when you want to sit with more than a day&apos;s verse.
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
  version,
  onVersion,
  book,
  onBack,
  onPick,
}: {
  version: BibleVersion;
  onVersion: (id: string) => void;
  book: BibleBook;
  onBack: () => void;
  onPick: (chapter: number) => void;
}) {
  return (
    <Shell>
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <BackLink label="All books" onClick={onBack} />
          <VersionPills value={version} onChange={onVersion} />
        </div>
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
  version,
  onVersion,
  book,
  chapter,
  highlight,
  onBack,
  onChapter,
}: {
  version: BibleVersion;
  onVersion: (id: string) => void;
  book: BibleBook;
  chapter: number;
  highlight?: { from: number; to: number };
  onBack: () => void;
  onChapter: (chapter: number) => void;
}) {
  return (
    <Shell>
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <BackLink label={book.name} onClick={onBack} />
          <VersionPills value={version} onChange={onVersion} />
        </div>
        <h1 className="font-serif text-3xl text-ink lg:text-4xl">
          {book.name} {chapter}
        </h1>
      </header>

      <ChapterView
        version={version}
        bookId={book.id}
        bookName={book.name}
        chapter={chapter}
        highlight={highlight}
        scrollToHighlight={highlight !== undefined}
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
