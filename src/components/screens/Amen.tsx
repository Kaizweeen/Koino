import type { Theme } from "@/lib/themes";

export function Amen({ theme, streak, favorite, onToggleFavorite }: { theme: Theme; streak: number; favorite: boolean; onToggleFavorite: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col items-center gap-2.5 text-center">
        <div className="flex h-18 w-18 items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, width: 72, height: 72 }}>
          <i className="ti ti-check text-3xl" style={{ color: theme.accent }} aria-hidden="true" />
        </div>
        <span className="font-serif text-xl text-ink">Amen.</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <i className="ti ti-plant-2" aria-hidden="true" /> {streak}-day streak
        </span>
      </div>
      <button onClick={onToggleFavorite} className="flex items-center justify-center gap-1.5 rounded-full border py-2.5 text-sm"
        style={{ borderColor: "rgba(0,0,0,0.18)", color: theme.accent }}>
        <i className="ti ti-heart" aria-hidden="true" />
        {favorite ? "Saved" : "Save"}
      </button>
    </div>
  );
}
