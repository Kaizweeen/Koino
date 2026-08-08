import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { SoapProgress } from "@/components/screens/SoapProgress";

export function Scripture({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
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
        </div>
      </div>

      <button
        onClick={onContinue}
        className="group mx-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
        style={{ color: theme.accent }}
      >
        Continue
        <i className="ti ti-arrow-right transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </div>
  );
}
