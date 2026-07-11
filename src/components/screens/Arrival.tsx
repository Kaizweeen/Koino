import type { Theme } from "@/lib/themes";

export function Arrival({ theme, today, streak, greeting, onBegin }: { theme: Theme; today: string; streak: number; greeting: string; onBegin: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col items-center gap-3 text-center">
        <span className="text-xs uppercase tracking-widest text-ink-muted">{today}</span>
        <span className="text-xl font-medium text-ink">{greeting}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
          style={{ background: theme.accentSoft, color: theme.accent }}>
          <i className={`ti ti-${theme.icon}`} aria-hidden="true" /> {theme.name}
        </span>
        <div className="breathe mt-1 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}>
          <i className={`ti ti-${theme.icon} text-2xl`} style={{ color: theme.accent }} aria-hidden="true" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button onClick={onBegin} className="w-full rounded-full py-3 text-sm font-medium text-white" style={{ background: theme.accent }}>
          Begin
        </button>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <i className="ti ti-plant-2" aria-hidden="true" /> {streak}-day streak
          </span>
        )}
      </div>
    </div>
  );
}
