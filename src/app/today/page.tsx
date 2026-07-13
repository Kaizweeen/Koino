import Link from "next/link";
import { DevotionFlow } from "@/components/DevotionFlow";

export default function TodayPage() {
  return (
    <div className="relative mx-auto max-w-sm">
      <Link
        href="/"
        aria-label="Back to home"
        className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink-secondary backdrop-blur transition-colors hover:text-ink"
      >
        <i className="ti ti-chevron-left text-xl" aria-hidden="true" />
      </Link>
      <DevotionFlow />
    </div>
  );
}
