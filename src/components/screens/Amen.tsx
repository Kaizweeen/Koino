import type { Theme } from "@/lib/themes";
import type { Verse } from "@/lib/devotions/types";
import { milestoneFor } from "@/lib/streak";
import { ShareButton } from "@/components/ShareButton";
import { Icon } from "@/components/Icon";

export function Amen({
  verse,
  theme,
  streak,
  favorite,
  onToggleFavorite,
  reflection,
}: {
  verse: Verse;
  theme: Theme;
  /**
   * The daily rhythm this sitting belongs to. Left out for a verse the reader chose themselves:
   * the streak is the shape of the daily devotion, and claiming one here would either be wrong or
   * quietly redefine what the number counts.
   */
  streak?: number;
  favorite: boolean;
  onToggleFavorite: () => void;
  reflection: string;
}) {
  const milestone = streak === undefined ? null : milestoneFor(streak);
  return (
    <div className="flex flex-1 flex-col gap-6 px-7 py-8 lg:gap-10 lg:px-16 lg:py-14">
      <div className="my-auto flex flex-col items-center gap-3 text-center lg:gap-5">
        <div className="relative flex h-[78px] w-[78px] items-center justify-center lg:h-32 lg:w-32">
          <span className="bloom-ring absolute inset-0 rounded-full border" style={{ borderColor: theme.accentBorder }} aria-hidden="true" />
          <span className="bloom flex h-[78px] w-[78px] items-center justify-center rounded-full lg:h-32 lg:w-32" style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}>
            <Icon name="check" className="text-3xl lg:text-5xl" style={{ color: theme.accent }} />
          </span>
        </div>
        <span className="font-serif text-2xl text-ink lg:text-[3.25rem] lg:leading-tight">Amen.</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted lg:text-sm">
          {streak === undefined ? (
            <>
              <Icon name="book" style={{ color: theme.accent }} /> Kept in your journal
            </>
          ) : (
            <>
              <Icon name="plant-2" style={{ color: theme.accent }} /> {streak}-day streak
            </>
          )}
        </span>
        {milestone && (
          <span
            className="rise-in mt-1 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium lg:px-5 lg:py-2.5 lg:text-sm"
            style={{ background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accentBorder}` }}
          >
            <Icon name="sparkles" /> {milestone.title}
          </span>
        )}
      </div>

      <div className="flex gap-3 lg:mx-auto lg:w-full lg:max-w-lg lg:gap-4">
        <button
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium transition-colors lg:py-3.5 lg:text-base"
          style={
            favorite
              ? { background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accentBorder}` }
              : { background: "var(--paper)", color: theme.accent, border: "1px solid var(--hairline)" }
          }
        >
          <Icon name="heart" />
          {favorite ? "Saved" : "Save"}
        </button>
        <ShareButton
          verse={verse}
          theme={theme}
          reflection={reflection}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium lg:py-3.5 lg:text-base"
        />
      </div>
    </div>
  );
}
