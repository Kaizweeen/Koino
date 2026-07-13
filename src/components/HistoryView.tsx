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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 rounded-xl bg-[#F1EFE8] p-3 text-center">
      <p className="text-2xl font-medium text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">{label}</p>
    </div>
  );
}

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
        <div className="breathe h-12 w-12 rounded-full border border-ink-muted/30 bg-white/60" aria-hidden="true" />
      </div>
    );
  }

  const done = new Set(completed);
  const grid = lastNDays(today, 28);

  return (
    <div className="fade-in flex flex-col gap-6 p-5 pb-4">
      <h1 className="font-serif text-2xl text-ink">Your history</h1>

      <div className="flex gap-2.5">
        <Stat value={computeStreak(completed, today)} label="Current streak" />
        <Stat value={longestStreak(completed)} label="Longest streak" />
        <Stat value={completed.length} label="Total days" />
      </div>

      <section>
        <h2 className="mb-2.5 text-[11px] uppercase tracking-wider text-ink-muted">Last four weeks</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((date) => (
            <span
              key={date}
              title={date}
              className="aspect-square rounded-md"
              style={
                done.has(date)
                  ? { background: "#3B6D11" }
                  : { background: "#F1EFE8", border: "0.5px solid #E4E2DA" }
              }
            />
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-3 text-[10px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#3B6D11" }} /> completed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#F1EFE8", border: "0.5px solid #E4E2DA" }} /> missed
          </span>
        </div>
      </section>
    </div>
  );
}
