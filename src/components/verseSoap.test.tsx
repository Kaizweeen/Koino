import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VerseSoap } from "@/components/VerseSoap";
import { clearChapterCache } from "@/lib/bible/chapter";
import { loadProgress, reflectionIdFor } from "@/lib/progress";

let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ push: vi.fn() }),
}));

const PSALM_46 = {
  book: "PSA",
  chapter: 46,
  verses: [
    { n: 10, t: "Be still, and know that I am God." },
    { n: 11, t: "Yahweh of Armies is with us." },
  ],
};

beforeEach(() => {
  clearChapterCache();
  vi.setSystemTime(new Date(2026, 7, 30, 9, 0, 0));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => PSALM_46 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
});

describe("VerseSoap", () => {
  it("offers the picker when no verse has been chosen", () => {
    params = new URLSearchParams();
    render(<VerseSoap />);
    expect(screen.getByText("Reflect on a passage")).toBeInTheDocument();
    expect(screen.getByLabelText("The passage")).toBeInTheDocument();
  });

  it("only offers to begin once the typed reference resolves", () => {
    params = new URLSearchParams();
    render(<VerseSoap />);
    expect(screen.getByRole("button", { name: "Begin" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("The passage"), { target: { value: "Psalm 46:10" } });
    expect(screen.getByRole("link", { name: /Begin with Psalms 46:10/ })).toHaveAttribute(
      "href",
      "/app/soap?b=PSA&c=46&v=10&m=open",
    );
  });

  it("takes a typed chapter, and says so before you commit to it", () => {
    params = new URLSearchParams();
    render(<VerseSoap />);

    fireEvent.change(screen.getByLabelText("The passage"), { target: { value: "Psalm 46" } });
    expect(screen.getByText("the whole chapter", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Begin with Psalms 46/ })).toHaveAttribute(
      "href",
      "/app/soap?b=PSA&c=46&m=open",
    );

    // One keystroke apart and a different sitting, so the two must not look alike here.
    fireEvent.change(screen.getByLabelText("The passage"), { target: { value: "Psalm 46:1" } });
    expect(screen.queryByText("the whole chapter", { exact: false })).toBeNull();
    expect(screen.getByRole("link", { name: /Begin with Psalms 46:1/ })).toHaveAttribute(
      "href",
      "/app/soap?b=PSA&c=46&v=1&m=open",
    );
  });

  it("opens the chosen verse at Scripture rather than at a greeting", async () => {
    params = new URLSearchParams("b=PSA&c=46&v=10");
    render(<VerseSoap />);
    expect(await screen.findByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("Psalms 46:10")).toBeInTheDocument();
    expect(screen.getByLabelText("SOAP step 1 of 4")).toBeInTheDocument();
    expect(screen.queryByText("Begin")).toBeNull();
  });

  it("reads a verse span as one passage", async () => {
    params = new URLSearchParams("b=PSA&c=46&v=10-11");
    render(<VerseSoap />);
    expect(
      await screen.findByText("Be still, and know that I am God. Yahweh of Armies is with us."),
    ).toBeInTheDocument();
    expect(screen.getByText("Psalms 46:10-11")).toBeInTheDocument();
  });

  it("asks the mood's questions when a mood came with the verse", async () => {
    params = new URLSearchParams("b=PSA&c=46&v=10&m=lament");
    render(<VerseSoap />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue/ }));
    expect(
      screen.getByText("What honest thing does this passage give you permission to bring to God?"),
    ).toBeInTheDocument();
  });

  it("asks open questions when no mood came with it", async () => {
    params = new URLSearchParams("b=PSA&c=46&v=10");
    render(<VerseSoap />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue/ }));
    expect(
      screen.getByText("What does this passage actually say, and what does it show you about God?"),
    ).toBeInTheDocument();
  });

  it("saves what is written against the verse, and leaves the streak alone", async () => {
    params = new URLSearchParams("b=PSA&c=46&v=10");
    render(<VerseSoap />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue/ }));
    fireEvent.change(screen.getByLabelText("Observation"), { target: { value: "God does the stilling" } });

    await waitFor(() => {
      const stored = loadProgress().reflections[reflectionIdFor("2026-08-30", "Psalms 46:10")];
      expect(stored?.soap.observation).toBe("God does the stilling");
      expect(stored?.verseText).toBe("Be still, and know that I am God.");
    });
    expect(loadProgress().completedDates).toEqual([]);
  });

  it("closes on Amen with the journal, not a streak it never earned", async () => {
    params = new URLSearchParams("b=PSA&c=46&v=10");
    render(<VerseSoap />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Amen" }));

    expect(screen.getByText("Amen.")).toBeInTheDocument();
    expect(screen.getByText("Kept in your journal")).toBeInTheDocument();
    expect(screen.queryByText(/day streak/)).toBeNull();
  });

  it("sets a whole chapter to read rather than quoting it", async () => {
    params = new URLSearchParams("b=PSA&c=46");
    render(<VerseSoap />);

    // Every verse of the chapter, in reading type — not one pull quote of the lot.
    expect(await screen.findByRole("heading", { name: "Psalms 46" })).toBeInTheDocument();
    expect(screen.getByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("Yahweh of Armies is with us.")).toBeInTheDocument();
    expect(screen.getByLabelText("SOAP step 1 of 4")).toBeInTheDocument();
    // The chapter is the passage, so there is nothing further to open.
    expect(screen.queryByText("Read the whole chapter")).toBeNull();
  });

  it("saves a chapter reflection against the chapter, not its first verse", async () => {
    params = new URLSearchParams("b=PSA&c=46");
    render(<VerseSoap />);
    fireEvent.click(await screen.findByRole("button", { name: /Continue/ }));
    fireEvent.change(screen.getByLabelText("Observation"), { target: { value: "refuge, then stillness" } });

    await waitFor(() => {
      const stored = loadProgress().reflections[reflectionIdFor("2026-08-30", "Psalms 46")];
      expect(stored?.soap.observation).toBe("refuge, then stillness");
      // The opening stands in for the chapter; the whole of it is never copied into storage.
      expect(stored?.verseText).toBe("Be still, and know that I am God. Yahweh of Armies is with us.");
    });
    expect(loadProgress().reflections[reflectionIdFor("2026-08-30", "Psalms 46:1")]).toBeUndefined();
  });

  it("shows a way back when the passage cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));
    params = new URLSearchParams("b=PSA&c=46&v=10");
    render(<VerseSoap />);
    expect(await screen.findByText("We couldn't find that passage.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
