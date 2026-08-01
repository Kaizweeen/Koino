"use client";

import { useEffect, useState } from "react";
import { computeStreak, longestStreak, loadProgress } from "@/lib/progress";
import { lastNDays } from "@/lib/week";

function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const BRAND = "#0F6E56";

export function HistoryView() {
  const [today, setToday] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setToday(localToday());
    setCompleted(loadProgress().completedDates);
  }, []);

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
  const grid = lastNDays(today, 28);
  const current = computeStreak(completed, today);

  return (
    <div className="fade-in flex flex-col gap-7 p-5 pb-6" style={{ ["--accent" as string]: BRAND }}>
      <h1 className="font-serif text-3xl text-ink">Your history</h1>

      <section
        className="relative overflow-hidden rounded-well p-6 shadow-card"
        style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, ${BRAND} 28%, transparent), transparent 70%)` }}
        />
        <div className="relative">
          <p className="text-[11px] font-medium uppercase tracking-widest2" style={{ color: BRAND }}>Current streak</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-5xl leading-none" style={{ color: BRAND }}>{current}</span>
            <span className="text-lg" style={{ color: BRAND, opacity: 0.7 }}>{current === 1 ? "day" : "days"}</span>
            <i className="ti ti-plant-2 breathe ml-auto text-2xl" style={{ color: BRAND, ["--accent" as string]: BRAND }} aria-hidden="true" />
          </div>
          <div
            className="mt-5 flex gap-8 border-t pt-3.5 text-xs"
            style={{ borderColor: "color-mix(in srgb, #0F6E56 22%, transparent)", color: `color-mix(in srgb, ${BRAND} 45%, var(--ink))` }}
          >
            <span>Longest streak <b className="font-semibold" style={{ color: BRAND }}>{longestStreak(completed)}</b></span>
            <span>Total days <b className="font-semibold" style={{ color: BRAND }}>{completed.length}</b></span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Last four weeks</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((date) => {
            const isDone = done.has(date);
            const isToday = date === today;
            return (
              <span
                key={date}
                title={date}
                className="aspect-square rounded-md transition-colors"
                style={
                  isDone
                    ? { background: BRAND, boxShadow: `0 4px 10px -6px color-mix(in srgb, ${BRAND} 80%, transparent)` }
                    : {
                        background: "var(--canvas)",
                        border: isToday ? `1.5px solid ${BRAND}` : "1px solid var(--hairline)",
                      }
                }
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BRAND }} /> completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--canvas)", border: "1px solid var(--hairline)" }} /> missed
          </span>
        </div>
      </section>
    </div>
  );
}
