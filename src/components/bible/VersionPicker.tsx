"use client";

import { BIBLE_VERSIONS, type BibleVersion } from "@/lib/bible/books";

/**
 * The translation switcher, in the two shapes the app needs.
 *
 * Both are plain buttons rather than a `<select>`: the choice is small and worth seeing all of, and
 * a native select on iOS opens a wheel that would sit oddly over a chapter of scripture.
 */

/**
 * Compact pills for a reader header, where the chapter is the point and the translation is an
 * aside. Labelled with the abbreviation, since the full names would not fit beside a book title.
 */
export function VersionPills({
  value,
  onChange,
  className = "",
}: {
  value: BibleVersion;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Bible version"
      className={`flex w-fit shrink-0 gap-0.5 rounded-full border p-0.5 ${className}`}
      style={{ borderColor: "var(--hairline)", background: "var(--canvas)" }}
    >
      {BIBLE_VERSIONS.map((v) => {
        const active = v.id === value.id;
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            aria-pressed={active}
            // The abbreviation alone would leave a screen reader saying "W E B"; the accessible
            // name carries the translation's real name instead.
            aria-label={v.name}
            title={v.name}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={active ? { background: "var(--accent)", color: "#fff" } : { color: "var(--ink-muted)" }}
          >
            <span aria-hidden="true">{v.short}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The full list, for Settings: each translation with the line that says how it reads, which is
 * what someone actually chooses on.
 */
export function VersionChoices({
  value,
  onChange,
}: {
  value: BibleVersion;
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Bible version" className="flex flex-col gap-2">
      {BIBLE_VERSIONS.map((v) => {
        const active = v.id === value.id;
        return (
          <button
            key={v.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v.id)}
            className="flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors"
            style={{
              borderColor: active ? "var(--accent)" : "var(--hairline)",
              background: active
                ? "color-mix(in srgb, var(--accent) 6%, var(--paper))"
                : "var(--paper)",
            }}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="font-serif text-[0.9375rem] text-ink">{v.name}</span>
                <span className="text-[10px] uppercase tracking-widest2 text-ink-muted">{v.short}</span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-secondary">{v.blurb}</span>
            </span>
            <span
              aria-hidden="true"
              className="mt-1 h-4 w-4 shrink-0 rounded-full border"
              style={{
                borderColor: active ? "var(--accent)" : "var(--hairline)",
                background: active
                  ? "radial-gradient(circle, var(--accent) 0 45%, transparent 46%)"
                  : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
