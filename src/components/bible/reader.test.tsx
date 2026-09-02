import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BibleReader } from "@/components/bible/BibleReader";
import { ChapterSheet } from "@/components/bible/ChapterSheet";
import { clearChapterCache } from "@/lib/bible/chapter";
import { parseReference } from "@/lib/bible/refs";
import { DEFAULT_VERSION } from "@/lib/bible/versions";
import { loadPrefs, setBibleVersion } from "@/lib/prefs";

const push = vi.fn();
let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => search,
}));

/** Serves a chapter that says which translation it came from, so a fetch can be read off screen. */
const serveChapters = () =>
  vi.fn(async (path: string) => {
    const versionId = path.split("/")[2];
    return {
      ok: true,
      json: async () => ({
        book: "PSA",
        chapter: 23,
        verses: [{ n: 1, t: `the ${versionId} shepherd` }],
      }),
    } as Response;
  });

beforeEach(() => {
  localStorage.clear();
  clearChapterCache();
  push.mockClear();
  search = new URLSearchParams();
  vi.stubGlobal("fetch", serveChapters());
  // jsdom has no layout, so it ships no scrollIntoView; the sheet scrolls to the quoted verse.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("BibleReader", () => {
  it("opens in the default translation and names it", async () => {
    render(<BibleReader />);
    expect(await screen.findByText(new RegExp(DEFAULT_VERSION.name))).toBeInTheDocument();
  });

  it("remembers a translation chosen from the book list", async () => {
    render(<BibleReader />);
    fireEvent.click(await screen.findByRole("button", { name: "King James Version" }));

    await waitFor(() => expect(loadPrefs().bibleVersion).toBe("kjv"));
    expect(await screen.findByText(/King James Version/)).toBeInTheDocument();
  });

  it("reads a chapter from the chosen translation, and credits it", async () => {
    setBibleVersion("kjv");
    search = new URLSearchParams({ b: "PSA", c: "23" });

    render(<BibleReader />);

    expect(await screen.findByText(/the kjv shepherd/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/bible/kjv/PSA/23.json");
    expect(screen.getByText(/King James Version \(public domain/)).toBeInTheDocument();
  });

  it("switches the chapter on screen to another translation", async () => {
    search = new URLSearchParams({ b: "PSA", c: "23" });
    render(<BibleReader />);
    expect(await screen.findByText(/the web shepherd/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Berean Standard Bible" }));

    expect(await screen.findByText(/the bsb shepherd/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/bible/bsb/PSA/23.json");
  });
});

describe("ChapterSheet", () => {
  it("opens the chapter in the translation the reader chose", async () => {
    setBibleVersion("bsb");
    render(
      <ChapterSheet reference={parseReference("Psalm 23:1")!} accent="#0F6E56" onClose={() => {}} />,
    );

    expect(await screen.findByText(/the bsb shepherd/)).toBeInTheDocument();
  });

  /** Switching mid-devotion is the same standing preference, so the reader agrees afterwards. */
  it("changes the app-wide choice when switched mid-devotion", async () => {
    render(
      <ChapterSheet reference={parseReference("Psalm 23:1")!} accent="#0F6E56" onClose={() => {}} />,
    );
    expect(await screen.findByText(/the web shepherd/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "King James Version" }));

    expect(await screen.findByText(/the kjv shepherd/)).toBeInTheDocument();
    await waitFor(() => expect(loadPrefs().bibleVersion).toBe("kjv"));
  });
});
