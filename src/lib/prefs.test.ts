import { describe, it, expect, beforeEach } from "vitest";
import { loadPrefs, setBibleVersion, setOnboarded, setThemePref, setTextSize } from "@/lib/prefs";
import { DEFAULT_VERSION } from "@/lib/bible/versions";
import { milestoneFor } from "@/lib/streak";

beforeEach(() => localStorage.clear());

describe("prefs", () => {
  it("defaults to not onboarded, system theme, regular text, and the default translation", () => {
    const p = loadPrefs();
    expect(p.onboarded).toBe(false);
    expect(p.theme).toBe("system");
    expect(p.textSize).toBe("regular");
    expect(p.bibleVersion).toBe(DEFAULT_VERSION.id);
  });

  it("persists the onboarded flag", () => {
    setOnboarded();
    expect(loadPrefs().onboarded).toBe(true);
  });

  it("persists theme and text size and stamps the document", () => {
    setThemePref("dark");
    setTextSize("large");
    expect(loadPrefs().theme).toBe("dark");
    expect(loadPrefs().textSize).toBe("large");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.text).toBe("large");
  });

  it("persists the chosen Bible version", () => {
    setBibleVersion("kjv");
    expect(loadPrefs().bibleVersion).toBe("kjv");
  });

  it("keeps every other preference when the version changes", () => {
    setThemePref("dark");
    setOnboarded();
    setBibleVersion("kjv");
    expect(loadPrefs()).toMatchObject({ theme: "dark", onboarded: true, bibleVersion: "kjv" });
  });

  /** A version can vanish between deploys; a stored id for one must not leave the reader empty. */
  it("falls back to the default for a version this build does not ship", () => {
    setBibleVersion("a-version-we-dropped");
    expect(loadPrefs().bibleVersion).toBe(DEFAULT_VERSION.id);

    localStorage.setItem("koino.prefs.v1", JSON.stringify({ bibleVersion: "nrsv" }));
    expect(loadPrefs().bibleVersion).toBe(DEFAULT_VERSION.id);
  });

  it("tolerates a missing or corrupt store", () => {
    localStorage.setItem("koino.prefs.v1", "{not json");
    expect(loadPrefs().onboarded).toBe(false);
    expect(loadPrefs().theme).toBe("system");
    expect(loadPrefs().bibleVersion).toBe(DEFAULT_VERSION.id);
  });
});

describe("streak milestones", () => {
  it("returns a milestone only on notable streak counts", () => {
    expect(milestoneFor(7)?.days).toBe(7);
    expect(milestoneFor(30)?.title).toMatch(/month/i);
    expect(milestoneFor(1)).toBeNull();
    expect(milestoneFor(8)).toBeNull();
    expect(milestoneFor(0)).toBeNull();
  });
});
