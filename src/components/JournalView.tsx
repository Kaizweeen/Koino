"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getDevotionShownOn } from "@/lib/devotions/select";
import { loadProgress, getEntry, entryDates, isFavorite, toggleFavorite, soapText, type Progress } from "@/lib/progress";
import { formatDisplayDate } from "@/lib/dates";
import { ShareButton } from "@/components/ShareButton";
import { BackupControls } from "@/components/BackupControls";

const PARTS = [
  { key: "observation", label: "Observation" },
  { key: "application", label: "Application" },
  { key: "prayer", label: "Prayer" },
] as const;

export function JournalView() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => setProgress(loadProgress()), []);

  const records = useMemo(() => {
    if (!progress) return [];
    return entryDates(progress).map((date) => {
      const devotion = getDevotionShownOn(DEVOTIONS, date);
      return {
        date,
        devotion,
        theme: getTheme(devotion.theme),
        entry: getEntry(progress, date),
        legacyNote: progress.notes[date] ?? "",
      };
    });
  }, [progress]);

  if (progress === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="breathe h-12 w-12 rounded-full" style={{ ["--accent" as string]: "#0F6E56", background: "#E1F5EE", border: "1px solid #9FE1CB" }} aria-hidden="true" />
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = records.filter((r) => {
    if (favOnly && !isFavorite(progress, r.date)) return false;
    if (!q) return true;
    const hay = [r.devotion.verseText, r.devotion.verseRef, r.theme.name, r.entry.observation, r.entry.application, r.entry.prayer, r.legacyNote]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
  const hasFavorites = records.some((r) => isFavorite(progress, r.date));

  const emptyMessage =
    records.length === 0 ? "Your journal is empty." : favOnly && !q ? "No favorites yet." : "No entries match your search.";

  return (
    <div className="fade-in mx-auto flex w-full max-w-6xl flex-col gap-5 p-5 pb-6 lg:gap-7 lg:px-10 lg:py-12">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink lg:text-4xl">Journal</h1>
          <p className="mt-1 text-xs text-ink-muted lg:mt-2 lg:text-sm">What you wrote, kept with the verse that stirred it.</p>
        </div>
        {hasFavorites && (
          <button
            onClick={() => setFavOnly((v) => !v)}
            aria-pressed={favOnly}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={favOnly ? { background: "#E1F5EE", color: "#0F6E56", border: "1px solid #9FE1CB" } : { background: "var(--paper)", color: "var(--ink-secondary)", border: "1px solid var(--hairline)" }}
          >
            <i className="ti ti-heart" aria-hidden="true" /> Favorites
          </button>
        )}
      </header>

      {records.length > 0 && (
        <div className="flex items-center gap-2 rounded-full border bg-paper px-4 py-2.5 lg:max-w-lg" style={{ borderColor: "var(--hairline)" }}>
          <i className="ti ti-search text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your journal"
            aria-label="Search your journal"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="text-ink-muted transition-colors hover:text-ink">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
            <i className="ti ti-book text-2xl text-brand" aria-hidden="true" />
          </span>
          <p className="text-sm text-ink-secondary">{emptyMessage}</p>
          {records.length === 0 && (
            <>
              <p className="max-w-[16rem] text-xs text-ink-muted">Finish a devotion and your Observation, Application, and Prayer will gather here.</p>
              <Link href="/app/today" className="btn-quiet mt-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform active:scale-95" style={{ ["--accent" as string]: "#0F6E56" }}>
                Go to today&apos;s devotion
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5 lg:block lg:columns-2 lg:gap-x-4 xl:columns-3">
          {filtered.map(({ date, devotion: d, theme: t, entry, legacyNote }) => {
          const accent = t.accent;
          return (
            <article key={date} className="rounded-well border bg-paper p-5 shadow-card lg:mb-4 lg:break-inside-avoid" style={{ borderColor: "var(--hairline)", ["--accent" as string]: accent }}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: t.accentSoft, color: t.accent }}>
                  <i className={`ti ti-${t.icon}`} aria-hidden="true" /> {t.name}
                </span>
                <span className="text-[10px] text-ink-muted">{formatDisplayDate(date)}</span>
              </div>

              <p className="mt-3.5 font-serif text-xl leading-snug text-ink">{d.verseText}</p>
              <p className="mt-1.5 text-[10px] uppercase tracking-widest2 text-ink-muted">{d.verseRef}</p>

              <div className="mt-4 flex flex-col gap-3">
                {PARTS.map(({ key, label }) =>
                  entry[key].trim() ? (
                    <div key={key} className="rounded-xl p-3.5" style={{ background: t.accentSoft }}>
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>{label}</p>
                      <p className="reading-text whitespace-pre-wrap font-serif text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${accent} 42%, #262521)` }}>{entry[key]}</p>
                    </div>
                  ) : null,
                )}
                {legacyNote && (
                  <div className="rounded-xl p-3.5" style={{ background: t.accentSoft }}>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>Note</p>
                    <p className="reading-text whitespace-pre-wrap font-serif text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${accent} 42%, #262521)` }}>{legacyNote}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3.5" style={{ borderColor: "var(--hairline)" }}>
                <button
                  onClick={() => setProgress(toggleFavorite(date))}
                  aria-pressed={isFavorite(progress, date)}
                  aria-label={isFavorite(progress, date) ? "Remove from favorites" : "Add to favorites"}
                  className="text-lg"
                  style={{ color: isFavorite(progress, date) ? accent : "var(--ink-muted)" }}
                >
                  <i className="ti ti-heart" aria-hidden="true" />
                </button>
                <ShareButton devotion={d} theme={t} reflection={soapText(entry)} className="flex items-center gap-1.5 text-xs font-medium" />
              </div>
            </article>
          );
          })}
        </div>
      )}

      <BackupControls onImported={() => setProgress(loadProgress())} />
    </div>
  );
}
