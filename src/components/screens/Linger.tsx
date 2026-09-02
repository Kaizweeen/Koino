import type { Theme } from "@/lib/themes";
import type { Verse } from "@/lib/devotions/types";
import { Icon } from "@/components/Icon";

export function Linger({ verse, theme }: { verse: Verse; theme: Theme }) {
  return (
    <div className="stagger flex flex-1 flex-col gap-4 px-7 py-8 lg:mx-auto lg:w-full lg:max-w-3xl lg:gap-6 lg:px-16 lg:py-14">
      <h2 className="font-serif text-2xl text-ink lg:text-[2.75rem] lg:leading-tight">Linger a while</h2>
      <p className="reading-text text-sm leading-relaxed text-ink-secondary lg:max-w-[38rem] lg:text-lg lg:leading-relaxed">
        Stay a moment before you go. Let the verse settle, unhurried.
      </p>

      <div
        className="flex items-center gap-3 rounded-2xl border bg-paper p-4 shadow-card lg:gap-4 lg:rounded-well lg:p-6"
        style={{ borderColor: "var(--hairline)" }}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:h-14 lg:w-14"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}
        >
          <Icon name="check" className="text-lg lg:text-2xl" style={{ color: theme.accent }} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink lg:text-base">{theme.name} — completed</p>
          <p className="text-xs text-ink-muted lg:text-sm">{verse.verseRef}</p>
        </div>
      </div>

      <span className="mt-auto flex items-center justify-center gap-1.5 text-center text-xs text-ink-muted lg:text-sm">
        <Icon name="sunrise" style={{ color: theme.accent }} /> New devotion tomorrow morning
      </span>
    </div>
  );
}
