"use client";

import { useMemo, useState } from "react";
import type { Theme } from "@/lib/themes";
import type { Verse } from "@/lib/devotions/types";
import { SoapProgress } from "@/components/screens/SoapProgress";
import { ChapterSheet } from "@/components/bible/ChapterSheet";
import { parseReference } from "@/lib/bible/refs";
import { Icon } from "@/components/Icon";

export function Scripture({ verse, theme, onContinue }: { verse: Verse; theme: Theme; onContinue: () => void }) {
  const [chapterOpen, setChapterOpen] = useState(false);
  // A reference the reader can't resolve simply means no chapter affordance, never a broken screen.
  const reference = useMemo(() => parseReference(verse.verseRef), [verse.verseRef]);

  return (
    <div className="flex flex-1 flex-col px-7 py-7 lg:px-16 lg:py-12">
      {/* lg:pl-14 clears the full-bleed flow's back button, which sits in the screen's corner. */}
      <div className="flex items-center justify-between lg:pl-14">
        <span className="inline-flex items-center gap-2 text-sm font-medium lg:text-base" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {theme.name}
        </span>
        <SoapProgress current={1} accent={theme.accent} />
      </div>

      <div className="stagger my-auto flex flex-col items-center gap-6 text-center lg:gap-10">
        <p className="max-w-[19rem] font-serif text-verse text-balance text-ink lg:max-w-[46rem] lg:text-[clamp(2.4rem,3.4vw,3.5rem)] lg:leading-[1.3]">{verse.verseText}</p>
        <div className="flex flex-col items-center gap-3 lg:gap-4">
          <span className="h-px w-8 rounded-full lg:w-12" style={{ background: theme.accentBorder }} aria-hidden="true" />
          <span className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted lg:text-xs">{verse.verseRef}</span>
          {reference && (
            <button
              onClick={() => setChapterOpen(true)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-ink-secondary hover:decoration-current lg:text-sm"
            >
              Read the whole chapter
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="group mx-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium lg:text-base"
        style={{ color: theme.accent }}
      >
        Continue
        <Icon name="arrow-right" className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>

      {chapterOpen && reference && (
        <ChapterSheet reference={reference} accent={theme.accent} onClose={() => setChapterOpen(false)} />
      )}
    </div>
  );
}
