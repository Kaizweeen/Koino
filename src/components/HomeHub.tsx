"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme, THEMES } from "@/lib/themes";
import { getTodayDevotion, getDevotionForDate } from "@/lib/devotions/select";
import { computeStreak, loadProgress, entryDates, getEntry } from "@/lib/progress";
import { formatDisplayDate, greetingForHour } from "@/lib/dates";
import { lastNDays, weekdayInitial } from "@/lib/week";
import { Atmosphere } from "@/components/Atmosphere";

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
        <div
          className="breathe h-14 w-14 rounded-full"
          style={{ ["--accent" as string]: "#0F6E56", background: "#E1F5EE", border: "1px solid #9FE1CB" }}
          aria-hidden="true"
        />
      </div>
    );
  }

  const devotion = getTodayDevotion(DEVOTIONS, today);
  const theme = getTheme(devotion.theme);
  const completedToday = progress.completedDates.includes(today);
  const streak = computeStreak(progress.completedDates, today);
  const week = lastNDays(today, 7).map((date) => ({ date, done: progress.completedDates.includes(date), isToday: date === today }));
  const recent = entryDates(progress)
    .map((date) => ({ date, devotion: getDevotionForDate(DEVOTIONS, date), entry: getEntry(progress, date) }))
    .filter((r) => r.devotion !== null)
    .slice(0, 2);
  const exploreThemes = Object.values(THEMES).slice(0, 4);

  return (
    <div className="relative min-h-screen" style={{ ["--accent" as string]: theme.accent }}>
      <Atmosphere accent={theme.accent} className="opacity-70" />

      <div className="fade-in relative z-10 flex flex-col gap-7 p-5 pb-6">
        <header className="flex items-start justify-between pt-1">
          <div>
            <p className="font-serif text-[1.6rem] leading-tight text-ink">{greetingForHour(new Date().getHours())}</p>
            <p className="mt-1 text-xs text-ink-muted">{formatDisplayDate(today)}</p>
          </div>
          {streak > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm"
              style={{ background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accentBorder}` }}
            >
              <i className="ti ti-plant-2" aria-hidden="true" /> {streak}
            </span>
          )}
        </header>

        <Link
          href="/today"
          className="group relative block overflow-hidden rounded-well p-6 shadow-card transition-transform active:scale-[0.99]"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full"
            style={{ background: `radial-gradient(circle, color-mix(in srgb, ${theme.accent} 26%, transparent), transparent 70%)` }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest2" style={{ color: theme.accent }}>
              <i className={`ti ti-${theme.icon}`} aria-hidden="true" /> Today · {theme.name}
            </span>
            <p className="mt-3 font-serif text-[1.35rem] leading-snug text-balance" style={{ color: theme.accent }}>
              {devotion.verseText}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-widest2" style={{ color: theme.accent, opacity: 0.65 }}>
              {devotion.verseRef}
            </p>
            <span className="btn-primary mt-5 flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium">
              {completedToday ? "Revisit today" : "Begin today's devotion"}
              <i className="ti ti-arrow-right transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">This week</h2>
            <Link href="/history" className="text-[11px] text-ink-muted transition-colors hover:text-ink">
              See all
            </Link>
          </div>
          <div className="flex justify-between">
            {week.map(({ date, done, isToday }) => (
              <span
                key={date}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-medium"
                style={
                  done
                    ? { background: theme.accent, color: "#fff", boxShadow: `0 6px 14px -6px color-mix(in srgb, ${theme.accent} 70%, transparent)` }
                    : {
                        background: "var(--paper)",
                        color: "var(--ink-muted)",
                        border: isToday ? `1.5px solid ${theme.accent}` : "1px dashed color-mix(in srgb, var(--ink) 16%, transparent)",
                      }
                }
              >
                {weekdayInitial(date)}
              </span>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Journal</h2>
            {recent.length > 0 && (
              <Link href="/journal" className="text-[11px] text-ink-muted transition-colors hover:text-ink">
                See all
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <p
              className="rounded-2xl border bg-paper p-4 text-center text-xs text-ink-muted"
              style={{ borderColor: "var(--hairline)" }}
            >
              Your journal is waiting. Finish today&apos;s devotion to write your first entry.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recent.map(({ date, devotion: rd, entry }) => {
                const rt = getTheme(rd!.theme);
                const snippet = entry.observation || entry.application || entry.prayer;
                return (
                  <Link
                    key={date}
                    href="/journal"
                    className="block rounded-2xl border bg-paper p-3.5 shadow-card transition-transform active:scale-[0.99]"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: rt.accent }}>
                      <i className={`ti ti-${rt.icon}`} aria-hidden="true" /> {rt.name}
                    </span>
                    <p className="mt-1.5 line-clamp-2 font-serif text-sm leading-snug text-ink">{snippet}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Explore themes</h2>
          <div className="flex flex-wrap gap-2">
            {exploreThemes.map((t) => (
              <Link
                key={t.slug}
                href="/themes"
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-transform active:scale-95"
                style={{ background: t.accentSoft, color: t.accent }}
              >
                <i className={`ti ti-${t.icon}`} aria-hidden="true" /> {t.name}
              </Link>
            ))}
            <Link
              href="/themes"
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-secondary transition-transform active:scale-95"
              style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)" }}
            >
              +8 more
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
