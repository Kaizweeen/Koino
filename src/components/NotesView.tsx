"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getDevotionForDate } from "@/lib/devotions/select";
import { loadProgress, notedDates, setNote } from "@/lib/progress";
import { formatDisplayDate } from "@/lib/dates";

export function NotesView() {
  const [dates, setDates] = useState<string[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = loadProgress();
    setDates(notedDates(p));
    setDrafts(p.notes);
  }, []);

  function edit(date: string, text: string) {
    setDrafts((d) => ({ ...d, [date]: text }));
    setNote(date, text);
  }

  return (
    <div className="fade-in flex flex-col gap-4 p-5 pb-4">
      <div>
        <h1 className="font-serif text-2xl text-ink">Notes</h1>
        <p className="mt-1 text-xs text-ink-muted">Your responses, kept with the verse that stirred them.</p>
      </div>

      {dates === null ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="breathe h-12 w-12 rounded-full border border-ink-muted/30 bg-white/60" aria-hidden="true" />
        </div>
      ) : dates.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <i className="ti ti-notebook text-3xl text-ink-muted" aria-hidden="true" />
          <p className="text-sm text-ink-secondary">No notes yet.</p>
          <p className="max-w-[16rem] text-xs text-ink-muted">
            When you finish a devotion, jot down what stirred you — it will gather here.
          </p>
          <Link
            href="/today"
            className="mt-2 rounded-full border border-black/15 px-4 py-2 text-sm text-ink transition-transform active:scale-95"
          >
            Go to today&apos;s devotion
          </Link>
        </div>
      ) : (
        dates.map((date) => {
          const d = getDevotionForDate(DEVOTIONS, date);
          const t = d ? getTheme(d.theme) : null;
          return (
            <article key={date} className="rounded-2xl border border-black/10 p-4">
              <div className="flex items-center justify-between">
                {t && d ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ background: t.accentSoft, color: t.accent }}
                  >
                    <i className={`ti ti-${t.icon}`} aria-hidden="true" /> {t.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-muted">Devotion</span>
                )}
                <span className="text-[10px] text-ink-muted">{formatDisplayDate(date)}</span>
              </div>
              {d && (
                <p className="mt-2.5 font-serif text-base leading-snug text-ink">{d.verseText}</p>
              )}
              <textarea
                value={drafts[date] ?? ""}
                onChange={(e) => edit(date, e.target.value)}
                rows={3}
                aria-label={`Note for ${formatDisplayDate(date)}`}
                placeholder="Write a note…"
                className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white p-3 font-serif text-sm leading-relaxed text-ink outline-none placeholder:font-sans placeholder:text-ink-muted focus:border-black/25"
              />
            </article>
          );
        })
      )}
    </div>
  );
}
