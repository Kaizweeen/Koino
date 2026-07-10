import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

export function Verse({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between text-ink-secondary">
        <i className="ti ti-chevron-left text-xl" aria-hidden="true" />
        <span className="text-sm font-medium" style={{ color: theme.accent }}>{theme.name}</span>
        <span style={{ width: 17 }} />
      </div>
      <div className="my-auto flex flex-col items-center gap-4 text-center">
        <p className="font-serif text-2xl leading-relaxed text-ink">{devotion.verseText}</p>
        <span className="text-xs uppercase tracking-widest text-ink-muted">{devotion.verseRef}</span>
      </div>
      <button onClick={onContinue} className="mx-auto flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
        Continue <i className="ti ti-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
}
