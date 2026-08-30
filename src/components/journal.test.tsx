import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JournalView } from "@/components/JournalView";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getDevotionShownOn } from "@/lib/devotions/select";

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
    const shown = getDevotionShownOn(DEVOTIONS, "2999-12-31");
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({ completedDates: [], favorites: [], entries: { "2999-12-31": { observation: "future thought", application: "", prayer: "" } } }),
    );
    render(<JournalView />);
    expect(await screen.findByText("future thought")).toBeInTheDocument();
    expect(screen.getByText(shown.verseText)).toBeInTheDocument();
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

  it("filters entries by a search query", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({
        completedDates: [],
        favorites: [],
        entries: {
          "2026-06-25": { observation: "stillness and rest", application: "", prayer: "" },
          "2026-06-26": { observation: "gratitude for gifts", application: "", prayer: "" },
        },
      }),
    );
    render(<JournalView />);
    await screen.findByText("stillness and rest");
    fireEvent.change(screen.getByLabelText("Search your journal"), { target: { value: "gratitude for" } });
    expect(screen.queryByText("stillness and rest")).toBeNull();
    expect(screen.getByText("gratitude for gifts")).toBeInTheDocument();
  });

  it("gathers a chosen-verse reflection alongside the daily entries", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({
        completedDates: [],
        favorites: [],
        entries: { "2026-06-25": { observation: "the day's verse", application: "", prayer: "" } },
        reflections: {
          "2026-06-26|John 15:5": {
            id: "2026-06-26|John 15:5",
            date: "2026-06-26",
            createdAt: "2026-06-26T08:00:00.000Z",
            verseRef: "John 15:5",
            verseText: "I am the vine. You are the branches.",
            mood: "open",
            soap: { observation: "abiding, not striving", application: "", prayer: "" },
            favorite: false,
          },
        },
      }),
    );
    render(<JournalView />);
    expect(await screen.findByText("abiding, not striving")).toBeInTheDocument();
    expect(screen.getByText("I am the vine. You are the branches.")).toBeInTheDocument();
    expect(screen.getByText("the day's verse")).toBeInTheDocument();
    // Marked as one the reader picked, so it is not mistaken for that day's devotion.
    expect(screen.getByLabelText("A verse you chose")).toBeInTheDocument();
  });

  it("keeps and filters a chosen-verse reflection by its own favorite flag", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({
        completedDates: [],
        favorites: [],
        entries: { "2026-06-25": { observation: "not kept", application: "", prayer: "" } },
        reflections: {
          r1: {
            id: "r1",
            date: "2026-06-26",
            createdAt: "2026-06-26T08:00:00.000Z",
            verseRef: "John 15:5",
            verseText: "I am the vine.",
            mood: "peace",
            soap: { observation: "kept", application: "", prayer: "" },
            favorite: true,
          },
        },
      }),
    );
    render(<JournalView />);
    expect(await screen.findByText("not kept")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Favorites/ }));
    expect(screen.queryByText("not kept")).toBeNull();
    expect(screen.getByText("kept")).toBeInTheDocument();
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
