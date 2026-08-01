import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShareButton } from "@/components/ShareButton";
import { getTheme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

const dev: Devotion = {
  date: "2026-06-25",
  verseRef: "Psalm 46:10",
  verseText: "Be still, and know that I am God.",
  theme: "peace",
  reflection: "r",
  prayer: "p",
};

describe("ShareButton", () => {
  it("opens a preview dialog with the verse card image", () => {
    render(<ShareButton devotion={dev} theme={getTheme("peace")} />);
    fireEvent.click(screen.getByRole("button", { name: "Share this verse" }));
    const dialog = screen.getByRole("dialog", { name: "Share verse card" });
    expect(dialog).toBeInTheDocument();
    const img = screen.getByAltText("Peace verse card") as HTMLImageElement;
    const decoded = decodeURIComponent(img.src);
    expect(decoded).toContain("that I am God."); // verse fragment (wraps across tspans)
    expect(decoded).toContain("PSALM 46:10"); // uppercased reference on the card
  });

  it("offers the reflection toggle only when a reflection is present", () => {
    const { rerender } = render(<ShareButton devotion={dev} theme={getTheme("peace")} />);
    fireEvent.click(screen.getByRole("button", { name: "Share this verse" }));
    expect(screen.queryByLabelText("Include my reflection")).toBeNull();

    rerender(<ShareButton devotion={dev} theme={getTheme("peace")} reflection="my response" />);
    expect(screen.getByLabelText("Include my reflection")).toBeInTheDocument();
  });

  it("adds the reflection to the card when the toggle is checked", () => {
    render(<ShareButton devotion={dev} theme={getTheme("peace")} reflection="my response" />);
    fireEvent.click(screen.getByRole("button", { name: "Share this verse" }));
    const before = screen.getByAltText("Peace verse card") as HTMLImageElement;
    expect(decodeURIComponent(before.src)).not.toContain("my response");
    fireEvent.click(screen.getByLabelText("Include my reflection"));
    const after = screen.getByAltText("Peace verse card") as HTMLImageElement;
    expect(decodeURIComponent(after.src)).toContain("my response");
  });
});
