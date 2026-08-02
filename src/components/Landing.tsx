"use client";

/*
  DIRECTION CONTRACT (landing, Persuade, inside the established "Light through paper" world)
  THESIS: Show the daily practice by flipping through Koino's real screens; refuse the feature-grid hero.
  OWN-WORLD: Warm paper ground, drifting accent light (Atmosphere), Lora serif for Scripture, Inter for chrome, per-theme accents, soft warm depth.
  STORY: A calm devotion meets you in your mood; read one verse, write S/O/A/P, keep it. The visitor understands the ritual and taps Begin.
  FIRST VIEWPORT: Left, a serif promise + primary "Begin today's devotion"; right, a phone showing the real Scripture screen under drifting light.
  FORM: Guided walkthrough (candidate 5), seed key 793b5dc5.
  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.
*/

import Link from "next/link";
import { THEMES, type ThemeSlug } from "@/lib/themes";
import { Atmosphere } from "@/components/Atmosphere";

const GREEN = THEMES.peace.accent;

// A spectrum of the day's light, drifting down the page, coloured by real theme accents.
const GLOWS: { top: string; side: "left" | "right"; off: string; size: string; theme: ThemeSlug; strength: string }[] = [
  { top: "-14%", side: "left", off: "-6%", size: "64vw", theme: "peace", strength: "52%" },
  { top: "10%", side: "right", off: "-8%", size: "58vw", theme: "gratitude", strength: "42%" },
  { top: "29%", side: "left", off: "-10%", size: "66vw", theme: "hope", strength: "46%" },
  { top: "49%", side: "right", off: "-6%", size: "60vw", theme: "love", strength: "44%" },
  { top: "69%", side: "left", off: "-8%", size: "64vw", theme: "longing", strength: "46%" },
  { top: "88%", side: "right", off: "-6%", size: "58vw", theme: "peace", strength: "48%" },
];

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function SoapDots({ current, accent }: { current: 1 | 2 | 3 | 4; accent: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {["S", "O", "A", "P"].map((l, i) => {
        const active = i + 1 === current;
        const done = i + 1 < current;
        return (
          <span
            key={l}
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium"
            style={
              active
                ? { background: accent, color: "#fff" }
                : done
                  ? { color: accent, background: `color-mix(in srgb, ${accent} 15%, transparent)` }
                  : { color: "var(--ink-muted)", background: "color-mix(in srgb, var(--ink) 8%, transparent)" }
            }
          >
            {l}
          </span>
        );
      })}
    </span>
  );
}

/** A phone-shaped frame holding an authored replica of a real Koino screen. */
function Phone({ accent, tone = "day", className = "", children }: { accent: string; tone?: "day" | "night"; className?: string; children: React.ReactNode }) {
  const bg = tone === "night" ? "#1C1B18" : "var(--paper)";
  return (
    <div
      className={`relative w-[280px] shrink-0 overflow-hidden rounded-[2.25rem] p-1.5 shadow-lift ${className}`}
      style={{ background: "color-mix(in srgb, var(--ink) 14%, var(--paper))", ["--accent" as string]: accent }}
    >
      <div className="relative flex min-h-[520px] flex-col overflow-hidden rounded-[1.9rem]" style={{ background: bg }}>
        <Atmosphere accent={accent} tone={tone} />
        <div className="relative z-10 flex flex-1 flex-col px-6 py-7">{children}</div>
      </div>
    </div>
  );
}

export function Landing() {
  const moods = Object.values(THEMES);

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      {/* Backdrop: a drifting spectrum of the day's light, plus faint paper grain. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {GLOWS.map((g, i) => (
          <div
            key={i}
            className="koino-float absolute rounded-full"
            style={{
              top: g.top,
              width: g.size,
              height: g.size,
              ...(g.side === "left" ? { left: g.off } : { right: g.off }),
              background: `radial-gradient(circle, color-mix(in srgb, ${THEMES[g.theme].accent} ${g.strength}, transparent), transparent 70%)`,
              animationDelay: `${i * -3.5}s`,
              animationDuration: `${18 + i * 2}s`,
            }}
          />
        ))}
        <div className="absolute inset-0 opacity-[0.055]" style={{ backgroundImage: GRAIN, backgroundSize: "140px 140px" }} />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-serif text-2xl text-ink">Koino</span>
          <Link href="/app" className="rounded-full px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink">
            Enter
          </Link>
        </header>

        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-8 md:grid-cols-[1.05fr_auto] md:gap-8 md:pt-16">
          <div className="max-w-xl">
            <h1 className="font-serif text-[clamp(2.6rem,7vw,4.25rem)] leading-[1.05] tracking-[-0.02em] text-ink text-balance">
              Come as you are. Meet God in a few honest minutes.
            </h1>
            <p className="mt-6 max-w-md text-[1.0625rem] leading-relaxed text-ink-secondary">
              Koino is a daily devotion built on the SOAP path. Read one verse, then write what you
              notice, how it lands, and a prayer. Short, finishable, and set to music that matches
              the day.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/app/today" className="btn-primary rounded-full px-7 py-3.5 text-[15px] font-medium" style={{ ["--accent" as string]: GREEN }}>
                Begin today&apos;s devotion
              </Link>
              <a href="#practice" className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary transition-colors hover:text-ink">
                See the practice
                <i className="ti ti-arrow-down transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-6 text-xs text-ink-muted">Free. Nothing to sign up for. Your writing stays on your device.</p>
          </div>

          {/* Scripture specimen */}
          <Phone accent={GREEN} className="mx-auto md:mx-0">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: GREEN }}>
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} /> Peace
              </span>
              <SoapDots current={1} accent={GREEN} />
            </div>
            <div className="my-auto flex flex-col items-center gap-5 text-center">
              <p className="font-serif text-2xl leading-[1.4] text-ink text-balance">Be still, and know that I am God.</p>
              <span className="h-px w-8 rounded-full" style={{ background: "#9FE1CB" }} />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-muted">Psalm 46:10</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: "#E1F5EE" }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: GREEN, color: "#fff" }}>
                <i className="ti ti-music text-sm" aria-hidden="true" />
              </span>
              <span className="text-xs font-medium" style={{ color: GREEN }}>Ambient, slow, soft worship</span>
            </div>
          </Phone>
        </section>

        {/* The practice: S O A P walkthrough */}
        <section id="practice" className="mx-auto max-w-6xl px-6 py-20">
          <div className="reveal-on-scroll mx-auto max-w-xl text-center">
            <h2 className="font-serif text-[clamp(2rem,5vw,2.75rem)] leading-tight tracking-[-0.01em] text-ink">Four small steps. One quiet arc.</h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-secondary">
              SOAP is an old, simple way to sit with Scripture. Koino walks you through it, one
              screen at a time, and keeps what you write.
            </p>
          </div>

          <div className="mt-16 flex flex-col gap-20">
            <Step
              n={2}
              letter="Observation"
              accent={GREEN}
              title="Notice what it says."
              body="A gentle question meets the verse. You write what you see about God, or about yourself. There is no wrong answer, only your own."
              prompt="What does this verse show you about where true rest is found?"
              answer="That stillness isn't the absence of noise. It's trusting the One who holds it all."
            />
            <Step
              n={3}
              letter="Application"
              accent={GREEN}
              reverse
              title="Let it touch today."
              body="One honest sentence about the day in front of you. Small and doable, not a resolution you'll forget by noon."
              prompt="Where do you most need to stop striving and trust today?"
              answer="Before the inbox. Let me begin from rest, not from proving."
            />
            <Step
              n={4}
              letter="Prayer"
              accent={GREEN}
              tone="night"
              title="Turn it into a prayer."
              body="The screen dims like evening. You say it back to God in your own words, and the day is marked complete."
              prompt="Ask God to quiet one thing you are carrying."
              answer="Quiet my heart, Lord. Before anything today, let me rest in you."
            />
          </div>

          {/* Amen moment */}
          <div className="reveal-on-scroll mx-auto mt-24 flex max-w-md flex-col items-center gap-4 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="breathe absolute inset-0 rounded-full" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB", ["--accent" as string]: GREEN }} />
              <i className="ti ti-check relative text-3xl" style={{ color: GREEN }} aria-hidden="true" />
            </div>
            <p className="font-serif text-2xl text-ink">Amen.</p>
            <p className="text-[1.0625rem] leading-relaxed text-ink-secondary">
              That is the whole thing. A few minutes, most days, and a streak that grows like a
              small green plant, never a scoreboard.
            </p>
          </div>
        </section>

        {/* Come as you are: mood spectrum */}
        <section className="border-y" style={{ borderColor: "var(--hairline)", background: "color-mix(in srgb, var(--ink) 3%, transparent)" }}>
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="reveal-on-scroll grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-16">
              <div className="max-w-md">
                <h2 className="font-serif text-[clamp(2rem,5vw,2.75rem)] leading-tight tracking-[-0.01em] text-ink">The day meets you where you are.</h2>
                <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-secondary">
                  Some mornings you arrive grateful. Some in grief, or longing, or awe. Koino draws
                  each day from an emotional theme, with its own verses and its own music. You do
                  not have to feel a certain way to begin.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {moods.map((m) => (
                  <span
                    key={m.slug}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium"
                    style={{ background: m.accentSoft, color: m.accent }}
                  >
                    <i className={`ti ti-${m.icon}`} aria-hidden="true" /> {m.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Keepsakes */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="reveal-on-scroll grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16">
            <div className="max-w-md">
              <h2 className="font-serif text-[clamp(2rem,5vw,2.75rem)] leading-tight tracking-[-0.01em] text-ink">Everything you write, kept.</h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-secondary">
                Each day becomes an entry in a private journal you can search and return to. When a
                verse moves you, make a small card and share it. Your words never leave your device
                unless you choose to send them.
              </p>
              <div className="mt-7 flex flex-col gap-3">
                {[
                  { icon: "book", text: "A searchable journal of every reflection" },
                  { icon: "share", text: "Shareable verse cards, made in a tap" },
                  { icon: "lock", text: "Stored on your device, exportable anytime" },
                ].map((f) => (
                  <div key={f.icon} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "#E1F5EE", color: GREEN }}>
                      <i className={`ti ti-${f.icon}`} aria-hidden="true" />
                    </span>
                    <span className="text-[15px] text-ink-secondary">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verse card specimen */}
            <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-well shadow-lift" style={{ background: "var(--paper)" }}>
              <div className="h-2" style={{ background: GREEN }} />
              <div className="flex flex-col items-center gap-5 px-8 py-12 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "#E1F5EE", color: GREEN }}>
                  <i className="ti ti-ripple" aria-hidden="true" /> Peace
                </span>
                <p className="font-serif text-2xl leading-[1.35] text-ink text-balance">
                  Weeping may stay for the night, but joy comes in the morning.
                </p>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: GREEN }}>Psalm 30:5</span>
                <span className="h-px w-8 rounded-full" style={{ background: "#9FE1CB" }} />
                <span className="font-serif text-lg text-ink">Koino</span>
              </div>
            </div>
          </div>
        </section>

        {/* The quiet difference */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="reveal-on-scroll font-serif text-[clamp(1.6rem,4.5vw,2.4rem)] leading-[1.35] tracking-[-0.01em] text-ink text-balance">
            No feed to fall into. No streak that shames you. No noise. Just you, a verse, and a few
            honest minutes with God.
          </p>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 pb-8">
            <div className="reveal-on-scroll relative overflow-hidden rounded-[2rem] px-8 py-16 text-center" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB", ["--accent" as string]: GREEN }}>
              <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full" style={{ background: `radial-gradient(circle, color-mix(in srgb, ${GREEN} 28%, transparent), transparent 70%)` }} />
              <div className="relative flex flex-col items-center gap-6">
                <h2 className="max-w-lg font-serif text-[clamp(2rem,5vw,3rem)] leading-[1.1] tracking-[-0.02em]" style={{ color: GREEN }}>
                  Begin today, from rest.
                </h2>
                <Link href="/app/today" className="btn-primary rounded-full px-8 py-4 text-base font-medium" style={{ ["--accent" as string]: GREEN }}>
                  Begin today&apos;s devotion
                </Link>
                <p className="text-xs" style={{ color: `color-mix(in srgb, ${GREEN} 55%, #262521)` }}>
                  Add Koino to your home screen to return each morning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="font-serif text-xl text-ink">Koino</span>
          <p className="max-w-sm text-xs leading-relaxed text-ink-muted">
            From <span className="italic">koinonia</span>, the Greek word for fellowship. Scripture in the World English Bible.
          </p>
          <Link href="/app" className="mt-1 text-xs font-medium text-ink-secondary transition-colors hover:text-ink">
            Enter the app
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Step({
  n,
  letter,
  title,
  body,
  prompt,
  answer,
  accent,
  tone = "day",
  reverse = false,
}: {
  n: 2 | 3 | 4;
  letter: string;
  title: string;
  body: string;
  prompt: string;
  answer: string;
  accent: string;
  tone?: "day" | "night";
  reverse?: boolean;
}) {
  const night = tone === "night";
  return (
    <div className={`reveal-on-scroll grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-16 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
      <Phone accent={accent} tone={tone} className="mx-auto md:mx-0">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: night ? "#B4AFA2" : accent }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} /> {letter}
          </span>
          <SoapDots current={n} accent={accent} />
        </div>
        <div className="my-auto flex flex-col gap-4">
          <p className="text-center font-serif text-lg leading-snug" style={{ color: night ? "#EDE9DF" : "var(--ink)" }}>{prompt}</p>
          <div
            className="rounded-2xl border p-3.5 font-serif text-[15px] leading-relaxed"
            style={
              night
                ? { borderColor: "rgba(237,233,223,0.18)", color: "#EDE9DF", background: "rgba(255,255,255,0.04)" }
                : { borderColor: "var(--hairline)", color: "var(--ink)", background: "var(--paper)" }
            }
          >
            {answer}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: night ? "#B4AFA2" : accent }}>
          {n === 4 ? "Amen" : "Continue"} <i className="ti ti-arrow-right" aria-hidden="true" />
        </div>
      </Phone>

      <div className="max-w-md">
        <span className="font-serif text-5xl" style={{ color: accent }}>{letter[0]}</span>
        <h3 className="mt-3 font-serif text-2xl leading-snug text-ink">{title}</h3>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-secondary">{body}</p>
      </div>
    </div>
  );
}
