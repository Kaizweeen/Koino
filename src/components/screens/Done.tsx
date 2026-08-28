import type { Theme } from "@/lib/themes";
import { Icon } from "@/components/Icon";

export function Done({ theme, streak, onReadAgain }: { theme: Theme; streak: number; onReadAgain: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-7 py-8 lg:px-16 lg:py-14">
      <div className="stagger my-auto flex flex-col items-center gap-4 text-center lg:gap-7">
        <div className="relative flex h-[84px] w-[84px] items-center justify-center lg:h-32 lg:w-32">
          <span
            className="breathe absolute inset-0 rounded-full"
            style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}
            aria-hidden="true"
          />
          <Icon name="check" className="relative text-3xl lg:text-5xl" style={{ color: theme.accent }} />
        </div>
        <span className="max-w-[16rem] font-serif text-2xl leading-snug text-ink lg:max-w-[30rem] lg:text-[3rem] lg:leading-[1.15]">You&apos;ve already been here today.</span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted lg:text-sm">
            <Icon name="plant-2" style={{ color: theme.accent }} /> {streak}-day streak
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 lg:gap-5">
        <button onClick={onReadAgain} className="btn-quiet w-full rounded-full py-3.5 text-[15px] font-medium lg:w-auto lg:px-24 lg:py-4 lg:text-base">
          Read it again
        </button>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted lg:text-sm">
          <Icon name="sunrise" style={{ color: theme.accent }} /> New devotion tomorrow morning
        </span>
      </div>
    </div>
  );
}
