"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

/**
 * SideRail — the desktop navigation (lg and up). Mirrors the mobile TabBar's
 * destinations, but as a quiet vertical rail with the Koino mark on top and
 * Settings anchored to the bottom. Hidden below lg; the TabBar takes over there.
 * Returns null on the immersive devotion flow, which stays chrome-free.
 */
const NAV = [
  { href: "/app", label: "Home", icon: "home" },
  { href: "/app/journal", label: "Journal", icon: "book" },
  { href: "/app/themes", label: "Themes", icon: "sparkles" },
  { href: "/app/history", label: "History", icon: "chart-line" },
] as const;

const activeStyle = {
  color: "var(--brand)",
  background: "color-mix(in srgb, var(--brand) 12%, transparent)",
} as const;

export function SideRail() {
  const pathname = usePathname();
  if (pathname === "/app/today") return null;

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <aside
      className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col px-4 py-7 lg:flex"
      style={{ borderRight: "1px solid var(--hairline)" }}
    >
      <Link href="/app" className="mb-9 flex items-center gap-2.5 px-2.5" aria-label="Koino home">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-card"
          style={{ background: "var(--brand)" }}
        >
          <Icon name="leaf" className="text-lg" />
        </span>
        <span className="font-serif text-xl leading-none text-ink">Koino</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                active ? "" : "text-ink-muted hover:text-ink-secondary"
              }`}
              style={active ? activeStyle : undefined}
            >
              <Icon name={item.icon} className="text-xl" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/app/settings"
        aria-current={isActive("/app/settings") ? "page" : undefined}
        className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive("/app/settings") ? "" : "text-ink-muted hover:text-ink-secondary"
        }`}
        style={isActive("/app/settings") ? activeStyle : undefined}
      >
        <Icon name="settings" className="text-xl" />
        Settings
      </Link>
    </aside>
  );
}
