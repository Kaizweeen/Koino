import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { StepDots } from "@/components/screens/StepDots";

export function Reflection({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {theme.name}
        </span>
        <StepDots current={2} accent={theme.accent} />
      </div>
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
