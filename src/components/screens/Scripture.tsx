"use client";

import { useMemo, useState } from "react";
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { SoapProgress } from "@/components/screens/SoapProgress";
import { ChapterSheet } from "@/components/bible/ChapterSheet";
import { parseReference } from "@/lib/bible/refs";
import { Icon } from "@/components/Icon";

export function Scripture({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  const [chapterOpen, setChapterOpen] = useState(false);
  // A reference the reader can't resolve simply means no chapter affordance, never a broken screen.
  const reference = useMemo(() => parseReference(devotion.verseRef), [devotion.verseRef]);

  return (
    <div className="flex flex-1 flex-col px-7 py-7">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {theme.name}
        </span>
        <SoapProgress current={1} accent={theme.accent} />
      </div>

      <div className="stagger my-auto flex flex-col items-center gap-6 text-center">
        <p className="max-w-[19rem] font-serif text-verse text-balance text-ink">{devotion.verseText}</p>
        <div className="flex flex-col items-center gap-3">
          <span className="h-px w-8 rounded-full" style={{ background: theme.accentBorder }} aria-hidden="true" />
          <span className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">{devotion.verseRef}</span>
          {reference && (
            <button
              onClick={() => setChapterOpen(true)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-ink-secondary hover:decoration-current"
            >
              Read the whole chapter
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="group mx-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
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
