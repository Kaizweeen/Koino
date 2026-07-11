import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { StepDots } from "@/components/screens/StepDots";

export function Verse({ devotion, theme, playlistId, onContinue }: { devotion: Devotion; theme: Theme; playlistId: string; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {theme.name}
        </span>
        <StepDots current={1} accent={theme.accent} />
      </div>
      <div className="my-auto flex flex-col items-center gap-4 text-center">
        <p className="font-serif text-2xl leading-relaxed text-ink">{devotion.verseText}</p>
        <span className="text-xs uppercase tracking-widest text-ink-muted">{devotion.verseRef}</span>
      </div>
      <div className="flex flex-col gap-3">
        <SpotifyEmbed playlistId={playlistId} title={`${theme.name} playlist`} />
        <button onClick={onContinue} className="mx-auto flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
          Continue <i className="ti ti-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
