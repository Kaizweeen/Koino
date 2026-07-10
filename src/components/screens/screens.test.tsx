import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";

describe("SpotifyEmbed", () => {
  it("renders an iframe pointing at the playlist embed URL", () => {
    render(<SpotifyEmbed playlistId="abc123" title="Peace playlist" />);
    const frame = screen.getByTitle("Peace playlist") as HTMLIFrameElement;
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.src).toContain("open.spotify.com/embed/playlist/abc123");
  });
});
