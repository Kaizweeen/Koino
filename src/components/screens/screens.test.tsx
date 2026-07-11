import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { Verse } from "@/components/screens/Verse";
import { Amen } from "@/components/screens/Amen";
import { Prayer } from "@/components/screens/Prayer";
import { Arrival } from "@/components/screens/Arrival";
import { Done } from "@/components/screens/Done";
import { getTheme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

describe("SpotifyEmbed", () => {
  it("renders an iframe pointing at the playlist embed URL", () => {
    render(<SpotifyEmbed playlistId="abc123" title="Peace playlist" />);
    const frame = screen.getByTitle("Peace playlist") as HTMLIFrameElement;
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.src).toContain("open.spotify.com/embed/playlist/abc123");
  });
});

const dev: Devotion = {
  date: "2026-06-25", verseRef: "Psalm 46:10", verseText: "Be still, and know that I am God.",
  theme: "peace", reflection: "r", prayer: "p",
};

describe("Verse screen", () => {
  it("shows the verse, reference, playlist, and progress", () => {
    render(<Verse devotion={dev} theme={getTheme("peace")} playlistId="abc123" onContinue={() => {}} />);
    expect(screen.getByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("Psalm 46:10")).toBeInTheDocument();
    expect(screen.getByTitle("Peace playlist")).toBeInTheDocument();
    expect(screen.getByLabelText("Step 1 of 3")).toBeInTheDocument();
  });
});

describe("Amen screen", () => {
  it("shows the streak count", () => {
    render(<Amen theme={getTheme("peace")} streak={8} favorite={false} onToggleFavorite={() => {}} />);
    expect(screen.getByText(/8-day streak/)).toBeInTheDocument();
  });
});

describe("Prayer screen", () => {
  it("exposes a real button and keeps the prayer as readable text", () => {
    render(<Prayer devotion={dev} theme={getTheme("peace")} onContinue={() => {}} />);
    const btn = screen.getByRole("button", { name: "Tap when you're ready" });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText("p").tagName).toBe("P");
  });

  it("fires onContinue exactly once per button click", () => {
    const onContinue = vi.fn();
    render(<Prayer devotion={dev} theme={getTheme("peace")} onContinue={onContinue} />);
    fireEvent.click(screen.getByRole("button", { name: "Tap when you're ready" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe("Arrival screen", () => {
  it("hides the streak at zero and shows the greeting", () => {
    render(<Arrival theme={getTheme("peace")} today="Saturday · July 11" streak={0} greeting="Good evening" onBegin={() => {}} />);
    expect(screen.getByText("Good evening")).toBeInTheDocument();
    expect(screen.queryByText(/day streak/)).toBeNull();
  });
});

describe("Done screen", () => {
  it("offers a re-read", () => {
    render(<Done theme={getTheme("peace")} streak={3} onReadAgain={() => {}} />);
    expect(screen.getByText("You've already been here today.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read it again" })).toBeInTheDocument();
  });
});
