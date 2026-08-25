import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "@/components/Icon";
import { THEMES } from "@/lib/themes";

const SRC = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(e.name) && !e.name.includes(".test.") ? [path] : [];
  });
}

/** Every icon named by a string literal at a call site, plus the ones data files select by name. */
function referencedNames(): string[] {
  const literals = sourceFiles(SRC).flatMap((f) => [
    ...readFileSync(f, "utf8").matchAll(/<Icon\s+name="([a-z0-9-]+)"/g),
    ...readFileSync(f, "utf8").matchAll(/\bicon:\s*"([a-z0-9-]+)"/g),
  ]);
  return [...new Set(literals.map((m) => m[1]))];
}

describe("Icon", () => {
  it("draws every icon the app asks for", () => {
    const names = referencedNames();
    // Guards the extraction itself: a broken regex would vacuously pass the loop below.
    expect(names.length).toBeGreaterThan(20);

    const missing = names.filter((name) => render(<Icon name={name} />).container.querySelector("svg") === null);
    expect(missing).toEqual([]);
  });

  it("draws every theme icon", () => {
    const icons = Object.values(THEMES).map((t) => t.icon);
    expect(icons).toHaveLength(12);
    expect(icons.filter((name) => render(<Icon name={name} />).container.querySelector("svg") === null)).toEqual([]);
  });

  it("inherits size and colour from the call site, as the icon font did", () => {
    const { container } = render(<Icon name="heart" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("1em");
    expect(svg.getAttribute("stroke")).toBe("currentColor");
  });

  it("hides decorative icons from assistive tech but names labelled ones", () => {
    expect(render(<Icon name="heart" />).container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    const labelled = render(<Icon name="heart" label="Saved" />).container.querySelector("svg")!;
    expect(labelled).toHaveAttribute("role", "img");
    expect(labelled).toHaveAttribute("aria-label", "Saved");
    expect(labelled).not.toHaveAttribute("aria-hidden");
  });
});
