import { THEMES } from "@/lib/themes";

export function ThemeExplorer() {
  const themes = Object.values(THEMES);
  return (
    <div className="fade-in flex flex-col gap-4 p-5 pb-4">
      <div>
        <h1 className="font-serif text-2xl text-ink">Themes</h1>
        <p className="mt-1 text-xs text-ink-muted">
          Every day is drawn from one of these. Each carries its own verses and its own music.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {themes.map((t) => (
          <article
            key={t.slug}
            className="rounded-2xl border p-4"
            style={{ background: t.accentSoft, borderColor: t.accentBorder }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70"
                style={{ color: t.accent }}
              >
                <i className={`ti ti-${t.icon} text-lg`} aria-hidden="true" />
              </span>
              <h2 className="text-base font-medium" style={{ color: t.accent }}>
                {t.name}
              </h2>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed" style={{ color: t.accent }}>
              {t.definition}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px]" style={{ color: t.accent, opacity: 0.75 }}>
              <i className="ti ti-music" aria-hidden="true" /> {t.moodProfile}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
