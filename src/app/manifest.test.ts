import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("is an installable standalone app with a name and icons", () => {
    const m = manifest();
    expect(m.display).toBe("standalone");
    expect(m.name).toMatch(/Koino/);
    expect(m.start_url).toBe("/");
    expect(m.icons?.length ?? 0).toBeGreaterThan(0);
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
  });
});
