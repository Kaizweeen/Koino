import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { Verse } from "@/components/screens/Verse";
import { Amen } from "@/components/screens/Amen";
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
  it("shows the verse text and reference in the theme accent", () => {
    render(<Verse devotion={dev} theme={getTheme("peace")} onContinue={() => {}} />);
    expect(screen.getByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("Psalm 46:10")).toBeInTheDocument();
  });
});

describe("Amen screen", () => {
  it("shows the streak count", () => {
    render(<Amen theme={getTheme("peace")} streak={8} favorite={false} onToggleFavorite={() => {}} />);
    expect(screen.getByText(/8-day streak/)).toBeInTheDocument();
  });
});
