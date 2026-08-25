"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadPrefs, setThemePref, setTextSize, applyPrefs, type ThemePref, type TextSize } from "@/lib/prefs";
import { BackupControls } from "@/components/BackupControls";
import { Icon } from "@/components/Icon";

const BRAND = "#0F6E56";

const THEME_OPTS: { value: ThemePref; label: string; icon: string }[] = [
  { value: "system", label: "System", icon: "device-mobile" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

const TEXT_OPTS: { value: TextSize; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "large", label: "Large" },
];

export function SettingsView() {
  const [theme, setTheme] = useState<ThemePref>("system");
  const [size, setSize] = useState<TextSize>("regular");

  useEffect(() => {
    const p = loadPrefs();
    setTheme(p.theme);
    setSize(p.textSize);
    applyPrefs(p);
  }, []);

  return (
    <div className="fade-in mx-auto flex w-full max-w-2xl flex-col gap-6 p-5 pb-6 lg:gap-8 lg:px-10 lg:py-12" style={{ ["--accent" as string]: BRAND }}>
      <Link href="/app" className="inline-flex w-fit items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink lg:hidden">
        <Icon name="chevron-left" /> Home
      </Link>

      <h1 className="font-serif text-3xl text-ink lg:text-4xl">Settings</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Appearance</h2>

        <div>
          <p className="mb-2 text-xs text-ink-muted">Theme</p>
          <div role="group" aria-label="Theme" className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--hairline)", background: "var(--canvas)" }}>
            {THEME_OPTS.map((o) => {
              const active = o.value === theme;
              return (
                <button
                  key={o.value}
                  onClick={() => { setTheme(o.value); setThemePref(o.value); }}
                  aria-pressed={active}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors"
                  style={active ? { background: BRAND, color: "#fff" } : { color: "var(--ink-secondary)" }}
                >
                  <Icon name={o.icon} /> {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-ink-muted">Text size</p>
          <div role="group" aria-label="Text size" className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--hairline)", background: "var(--canvas)" }}>
            {TEXT_OPTS.map((o) => {
              const active = o.value === size;
              return (
                <button
                  key={o.value}
                  onClick={() => { setSize(o.value); setTextSize(o.value); }}
                  aria-pressed={active}
                  className="flex flex-1 items-center justify-center rounded-full py-2 text-sm font-medium transition-colors"
                  style={active ? { background: BRAND, color: "#fff" } : { color: "var(--ink-secondary)" }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 reading-text text-sm text-ink-secondary">This is how your reading will look.</p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Your data</h2>
        <BackupControls />
      </section>
    </div>
  );
}
