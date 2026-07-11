import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DevotionFlow } from "@/components/DevotionFlow";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 12, 9, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("DevotionFlow", () => {
  it("renders the arrival screen for the local day after mount", async () => {
    render(<DevotionFlow />);
    expect(await screen.findByText("Begin")).toBeInTheDocument();
    expect(screen.getByText("Good morning")).toBeInTheDocument();
  });

  it("shows the done state when today is already completed", async () => {
    const d = new Date();
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: [local], favorites: [] }));
    render(<DevotionFlow />);
    expect(await screen.findByText("You've already been here today.")).toBeInTheDocument();
  });
});
