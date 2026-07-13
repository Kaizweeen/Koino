"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme, THEMES } from "@/lib/themes";
import { getTodayDevotion, getSavedDevotions } from "@/lib/devotions/select";
import { computeStreak, loadProgress } from "@/lib/progress";
import { formatDisplayDate, greetingForHour } from "@/lib/dates";
import { lastNDays, weekdayInitial } from "@/lib/week";

function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function HomeHub() {
  const [today, setToday] = useState<string | null>(null);
  const [progress, setProgress] = useState(() => loadProgress());

  useEffect(() => {
    setToday(localToday());
    setProgress(loadProgress());
  }, []);

  if (!today) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="breathe h-14 w-14 rounded-full border border-ink-muted/30 bg-white/60" aria-hidden="true" />
      </div>
    );
  }

  const devotion = getTodayDevotion(DEVOTIONS, today);
  const theme = getTheme(devotion.theme);
  const completedToday = progress.completedDates.includes(today);
  const streak = computeStreak(progress.completedDates, today);
  const week = lastNDays(today, 7).map((date) => ({ date, done: progress.completedDates.includes(date) }));
  const saved = getSavedDevotions(DEVOTIONS, progress.favorites).slice(0, 2);
  const exploreThemes = Object.values(THEMES).slice(0, 4);

  return (
    <div className="fade-in flex flex-col gap-6 p-5 pb-4">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-base font-medium text-ink">{greetingForHour(new Date().getHours())}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{formatDisplayDate(today)}</p>
        </div>
        {streak > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: theme.accentSoft, color: theme.accent }}
          >
            <i className="ti ti-plant-2" aria-hidden="true" /> {streak}
          </span>
        )}
      </header>

      <Link
        href="/today"
        className="block rounded-2xl border p-5 transition-transform active:scale-[0.99]"
        style={{ background: theme.accentSoft, borderColor: theme.accentBorder }}
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: theme.accent }}>
          <i className={`ti ti-${theme.icon}`} aria-hidden="true" /> Today · {theme.name}
        </span>
        <p className="mt-2.5 font-serif text-xl leading-snug" style={{ color: theme.accent }}>
          {devotion.verseText}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: theme.accent, opacity: 0.7 }}>
          {devotion.verseRef}
        </p>
        <span
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium text-white"
          style={{ background: theme.accent }}
        >
          {completedToday ? "Revisit today" : "Begin today's devotion"}
          <i className="ti ti-arrow-right" aria-hidden="true" />
        </span>
      </Link>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-wider text-ink-muted">This week</h2>
          <Link href="/history" className="text-[11px] text-ink-muted transition-colors hover:text-ink">
            See all
          </Link>
        </div>
        <div className="flex justify-between">
          {week.map(({ date, done }) => (
            <span
              key={date}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px]"
              style={
                done
                  ? { background: theme.accent, color: "#fff" }
                  : { background: "#F1EFE8", color: "#B4B2A9", border: "1px dashed #D3D1C7" }
              }
            >
              {weekdayInitial(date)}
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-wider text-ink-muted">Saved</h2>
          {saved.length > 0 && (
            <Link href="/saved" className="text-[11px] text-ink-muted transition-colors hover:text-ink">
              See all
            </Link>
          )}
        </div>
        {saved.length === 0 ? (
          <p className="rounded-xl border border-black/10 p-4 text-center text-xs text-ink-muted">
            Nothing saved yet. Tap the heart after a devotion to keep it here.
          </p>
        ) : (
          <div className="flex gap-2.5">
            {saved.map((d) => {
              const t = getTheme(d.theme);
              return (
                <div key={d.date} className="flex-1 rounded-xl border border-black/10 p-3">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />
                  <p className="mt-1.5 line-clamp-2 font-serif text-sm leading-tight text-ink">{d.verseText}</p>
                  <p className="mt-1 text-[10px] text-ink-muted">{d.verseRef}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2.5 text-[11px] uppercase tracking-wider text-ink-muted">Explore themes</h2>
        <div className="flex flex-wrap gap-1.5">
          {exploreThemes.map((t) => (
            <Link
              key={t.slug}
              href="/themes"
              className="rounded-full px-3 py-1 text-xs transition-transform active:scale-95"
              style={{ background: t.accentSoft, color: t.accent }}
            >
              {t.name}
            </Link>
          ))}
          <Link
            href="/themes"
            className="rounded-full bg-[#F1EFE8] px-3 py-1 text-xs text-ink-secondary transition-transform active:scale-95"
          >
            +8
          </Link>
        </div>
      </section>
    </div>
  );
}
