import { describe, it, expect, beforeEach } from "vitest";
import { exportProgress, backupFilename, mergeProgress, extractProgress, importProgress } from "@/lib/backup";
import { loadProgress } from "@/lib/progress";

beforeEach(() => localStorage.clear());

describe("backup", () => {
  it("exports the current progress as a versioned Koino document", () => {
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: ["2026-06-25"], favorites: [], entries: { "2026-06-25": { observation: "o", application: "", prayer: "" } } }));
    const doc = JSON.parse(exportProgress());
    expect(doc.app).toBe("koino");
    expect(doc.version).toBe(1);
    expect(doc.progress.entries["2026-06-25"].observation).toBe("o");
  });

  it("names the backup by date", () => {
    expect(backupFilename(new Date("2026-08-02T10:00:00Z"))).toBe("koino-journal-2026-08-02.json");
  });

  it("unions completed dates and favorites and prefers incoming entries", () => {
    const base = { completedDates: ["a"], favorites: ["x"], entries: { d1: { observation: "old", application: "", prayer: "" } }, notes: {} };
    const incoming = { completedDates: ["b"], favorites: ["x", "y"], entries: { d1: { observation: "new", application: "", prayer: "" }, d2: { observation: "n2", application: "", prayer: "" } }, notes: {} };
    const merged = mergeProgress(base, incoming);
    expect(merged.completedDates).toEqual(["a", "b"]);
    expect(merged.favorites).toEqual(["x", "y"]);
    expect(merged.entries.d1.observation).toBe("new");
    expect(merged.entries.d2.observation).toBe("n2");
  });

  it("accepts a wrapped backup or a bare progress object, and rejects junk", () => {
    expect(extractProgress({ app: "koino", progress: { entries: {} } })).not.toBeNull();
    expect(extractProgress({ completedDates: [], favorites: [], entries: {}, notes: {} })).not.toBeNull();
    expect(extractProgress({ hello: "world" })).toBeNull();
    expect(extractProgress("nope")).toBeNull();
  });

  it("imports a backup and merges it into stored progress", () => {
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: ["2026-06-25"], favorites: [], entries: {}, notes: {} }));
    const doc = JSON.stringify({ app: "koino", version: 1, exportedAt: "x", progress: { completedDates: ["2026-06-26"], favorites: ["2026-06-26"], entries: { "2026-06-26": { observation: "restored", application: "", prayer: "" } }, notes: {} } });
    importProgress(doc);
    const p = loadProgress();
    expect(p.completedDates).toEqual(["2026-06-25", "2026-06-26"]);
    expect(p.entries["2026-06-26"].observation).toBe("restored");
  });

  it("throws a friendly error on invalid JSON or non-Koino files", () => {
    expect(() => importProgress("{not json")).toThrow(/valid JSON/);
    expect(() => importProgress(JSON.stringify({ hello: 1 }))).toThrow(/Koino backup/);
  });
});
