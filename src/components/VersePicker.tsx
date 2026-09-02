"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { THEMES, type MoodSlug } from "@/lib/themes";
import { parseReference, formatReference } from "@/lib/bible/refs";
import { referenceQuery } from "@/lib/bible/passage";
import { Icon } from "@/components/Icon";

/**
 * Where a verse of your own choosing gets picked.
 *
 * Two ways in, because people arrive knowing two different things. Someone who has the reference
 * in their head types it and is one tap from writing; someone who only knows they want to be in
 * John goes to the reader and taps the verse off the page. This screen is the first; the Bible
 * tab is the second, and both land on the same flow.
 */
export function VersePicker() {
  const [query, setQuery] = useState("");
  const [mood, setMood] = useState<MoodSlug>("open");

  const trimmed = query.trim();
  const reference = useMemo(() => (trimmed === "" ? null : parseReference(trimmed)), [trimmed]);

  return (
    <div className="fade-in mx-auto flex w-full max-w-2xl flex-col gap-6 p-5 pb-8 lg:gap-8 lg:px-10 lg:py-12">
      <header>
        <h1 className="font-serif text-3xl text-ink lg:text-4xl">Reflect on a passage</h1>
        <p className="mt-1 max-w-[26rem] text-xs text-ink-muted lg:mt-2 lg:max-w-[34rem] lg:text-sm">
          Any passage you like — a verse, a few, or a whole chapter — walked through the same four
          steps as the daily devotion: Scripture, Observation, Application, Prayer.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <label htmlFor="verse-reference" className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">
          The passage
        </label>
        <div
          className="flex items-center gap-2 rounded-full border bg-paper px-4 py-2.5"
          style={{ borderColor: "var(--hairline)" }}
        >
          <Icon name="search" className="text-ink-muted" />
          <input
            id="verse-reference"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Psalm 46:10"
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear" className="text-ink-muted transition-colors hover:text-ink">
              <Icon name="x" />
            </button>
          )}
        </div>
        {/* Silent until there is something to say: an empty field is not a mistake, and neither is
            a reference half-typed. Naming what was understood matters most for a chapter, where
            "Psalm 23" and "Psalm 23:1" are a keystroke apart and mean quite different sittings.
            aria-live so the resolution is announced, not just seen. */}
        <p className="min-h-[1.25rem] px-4 text-xs" aria-live="polite">
          {reference ? (
            <span className="text-ink-secondary">
              {formatReference(reference)}
              {reference.wholeChapter && <span className="text-ink-muted"> · the whole chapter</span>}
            </span>
          ) : trimmed !== "" ? (
            <span className="text-ink-muted">Try a book with a chapter, and a verse if you want one — “John 15:5”.</span>
          ) : (
            <span className="text-ink-muted">A verse, a short span, or a whole chapter — “Psalm 46:10”, “Romans 8:38-39”, “Psalm 23”.</span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">
          Coming to it with <span className="normal-case tracking-normal">(optional)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          <MoodChip slug="open" name="No mood, just the passage" icon="book-2" accent="#0F6E56" accentSoft="#E1F5EE" selected={mood === "open"} onSelect={setMood} />
          {Object.values(THEMES).map((t) => (
            <MoodChip
              key={t.slug}
              slug={t.slug}
              name={t.name}
              icon={t.icon}
              accent={t.accent}
              accentSoft={t.accentSoft}
              selected={mood === t.slug}
              onSelect={setMood}
            />
          ))}
        </div>
        <p className="text-xs text-ink-muted">A mood only changes the questions you&apos;ll be asked, and the colour they arrive in.</p>
      </div>

      {reference ? (
        <Link
          href={`/app/soap?${referenceQuery(reference)}&m=${mood}`}
          className="btn-primary w-full rounded-full py-3.5 text-center text-[15px] font-medium lg:w-auto lg:self-start lg:px-16 lg:py-4"
        >
          Begin with {formatReference(reference)}
        </Link>
      ) : (
        <button
          disabled
          className="w-full cursor-not-allowed rounded-full py-3.5 text-[15px] font-medium text-ink-muted lg:w-auto lg:self-start lg:px-16 lg:py-4"
          style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)" }}
        >
          Begin
        </button>
      )}

      <Link
        href="/app/bible"
        className="flex items-center gap-3 rounded-2xl border bg-paper p-4 shadow-card transition-transform active:scale-[0.99]"
        style={{ borderColor: "var(--hairline)" }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: "#E1F5EE", color: "#0F6E56" }}
        >
          <Icon name="book-2" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Not sure where to land?</p>
          <p className="text-xs text-ink-muted">Read the Bible and pick as you go.</p>
        </div>
        <Icon name="chevron-right" className="ml-auto shrink-0 text-ink-muted" />
      </Link>
    </div>
  );
}

function MoodChip({
  slug,
  name,
  icon,
  accent,
  accentSoft,
  selected,
  onSelect,
}: {
  slug: MoodSlug;
  name: string;
  icon: string;
  accent: string;
  accentSoft: string;
  selected: boolean;
  onSelect: (slug: MoodSlug) => void;
}) {
  return (
    <button
      onClick={() => onSelect(slug)}
      aria-pressed={selected}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-transform active:scale-95 lg:text-sm"
      style={
        selected
          ? { background: accent, color: "#fff" }
          : { background: accentSoft, color: accent, border: "1px solid transparent" }
      }
    >
      <Icon name={icon} /> {name}
    </button>
  );
}
