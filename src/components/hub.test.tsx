import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeHub } from "@/components/HomeHub";
import { SavedList } from "@/components/SavedList";
import { ThemeExplorer } from "@/components/ThemeExplorer";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 12, 9, 0, 0));
  localStorage.clear();
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

  it("shows the empty saved state when nothing is saved", async () => {
    render(<HomeHub />);
    expect(await screen.findByText(/Nothing saved yet/)).toBeInTheDocument();
  });
});

describe("SavedList", () => {
  it("shows the empty state when there are no favorites", async () => {
    render(<SavedList />);
    expect(await screen.findByText("You haven't saved anything yet.")).toBeInTheDocument();
  });

  it("renders a saved devotion when one exists", async () => {
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: [], favorites: ["2026-06-25"] }));
    render(<SavedList />);
    expect(await screen.findByText("Be still, and know that I am God.")).toBeInTheDocument();
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
