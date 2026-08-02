import { describe, it, expect } from "vitest";
import { getPlan, getPlanDevotions, availablePlans } from "@/lib/plans";

describe("reading plans", () => {
  it("resolves a plan by slug, or null", () => {
    expect(getPlan("rest")?.theme).toBe("peace");
    expect(getPlan("nope")).toBeNull();
  });

  it("a plan's devotions all share its theme, in date order", () => {
    const plan = getPlan("rest")!;
    const devs = getPlanDevotions(plan);
    expect(devs.length).toBeGreaterThan(0);
    expect(devs.every((d) => d.theme === "peace")).toBe(true);
    const dates = devs.map((d) => d.date);
    expect(dates).toEqual([...dates].sort());
  });

  it("only surfaces plans that actually have devotions", () => {
    const avail = availablePlans();
    expect(avail.length).toBeGreaterThan(0);
    for (const p of avail) expect(getPlanDevotions(p).length).toBeGreaterThan(0);
  });
});
