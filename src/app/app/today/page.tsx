import Link from "next/link";
import { DevotionFlow } from "@/components/DevotionFlow";
import { Icon } from "@/components/Icon";

export default function TodayPage() {
  return (
    <div className="relative mx-auto max-w-sm lg:max-w-none">
      <Link
        href="/app"
        aria-label="Back to home"
        /* The flow is full-bleed on desktop, so the way back sits in the screen's own corner. */
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary shadow-card ring-1 ring-black/[0.05] backdrop-blur transition-colors hover:text-ink lg:left-8 lg:top-8 lg:h-12 lg:w-12"
        style={{ background: "color-mix(in srgb, var(--paper) 80%, transparent)" }}
      >
        <Icon name="chevron-left" className="text-xl" />
      </Link>
      <DevotionFlow />
    </div>
  );
}
