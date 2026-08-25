import type { Theme } from "@/lib/themes";
import { Icon } from "@/components/Icon";

export function Arrival({ theme, today, streak, greeting, onBegin }: { theme: Theme; today: string; streak: number; greeting: string; onBegin: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-7 py-8">
      <div className="stagger my-auto flex flex-col items-center gap-6 text-center">
        <span className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">{today}</span>

        <div className="relative flex h-28 w-28 items-center justify-center">
          <span
            className="breathe absolute inset-0 rounded-full"
            style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}
            aria-hidden="true"
          />
          <Icon name={theme.icon} className="relative text-4xl" style={{ color: theme.accent }} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <h1 className="font-serif text-display text-ink">{greeting}</h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
            style={{ background: theme.accentSoft, color: theme.accent }}
          >
            <Icon name={theme.icon} /> {theme.name}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button onClick={onBegin} className="btn-primary w-full rounded-full py-3.5 text-[15px] font-medium">
          Begin
        </button>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <Icon name="plant-2" style={{ color: theme.accent }} /> {streak}-day streak
          </span>
        )}
      </div>
    </div>
  );
}
