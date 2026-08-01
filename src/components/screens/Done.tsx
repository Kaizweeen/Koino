import type { Theme } from "@/lib/themes";

export function Done({ theme, streak, onReadAgain }: { theme: Theme; streak: number; onReadAgain: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-7 py-8">
      <div className="stagger my-auto flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-[84px] w-[84px] items-center justify-center">
          <span
            className="breathe absolute inset-0 rounded-full"
            style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}
            aria-hidden="true"
          />
          <i className="ti ti-check relative text-3xl" style={{ color: theme.accent }} aria-hidden="true" />
        </div>
        <span className="max-w-[16rem] font-serif text-2xl leading-snug text-ink">You&apos;ve already been here today.</span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <i className="ti ti-plant-2" style={{ color: theme.accent }} aria-hidden="true" /> {streak}-day streak
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button onClick={onReadAgain} className="btn-quiet w-full rounded-full py-3.5 text-[15px] font-medium">
          Read it again
        </button>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <i className="ti ti-sunrise" style={{ color: theme.accent }} aria-hidden="true" /> New devotion tomorrow morning
        </span>
      </div>
    </div>
  );
}
