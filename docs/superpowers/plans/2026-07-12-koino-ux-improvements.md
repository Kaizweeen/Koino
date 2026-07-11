# Koino UX/UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the six user-approved UX/UI improvements: real typography (Lora/Inter), motion & stillness, first-paint/desktop polish, humanized Arrival + completed-today state, music on the Verse screen with progress indicator, and a WEB verse-text verification pass.

**Architecture:** All changes stay inside the existing structure: `src/app` (layout/metadata/globals), `src/components/screens` (presentational), `src/components/DevotionFlow.tsx` (state), `src/lib` (pure helpers). One deliberate behavior correction: daily completion and streak key off the USER'S local day (`today`), not the devotion's content date — favorites keep keying off `devotion.date`.

**Tech Stack:** Next.js 14.2.35 (pinned), next/font/google, TypeScript strict, Tailwind, Vitest + RTL.

## Global Constraints

- Next.js stays pinned `14.2.35`; no new runtime dependencies (next/font is built in).
- TypeScript strict — no `any` outside brief-mandated test casts.
- Paper column `#FBFAF7` (`bg-paper`); new desktop canvas behind it `#F1EFE8`; ink palette unchanged.
- Scripture/serif voice: Lora. Interface/sans: Inter. Via `next/font` CSS variables `--font-serif` / `--font-sans` (Tailwind config already reads these variables — do not edit tailwind.config.ts).
- All animation must be disabled under `prefers-reduced-motion: reduce`.
- Tabler outline icons only. Sentence case. No emoji.
- Completion + streak use the user's local `today`; favorites use `devotion.date`.
- `npm test`, `npm run lint`, `npm run build` must all pass at every commit.

---

### Task 1: Typography, metadata, canvas, motion foundation, loading emblem

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/icon.svg`
- Modify: `src/components/DevotionFlow.tsx` (mount-gate branch + main classNames only)

**Interfaces:**
- Produces: CSS classes `.fade-in` and `.breathe` (used by Tasks I2/I3); fonts exposed as `--font-sans`/`--font-serif` on `<html>`; app favicon + metadata; warm desktop canvas.

- [ ] **Step 1: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Koino — a daily guided devotion",
  description: "One verse, a short reflection, a guided prayer — set to music that matches the day.",
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
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

- [ ] **Step 2: Replace `src/app/globals.css`**

```css
:root {
  --color-paper: #FBFAF7;
  --color-canvas: #F1EFE8;
  --color-ink: #2C2C2A;
  --color-ink-muted: #9A988F;
  --color-ink-secondary: #6F6E68;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

@keyframes koino-fade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
@keyframes koino-breathe {
  0%, 100% { transform: scale(1); opacity: 0.75; }
  50% { transform: scale(1.05); opacity: 1; }
}
.fade-in { animation: koino-fade 500ms ease both; }
.breathe { animation: koino-breathe 3.5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .fade-in, .breathe { animation: none; }
}
```

Note: `--font-sans`/`--font-serif` are intentionally REMOVED from `:root` — next/font now defines them on `<html>`.

- [ ] **Step 3: Create `src/app/icon.svg`** (App Router favicon convention)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FBFAF7"/><path d="M32 12c-7 8-14 12-14 22a14 14 0 0 0 28 0c0-10-7-14-14-22z" fill="none" stroke="#0F6E56" stroke-width="4" stroke-linejoin="round"/></svg>
```

- [ ] **Step 4: Update `src/components/DevotionFlow.tsx` shell only**

Replace the mount-gate branch:
```tsx
if (!devotion) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center border-x border-black/5 bg-paper">
      <div className="breathe h-16 w-16 rounded-full border border-ink-muted/30 bg-white/60" aria-hidden="true" />
    </main>
  );
}
```
And add `border-x border-black/5` to the full-render `<main>` className (after `max-w-sm`).

- [ ] **Step 5: Verify**

Run: `npm test` (25 passing), `npm run lint` (exit 0), `npm run build` (succeeds; fonts self-hosted at build time).

- [ ] **Step 6: Commit**

```bash
git add src/app src/components/DevotionFlow.tsx
git commit -m "feat: real typography, metadata, warm canvas, motion foundation"
```

---

### Task 2: Date/greeting helpers, humanized Arrival, completed-today state

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/dates.test.ts`
- Create: `src/components/screens/Done.tsx`
- Modify: `src/components/screens/Arrival.tsx`
- Modify: `src/components/DevotionFlow.tsx`
- Test: `src/components/screens/screens.test.tsx` (extend), `src/components/DevotionFlow.test.tsx` (extend)

**Interfaces:**
- Consumes: `.breathe` (Task I1), progress store, themes.
- Produces: `formatDisplayDate(isoDate: string): string` ("Saturday · July 11"), `greetingForHour(hour: number): string`; `Done({ theme, streak, onReadAgain })`; Arrival prop change: `{ theme, today, streak, greeting, onBegin }` where `today` now receives the DISPLAY-formatted string.
- Behavior correction: `complete()` marks `today` (user's local day), streak computed against `today`; favorites stay on `devotion.date`; done-state triggers when `today` ∈ completedDates.

- [ ] **Step 1: Write failing tests** — `src/lib/dates.test.ts`:

```ts
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
```

Run: `npm test -- dates` → FAIL (module not found).

- [ ] **Step 2: Create `src/lib/dates.ts`**

```ts
export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return `${weekday} · ${monthDay}`;
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
```

Run: `npm test -- dates` → PASS.

- [ ] **Step 3: Create `src/components/screens/Done.tsx`**

```tsx
import type { Theme } from "@/lib/themes";

export function Done({ theme, streak, onReadAgain }: { theme: Theme; streak: number; onReadAgain: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col items-center gap-2.5 text-center">
        <div
          className="breathe flex items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, width: 72, height: 72 }}
        >
          <i className="ti ti-check text-3xl" style={{ color: theme.accent }} aria-hidden="true" />
        </div>
        <span className="font-serif text-xl text-ink">You&apos;ve already been here today.</span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <i className="ti ti-plant-2" aria-hidden="true" /> {streak}-day streak
          </span>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onReadAgain}
          className="w-full rounded-full border py-2.5 text-sm text-ink"
          style={{ borderColor: "rgba(0,0,0,0.18)" }}
        >
          Read it again
        </button>
        <span className="text-xs text-ink-muted">New devotion tomorrow morning</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `src/components/screens/Arrival.tsx`**

New signature and body:
```tsx
import type { Theme } from "@/lib/themes";

export function Arrival({ theme, today, streak, greeting, onBegin }: { theme: Theme; today: string; streak: number; greeting: string; onBegin: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="my-auto flex flex-col items-center gap-3 text-center">
        <span className="text-xs uppercase tracking-widest text-ink-muted">{today}</span>
        <span className="text-xl font-medium text-ink">{greeting}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
          style={{ background: theme.accentSoft, color: theme.accent }}>
          <i className={`ti ti-${theme.icon}`} aria-hidden="true" /> {theme.name}
        </span>
        <div className="breathe mt-1 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}>
          <i className={`ti ti-${theme.icon} text-2xl`} style={{ color: theme.accent }} aria-hidden="true" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button onClick={onBegin} className="w-full rounded-full py-3 text-sm font-medium text-white" style={{ background: theme.accent }}>
          Begin
        </button>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <i className="ti ti-plant-2" aria-hidden="true" /> {streak}-day streak
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update `src/components/DevotionFlow.tsx`**

- `type Step` gains `"done"`.
- Imports add: `formatDisplayDate`, `greetingForHour` from `@/lib/dates`; `Done` from `@/components/screens/Done`.
- Mount effect becomes:
```tsx
useEffect(() => {
  const t = localToday();
  setToday(t);
  if (loadProgress().completedDates.includes(t)) setStep("done");
}, []);
```
- Streak keys off the user's day: `computeStreak(progress.completedDates, today)` guarded on `today` (0 when null); dependency `[progress.completedDates, today]`.
- `complete()` marks the user's day:
```tsx
function complete() {
  if (!today) return;
  setProgress(markComplete(today));
  setStep("amen");
}
```
- Render adds, alongside the other steps:
```tsx
{step === "done" && <Done theme={theme} streak={streak} onReadAgain={() => setStep("verse")} />}
```
- Arrival call becomes:
```tsx
{step === "arrival" && (
  <Arrival
    theme={theme}
    today={formatDisplayDate(today ?? devotion.date)}
    streak={streak}
    greeting={greetingForHour(new Date().getHours())}
    onBegin={() => setStep("verse")}
  />
)}
```
- Favorites remain `devotion.date` (unchanged).

- [ ] **Step 6: Extend tests**

`screens.test.tsx` — update the Amen block imports as needed and ADD:
```tsx
import { Arrival } from "@/components/screens/Arrival";
import { Done } from "@/components/screens/Done";

describe("Arrival screen", () => {
  it("hides the streak at zero and shows the greeting", () => {
    render(<Arrival theme={getTheme("peace")} today="Saturday · July 11" streak={0} greeting="Good evening" onBegin={() => {}} />);
    expect(screen.getByText("Good evening")).toBeInTheDocument();
    expect(screen.queryByText(/day streak/)).toBeNull();
  });
});

describe("Done screen", () => {
  it("offers a re-read", () => {
    render(<Done theme={getTheme("peace")} streak={3} onReadAgain={() => {}} />);
    expect(screen.getByText("You've already been here today.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read it again" })).toBeInTheDocument();
  });
});
```

`DevotionFlow.test.tsx` — ADD (localStorage key `koino.progress.v1`):
```tsx
it("shows the done state when today is already completed", async () => {
  const d = new Date();
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: [local], favorites: [] }));
  render(<DevotionFlow />);
  expect(await screen.findByText("You've already been here today.")).toBeInTheDocument();
  localStorage.clear();
});
```

TDD order: write the new tests first, see the new ones FAIL, then apply Steps 2-5, then all PASS.

- [ ] **Step 7: Verify & commit**

Run: `npm test` (all green), `npm run lint`, `npm run build`.
```bash
git add src/lib/dates.ts src/lib/dates.test.ts src/components/screens src/components/DevotionFlow.tsx src/components/DevotionFlow.test.tsx
git commit -m "feat: humanized arrival, greetings, and completed-today state"
```

---

### Task 3: Music on the Verse screen, progress indicator, motion application

**Files:**
- Create: `src/components/screens/StepDots.tsx`
- Modify: `src/components/screens/Verse.tsx`, `src/components/screens/Reflection.tsx`
- Modify: `src/components/DevotionFlow.tsx` (pass playlistId to Verse; keyed fade wrapper)
- Test: `src/components/screens/screens.test.tsx` (update Verse test)

**Interfaces:**
- Consumes: `.fade-in` (Task I1), `SpotifyEmbed`.
- Produces: `StepDots({ current, accent }: { current: 1 | 2 | 3; accent: string })`; Verse prop change: `{ devotion, theme, playlistId, onContinue }`.

- [ ] **Step 1: Create `src/components/screens/StepDots.tsx`**

```tsx
export function StepDots({ current, accent }: { current: 1 | 2 | 3; accent: string }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Step ${current} of 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className="h-[3px] w-4 rounded-full" style={{ background: n <= current ? accent : "#EAE8E0" }} />
      ))}
    </span>
  );
}
```

- [ ] **Step 2: Replace `src/components/screens/Verse.tsx`**

```tsx
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { StepDots } from "@/components/screens/StepDots";

export function Verse({ devotion, theme, playlistId, onContinue }: { devotion: Devotion; theme: Theme; playlistId: string; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {theme.name}
        </span>
        <StepDots current={1} accent={theme.accent} />
      </div>
      <div className="my-auto flex flex-col items-center gap-4 text-center">
        <p className="font-serif text-2xl leading-relaxed text-ink">{devotion.verseText}</p>
        <span className="text-xs uppercase tracking-widest text-ink-muted">{devotion.verseRef}</span>
      </div>
      <div className="flex flex-col gap-3">
        <SpotifyEmbed playlistId={playlistId} title={`${theme.name} playlist`} />
        <button onClick={onContinue} className="mx-auto flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
          Continue <i className="ti ti-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
```

(The decorative dead chevron is gone; the header is theme label + progress.)

- [ ] **Step 3: Update `src/components/screens/Reflection.tsx`** — add the same header with `current={2}`:

```tsx
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { StepDots } from "@/components/screens/StepDots";

export function Reflection({ devotion, theme, onContinue }: { devotion: Devotion; theme: Theme; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {theme.name}
        </span>
        <StepDots current={2} accent={theme.accent} />
      </div>
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

- [ ] **Step 4: Update `src/components/DevotionFlow.tsx`**

- Verse call gains `playlistId={playlistId}`.
- The inner wrapper `<div className="flex min-h-screen flex-col">` becomes `<div key={step} className="fade-in flex min-h-screen flex-col">` — remounting per step gives the fade-on-enter; reduced-motion users get instant cuts via the CSS media query.

- [ ] **Step 5: Update tests (TDD: update first, watch fail, then implement)**

In `screens.test.tsx`, replace the Verse test:
```tsx
describe("Verse screen", () => {
  it("shows the verse, reference, playlist, and progress", () => {
    render(<Verse devotion={dev} theme={getTheme("peace")} playlistId="abc123" onContinue={() => {}} />);
    expect(screen.getByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("Psalm 46:10")).toBeInTheDocument();
    expect(screen.getByTitle("Peace playlist")).toBeInTheDocument();
    expect(screen.getByLabelText("Step 1 of 3")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Verify & commit**

Run: `npm test` (all green), `npm run lint`, `npm run build`.
```bash
git add src/components
git commit -m "feat: music at the verse, progress dots, step cross-fade"
```

---

### Task 4: WEB verse-text verification pass

**Files:**
- Create: `scripts/verify-verses.mjs`
- Modify: `src/lib/devotions/content.ts` (only `verseText`/`verseRef` corrections)

**Interfaces:**
- Consumes: `content.ts` entries; public WEB source `https://bible-api.com/{ref}?translation=web`.
- Produces: a repeatable verification script and verified WEB verse texts.

- [ ] **Step 1: Create `scripts/verify-verses.mjs`**

```js
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/devotions/content.ts", import.meta.url), "utf8");
const entries = [...src.matchAll(/verseRef:\s*"([^"]+)"[\s\S]*?verseText:\s*"((?:[^"\\]|\\.)*)"/g)]
  .map((m) => ({ ref: m[1], text: m[2].replace(/\\"/g, '"') }));

const norm = (s) =>
  s.toLowerCase().replace(/[‘’“”]/g, "'").replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ").trim();

let flagged = 0;
for (const { ref, text } of entries) {
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=web`);
  if (!res.ok) {
    console.log(`?? ${ref}: HTTP ${res.status}`);
    flagged++;
    continue;
  }
  const data = await res.json();
  const api = norm(data.text ?? "");
  const ours = norm(text);
  if (api.includes(ours)) {
    console.log(`ok ${ref}`);
  } else {
    console.log(`!! ${ref}\n   ours: ${text}\n   web : ${(data.text ?? "").trim().replace(/\s+/g, " ")}`);
    flagged++;
  }
  await new Promise((r) => setTimeout(r, 300));
}
console.log(`\n${flagged} of ${entries.length} flagged`);
```

- [ ] **Step 2: Run it** — `node scripts/verify-verses.mjs` (37 entries, ~15s with the delay). Save the full output into the report.

- [ ] **Step 3: Fix drift** — for every `!!` entry, correct `verseText` in `content.ts` to authentic WEB wording. Quoting a coherent PORTION of the verse is allowed (the script checks substring containment after normalization) — but the words used must be WEB's words. If a reference itself is wrong (verse text belongs to a different ref), fix whichever side is wrong while keeping the theme fit. HTTP failures: retry once; if the API cannot serve a ref, note it for owner manual check rather than guessing.

- [ ] **Step 4: Re-run until clean** — `node scripts/verify-verses.mjs` reports 0 flagged (or only owner-noted API gaps).

- [ ] **Step 5: Verify & commit**

Run: `npm test` (content integrity suite still green), `npm run lint`, `npm run build`.
```bash
git add scripts/verify-verses.mjs src/lib/devotions/content.ts
git commit -m "fix: verify and correct verse texts against WEB source"
```

---

## Self-Review

**Coverage vs the six approved items:** A → I1 (fonts). D → I1 (CSS foundation) + I2/I3 (breathe on emblems, fade wrapper, reduced-motion). E → I1 (icon.svg, metadata/themeColor, canvas, loading emblem, border-x). B → I2 (formatDisplayDate, greetingForHour, streak-at-zero hidden, Done state + flow wiring, today-keyed completion fix). C → I3 (SpotifyEmbed on Verse, StepDots, dead-chevron removal). F → I4 (script + corrections).

**Placeholder scan:** all steps carry complete code or exact commands; the only judgment step is I4 Step 3, which defines its decision rule (WEB wording, substring rule, owner-note fallback).

**Type consistency:** `Arrival` gains `greeting: string` and I2's DevotionFlow call matches; `Verse` gains `playlistId: string` and I3's DevotionFlow call matches; `Done` and `StepDots` signatures match their call sites; `Step` union gains `"done"` in I2 and I3 keys the wrapper on `step` without touching the union.

**Ordering:** I1 provides `.breathe`/`.fade-in` used by I2/I3 — execute in order I1 → I2 → I3; I4 is independent and can run last.
