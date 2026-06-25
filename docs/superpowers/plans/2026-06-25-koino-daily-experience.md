# Koino Daily Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the anonymous, flat-file-driven daily devotion experience — the morning flow Arrival → Verse → Reflection → Prayer → Amen → Linger with a theme-tinted embedded Spotify playlist and a local-storage streak.

**Architecture:** Next.js 14 App Router. A server component resolves "today's" devotion from flat TypeScript content files and a theme registry, then hands it to a client-side flow controller that sequences six presentational screens. Streak/favorites live in `localStorage`. No database, no auth, no network calls except the Spotify embed iframe.

**Tech Stack:** Next.js 14, TypeScript (strict), Tailwind CSS, Vitest + React Testing Library (jsdom) for tests.

## Global Constraints

- Next.js pinned to the latest patched `14.2.x` (current `14.2.15` has a known vulnerability).
- TypeScript `strict` is on — no `any`, no implicit `any`.
- Import alias `@/*` maps to `./src/*` (already in `tsconfig.json`).
- Scripture is rendered in a serif (`--font-serif`); all interface text in a sans (`--font-sans`).
- Canvas color is warm paper `#FBFAF7`; primary ink `#2C2C2A`; muted `#9A988F`; secondary `#6F6E68`.
- Theme accent is the ONLY thing that changes between days — layout, type, and rhythm stay constant.
- Tabler outline icons only (icon font), referenced by name in the theme registry.
- Sentence case everywhere. No emoji.
- This slice is anonymous-only: no Supabase, no accounts, no live Bible API. Verse text is stored inline in the seed content.

---

## File Structure

- `vitest.config.ts` — test runner config (jsdom, React plugin).
- `vitest.setup.ts` — imports `@testing-library/jest-dom`.
- `src/lib/themes.ts` — `Theme` type, the 12-theme registry, `getTheme`.
- `src/lib/themes.test.ts` — registry tests.
- `src/lib/devotions/types.ts` — `Devotion` type.
- `src/lib/devotions/content.ts` — the seed devotion array (flat content).
- `src/lib/devotions/select.ts` — pure `getDevotionForDate`, `getTodayDevotion`, `getPlaylistId`.
- `src/lib/devotions/select.test.ts` — selection + rotation tests.
- `src/lib/progress.ts` — `localStorage` progress store + pure `computeStreak`.
- `src/lib/progress.test.ts` — streak logic tests.
- `src/components/SpotifyEmbed.tsx` — themed iframe wrapper.
- `src/components/screens/Arrival.tsx`, `Verse.tsx`, `Reflection.tsx`, `Prayer.tsx`, `Amen.tsx`, `Linger.tsx` — presentational screens.
- `src/components/screens/screens.test.tsx` — rendering/accent tests.
- `src/components/DevotionFlow.tsx` — client flow controller.
- `src/app/layout.tsx` — fonts + globals.
- `src/app/globals.css` — design tokens + base styles.
- `src/app/page.tsx` — server component: resolve today's devotion, render `DevotionFlow`.
- `tailwind.config.ts` — extend with Koino tokens (modify existing).

---

### Task 1: Project setup, Next.js upgrade, and test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`

**Interfaces:**
- Produces: a booting Next.js app with `npm test` wired to Vitest, and an `npm run test` script.

- [ ] **Step 1: Upgrade Next.js to the latest patched 14.2.x**

Run: `npm install next@"14.2.x"`
Expected: `package.json` `next` dependency resolves to a `14.2.x` newer than `14.2.15`; no install errors.

- [ ] **Step 2: Install test tooling**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: packages added to `devDependencies`.

- [ ] **Step 3: Add the test script**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 6: Create the minimal app shell**

`src/app/globals.css`:
```css
:root {
  --color-paper: #FBFAF7;
  --color-ink: #2C2C2A;
  --color-ink-muted: #9A988F;
  --color-ink-secondary: #6F6E68;
  --font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-serif: Georgia, "Times New Roman", serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koino",
  description: "A daily guided devotion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx` (placeholder, replaced in Task 8):
```tsx
export default function Page() {
  return <main>Koino</main>;
}
```

- [ ] **Step 7: Verify the app builds and tests run**

Run: `npm run build`
Expected: build succeeds.
Run: `npm test`
Expected: Vitest runs and reports "no test files" (exit 0) — tooling is wired.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts src/app
git commit -m "chore: upgrade Next.js, add Vitest, scaffold app shell"
```

---

### Task 2: Design tokens in Tailwind

**Files:**
- Modify: `tailwind.config.ts`

**Interfaces:**
- Produces: Tailwind utilities for `paper`, `ink`, `ink-muted`, `ink-secondary` colors and a `serif`/`sans` font family, usable by all screen components.

- [ ] **Step 1: Extend the Tailwind theme**

Replace the `theme` block in `tailwind.config.ts` so `content` covers `./src/**/*.{ts,tsx}` and `extend` adds:
```ts
extend: {
  colors: {
    paper: "#FBFAF7",
    ink: { DEFAULT: "#2C2C2A", muted: "#9A988F", secondary: "#6F6E68" },
  },
  fontFamily: {
    sans: ["var(--font-sans)"],
    serif: ["var(--font-serif)"],
  },
},
```
Ensure `content` is: `content: ["./src/**/*.{ts,tsx}"]`.

- [ ] **Step 2: Verify Tailwind compiles**

Run: `npm run build`
Expected: build succeeds with no Tailwind config errors.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add Koino design tokens to Tailwind"
```

---

### Task 3: Theme registry

**Files:**
- Create: `src/lib/themes.ts`
- Test: `src/lib/themes.test.ts`

**Interfaces:**
- Produces:
  - `type ThemeSlug = "peace" | "gratitude" | "hope" | "lament" | "surrender" | "awe" | "joy" | "repentance" | "strength" | "comfort" | "love" | "longing"`
  - `interface Theme { slug: ThemeSlug; name: string; definition: string; moodProfile: string; accent: string; accentSoft: string; accentBorder: string; icon: string; playlistIds: string[] }`
  - `const THEMES: Record<ThemeSlug, Theme>`
  - `function getTheme(slug: ThemeSlug): Theme`

- [ ] **Step 1: Write the failing test**

`src/lib/themes.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { THEMES, getTheme } from "@/lib/themes";

describe("theme registry", () => {
  it("defines all 12 themes with matching slugs", () => {
    const slugs = Object.keys(THEMES);
    expect(slugs).toHaveLength(12);
    for (const [key, theme] of Object.entries(THEMES)) {
      expect(theme.slug).toBe(key);
    }
  });

  it("gives every theme a non-empty accent hex and at least one playlist", () => {
    for (const theme of Object.values(THEMES)) {
      expect(theme.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.playlistIds.length).toBeGreaterThan(0);
    }
  });

  it("getTheme returns the requested theme", () => {
    expect(getTheme("peace").name).toBe("Peace");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- themes`
Expected: FAIL — cannot resolve `@/lib/themes`.

- [ ] **Step 3: Write the registry**

`src/lib/themes.ts` (playlist IDs are placeholders the owner replaces with real Koino-owned playlist IDs; each is a valid 22-char base62 string so embeds render):
```ts
export type ThemeSlug =
  | "peace" | "gratitude" | "hope" | "lament" | "surrender" | "awe"
  | "joy" | "repentance" | "strength" | "comfort" | "love" | "longing";

export interface Theme {
  slug: ThemeSlug;
  name: string;
  definition: string;
  moodProfile: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  icon: string;
  playlistIds: string[];
}

export const THEMES: Record<ThemeSlug, Theme> = {
  peace:      { slug: "peace",      name: "Peace",      definition: "Resting in God's nearness instead of striving.", moodProfile: "Ambient, slow, soft instrumental worship.", accent: "#0F6E56", accentSoft: "#E1F5EE", accentBorder: "#9FE1CB", icon: "ripple",      playlistIds: ["37i9dQZF1DWZqd5JICZI0u"] },
  gratitude:  { slug: "gratitude",  name: "Gratitude",  definition: "Naming and thanking God for his gifts.",          moodProfile: "Warm, gentle, acoustic, major-key.",        accent: "#854F0B", accentSoft: "#FAEEDA", accentBorder: "#FAC775", icon: "sun",         playlistIds: ["37i9dQZF1DX5trt9i14X7j"] },
  hope:       { slug: "hope",       name: "Hope",       definition: "Looking forward to God's promises.",              moodProfile: "Building, hopeful, light.",                 accent: "#185FA5", accentSoft: "#E6F1FB", accentBorder: "#B5D4F4", icon: "sunrise",     playlistIds: ["37i9dQZF1DX2sUQwD7tbmL"] },
  lament:     { slug: "lament",     name: "Lament",     definition: "Bringing grief honestly before God.",             moodProfile: "Sparse, minor, reflective, room to breathe.", accent: "#534AB7", accentSoft: "#EEEDFE", accentBorder: "#CECBF6", icon: "cloud-rain",  playlistIds: ["37i9dQZF1DWVrtsSlLKzro"] },
  surrender:  { slug: "surrender",  name: "Surrender",  definition: "Yielding control and trusting God.",              moodProfile: "Tender, yielding, contemplative.",          accent: "#0F6E56", accentSoft: "#E1F5EE", accentBorder: "#9FE1CB", icon: "hand-stop",   playlistIds: ["37i9dQZF1DWUvQoIOFMFUT"] },
  awe:        { slug: "awe",        name: "Awe",        definition: "Standing small before God's greatness.",          moodProfile: "Expansive, reverent, cinematic.",           accent: "#0C447C", accentSoft: "#E6F1FB", accentBorder: "#85B7EB", icon: "mountain",    playlistIds: ["37i9dQZF1DX4PP3DA4J0N8"] },
  joy:        { slug: "joy",        name: "Joy",        definition: "Celebrating God's goodness.",                     moodProfile: "Upbeat, bright, rhythmic.",                 accent: "#993C1D", accentSoft: "#FAECE7", accentBorder: "#F5C4B3", icon: "sparkles",    playlistIds: ["37i9dQZF1DX9wa6XirBPv8"] },
  repentance: { slug: "repentance", name: "Repentance", definition: "Turning back to God with humility.",              moodProfile: "Quiet, honest, stripped-back.",             accent: "#5F5E5A", accentSoft: "#F1EFE8", accentBorder: "#D3D1C7", icon: "flame",       playlistIds: ["37i9dQZF1DX1s9knjP51Oa"] },
  strength:   { slug: "strength",   name: "Strength",   definition: "Drawing courage from God's steadiness.",          moodProfile: "Steady, grounding, anthemic.",              accent: "#3B6D11", accentSoft: "#EAF3DE", accentBorder: "#C0DD97", icon: "shield",      playlistIds: ["37i9dQZF1DX0jgyAiPl8Af"] },
  comfort:    { slug: "comfort",    name: "Comfort",    definition: "Receiving God's nearness in pain.",               moodProfile: "Enveloping, soothing, soft pads.",          accent: "#185FA5", accentSoft: "#E6F1FB", accentBorder: "#B5D4F4", icon: "feather",     playlistIds: ["37i9dQZF1DWXe9gFZP0gtP"] },
  love:       { slug: "love",       name: "Love",       definition: "Resting in and reflecting God's love.",           moodProfile: "Warm, intimate, melodic.",                  accent: "#993556", accentSoft: "#FBEAF0", accentBorder: "#F4C0D1", icon: "heart",       playlistIds: ["37i9dQZF1DWVUhXYrJfk1c"] },
  longing:    { slug: "longing",    name: "Longing",    definition: "Seeking and waiting on God.",                     moodProfile: "Yearning, open, atmospheric.",              accent: "#26215C", accentSoft: "#EEEDFE", accentBorder: "#AFA9EC", icon: "compass",     playlistIds: ["37i9dQZF1DWSiZVO2J6WeI"] },
};

export function getTheme(slug: ThemeSlug): Theme {
  return THEMES[slug];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- themes`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/themes.ts src/lib/themes.test.ts
git commit -m "feat: add 12-theme registry"
```

---

### Task 4: Devotion content model and selection

**Files:**
- Create: `src/lib/devotions/types.ts`
- Create: `src/lib/devotions/content.ts`
- Create: `src/lib/devotions/select.ts`
- Test: `src/lib/devotions/select.test.ts`

**Interfaces:**
- Produces:
  - `interface Devotion { date: string; verseRef: string; verseText: string; theme: ThemeSlug; reflection: string; prayer: string }`
  - `const DEVOTIONS: Devotion[]` (sorted ascending by `date`)
  - `function getDevotionForDate(devotions: Devotion[], date: string): Devotion | null`
  - `function getTodayDevotion(devotions: Devotion[], today: string): Devotion` — exact match, else most recent past entry, else the first entry
  - `function getPlaylistId(theme: Theme, date: string): string` — rotates by day index over `theme.playlistIds`

- [ ] **Step 1: Write the failing test**

`src/lib/devotions/select.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getDevotionForDate, getTodayDevotion, getPlaylistId } from "@/lib/devotions/select";
import type { Devotion } from "@/lib/devotions/types";

const sample: Devotion[] = [
  { date: "2026-06-23", verseRef: "A 1:1", verseText: "a", theme: "peace", reflection: "r", prayer: "p" },
  { date: "2026-06-25", verseRef: "B 1:1", verseText: "b", theme: "joy",   reflection: "r", prayer: "p" },
];

describe("devotion selection", () => {
  it("returns an exact date match", () => {
    expect(getDevotionForDate(sample, "2026-06-25")?.verseRef).toBe("B 1:1");
  });

  it("returns null when no date matches", () => {
    expect(getDevotionForDate(sample, "2030-01-01")).toBeNull();
  });

  it("today falls back to the most recent past entry", () => {
    expect(getTodayDevotion(sample, "2026-06-24").date).toBe("2026-06-23");
  });

  it("today falls back to the first entry when all are in the future", () => {
    expect(getTodayDevotion(sample, "2026-01-01").date).toBe("2026-06-23");
  });

  it("rotates playlists deterministically by date", () => {
    const theme = { playlistIds: ["x", "y"] } as any;
    expect(getPlaylistId(theme, "2026-06-24")).toBe(getPlaylistId(theme, "2026-06-24"));
    expect(getPlaylistId({ playlistIds: ["only"] } as any, "2026-06-24")).toBe("only");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- select`
Expected: FAIL — cannot resolve `@/lib/devotions/select`.

- [ ] **Step 3: Write the types**

`src/lib/devotions/types.ts`:
```ts
import type { ThemeSlug } from "@/lib/themes";

export interface Devotion {
  date: string;       // YYYY-MM-DD
  verseRef: string;
  verseText: string;
  theme: ThemeSlug;
  reflection: string;
  prayer: string;
}
```

- [ ] **Step 4: Write the selection logic**

`src/lib/devotions/select.ts`:
```ts
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

export function getDevotionForDate(devotions: Devotion[], date: string): Devotion | null {
  return devotions.find((d) => d.date === date) ?? null;
}

export function getTodayDevotion(devotions: Devotion[], today: string): Devotion {
  const exact = getDevotionForDate(devotions, today);
  if (exact) return exact;
  const past = devotions.filter((d) => d.date <= today);
  if (past.length > 0) return past[past.length - 1];
  return devotions[0];
}

function dayIndex(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

export function getPlaylistId(theme: Theme, date: string): string {
  const ids = theme.playlistIds;
  return ids[dayIndex(date) % ids.length];
}
```

- [ ] **Step 5: Write the seed content**

`src/lib/devotions/content.ts` (seed the first week; owner extends to ~30 days. Verse text is World English Bible, public domain):
```ts
import type { Devotion } from "@/lib/devotions/types";

export const DEVOTIONS: Devotion[] = [
  {
    date: "2026-06-25",
    verseRef: "Psalm 46:10",
    verseText: "Be still, and know that I am God.",
    theme: "peace",
    reflection:
      "Stillness isn't the absence of noise — it's trusting the One who holds it all. You don't have to carry today by force. Begin from rest, not striving.",
    prayer:
      "Quiet my heart, Lord. Before I do anything today, let me rest in knowing you are God — and I am held.",
  },
  {
    date: "2026-06-26",
    verseRef: "1 Thessalonians 5:18",
    verseText: "In everything give thanks, for this is the will of God in Christ Jesus toward you.",
    theme: "gratitude",
    reflection:
      "Gratitude doesn't deny what's hard; it widens the frame until grace is back in view. Name one gift before the day's demands crowd in.",
    prayer:
      "Thank you, Father, for mercy I forget to count. Open my eyes to your goodness already around me.",
  },
  {
    date: "2026-06-27",
    verseRef: "Psalm 30:5",
    verseText: "Weeping may stay for the night, but joy comes in the morning.",
    theme: "lament",
    reflection:
      "God makes room for the night. Grief is not faithlessness — it's honesty carried to the only One who can hold it. Morning is coming, but you can weep until it does.",
    prayer:
      "Lord, I bring you what hurts. Sit with me in the dark, and let me trust the morning you've promised.",
  },
];
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- select`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/devotions
git commit -m "feat: add devotion content model, seed content, and selection"
```

---

### Task 5: Spotify embed component

**Files:**
- Create: `src/components/SpotifyEmbed.tsx`
- Test: `src/components/screens/screens.test.tsx` (create the file here; extended in Task 7)

**Interfaces:**
- Produces: `function SpotifyEmbed({ playlistId, title }: { playlistId: string; title?: string }): JSX.Element` — renders an iframe to `https://open.spotify.com/embed/playlist/{playlistId}` with an accessible title.

- [ ] **Step 1: Write the failing test**

`src/components/screens/screens.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";

describe("SpotifyEmbed", () => {
  it("renders an iframe pointing at the playlist embed URL", () => {
    render(<SpotifyEmbed playlistId="abc123" title="Peace playlist" />);
    const frame = screen.getByTitle("Peace playlist") as HTMLIFrameElement;
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.src).toContain("open.spotify.com/embed/playlist/abc123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- screens`
Expected: FAIL — cannot resolve `@/components/SpotifyEmbed`.

- [ ] **Step 3: Write the component**

`src/components/SpotifyEmbed.tsx`:
```tsx
export function SpotifyEmbed({ playlistId, title }: { playlistId: string; title?: string }) {
  return (
    <iframe
      title={title ?? "Spotify playlist"}
      src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=koino`}
      width="100%"
      height="80"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      style={{ border: 0, borderRadius: 12 }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- screens`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/SpotifyEmbed.tsx src/components/screens/screens.test.tsx
git commit -m "feat: add themed Spotify embed component"
```

---

### Task 6: Local progress store

**Files:**
- Create: `src/lib/progress.ts`
- Test: `src/lib/progress.test.ts`

**Interfaces:**
- Produces:
  - `interface Progress { completedDates: string[]; favorites: string[] }`
  - `function computeStreak(completedDates: string[], today: string): number` — consecutive days ending at `today` or `today − 1`
  - `function loadProgress(): Progress`
  - `function markComplete(date: string): Progress`
  - `function toggleFavorite(date: string): Progress`
  - `function isFavorite(p: Progress, date: string): boolean`

- [ ] **Step 1: Write the failing test**

`src/lib/progress.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { computeStreak, loadProgress, markComplete, toggleFavorite, isFavorite } from "@/lib/progress";

beforeEach(() => localStorage.clear());

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-06-23", "2026-06-24", "2026-06-25"], "2026-06-25")).toBe(3);
  });
  it("still counts if today isn't done yet but yesterday was", () => {
    expect(computeStreak(["2026-06-23", "2026-06-24"], "2026-06-25")).toBe(2);
  });
  it("breaks when there's a gap", () => {
    expect(computeStreak(["2026-06-20", "2026-06-24", "2026-06-25"], "2026-06-25")).toBe(2);
  });
  it("is zero when the most recent completion is too old", () => {
    expect(computeStreak(["2026-06-20"], "2026-06-25")).toBe(0);
  });
});

describe("progress store", () => {
  it("marks a date complete and persists it", () => {
    markComplete("2026-06-25");
    expect(loadProgress().completedDates).toContain("2026-06-25");
  });
  it("toggles favorites", () => {
    let p = toggleFavorite("2026-06-25");
    expect(isFavorite(p, "2026-06-25")).toBe(true);
    p = toggleFavorite("2026-06-25");
    expect(isFavorite(p, "2026-06-25")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- progress`
Expected: FAIL — cannot resolve `@/lib/progress`.

- [ ] **Step 3: Write the store**

`src/lib/progress.ts`:
```ts
export interface Progress {
  completedDates: string[];
  favorites: string[];
}

const KEY = "koino.progress.v1";

function addDays(date: string, delta: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + delta * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function computeStreak(completedDates: string[], today: string): number {
  const done = new Set(completedDates);
  let cursor = done.has(today) ? today : addDays(today, -1);
  if (!done.has(cursor)) return 0;
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { completedDates: [], favorites: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { completedDates: [], favorites: [] };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { completedDates: parsed.completedDates ?? [], favorites: parsed.favorites ?? [] };
  } catch {
    return { completedDates: [], favorites: [] };
  }
}

function save(p: Progress): Progress {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

export function markComplete(date: string): Progress {
  const p = loadProgress();
  if (!p.completedDates.includes(date)) p.completedDates = [...p.completedDates, date].sort();
  return save(p);
}

export function toggleFavorite(date: string): Progress {
  const p = loadProgress();
  p.favorites = p.favorites.includes(date)
    ? p.favorites.filter((d) => d !== date)
    : [...p.favorites, date].sort();
  return save(p);
}

export function isFavorite(p: Progress, date: string): boolean {
  return p.favorites.includes(date);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- progress`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.ts src/lib/progress.test.ts
git commit -m "feat: add local-storage progress store with streak logic"
```

---

### Task 7: Devotion screen components

**Files:**
- Create: `src/components/screens/Arrival.tsx`, `Verse.tsx`, `Reflection.tsx`, `Prayer.tsx`, `Amen.tsx`, `Linger.tsx`
- Test: `src/components/screens/screens.test.tsx` (extend)

**Interfaces:**
- Consumes: `Theme` (`@/lib/themes`), `Devotion` (`@/lib/devotions/types`), `SpotifyEmbed`.
- Produces presentational components, each accepting a typed props object. Signatures:
  - `Arrival({ theme, today, streak, onBegin }: { theme: Theme; today: string; streak: number; onBegin: () => void })`
  - `Verse({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void })`
  - `Reflection({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void })`
  - `Prayer({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void })`
  - `Amen({ theme, streak, favorite, onToggleFavorite }: { theme: Theme; streak: number; favorite: boolean; onToggleFavorite: () => void })`
  - `Linger({ devotion, theme, playlistId }: { devotion: Devotion; theme: Theme; playlistId: string })`

- [ ] **Step 1: Write the failing tests (extend `screens.test.tsx`)**

Append to `src/components/screens/screens.test.tsx`:
```tsx
import { Verse } from "@/components/screens/Verse";
import { Amen } from "@/components/screens/Amen";
import { getTheme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

const dev: Devotion = {
  date: "2026-06-25", verseRef: "Psalm 46:10", verseText: "Be still, and know that I am God.",
  theme: "peace", reflection: "r", prayer: "p",
};

describe("Verse screen", () => {
  it("shows the verse text and reference in the theme accent", () => {
    render(<Verse devotion={dev} theme={getTheme("peace")} onContinue={() => {}} />);
    expect(screen.getByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("Psalm 46:10")).toBeInTheDocument();
  });
});

describe("Amen screen", () => {
  it("shows the streak count", () => {
    render(<Amen theme={getTheme("peace")} streak={8} favorite={false} onToggleFavorite={() => {}} />);
    expect(screen.getByText(/8-day streak/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- screens`
Expected: FAIL — cannot resolve `@/components/screens/Verse`.

- [ ] **Step 3: Implement the six screens**

Each screen is a phone-screen-sized flex column on warm paper, using the theme accent for tinted elements, matching the brainstorming mockups. Write all six files.

`src/components/screens/Verse.tsx`:
```tsx
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

export function Verse({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between text-ink-secondary">
        <i className="ti ti-chevron-left text-xl" aria-hidden="true" />
        <span className="text-sm font-medium" style={{ color: theme.accent }}>{theme.name}</span>
        <span style={{ width: 17 }} />
      </div>
      <div className="my-auto flex flex-col items-center gap-4 text-center">
        <p className="font-serif text-2xl leading-relaxed text-ink">{devotion.verseText}</p>
        <span className="text-xs uppercase tracking-widest text-ink-muted">{devotion.verseRef}</span>
      </div>
      <button onClick={onContinue} className="mx-auto flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
        Continue <i className="ti ti-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
}
```

`src/components/screens/Arrival.tsx`:
```tsx
import type { Theme } from "@/lib/themes";

export function Arrival({ theme, today, streak, onBegin }: { theme: Theme; today: string; streak: number; onBegin: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col items-center gap-3 text-center">
        <span className="text-xs uppercase tracking-widest text-ink-muted">{today}</span>
        <span className="text-xl font-medium text-ink">Good morning</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
          style={{ background: theme.accentSoft, color: theme.accent }}>
          <i className={`ti ti-${theme.icon}`} aria-hidden="true" /> {theme.name}
        </span>
        <div className="mt-1 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}>
          <i className={`ti ti-${theme.icon} text-2xl`} style={{ color: theme.accent }} aria-hidden="true" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button onClick={onBegin} className="w-full rounded-full py-3 text-sm font-medium text-white" style={{ background: theme.accent }}>
          Begin
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <i className="ti ti-plant-2" aria-hidden="true" /> {streak}-day streak
        </span>
      </div>
    </div>
  );
}
```

`src/components/screens/Reflection.tsx`:
```tsx
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

export function Reflection({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col gap-3 text-center">
        <span className="text-xs uppercase tracking-widest text-ink-muted">Reflection</span>
        <p className="text-sm leading-relaxed text-ink-secondary">{devotion.reflection}</p>
      </div>
      <button onClick={onContinue} className="mx-auto flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
        Continue <i className="ti ti-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
}
```

`src/components/screens/Prayer.tsx` (the app's one dark moment):
```tsx
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

export function Prayer({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  return (
    <button onClick={onContinue} className="flex h-full w-full flex-col p-6 text-left" style={{ background: "#211F1C" }}>
      <span className="text-center text-sm font-medium" style={{ color: theme.accentBorder }}>{theme.name}</span>
      <div className="my-auto flex flex-col items-center gap-3 text-center">
        <span className="text-xs uppercase tracking-widest" style={{ color: "#7E7C72" }}>A prayer</span>
        <p className="font-serif text-lg leading-relaxed" style={{ color: "#E8E4DA" }}>{devotion.prayer}</p>
      </div>
      <span className="text-center text-xs" style={{ color: "#7E7C72" }}>Tap when you're ready</span>
    </button>
  );
}
```

`src/components/screens/Amen.tsx`:
```tsx
import type { Theme } from "@/lib/themes";

export function Amen({ theme, streak, favorite, onToggleFavorite }: { theme: Theme; streak: number; favorite: boolean; onToggleFavorite: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col items-center gap-2.5 text-center">
        <div className="flex h-18 w-18 items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, width: 72, height: 72 }}>
          <i className="ti ti-check text-3xl" style={{ color: theme.accent }} aria-hidden="true" />
        </div>
        <span className="font-serif text-xl text-ink">Amen.</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <i className="ti ti-plant-2" aria-hidden="true" /> {streak}-day streak
        </span>
      </div>
      <button onClick={onToggleFavorite} className="flex items-center justify-center gap-1.5 rounded-full border py-2.5 text-sm"
        style={{ borderColor: "rgba(0,0,0,0.18)", color: theme.accent }}>
        <i className={`ti ti-heart${favorite ? " ti-heart-filled" : ""}`} aria-hidden="true" />
        {favorite ? "Saved" : "Save"}
      </button>
    </div>
  );
}
```

Note: `ti-heart-filled` is not in the outline set; use only `ti-heart` and convey saved state via the label and accent color. Corrected line:
```tsx
<i className="ti ti-heart" aria-hidden="true" />
```

`src/components/screens/Linger.tsx`:
```tsx
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";

export function Linger({ devotion, theme, playlistId }: { devotion: Devotion; theme: Theme; playlistId: string }) {
  return (
    <div className="flex h-full flex-col gap-3 p-6">
      <span className="text-base font-medium text-ink">Today</span>
      <div className="flex items-center gap-2.5 rounded-xl border p-3" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: theme.accentSoft }}>
          <i className="ti ti-check" style={{ color: theme.accent }} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{theme.name} — completed</p>
          <p className="text-xs text-ink-muted">{devotion.verseRef}</p>
        </div>
      </div>
      <SpotifyEmbed playlistId={playlistId} title={`${theme.name} playlist`} />
      <span className="mt-auto text-center text-xs text-ink-muted">New devotion tomorrow morning</span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- screens`
Expected: PASS (Verse + Amen + SpotifyEmbed tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/screens
git commit -m "feat: add six devotion screen components"
```

---

### Task 8: Flow controller and Today page

**Files:**
- Create: `src/components/DevotionFlow.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: all six screens, `getTheme`, `getPlaylistId`, progress store.
- Produces: `function DevotionFlow({ devotion }: { devotion: Devotion }): JSX.Element` — a `"use client"` component that owns step state (`arrival → verse → reflection → prayer → amen → linger`), reads/writes progress, and computes the streak; and a server `page.tsx` that resolves today's devotion and renders it.

- [ ] **Step 1: Write the flow controller**

`src/components/DevotionFlow.tsx`:
```tsx
"use client";

import { useMemo, useState } from "react";
import type { Devotion } from "@/lib/devotions/types";
import { getTheme } from "@/lib/themes";
import { getPlaylistId } from "@/lib/devotions/select";
import { computeStreak, loadProgress, markComplete, toggleFavorite, isFavorite } from "@/lib/progress";
import { Arrival } from "@/components/screens/Arrival";
import { Verse } from "@/components/screens/Verse";
import { Reflection } from "@/components/screens/Reflection";
import { Prayer } from "@/components/screens/Prayer";
import { Amen } from "@/components/screens/Amen";
import { Linger } from "@/components/screens/Linger";

type Step = "arrival" | "verse" | "reflection" | "prayer" | "amen" | "linger";

export function DevotionFlow({ devotion }: { devotion: Devotion }) {
  const theme = getTheme(devotion.theme);
  const playlistId = getPlaylistId(theme, devotion.date);
  const [step, setStep] = useState<Step>("arrival");
  const [progress, setProgress] = useState(() => loadProgress());

  const streak = useMemo(
    () => computeStreak(progress.completedDates, devotion.date),
    [progress.completedDates, devotion.date],
  );

  function complete() {
    setProgress(markComplete(devotion.date));
    setStep("amen");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col bg-paper">
      <div className="flex min-h-screen flex-col">
        {step === "arrival" && <Arrival theme={theme} today={devotion.date} streak={streak} onBegin={() => setStep("verse")} />}
        {step === "verse" && <Verse devotion={devotion} theme={theme} onContinue={() => setStep("reflection")} />}
        {step === "reflection" && <Reflection devotion={devotion} theme={theme} onContinue={() => setStep("prayer")} />}
        {step === "prayer" && <Prayer devotion={devotion} theme={theme} onContinue={complete} />}
        {step === "amen" && (
          <Amen
            theme={theme}
            streak={streak}
            favorite={isFavorite(progress, devotion.date)}
            onToggleFavorite={() => setProgress(toggleFavorite(devotion.date))}
          />
        )}
        {step === "amen" && (
          <button onClick={() => setStep("linger")} className="mb-6 mx-auto flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
            Continue <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        )}
        {step === "linger" && <Linger devotion={devotion} theme={theme} playlistId={playlistId} />}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Wire the Today page**

`src/app/page.tsx`:
```tsx
import { DevotionFlow } from "@/components/DevotionFlow";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTodayDevotion } from "@/lib/devotions/select";

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const devotion = getTodayDevotion(DEVOTIONS, today);
  return <DevotionFlow devotion={devotion} />;
}
```

- [ ] **Step 3: Verify the build and full test suite**

Run: `npm run build`
Expected: build succeeds.
Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 4: Manually verify the flow**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: Arrival → tap Begin → Verse → Continue → Reflection → Continue → Prayer (dark screen) → tap → Amen (streak shows 1, Save toggles) → Continue → Linger with the Spotify player embedded. Verify on a mobile viewport (DevTools device mode).

- [ ] **Step 5: Commit**

```bash
git add src/components/DevotionFlow.tsx src/app/page.tsx
git commit -m "feat: wire the daily devotion flow and Today page"
```

---

## Self-Review

**Spec coverage (against §4–§9 of the design spec):**
- Verse of the Day (§4.1) → Tasks 4, 7 (Verse). Verse text is seeded inline this slice; live Bible API deferred per plan scope.
- Reflection + Prayer (§4.2) → Tasks 4, 7 (Reflection, Prayer).
- Themed Spotify playlist (§4.3, §6) → Tasks 3 (playlistIds), 4 (`getPlaylistId`), 5 (SpotifyEmbed), 7 (Linger).
- Today screen / morning flow (§4.4, §5) → Tasks 7, 8. The dark prayer screen (§5.5) → Task 7 (Prayer).
- Streak, save (§4.5, §4.6) → Task 6, surfaced in Tasks 7 (Amen) and 8.
- Theme taxonomy + theme-as-color UI (§6, §9) → Task 3 registry, accent applied across all screens.
- Warm paper + serif scripture / sans UI (§9, Global Constraints) → Tasks 1, 2, 7.
- **Deferred by design (not gaps):** accounts/Supabase (§4.8), reminders/PWA (§4.7), CMS (§7), live Bible API (§10) — these are Plans 2–4.

**Placeholder scan:** Spotify playlist IDs are explicitly owner-supplied real values with valid-format defaults so embeds render — called out, not a silent TODO. No "TBD"/"handle edge cases"/uncoded test steps remain.

**Type consistency:** `Devotion`, `Theme`, `ThemeSlug`, `Progress` and the function signatures (`getTodayDevotion`, `getPlaylistId`, `computeStreak`, `markComplete`, `toggleFavorite`, `isFavorite`) are used identically across Tasks 3–8. The `ti-heart-filled` slip in Task 7 is corrected inline to `ti-heart` (outline-only constraint).
