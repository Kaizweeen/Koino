"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/saved", label: "Saved", icon: "heart" },
  { href: "/themes", label: "Themes", icon: "sparkles" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 flex border-t border-black/10 bg-paper/95 backdrop-blur">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
              active ? "text-ink" : "text-ink-muted"
            }`}
          >
            <i className={`ti ti-${tab.icon} text-xl`} aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
