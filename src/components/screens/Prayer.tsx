import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

export function Prayer({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  return (
    <button onClick={onContinue} className="flex h-full w-full flex-col p-6 text-left" style={{ background: "#211F1C" }}>
      <span className="text-center text-sm font-medium" style={{ color: theme.accentBorder }}>{theme.name}</span>
      <div className="my-auto flex flex-col items-center gap-3 text-center">
        <span className="text-xs uppercase tracking-widest" style={{ color: "#7E7C72" }}>A prayer</span>
        <p className="font-serif text-lg leading-relaxed" style={{ color: "#E8E4DA" }}>{devotion.prayer}</p>
      </div>
      <span className="text-center text-xs" style={{ color: "#7E7C72" }}>Tap when you're ready</span>
    </button>
  );
}
