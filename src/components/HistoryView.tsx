"use client";

import { useEffect, useRef, useState } from "react";
import { computeStreak, longestStreak, loadProgress } from "@/lib/progress";
import { Icon } from "@/components/Icon";

const BRAND = "#0F6E56";

function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* Date helpers keyed to the same UTC-midnight convention the rest of the app uses,
   so weekday alignment matches the stored "YYYY-MM-DD" completion dates. */
function addDays(date: string, delta: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + delta * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}
function weekdayIndex(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
}
function monthShort(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

// Rows run Sunday..Saturday; label only Mon/Wed/Fri, GitHub-style.
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface Cell {
  date: string;
  done: boolean;
  isToday: boolean;
  future: boolean;
}

function StatTile({ label, value, unit, icon }: { label: string; value: number; unit: string; icon: string }) {
  return (
    <div className="rounded-well border bg-paper p-4 shadow-card lg:p-5" style={{ borderColor: "var(--hairline)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-widest2 text-ink-muted lg:text-[11px]">{label}</p>
        <Icon name={icon} className="text-sm" style={{ color: BRAND }} />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-serif text-3xl leading-none text-ink lg:text-4xl">{value}</span>
        <span className="text-xs text-ink-muted">{unit}</span>
      </div>
    </div>
  );
}

export function HistoryView() {
  const [today, setToday] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  const rhythmRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setToday(localToday());
    setCompleted(loadProgress().completedDates);
  }, []);

  // Open the rhythm graph on the most recent weeks (the right edge), so today's
  // streak is what you see first when the history is wide enough to scroll.
  useEffect(() => {
    const el = rhythmRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [today, completed]);

  if (!today) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="breathe h-12 w-12 rounded-full"
          style={{ ["--accent" as string]: BRAND, background: "#E1F5EE", border: "1px solid #9FE1CB" }}
          aria-hidden="true"
        />
      </div>
    );
  }

  const done = new Set(completed);
  const current = computeStreak(completed, today);
  const longest = longestStreak(completed);
  const total = completed.length;

  // Build a weekday-aligned graph: columns are weeks (Sun..Sat), most recent on the right.
  // Window grows with the account's history, clamped so it never feels empty or endless.
  const endSaturday = addDays(today, 6 - weekdayIndex(today));
  const firstCompleted = total > 0 ? [...completed].sort()[0] : today;
  const startCandidate = addDays(firstCompleted, -weekdayIndex(firstCompleted));
  const spanDays = (Date.parse(`${endSaturday}T00:00:00Z`) - Date.parse(`${startCandidate}T00:00:00Z`)) / 86_400_000;
  const weeksToShow = Math.max(14, Math.min(26, Math.round((spanDays + 1) / 7)));
  const startSunday = addDays(endSaturday, -(weeksToShow * 7 - 1));

  const weeks: Cell[][] = [];
  for (let w = 0; w < weeksToShow; w += 1) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(startSunday, w * 7 + d);
      col.push({ date, done: done.has(date), isToday: date === today, future: date > today });
    }
    weeks.push(col);
  }
  // A month label above the first column that falls in a new month.
  const monthLabels = weeks.map((col, i) =>
    i === 0 || monthShort(col[0].date) !== monthShort(weeks[i - 1][0].date) ? monthShort(col[0].date) : "",
  );

  return (
    <div className="fade-in mx-auto flex w-full max-w-5xl flex-col gap-6 p-5 pb-6 lg:gap-8 lg:px-10 lg:py-12" style={{ ["--accent" as string]: BRAND }}>
      <header>
        <h1 className="font-serif text-3xl text-ink lg:text-4xl">Your history</h1>
        <p className="mt-1 text-xs text-ink-muted lg:mt-2 lg:text-sm">Every morning you&apos;ve returned, gathered in one place.</p>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        {/* Stats: current streak hero + longest/total tiles */}
        <div className="flex flex-col gap-3 lg:col-span-5 lg:gap-4">
          <section
            className="relative overflow-hidden rounded-well p-6 shadow-card lg:p-8"
            style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full lg:h-52 lg:w-52"
              style={{ background: `radial-gradient(circle, color-mix(in srgb, ${BRAND} 28%, transparent), transparent 70%)` }}
            />
            <div className="relative">
              <p className="text-[11px] font-medium uppercase tracking-widest2" style={{ color: BRAND }}>Current streak</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-serif text-5xl leading-none lg:text-6xl" style={{ color: BRAND }}>{current}</span>
                <span className="text-lg" style={{ color: BRAND, opacity: 0.7 }}>{current === 1 ? "day" : "days"}</span>
                <span
                className="breathe ml-auto flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full lg:h-12 lg:w-12"
                style={{ background: "color-mix(in srgb, var(--brand) 14%, transparent)", ["--accent" as string]: BRAND }}
                aria-hidden="true"
              >
                <Icon name="plant-2" className="text-xl lg:text-2xl" style={{ color: BRAND }} />
              </span>
              </div>
              <p className="mt-4 text-xs lg:text-sm" style={{ color: `color-mix(in srgb, ${BRAND} 45%, var(--ink))` }}>
                {current > 0 ? "Keep the rhythm going tomorrow morning." : "Begin today to start a new streak."}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <StatTile label="Longest streak" value={longest} unit={longest === 1 ? "day" : "days"} icon="flame" />
            <StatTile label="Total days" value={total} unit={total === 1 ? "day" : "days"} icon="calendar-heart" />
          </div>
        </div>

        {/* Rhythm graph */}
        <section className="rounded-well border bg-paper p-5 shadow-card lg:col-span-7 lg:p-7" style={{ borderColor: "var(--hairline)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Your rhythm</h2>
            <span className="text-[11px] text-ink-muted">Last {weeksToShow} weeks</span>
          </div>

          <div ref={rhythmRef} className="no-scrollbar overflow-x-auto pb-1">
            <div className="flex min-w-max gap-1">
              {/* Weekday gutter */}
              <div className="flex flex-col gap-1 pr-1">
                <span className="h-3" aria-hidden="true" />
                {WEEKDAY_LABELS.map((lab, i) => (
                  <span key={i} className="flex h-4 w-7 items-center text-[10px] leading-none text-ink-muted lg:h-5">
                    {lab}
                  </span>
                ))}
              </div>
              {/* Week columns */}
              {weeks.map((col, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  <span className="h-3 whitespace-nowrap text-[10px] leading-none text-ink-muted">{monthLabels[wi]}</span>
                  {col.map((cell) =>
                    cell.future ? (
                      <span key={cell.date} className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden="true" />
                    ) : (
                      <span
                        key={cell.date}
                        title={cell.date}
                        className="h-4 w-4 rounded-[3px] lg:h-5 lg:w-5"
                        style={
                          cell.done
                            ? { background: BRAND, boxShadow: `0 3px 8px -5px color-mix(in srgb, ${BRAND} 80%, transparent)` }
                            : { background: "var(--canvas)", border: cell.isToday ? `1.5px solid ${BRAND}` : "1px solid var(--hairline)" }
                        }
                      />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-[10px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: BRAND }} /> completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--canvas)", border: "1px solid var(--hairline)" }} /> missed
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
