import Link from "next/link";
import { DevotionFlow } from "@/components/DevotionFlow";

export default function TodayPage() {
  return (
    <div className="relative mx-auto max-w-sm lg:max-w-none">
      <Link
        href="/app"
        aria-label="Back to home"
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary shadow-card ring-1 ring-black/[0.05] backdrop-blur transition-colors hover:text-ink"
        style={{ background: "color-mix(in srgb, var(--paper) 80%, transparent)" }}
      >
        <i className="ti ti-chevron-left text-xl" aria-hidden="true" />
      </Link>
      <DevotionFlow />
    </div>
  );
}
