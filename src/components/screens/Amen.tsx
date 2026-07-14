import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { ShareButton } from "@/components/ShareButton";

export function Amen({
  devotion,
  theme,
  streak,
  favorite,
  onToggleFavorite,
  note,
  onChangeNote,
}: {
  devotion: Devotion;
  theme: Theme;
  streak: number;
  favorite: boolean;
  onToggleFavorite: () => void;
  note: string;
  onChangeNote: (text: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-5 p-6">
      <div className="mt-2 flex flex-col items-center gap-2.5 text-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, width: 72, height: 72 }}
        >
          <i className="ti ti-check text-3xl" style={{ color: theme.accent }} aria-hidden="true" />
        </div>
        <span className="font-serif text-xl text-ink">Amen.</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <i className="ti ti-plant-2" aria-hidden="true" /> {streak}-day streak
        </span>
      </div>

      <div className="mt-1 border-t border-black/5 pt-4">
        <label htmlFor="devotion-note" className="mb-2 block text-[11px] uppercase tracking-wider text-ink-muted">
          Your note
        </label>
        <textarea
          id="devotion-note"
          value={note}
          onChange={(e) => onChangeNote(e.target.value)}
          rows={4}
          placeholder="What is God stirring in you today?"
          className="w-full resize-none rounded-xl border border-black/10 bg-white p-3 font-serif text-sm leading-relaxed text-ink outline-none placeholder:font-sans placeholder:text-ink-muted focus:border-black/25"
        />
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-muted">
          <i className="ti ti-check" aria-hidden="true" /> Saved automatically
        </p>
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={onToggleFavorite}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2.5 text-sm"
          style={{ borderColor: "rgba(0,0,0,0.18)", color: theme.accent }}
        >
          <i className="ti ti-heart" aria-hidden="true" />
          {favorite ? "Saved" : "Save"}
        </button>
        <ShareButton
          devotion={devotion}
          theme={theme}
          note={note}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2.5 text-sm"
        />
      </div>
    </div>
  );
}
