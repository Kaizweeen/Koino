import { describe, it, expect } from "vitest";
import { lastNDays, weekdayInitial } from "@/lib/week";

describe("lastNDays", () => {
  it("returns n consecutive days ending at today, oldest first", () => {
    expect(lastNDays("2026-07-12", 7)).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
  });

  it("handles a single day", () => {
    expect(lastNDays("2026-07-12", 1)).toEqual(["2026-07-12"]);
  });
});

describe("weekdayInitial", () => {
  it("maps ISO dates to weekday initials", () => {
    expect(weekdayInitial("2026-07-12")).toBe("S"); // Sunday
    expect(weekdayInitial("2026-07-13")).toBe("M"); // Monday
    expect(weekdayInitial("2026-07-17")).toBe("F"); // Friday
  });
});
