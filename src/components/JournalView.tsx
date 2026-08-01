"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getDevotionForDate } from "@/lib/devotions/select";
import { loadProgress, getEntry, entryDates, isFavorite, toggleFavorite, soapText, type Progress } from "@/lib/progress";
import { formatDisplayDate } from "@/lib/dates";
import { ShareButton } from "@/components/ShareButton";

const PARTS = [
  { key: "observation", label: "Observation" },
  { key: "application", label: "Application" },
  { key: "prayer", label: "Prayer" },
] as const;

export function JournalView() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  useEffect(() => setProgress(loadProgress()), []);

  if (progress === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="breathe h-12 w-12 rounded-full" style={{ ["--accent" as string]: "#0F6E56", background: "#E1F5EE", border: "1px solid #9FE1CB" }} aria-hidden="true" />
      </div>
    );
  }

  const dates = entryDates(progress).filter((d) => !favOnly || isFavorite(progress, d));

  return (
    <div className="fade-in flex flex-col gap-5 p-5 pb-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Journal</h1>
          <p className="mt-1 text-xs text-ink-muted">What you wrote, kept with the verse that stirred it.</p>
        </div>
        {entryDates(progress).some((d) => isFavorite(progress, d)) && (
          <button
            onClick={() => setFavOnly((v) => !v)}
            aria-pressed={favOnly}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={favOnly ? { background: "#E1F5EE", color: "#0F6E56", border: "1px solid #9FE1CB" } : { background: "var(--paper)", color: "var(--ink-secondary)", border: "1px solid var(--hairline)" }}
          >
            <i className={favOnly ? "ti ti-heart-filled" : "ti ti-heart"} aria-hidden="true" /> Favorites
          </button>
        )}
      </header>

      {dates.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
            <i className="ti ti-book text-2xl text-brand" aria-hidden="true" />
          </span>
          <p className="text-sm text-ink-secondary">{favOnly ? "No favorites yet." : "Your journal is empty."}</p>
          <p className="max-w-[16rem] text-xs text-ink-muted">Finish a devotion and your Observation, Application, and Prayer will gather here.</p>
          <Link href="/today" className="btn-quiet mt-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform active:scale-95" style={{ ["--accent" as string]: "#0F6E56" }}>
            Go to today&apos;s devotion
          </Link>
        </div>
      ) : (
        dates.map((date) => {
          const d = getDevotionForDate(DEVOTIONS, date);
          const t = d ? getTheme(d.theme) : null;
          const entry = getEntry(progress, date);
          const legacyNote = progress.notes[date];
          const accent = t?.accent ?? "#0F6E56";
          return (
            <article key={date} className="rounded-well border bg-paper p-5 shadow-card" style={{ borderColor: "var(--hairline)", ["--accent" as string]: accent }}>
              <div className="flex items-center justify-between">
                {t && d ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: t.accentSoft, color: t.accent }}>
                    <i className={`ti ti-${t.icon}`} aria-hidden="true" /> {t.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-muted">Devotion</span>
                )}
                <span className="text-[10px] text-ink-muted">{formatDisplayDate(date)}</span>
              </div>

              {d && <p className="mt-3.5 font-serif text-xl leading-snug text-ink">{d.verseText}</p>}
              {d && <p className="mt-1.5 text-[10px] uppercase tracking-widest2 text-ink-muted">{d.verseRef}</p>}

              <div className="mt-4 flex flex-col gap-3">
                {PARTS.map(({ key, label }) =>
                  entry[key].trim() ? (
                    <div key={key} className="rounded-xl p-3.5" style={{ background: t?.accentSoft ?? "#E1F5EE" }}>
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>{label}</p>
                      <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${accent} 42%, var(--ink))` }}>{entry[key]}</p>
                    </div>
                  ) : null,
                )}
                {legacyNote && (
                  <div className="rounded-xl p-3.5" style={{ background: t?.accentSoft ?? "#E1F5EE" }}>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>Note</p>
                    <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${accent} 42%, var(--ink))` }}>{legacyNote}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3.5" style={{ borderColor: "var(--hairline)" }}>
                <button
                  onClick={() => setProgress(toggleFavorite(date))}
                  aria-pressed={isFavorite(progress, date)}
                  aria-label={isFavorite(progress, date) ? "Remove from favorites" : "Add to favorites"}
                  className="text-lg"
                  style={{ color: accent }}
                >
                  <i className={isFavorite(progress, date) ? "ti ti-heart-filled" : "ti ti-heart"} aria-hidden="true" />
                </button>
                {d && t && <ShareButton devotion={d} theme={t} reflection={soapText(entry)} className="flex items-center gap-1.5 text-xs font-medium" />}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
