import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";

export function Linger({ devotion, theme, playlistId }: { devotion: Devotion; theme: Theme; playlistId: string }) {
  return (
    <div className="stagger flex flex-1 flex-col gap-4 px-7 py-8">
      <h2 className="font-serif text-2xl text-ink">Linger a while</h2>

      <div
        className="flex items-center gap-3 rounded-2xl border bg-paper p-4 shadow-card"
        style={{ borderColor: "var(--hairline)" }}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}
        >
          <i className="ti ti-check text-lg" style={{ color: theme.accent }} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{theme.name} — completed</p>
          <p className="text-xs text-ink-muted">{devotion.verseRef}</p>
        </div>
      </div>

      <span className="mt-1 text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Stay in the music</span>
      <SpotifyEmbed playlistId={playlistId} title={`${theme.name} playlist`} />

      <span className="mt-auto flex items-center justify-center gap-1.5 text-center text-xs text-ink-muted">
        <i className="ti ti-sunrise" style={{ color: theme.accent }} aria-hidden="true" /> New devotion tomorrow morning
      </span>
    </div>
  );
}
