import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeHub } from "@/components/HomeHub";
import { ThemeExplorer } from "@/components/ThemeExplorer";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 12, 9, 0, 0));
  localStorage.clear();
  localStorage.setItem("koino.prefs.v1", JSON.stringify({ onboarded: true }));
});
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("HomeHub", () => {
  it("greets, shows today's verse, and links to the devotion", async () => {
    render(<HomeHub />);
    expect(await screen.findByText("Good morning")).toBeInTheDocument();
    expect(screen.getByText("Create in me a clean heart, O God. Renew a right spirit within me.")).toBeInTheDocument();
    const cta = screen.getByText("Begin today's devotion").closest("a");
    expect(cta).toHaveAttribute("href", "/today");
  });

  it("shows the empty journal peek when nothing is written", async () => {
    render(<HomeHub />);
    expect(await screen.findByText(/Your journal is waiting/)).toBeInTheDocument();
  });

  it("shows onboarding on the very first run", async () => {
    localStorage.setItem("koino.prefs.v1", JSON.stringify({ onboarded: false }));
    render(<HomeHub />);
    expect(await screen.findByText("Welcome to Koino")).toBeInTheDocument();
  });

  it("nudges to keep the streak when today isn't done yet", async () => {
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: ["2026-07-11"], favorites: [], entries: {} }));
    render(<HomeHub />);
    expect(await screen.findByText(/Keep your 1-day streak going/)).toBeInTheDocument();
  });
});

describe("ThemeExplorer", () => {
  it("lists all twelve themes", () => {
    render(<ThemeExplorer />);
    expect(screen.getByText("Peace")).toBeInTheDocument();
    expect(screen.getByText("Longing")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(12);
  });
});
