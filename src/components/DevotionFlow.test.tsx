import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("walks Scripture into the Observation writing step", async () => {
    render(<DevotionFlow />);
    fireEvent.click(await screen.findByText("Begin"));
    expect(screen.getByLabelText("SOAP step 1 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByLabelText("SOAP step 2 of 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Observation")).toBeInTheDocument();
  });

  it("shows the done state when today is already completed", async () => {
    const d = new Date();
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: [local], favorites: [], entries: {} }));
    render(<DevotionFlow />);
    expect(await screen.findByText("You've already been here today.")).toBeInTheDocument();
  });
});
