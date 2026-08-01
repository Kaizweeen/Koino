const LETTERS = ["S", "O", "A", "P"] as const;

export function SoapProgress({ current, accent }: { current: 1 | 2 | 3 | 4; accent: string }) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`SOAP step ${current} of 4`}>
      {LETTERS.map((letter, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <span
            key={letter}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium transition-colors duration-500"
            style={
              active
                ? { background: accent, color: "#fff" }
                : done
                  ? { color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)` }
                  : { color: "var(--ink-muted)", background: "color-mix(in srgb, var(--ink) 6%, transparent)" }
            }
          >
            {letter}
          </span>
        );
      })}
    </span>
  );
}
