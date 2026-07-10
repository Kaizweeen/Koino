import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

export function Reflection({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col gap-3 text-center">
        <span className="text-xs uppercase tracking-widest text-ink-muted">Reflection</span>
        <p className="text-sm leading-relaxed text-ink-secondary">{devotion.reflection}</p>
      </div>
      <button onClick={onContinue} className="mx-auto flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
        Continue <i className="ti ti-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
}
