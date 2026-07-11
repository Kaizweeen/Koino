import { describe, it, expect } from "vitest";
import { formatDisplayDate, greetingForHour } from "@/lib/dates";

describe("formatDisplayDate", () => {
  it("formats an ISO date as weekday · month day", () => {
    expect(formatDisplayDate("2026-07-11")).toBe("Saturday · July 11");
  });
});

describe("greetingForHour", () => {
  it("greets by time of day", () => {
    expect(greetingForHour(6)).toBe("Good morning");
    expect(greetingForHour(14)).toBe("Good afternoon");
    expect(greetingForHour(21)).toBe("Good evening");
  });
});
