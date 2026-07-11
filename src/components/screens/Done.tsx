import type { Theme } from "@/lib/themes";

export function Done({ theme, streak, onReadAgain }: { theme: Theme; streak: number; onReadAgain: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col items-center gap-2.5 text-center">
        <div
          className="breathe flex items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, width: 72, height: 72 }}
        >
          <i className="ti ti-check text-3xl" style={{ color: theme.accent }} aria-hidden="true" />
        </div>
        <span className="font-serif text-xl text-ink">You&apos;ve already been here today.</span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <i className="ti ti-plant-2" aria-hidden="true" /> {streak}-day streak
          </span>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onReadAgain}
          className="w-full rounded-full border py-2.5 text-sm text-ink"
          style={{ borderColor: "rgba(0,0,0,0.18)" }}
        >
          Read it again
        </button>
        <span className="text-xs text-ink-muted">New devotion tomorrow morning</span>
      </div>
    </div>
  );
}
