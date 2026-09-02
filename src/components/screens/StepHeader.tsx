import { SoapProgress } from "@/components/screens/SoapProgress";

/**
 * The line every step of the arc wears: where you are in the passage's mood on the left, how far
 * through the four steps on the right. Shared so the flow reads as one movement rather than four
 * screens that happen to look alike.
 */
export function StepHeader({
  label,
  accent,
  step,
}: {
  label: string;
  accent: string;
  step: 1 | 2 | 3 | 4;
}) {
  return (
    // lg:pl-14 clears the full-bleed flow's back button, which sits in the screen's corner.
    <div className="flex items-center justify-between lg:pl-14">
      <span className="inline-flex items-center gap-2 text-sm font-medium lg:text-base" style={{ color: accent }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        {label}
      </span>
      <SoapProgress current={step} accent={accent} />
    </div>
  );
}
