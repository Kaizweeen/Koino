import { describe, it, expect } from "vitest";
import { SOAP_PROMPTS, getSoapPrompts } from "@/lib/soap/prompts";
import { THEMES } from "@/lib/themes";

describe("SOAP prompts", () => {
  it("has an observation, application, and prayer prompt for every theme", () => {
    const slugs = Object.keys(THEMES);
    expect(Object.keys(SOAP_PROMPTS).sort()).toEqual(slugs.sort());
    for (const slug of slugs) {
      const p = getSoapPrompts(slug as keyof typeof THEMES);
      expect(p.observation.trim().length).toBeGreaterThan(0);
      expect(p.application.trim().length).toBeGreaterThan(0);
      expect(p.prayer.trim().length).toBeGreaterThan(0);
    }
  });

  it("returns the peace prompts", () => {
    expect(getSoapPrompts("peace").observation).toMatch(/rest/i);
  });
});
