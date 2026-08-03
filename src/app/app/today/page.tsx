import Link from "next/link";
import { DevotionFlow } from "@/components/DevotionFlow";

export default function TodayPage() {
  return (
    <div className="relative mx-auto max-w-sm lg:max-w-none">
      <Link
        href="/app"
        aria-label="Back to home"
        /* Desktop: anchor to the gutter just left of the centered max-w-lg (32rem) reading
           column, i.e. 16rem (half the column) + a gap left of viewport centre. */
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary shadow-card ring-1 ring-black/[0.05] backdrop-blur transition-colors hover:text-ink lg:left-[calc(50%-19.5rem)] lg:top-8"
        style={{ background: "color-mix(in srgb, var(--paper) 80%, transparent)" }}
      >
        <i className="ti ti-chevron-left text-xl" aria-hidden="true" />
      </Link>
      <DevotionFlow />
    </div>
  );
}
