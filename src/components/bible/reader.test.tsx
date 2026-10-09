import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BibleReader } from "@/components/bible/BibleReader";
import { clearChapterCache } from "@/lib/bible/chapter";

const params = new URLSearchParams("b=PSA&c=46");

vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ push: vi.fn() }),
}));

const PSALM_46 = {
  book: "PSA",
  chapter: 46,
  verses: [
    { n: 9, t: "He makes wars cease to the end of the earth." },
    { n: 10, t: "Be still, and know that I am God." },
    { n: 11, t: "Yahweh of Armies is with us." },
  ],
};

beforeEach(() => {
  clearChapterCache();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => PSALM_46 })),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("BibleReader verse selection", () => {
  it("offers to reflect on a verse once one is tapped", async () => {
    render(<BibleReader />);
    fireEvent.click(await screen.findByText("Be still, and know that I am God."));

    expect(screen.getByText("Psalms 46:10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reflect on this" })).toHaveAttribute(
      "href",
      "/app/soap?b=PSA&c=46&v=10",
    );
  });

  it("stretches the span to a second verse tapped outside it", async () => {
    render(<BibleReader />);
    fireEvent.click(await screen.findByText("Be still, and know that I am God."));
    fireEvent.click(screen.getByText("Yahweh of Armies is with us."));

    expect(screen.getByRole("link", { name: "Reflect on this" })).toHaveAttribute(
      "href",
      "/app/soap?b=PSA&c=46&v=10-11",
    );
  });

  it("narrows a span back to one verse, and lets a single verse go", async () => {
    render(<BibleReader />);
    fireEvent.click(await screen.findByText("Be still, and know that I am God."));
    fireEvent.click(screen.getByText("Yahweh of Armies is with us."));
    fireEvent.click(screen.getByText("Yahweh of Armies is with us."));
    expect(screen.getByRole("link", { name: "Reflect on this" })).toHaveAttribute(
      "href",
      "/app/soap?b=PSA&c=46&v=11",
    );

    fireEvent.click(screen.getByText("Yahweh of Armies is with us."));
    expect(screen.queryByRole("link", { name: "Reflect on this" })).toBeNull();
  });

  it("offers the whole chapter until a verse narrows it", async () => {
    render(<BibleReader />);
    const chapterLink = await screen.findByRole("link", { name: /Reflect on this chapter/ });
    expect(chapterLink).toHaveAttribute("href", "/app/soap?b=PSA&c=46");

    // Picking a verse is a narrower ask, so the chapter offer steps out of its way.
    fireEvent.click(screen.getByText("Be still, and know that I am God."));
    expect(screen.queryByRole("link", { name: /Reflect on this chapter/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.getByRole("link", { name: /Reflect on this chapter/ })).toBeInTheDocument();
  });

  it("clears the selection outright", async () => {
    render(<BibleReader />);
    fireEvent.click(await screen.findByText("Be still, and know that I am God."));
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.queryByRole("link", { name: "Reflect on this" })).toBeNull();
  });

  it("responds to the keyboard, since every verse is a control here", async () => {
    render(<BibleReader />);
    const target = await screen.findByText("Be still, and know that I am God.");
    fireEvent.keyDown(target, { key: "Enter" });
    expect(screen.getByRole("link", { name: "Reflect on this" })).toHaveAttribute(
      "href",
      "/app/soap?b=PSA&c=46&v=10",
    );
  });
});
