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
    <div className="flex flex-1 flex-col px-7 py-7 lg:px-16 lg:py-12">
      {/* lg:pl-14 clears the full-bleed flow's back button, which sits in the screen's corner. */}
      <div className="flex items-center justify-between lg:pl-14">
        <span className="inline-flex items-center gap-2 text-sm font-medium lg:text-base" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {label}
        </span>
        <SoapProgress current={step} accent={theme.accent} />
      </div>

      {/*
       * Mobile stacks prompt → field → nudge. At lg the same DOM becomes two columns —
       * the prompt and its nudge sit on the left, the writing field fills the right and
       * spans both rows — so the wide canvas gives the page room instead of empty gutters.
       */}
      <div className="stagger my-auto flex w-full flex-col gap-4 lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-5 lg:py-6">
        <p className="text-center font-serif text-xl leading-snug text-ink lg:col-start-1 lg:row-start-1 lg:self-end lg:text-left lg:text-[2rem] lg:leading-[1.25]">{prompt}</p>
        <label htmlFor={fieldId} className="sr-only">{label}</label>
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder="Write your own…"
          className="reading-text w-full resize-none rounded-2xl border bg-paper p-3.5 font-serif text-[15px] leading-relaxed text-ink shadow-sm outline-none transition-colors placeholder:font-sans placeholder:text-ink-muted lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-[22rem] lg:rounded-well lg:p-7 lg:text-[17px] lg:shadow-card"
          style={{ borderColor: "var(--hairline)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
        />
        {nudge && (
          <details className="rounded-xl px-3.5 py-2.5 lg:col-start-1 lg:row-start-2 lg:self-start lg:rounded-2xl lg:px-5 lg:py-4" style={{ background: theme.accentSoft }}>
            <summary className="cursor-pointer list-none text-sm font-medium" style={{ color: theme.accent }}>
              Need a nudge?
            </summary>
            <p className="mt-2 text-sm leading-relaxed lg:text-[15px]" style={{ color: `color-mix(in srgb, ${theme.accent} 42%, #262521)` }}>
              {nudge}
            </p>
          </details>
        )}
      </div>

      <button onClick={onContinue} className="btn-primary w-full rounded-full py-3.5 text-[15px] font-medium lg:mx-auto lg:w-auto lg:px-24 lg:py-4 lg:text-base">
        {continueLabel}
      </button>
    </div>
  );
}
