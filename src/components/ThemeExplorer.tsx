import { THEMES } from "@/lib/themes";
import { Icon } from "@/components/Icon";

export function ThemeExplorer() {
  const themes = Object.values(THEMES);
  return (
    <div className="fade-in mx-auto flex w-full max-w-6xl flex-col gap-5 p-5 pb-6 lg:gap-8 lg:px-10 lg:py-12">
      <header>
        <h1 className="font-serif text-3xl text-ink lg:text-4xl">Themes</h1>
        <p className="mt-1 max-w-[20rem] text-xs text-ink-muted lg:mt-2 lg:max-w-[34rem] lg:text-sm">
          Every day is drawn from one of these, each with its own verses and its own colour of light.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {themes.map((t) => (
          <article
            key={t.slug}
            className="relative overflow-hidden rounded-well p-5 lg:p-6"
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
                style={{ color: "#fff", background: t.accent }}
              >
                <Icon name={t.icon} className="text-xl" />
              </span>
              <div className="min-w-0">
                <h2 className="font-serif text-lg" style={{ color: t.accent }}>
                  {t.name}
                </h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${t.accent} 40%, #262521)` }}>
                  {t.definition}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
