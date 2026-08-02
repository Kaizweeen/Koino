import type { Theme } from "@/lib/themes";
import { SoapProgress } from "@/components/screens/SoapProgress";

export function SoapStep({
  theme,
  step,
  label,
  prompt,
  value,
  onChange,
  onContinue,
  continueLabel,
  nudge,
}: {
  theme: Theme;
  step: 2 | 3 | 4;
  label: string;
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  onContinue: () => void;
  continueLabel: string;
  nudge?: string;
}) {
  const fieldId = `soap-${label.toLowerCase()}`;
  return (
    <div className="flex flex-1 flex-col px-7 py-7">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {label}
        </span>
        <SoapProgress current={step} accent={theme.accent} />
      </div>

      <div className="stagger my-auto flex flex-col gap-4">
        <p className="text-center font-serif text-xl leading-snug text-ink">{prompt}</p>
        <label htmlFor={fieldId} className="sr-only">{label}</label>
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder="Write your own…"
          className="reading-text w-full resize-none rounded-2xl border bg-paper p-3.5 font-serif text-[15px] leading-relaxed text-ink shadow-sm outline-none transition-colors placeholder:font-sans placeholder:text-ink-muted"
          style={{ borderColor: "var(--hairline)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
        />
        {nudge && (
          <details className="rounded-xl px-3.5 py-2.5" style={{ background: theme.accentSoft }}>
            <summary className="cursor-pointer list-none text-sm font-medium" style={{ color: theme.accent }}>
              Need a nudge?
            </summary>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${theme.accent} 42%, var(--ink))` }}>
              {nudge}
            </p>
          </details>
        )}
      </div>

      <button onClick={onContinue} className="btn-primary w-full rounded-full py-3.5 text-[15px] font-medium">
        {continueLabel}
      </button>
    </div>
  );
}
