"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

const TABS = [
  { href: "/app", label: "Home", icon: "home" },
  { href: "/app/journal", label: "Journal", icon: "book" },
  { href: "/app/bible", label: "Bible", icon: "book-2" },
  { href: "/app/themes", label: "Themes", icon: "sparkles" },
  { href: "/app/history", label: "History", icon: "chart-line" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="sticky bottom-0 z-20 flex backdrop-blur-md lg:hidden"
      style={{ background: "color-mix(in srgb, var(--paper) 90%, transparent)", borderTop: "1px solid var(--hairline)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const active = tab.href === "/app" ? pathname === "/app" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              active ? "text-brand" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            {active && (
              <span className="absolute top-0 h-[2.5px] w-7 rounded-full bg-brand" aria-hidden="true" />
            )}
            <Icon name={tab.icon} className="text-[1.35rem]" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
