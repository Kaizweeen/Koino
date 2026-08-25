import { afterEach, describe, expect, it, vi } from "vitest";
import { isStorageAvailable, readRaw, writeRaw } from "@/lib/storage";
import { loadProgress, markComplete, setSoapField } from "@/lib/progress";
import { loadPrefs, setThemePref } from "@/lib/prefs";

/** Make localStorage behave like Safari Private Browsing / an exhausted quota. */
function breakWrites() {
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("QuotaExceededError");
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("storage", () => {
  it("round-trips a value", () => {
    expect(writeRaw("k", "v")).toBe(true);
    expect(readRaw("k")).toBe("v");
  });

  it("reports a rejected write instead of throwing", () => {
    breakWrites();
    expect(writeRaw("k", "v")).toBe(false);
  });

  it("reports unreadable storage as absent", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    expect(readRaw("k")).toBeNull();
  });

  it("detects storage that will not keep writes", () => {
    expect(isStorageAvailable()).toBe(true);
    breakWrites();
    expect(isStorageAvailable()).toBe(false);
  });

  it("leaves no probe key behind", () => {
    isStorageAvailable();
    expect(readRaw("koino.probe")).toBeNull();
  });
});

describe("callers survive unwritable storage", () => {
  it("keeps the devotion usable when progress cannot be saved", () => {
    breakWrites();
    expect(() => markComplete("2026-08-25")).not.toThrow();
    expect(() => setSoapField("2026-08-25", "prayer", "thank you")).not.toThrow();
    expect(loadProgress().completedDates).toEqual([]);
  });

  it("keeps settings usable when prefs cannot be saved", () => {
    breakWrites();
    expect(() => setThemePref("dark")).not.toThrow();
    expect(loadPrefs().theme).toBe("system");
  });
});
