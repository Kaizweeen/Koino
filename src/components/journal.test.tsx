import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JournalView } from "@/components/JournalView";
import { DEVOTIONS } from "@/lib/devotions/content";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("JournalView", () => {
  it("shows the empty state when nothing is written", async () => {
    render(<JournalView />);
    expect(await screen.findByText("Your journal is empty.")).toBeInTheDocument();
  });

  it("renders a written entry beside its verse", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({ completedDates: [], favorites: [], entries: { "2026-06-25": { observation: "God is near", application: "", prayer: "quiet me" } } }),
    );
    render(<JournalView />);
    expect(await screen.findByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("God is near")).toBeInTheDocument();
    expect(screen.getByText("quiet me")).toBeInTheDocument();
  });

  it("shows an entry written on a day with no exact devotion, resolved to the one shown", async () => {
    const last = DEVOTIONS[DEVOTIONS.length - 1];
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({ completedDates: [], favorites: [], entries: { "2999-12-31": { observation: "future thought", application: "", prayer: "" } } }),
    );
    render(<JournalView />);
    expect(await screen.findByText("future thought")).toBeInTheDocument();
    expect(screen.getByText(last.verseText)).toBeInTheDocument();
  });

  it("filters to favorites", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({
        completedDates: [],
        favorites: ["2026-06-26"],
        entries: {
          "2026-06-25": { observation: "unfav", application: "", prayer: "" },
          "2026-06-26": { observation: "faved", application: "", prayer: "" },
        },
      }),
    );
    render(<JournalView />);
    expect(await screen.findByText("unfav")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Favorites/ }));
    expect(screen.queryByText("unfav")).toBeNull();
    expect(screen.getByText("faved")).toBeInTheDocument();
  });

  it("shows a legacy note when present without a structured entry", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({ completedDates: [], favorites: [], entries: {}, notes: { "2026-06-25": "old reflection" } }),
    );
    render(<JournalView />);
    expect(await screen.findByText("old reflection")).toBeInTheDocument();
  });
});
