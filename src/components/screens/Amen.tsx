import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { milestoneFor } from "@/lib/streak";
import { ShareButton } from "@/components/ShareButton";
import { Icon } from "@/components/Icon";

export function Amen({
  devotion,
  theme,
  streak,
  favorite,
  onToggleFavorite,
  reflection,
}: {
  devotion: Devotion;
  theme: Theme;
  streak: number;
  favorite: boolean;
  onToggleFavorite: () => void;
  reflection: string;
}) {
  const milestone = milestoneFor(streak);
  return (
    <div className="flex flex-1 flex-col gap-6 px-7 py-8">
      <div className="my-auto flex flex-col items-center gap-3 text-center">
        <div className="relative flex h-[78px] w-[78px] items-center justify-center">
          <span className="bloom-ring absolute inset-0 rounded-full border" style={{ borderColor: theme.accentBorder }} aria-hidden="true" />
          <span className="bloom flex h-[78px] w-[78px] items-center justify-center rounded-full" style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}>
            <Icon name="check" className="text-3xl" style={{ color: theme.accent }} />
          </span>
        </div>
        <span className="font-serif text-2xl text-ink">Amen.</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <Icon name="plant-2" style={{ color: theme.accent }} /> {streak}-day streak
        </span>
        {milestone && (
          <span
            className="rise-in mt-1 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium"
            style={{ background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accentBorder}` }}
          >
            <Icon name="sparkles" /> {milestone.title}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium transition-colors"
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
          devotion={devotion}
          theme={theme}
          reflection={reflection}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium"
        />
      </div>
    </div>
  );
}
