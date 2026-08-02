import { THEMES } from "@/lib/themes";

export function ThemeExplorer() {
  const themes = Object.values(THEMES);
  return (
    <div className="fade-in flex flex-col gap-5 p-5 pb-6">
      <header>
        <h1 className="font-serif text-3xl text-ink">Themes</h1>
        <p className="mt-1 max-w-[20rem] text-xs text-ink-muted">
          Every day is drawn from one of these. Each carries its own verses and its own music.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {themes.map((t) => (
          <article
            key={t.slug}
            className="relative overflow-hidden rounded-well p-5"
            style={{ background: t.accentSoft, border: `1px solid ${t.accentBorder}` }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full"
              style={{ background: `radial-gradient(circle, color-mix(in srgb, ${t.accent} 30%, transparent), transparent 70%)` }}
            />
            <div className="relative flex items-start gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                style={{ color: t.accent, background: "color-mix(in srgb, var(--paper) 70%, transparent)" }}
              >
                <i className={`ti ti-${t.icon} text-xl`} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="font-serif text-lg" style={{ color: t.accent }}>
                  {t.name}
                </h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${t.accent} 40%, var(--ink))` }}>
                  {t.definition}
                </p>
                <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px]" style={{ color: t.accent, opacity: 0.78 }}>
                  <i className="ti ti-music" aria-hidden="true" /> {t.moodProfile}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
