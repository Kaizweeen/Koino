import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("is an installable standalone app with a name and icons", () => {
    const m = manifest();
    expect(m.display).toBe("standalone");
    expect(m.name).toMatch(/Koino/);
    expect(m.start_url).toBe("/app");
    expect(m.icons?.length ?? 0).toBeGreaterThan(0);
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("ships a raster icon of at least 192px, which installers require", () => {
    const raster = manifest().icons?.filter((i) => i.type === "image/png") ?? [];
    expect(raster.map((i) => i.sizes)).toContain("192x192");
    expect(raster.map((i) => i.sizes)).toContain("512x512");
    expect(raster.some((i) => i.purpose === "maskable")).toBe(true);
  });
});
