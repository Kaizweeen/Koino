import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";

export function Linger({ devotion, theme, playlistId }: { devotion: Devotion; theme: Theme; playlistId: string }) {
  return (
    <div className="flex flex-1 flex-col gap-3 p-6">
      <span className="text-base font-medium text-ink">Today</span>
      <div className="flex items-center gap-2.5 rounded-xl border p-3" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: theme.accentSoft }}>
          <i className="ti ti-check" style={{ color: theme.accent }} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{theme.name} — completed</p>
          <p className="text-xs text-ink-muted">{devotion.verseRef}</p>
        </div>
      </div>
      <SpotifyEmbed playlistId={playlistId} title={`${theme.name} playlist`} />
      <span className="mt-auto text-center text-xs text-ink-muted">New devotion tomorrow morning</span>
    </div>
  );
}
