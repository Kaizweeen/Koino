"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getSavedDevotions } from "@/lib/devotions/select";
import { loadProgress } from "@/lib/progress";
import { formatDisplayDate } from "@/lib/dates";

export function SavedList() {
  const [saved, setSaved] = useState<ReturnType<typeof getSavedDevotions> | null>(null);

  useEffect(() => {
    setSaved(getSavedDevotions(DEVOTIONS, loadProgress().favorites));
  }, []);

  return (
    <div className="fade-in flex flex-col gap-4 p-5 pb-4">
      <h1 className="font-serif text-2xl text-ink">Saved</h1>

      {saved === null ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="breathe h-12 w-12 rounded-full border border-ink-muted/30 bg-white/60" aria-hidden="true" />
        </div>
      ) : saved.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <i className="ti ti-heart text-3xl text-ink-muted" aria-hidden="true" />
          <p className="text-sm text-ink-secondary">You haven&apos;t saved anything yet.</p>
          <p className="max-w-[16rem] text-xs text-ink-muted">
            Tap the heart when you finish a devotion, and it will wait for you here.
          </p>
          <Link
            href="/today"
            className="mt-2 rounded-full border border-black/15 px-4 py-2 text-sm text-ink transition-transform active:scale-95"
          >
            Go to today&apos;s devotion
          </Link>
        </div>
      ) : (
        saved.map((d) => {
          const t = getTheme(d.theme);
          return (
            <article key={d.date} className="rounded-2xl border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ background: t.accentSoft, color: t.accent }}
                >
                  <i className={`ti ti-${t.icon}`} aria-hidden="true" /> {t.name}
                </span>
                <span className="text-[10px] text-ink-muted">{formatDisplayDate(d.date)}</span>
              </div>
              <p className="mt-3 font-serif text-lg leading-snug text-ink">{d.verseText}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-muted">{d.verseRef}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{d.reflection}</p>
            </article>
          );
        })
      )}
    </div>
  );
}
