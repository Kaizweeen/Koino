import { describe, it, expect, beforeEach } from "vitest";
import { loadPrefs, setOnboarded } from "@/lib/prefs";
import { milestoneFor } from "@/lib/streak";

beforeEach(() => localStorage.clear());

describe("prefs", () => {
  it("defaults to not onboarded and persists the flag", () => {
    expect(loadPrefs().onboarded).toBe(false);
    setOnboarded();
    expect(loadPrefs().onboarded).toBe(true);
  });

  it("tolerates a missing or corrupt store", () => {
    localStorage.setItem("koino.prefs.v1", "{not json");
    expect(loadPrefs().onboarded).toBe(false);
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
