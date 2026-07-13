import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotesView } from "@/components/NotesView";
import { loadProgress } from "@/lib/progress";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("NotesView", () => {
  it("shows the empty state when there are no notes", async () => {
    render(<NotesView />);
    expect(await screen.findByText("No notes yet.")).toBeInTheDocument();
  });

  it("lists an existing note beside its verse", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({ completedDates: [], favorites: [], notes: { "2026-06-25": "be still my soul" } }),
    );
    render(<NotesView />);
    expect(await screen.findByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("be still my soul")).toBeInTheDocument();
  });

  it("persists edits to a note", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({ completedDates: [], favorites: [], notes: { "2026-06-25": "first" } }),
    );
    render(<NotesView />);
    const field = await screen.findByDisplayValue("first");
    fireEvent.change(field, { target: { value: "revised" } });
    expect(loadProgress().notes["2026-06-25"]).toBe("revised");
  });
});
