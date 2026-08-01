# SOAP Method Devotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework Koino's daily devotion into the SOAP method (Scripture, Observation, Application, Prayer) where the user writes their own O/A/P guided by theme-aware prompts, and replace the Notes/Saved tabs with a single Journal.

**Architecture:** Keep the existing Next.js App Router + client-component structure and the "Light through paper" visual system unchanged. Add a static prompt content module and extend the localStorage progress store with a per-date `entries` map. Rebuild the `/today` step machine to a Scripture-read step plus three auto-saving writing steps, and replace `SavedList`/`NotesView` with a `JournalView`.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind, Vitest + Testing Library, localStorage persistence, Tabler icon webfont.

## Global Constraints

- Persistence is browser `localStorage` under key `koino.progress.v1`; no backend, no auth.
- Never destroy legacy data: an existing store with `notes` and no `entries` must load and its notes must remain visible in the Journal.
- Do not modify `DESIGN.md`, the token system, or the 12 themes/accents/icons/playlists.
- Serif (`font-serif`, Lora) is for Scripture and the user's own writing; sans (Inter) for interface. Uppercase micro-labels use `tracking-widest2`.
- Every themed element reads the day's accent from the `--accent` CSS variable set on the flow container (The Day's Light Rule).
- Prompts are static authored content (12 themes x 3), no dynamic/AI generation.
- Definition of done for the whole plan: `npm test` green, `npx tsc --noEmit` clean, `npx next lint` clean, `node C:\Users\User\.claude\skills\impeccable\scripts\detect.mjs --json <changed>` returns `[]`, and a live walk of `/today` and all tabs shows no console errors.

---

## File Structure

**Create:**
- `src/lib/soap/prompts.ts` — `SoapPrompts` type, `SOAP_PROMPTS` (12 themes), `getSoapPrompts`.
- `src/lib/soap/prompts.test.ts` — prompt coverage tests.
- `src/components/screens/SoapProgress.tsx` — labeled S O A P progress (replaces `StepDots`).
- `src/components/screens/Scripture.tsx` — the read-only verse step (from `Verse`).
- `src/components/screens/SoapStep.tsx` — shared writing screen for O/A/P.
- `src/components/JournalView.tsx` — the Journal tab (replaces `SavedList` + `NotesView`).
- `src/components/journal.test.tsx` — Journal tests.
- `src/app/(hub)/journal/page.tsx` — Journal route.

**Modify:**
- `src/lib/progress.ts` — add `SoapEntry`, `entries`, `getEntry`, `setSoapField`, `entryDates`, `hasWrittenEntry`, `soapText`.
- `src/lib/progress.test.ts` — new persistence tests.
- `src/components/DevotionFlow.tsx` — new step machine + entry wiring + prompts.
- `src/components/DevotionFlow.test.tsx` — updated walk.
- `src/components/screens/Amen.tsx` — drop the free-note field; share the SOAP reflection.
- `src/components/screens/screens.test.tsx` — swap Verse/Reflection/Prayer for Scripture/SoapStep; update Amen.
- `src/components/ShareButton.tsx` — `note` prop becomes `reflection`; label "Include my reflection".
- `src/components/share.test.tsx` — updated label/prop.
- `src/components/TabBar.tsx` — tabs Home / Journal / Themes / History.
- `src/components/HomeHub.tsx` — recent-journal peek replaces the Saved peek.
- `src/components/hub.test.tsx` — JournalView replaces SavedList; HomeHub peek assertion.

**Delete:**
- `src/components/SavedList.tsx`, `src/app/(hub)/saved/page.tsx`
- `src/components/NotesView.tsx`, `src/components/notes.test.tsx`, `src/app/(hub)/notes/page.tsx`
- `src/components/screens/Verse.tsx`, `src/components/screens/Reflection.tsx`, `src/components/screens/Prayer.tsx`, `src/components/screens/StepDots.tsx`

---

## Task 1: SOAP prompts content

**Files:**
- Create: `src/lib/soap/prompts.ts`
- Test: `src/lib/soap/prompts.test.ts`

**Interfaces:**
- Consumes: `ThemeSlug` from `src/lib/themes.ts`.
- Produces: `interface SoapPrompts { observation: string; application: string; prayer: string }`; `SOAP_PROMPTS: Record<ThemeSlug, SoapPrompts>`; `getSoapPrompts(theme: ThemeSlug): SoapPrompts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/soap/prompts.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/soap/prompts.test.ts`
Expected: FAIL — cannot resolve `@/lib/soap/prompts`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/soap/prompts.ts
import type { ThemeSlug } from "@/lib/themes";

export interface SoapPrompts {
  observation: string;
  application: string;
  prayer: string;
}

export const SOAP_PROMPTS: Record<ThemeSlug, SoapPrompts> = {
  peace:      { observation: "What does this verse show you about where true rest is found?", application: "Where do you most need to stop striving and trust today?", prayer: "Ask God to quiet one thing you are carrying." },
  gratitude:  { observation: "What good gift from God does this passage bring into view?", application: "What is one specific thing you can thank God for right now?", prayer: "Name that gift back to God with thanks." },
  hope:       { observation: "What promise or future does this verse point you toward?", application: "Where do you need hope to steady you today?", prayer: "Ask God to anchor you in what he has promised." },
  lament:     { observation: "What honest thing does this passage give you permission to bring to God?", application: "What grief or weight do you need to carry to God today, rather than hold alone?", prayer: "Tell God plainly what hurts, and ask him to sit with you in it." },
  surrender:  { observation: "What is this verse inviting you to release into God's hands?", application: "What are you gripping tightly that you could loosen your hold on today?", prayer: "Hand that thing to God, and ask for the trust to leave it there." },
  awe:        { observation: "What does this passage reveal about how great God is?", application: "How could seeing God as this big change the way you meet today?", prayer: "Worship God for something about him that is far bigger than you." },
  joy:        { observation: "What goodness of God does this verse point you toward?", application: "What is one gift today that you could stop and actually celebrate?", prayer: "Thank God for something specific, out loud in your prayer." },
  repentance: { observation: "What does this verse show you honestly about your own heart?", application: "Is there one thing you sense God gently asking you to turn from?", prayer: "Tell God what you want to turn back to him, and receive his mercy." },
  strength:   { observation: "Where does this passage say your strength actually comes from?", application: "What are you facing today that you need God's steadiness for?", prayer: "Ask God for the courage and strength you don't have on your own." },
  comfort:    { observation: "How does this verse show God drawing near to those who hurt?", application: "Where do you need to let God comfort you today, instead of coping alone?", prayer: "Let God near the tender place, and ask him to hold you there." },
  love:       { observation: "What does this passage show you about how God loves you?", application: "How could resting in that love change how you treat someone today?", prayer: "Receive God's love, and ask to carry it to someone else." },
  longing:    { observation: "What is this verse teaching you about seeking and waiting on God?", application: "What are you waiting for, and how can you keep seeking God in it?", prayer: "Tell God what you long for, and ask him to meet you as you wait." },
};

export function getSoapPrompts(theme: ThemeSlug): SoapPrompts {
  return SOAP_PROMPTS[theme];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/soap/prompts.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/soap/prompts.ts src/lib/soap/prompts.test.ts
git commit -m "feat: theme-aware SOAP prompts"
```

---

## Task 2: Progress store — SOAP entries

**Files:**
- Modify: `src/lib/progress.ts`
- Test: `src/lib/progress.test.ts`

**Interfaces:**
- Consumes: existing `Progress`, `loadProgress`, `markComplete`.
- Produces: `interface SoapEntry { observation: string; application: string; prayer: string }`; `Progress.entries: Record<string, SoapEntry>`; `getEntry(p: Progress, date: string): SoapEntry`; `setSoapField(date: string, field: keyof SoapEntry, text: string): Progress`; `hasWrittenEntry(p: Progress, date: string): boolean`; `entryDates(p: Progress): string[]` (desc, unique, includes legacy noted dates); `soapText(entry: SoapEntry): string`.

- [ ] **Step 1: Write the failing test**

```ts
// append to src/lib/progress.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { loadProgress, setSoapField, getEntry, hasWrittenEntry, entryDates, soapText } from "@/lib/progress";

describe("SOAP entries", () => {
  afterEach(() => localStorage.clear());

  it("defaults to an empty entry map and empty entry", () => {
    expect(loadProgress().entries).toEqual({});
    expect(getEntry(loadProgress(), "2026-06-25")).toEqual({ observation: "", application: "", prayer: "" });
  });

  it("saves one field at a time and round-trips", () => {
    setSoapField("2026-06-25", "observation", "God is near");
    setSoapField("2026-06-25", "prayer", "quiet me");
    const e = getEntry(loadProgress(), "2026-06-25");
    expect(e.observation).toBe("God is near");
    expect(e.prayer).toBe("quiet me");
    expect(e.application).toBe("");
  });

  it("removes the entry when all fields are cleared", () => {
    setSoapField("2026-06-25", "observation", "x");
    setSoapField("2026-06-25", "observation", "");
    expect(hasWrittenEntry(loadProgress(), "2026-06-25")).toBe(false);
    expect(loadProgress().entries["2026-06-25"]).toBeUndefined();
  });

  it("tolerates a legacy store with notes and no entries, and lists legacy noted dates", () => {
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: [], favorites: [], notes: { "2026-06-20": "old note" } }));
    const p = loadProgress();
    expect(p.entries).toEqual({});
    expect(entryDates(p)).toContain("2026-06-20");
  });

  it("lists entry dates most-recent first", () => {
    setSoapField("2026-06-20", "observation", "a");
    setSoapField("2026-06-25", "observation", "b");
    expect(entryDates(loadProgress())).toEqual(["2026-06-25", "2026-06-20"]);
  });

  it("composes non-empty parts into shareable text", () => {
    expect(soapText({ observation: "O", application: "", prayer: "P" })).toBe("O\n\nP");
    expect(soapText({ observation: "", application: "", prayer: "" })).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/progress.test.ts`
Expected: FAIL — `setSoapField`, `getEntry`, etc. not exported.

- [ ] **Step 3: Edit `Progress` and `loadProgress`**

Replace the `Progress` interface and `loadProgress` in `src/lib/progress.ts`:

```ts
export interface SoapEntry {
  observation: string;
  application: string;
  prayer: string;
}

export interface Progress {
  completedDates: string[];
  favorites: string[];
  entries: Record<string, SoapEntry>;
  notes: Record<string, string>; // legacy; read-only in UI, never destroyed
}

const EMPTY_ENTRY: SoapEntry = { observation: "", application: "", prayer: "" };

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { completedDates: [], favorites: [], entries: {}, notes: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { completedDates: [], favorites: [], entries: {}, notes: {} };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedDates: parsed.completedDates ?? [],
      favorites: parsed.favorites ?? [],
      entries: parsed.entries ?? {},
      notes: parsed.notes ?? {},
    };
  } catch {
    return { completedDates: [], favorites: [], entries: {}, notes: {} };
  }
}
```

- [ ] **Step 4: Add the entry helpers**

Append to `src/lib/progress.ts` (after `getNote`/`notedDates`):

```ts
export function getEntry(p: Progress, date: string): SoapEntry {
  return { ...EMPTY_ENTRY, ...(p.entries[date] ?? {}) };
}

function isEmptyEntry(e: SoapEntry): boolean {
  return e.observation.trim() === "" && e.application.trim() === "" && e.prayer.trim() === "";
}

/** Auto-save one SOAP field for a date. Removes the entry entirely when all fields go blank. */
export function setSoapField(date: string, field: keyof SoapEntry, text: string): Progress {
  const p = loadProgress();
  const next: SoapEntry = { ...getEntry(p, date), [field]: text };
  const entries = { ...p.entries };
  if (isEmptyEntry(next)) delete entries[date];
  else entries[date] = next;
  p.entries = entries;
  return save(p);
}

export function hasWrittenEntry(p: Progress, date: string): boolean {
  const e = p.entries[date];
  return e !== undefined && !isEmptyEntry(e);
}

/** Dates that have a SOAP entry or a legacy note, most recent first, de-duplicated. */
export function entryDates(p: Progress): string[] {
  const dates = new Set<string>();
  for (const [date, e] of Object.entries(p.entries)) if (!isEmptyEntry(e)) dates.add(date);
  for (const date of Object.keys(p.notes)) dates.add(date);
  return [...dates].sort().reverse();
}

/** The non-empty SOAP parts joined for sharing. */
export function soapText(entry: SoapEntry): string {
  return [entry.observation, entry.application, entry.prayer].map((s) => s.trim()).filter(Boolean).join("\n\n");
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/progress.test.ts`
Expected: PASS (all SOAP-entry tests plus the pre-existing streak tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/progress.ts src/lib/progress.test.ts
git commit -m "feat: SOAP entry persistence with legacy-safe load"
```

---

## Task 3: SoapProgress indicator

**Files:**
- Create: `src/components/screens/SoapProgress.tsx`
- Test: add a block to `src/components/screens/screens.test.tsx` (import at top).

**Interfaces:**
- Produces: `SoapProgress({ current, accent }: { current: 1 | 2 | 3 | 4; accent: string })`. Renders letters S O A P; the current letter uses `accent`; earlier letters are filled; later letters faint. `aria-label` = `SOAP step {current} of 4`.

- [ ] **Step 1: Write the failing test**

```tsx
// add to src/components/screens/screens.test.tsx
import { SoapProgress } from "@/components/screens/SoapProgress";

describe("SoapProgress", () => {
  it("labels the current step and renders all four letters", () => {
    render(<SoapProgress current={2} accent="#0F6E56" />);
    expect(screen.getByLabelText("SOAP step 2 of 4")).toBeInTheDocument();
    for (const letter of ["S", "O", "A", "P"]) {
      expect(screen.getByText(letter)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/screens/screens.test.tsx -t SoapProgress`
Expected: FAIL — cannot resolve `SoapProgress`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/screens/SoapProgress.tsx
const LETTERS = ["S", "O", "A", "P"] as const;

export function SoapProgress({ current, accent }: { current: 1 | 2 | 3 | 4; accent: string }) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`SOAP step ${current} of 4`}>
      {LETTERS.map((letter, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <span
            key={letter}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium transition-colors duration-500"
            style={
              active
                ? { background: accent, color: "#fff" }
                : done
                  ? { color: accent, background: "color-mix(in srgb, " + accent + " 14%, transparent)" }
                  : { color: "var(--ink-muted)", background: "color-mix(in srgb, var(--ink) 6%, transparent)" }
            }
          >
            {letter}
          </span>
        );
      })}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/screens/screens.test.tsx -t SoapProgress`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/SoapProgress.tsx src/components/screens/screens.test.tsx
git commit -m "feat: labeled SOAP progress indicator"
```

---

## Task 4: Scripture screen

**Files:**
- Create: `src/components/screens/Scripture.tsx`
- Test: add a block to `src/components/screens/screens.test.tsx`.

**Interfaces:**
- Consumes: `Theme`, `Devotion`, `SpotifyEmbed`, `SoapProgress`.
- Produces: `Scripture({ devotion, theme, playlistId, onContinue }: { devotion: Devotion; theme: Theme; playlistId: string; onContinue: () => void })`. Shows verse text, reference, playlist, `SoapProgress current={1}`, and a Continue button.

- [ ] **Step 1: Write the failing test**

```tsx
// add to src/components/screens/screens.test.tsx
import { Scripture } from "@/components/screens/Scripture";

describe("Scripture screen", () => {
  it("shows the verse, reference, playlist, and SOAP progress at S", () => {
    render(<Scripture devotion={dev} theme={getTheme("peace")} playlistId="abc123" onContinue={() => {}} />);
    expect(screen.getByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("Psalm 46:10")).toBeInTheDocument();
    expect(screen.getByTitle("Peace playlist")).toBeInTheDocument();
    expect(screen.getByLabelText("SOAP step 1 of 4")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/screens/screens.test.tsx -t "Scripture screen"`
Expected: FAIL — cannot resolve `Scripture`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/screens/Scripture.tsx
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { SoapProgress } from "@/components/screens/SoapProgress";

export function Scripture({ devotion, theme, playlistId, onContinue }: { devotion: Devotion; theme: Theme; playlistId: string; onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-7 py-7">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {theme.name}
        </span>
        <SoapProgress current={1} accent={theme.accent} />
      </div>

      <div className="stagger my-auto flex flex-col items-center gap-6 text-center">
        <p className="max-w-[19rem] font-serif text-verse text-balance text-ink">{devotion.verseText}</p>
        <div className="flex flex-col items-center gap-3">
          <span className="h-px w-8 rounded-full" style={{ background: theme.accentBorder }} aria-hidden="true" />
          <span className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">{devotion.verseRef}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SpotifyEmbed playlistId={playlistId} title={`${theme.name} playlist`} />
        <button
          onClick={onContinue}
          className="group mx-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
          style={{ color: theme.accent }}
        >
          Continue
          <i className="ti ti-arrow-right transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/screens/screens.test.tsx -t "Scripture screen"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/Scripture.tsx src/components/screens/screens.test.tsx
git commit -m "feat: Scripture (S) step"
```

---

## Task 5: SoapStep writing screen

**Files:**
- Create: `src/components/screens/SoapStep.tsx`
- Test: add a block to `src/components/screens/screens.test.tsx`.

**Interfaces:**
- Consumes: `Theme`, `SoapProgress`.
- Produces: `SoapStep(props)` where
  ```ts
  {
    theme: Theme;
    step: 2 | 3 | 4;          // O=2, A=3, P=4 for SoapProgress
    label: string;            // "Observation" | "Application" | "Prayer"
    prompt: string;           // the theme-aware question
    value: string;            // current field text
    onChange: (text: string) => void;
    onContinue: () => void;
    continueLabel: string;    // "Continue" | "Amen"
    nudge?: string;           // optional pre-written text
  }
  ```
  Renders the theme header + `SoapProgress`, the prompt (serif), an auto-saving serif textarea (label = `label`), an optional "Need a nudge?" `<details>` disclosure showing `nudge`, and the advance button.

- [ ] **Step 1: Write the failing test**

```tsx
// add to src/components/screens/screens.test.tsx
import { SoapStep } from "@/components/screens/SoapStep";

describe("SoapStep", () => {
  it("shows the prompt, an editable field, and emits typed text", () => {
    const onChange = vi.fn();
    render(
      <SoapStep theme={getTheme("peace")} step={2} label="Observation" prompt="What do you notice?"
        value="" onChange={onChange} onContinue={() => {}} continueLabel="Continue" nudge="a hint" />,
    );
    expect(screen.getByText("What do you notice?")).toBeInTheDocument();
    expect(screen.getByLabelText("Observation")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Observation"), { target: { value: "peace here" } });
    expect(onChange).toHaveBeenCalledWith("peace here");
  });

  it("reveals the nudge text and hides the disclosure when no nudge is given", () => {
    const { rerender } = render(
      <SoapStep theme={getTheme("peace")} step={2} label="Observation" prompt="p"
        value="" onChange={() => {}} onContinue={() => {}} continueLabel="Continue" nudge="the hidden hint" />,
    );
    expect(screen.getByText("the hidden hint")).toBeInTheDocument();
    expect(screen.getByText("Need a nudge?")).toBeInTheDocument();

    rerender(
      <SoapStep theme={getTheme("peace")} step={3} label="Application" prompt="p"
        value="" onChange={() => {}} onContinue={() => {}} continueLabel="Continue" />,
    );
    expect(screen.queryByText("Need a nudge?")).toBeNull();
  });

  it("advances with the given continue label", () => {
    const onContinue = vi.fn();
    render(
      <SoapStep theme={getTheme("peace")} step={4} label="Prayer" prompt="p"
        value="" onChange={() => {}} onContinue={onContinue} continueLabel="Amen" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Amen" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/screens/screens.test.tsx -t SoapStep`
Expected: FAIL — cannot resolve `SoapStep`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/screens/SoapStep.tsx
import type { Theme } from "@/lib/themes";
import { SoapProgress } from "@/components/screens/SoapProgress";

export function SoapStep({
  theme,
  step,
  label,
  prompt,
  value,
  onChange,
  onContinue,
  continueLabel,
  nudge,
}: {
  theme: Theme;
  step: 2 | 3 | 4;
  label: string;
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  onContinue: () => void;
  continueLabel: string;
  nudge?: string;
}) {
  const fieldId = `soap-${label.toLowerCase()}`;
  return (
    <div className="flex flex-1 flex-col px-7 py-7">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: theme.accent }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          {label}
        </span>
        <SoapProgress current={step} accent={theme.accent} />
      </div>

      <div className="stagger my-auto flex flex-col gap-4">
        <p className="text-center font-serif text-xl leading-snug text-ink">{prompt}</p>
        <label htmlFor={fieldId} className="sr-only">{label}</label>
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder="Write your own…"
          className="w-full resize-none rounded-2xl border bg-paper p-3.5 font-serif text-[15px] leading-relaxed text-ink shadow-sm outline-none transition-colors placeholder:font-sans placeholder:text-ink-muted"
          style={{ borderColor: "var(--hairline)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
        />
        {nudge && (
          <details className="rounded-xl px-3.5 py-2.5" style={{ background: theme.accentSoft }}>
            <summary className="cursor-pointer list-none text-[13px] font-medium" style={{ color: theme.accent }}>
              Need a nudge?
            </summary>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${theme.accent} 42%, var(--ink))` }}>
              {nudge}
            </p>
          </details>
        )}
      </div>

      <button onClick={onContinue} className="btn-primary w-full rounded-full py-3.5 text-[15px] font-medium">
        {continueLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/screens/screens.test.tsx -t SoapStep`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/SoapStep.tsx src/components/screens/screens.test.tsx
git commit -m "feat: SOAP writing step (O/A/P)"
```

---

## Task 6: Amen without the free-note field

**Files:**
- Modify: `src/components/screens/Amen.tsx`
- Test: `src/components/screens/screens.test.tsx` (update the existing Amen block).

**Interfaces:**
- Consumes: `Theme`, `Devotion`, `ShareButton` (with its new `reflection` prop from Task 7 — but this task only passes a string, so it compiles against either prop name once Task 7 lands; sequence Task 7 before running the full suite).
- Produces: `Amen({ devotion, theme, streak, favorite, onToggleFavorite, reflection }: { devotion: Devotion; theme: Theme; streak: number; favorite: boolean; onToggleFavorite: () => void; reflection: string })`. No note textarea; shows the bloom, streak, favorite, and share.

- [ ] **Step 1: Update the Amen test**

Replace the `describe("Amen screen", ...)` block in `screens.test.tsx` with:

```tsx
describe("Amen screen", () => {
  it("shows the streak and the save/share actions, without a note field", () => {
    render(<Amen devotion={dev} theme={getTheme("peace")} streak={8} favorite={false} onToggleFavorite={() => {}} reflection="my observation" />);
    expect(screen.getByText(/8-day streak/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share this verse" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("What is God stirring in you today?")).toBeNull();
  });

  it("toggles favorite", () => {
    const onToggleFavorite = vi.fn();
    render(<Amen devotion={dev} theme={getTheme("peace")} streak={1} favorite={false} onToggleFavorite={onToggleFavorite} reflection="" />);
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/screens/screens.test.tsx -t "Amen screen"`
Expected: FAIL — Amen still requires `note`/`onChangeNote` and renders the placeholder.

- [ ] **Step 3: Rewrite `Amen.tsx`**

```tsx
// src/components/screens/Amen.tsx
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { ShareButton } from "@/components/ShareButton";

export function Amen({
  devotion,
  theme,
  streak,
  favorite,
  onToggleFavorite,
  reflection,
}: {
  devotion: Devotion;
  theme: Theme;
  streak: number;
  favorite: boolean;
  onToggleFavorite: () => void;
  reflection: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-7 py-8">
      <div className="my-auto flex flex-col items-center gap-3 text-center">
        <div className="relative flex h-[78px] w-[78px] items-center justify-center">
          <span className="bloom-ring absolute inset-0 rounded-full border" style={{ borderColor: theme.accentBorder }} aria-hidden="true" />
          <span className="bloom flex h-[78px] w-[78px] items-center justify-center rounded-full" style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}>
            <i className="ti ti-check text-3xl" style={{ color: theme.accent }} aria-hidden="true" />
          </span>
        </div>
        <span className="font-serif text-2xl text-ink">Amen.</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <i className="ti ti-plant-2" style={{ color: theme.accent }} aria-hidden="true" /> {streak}-day streak
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium transition-colors"
          style={
            favorite
              ? { background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accentBorder}` }
              : { background: "var(--paper)", color: theme.accent, border: "1px solid var(--hairline)" }
          }
        >
          <i className={favorite ? "ti ti-heart-filled" : "ti ti-heart"} aria-hidden="true" />
          {favorite ? "Saved" : "Save"}
        </button>
        <ShareButton
          devotion={devotion}
          theme={theme}
          reflection={reflection}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test (will pass after Task 7 lands the `reflection` prop)**

Run: `npx vitest run src/components/screens/screens.test.tsx -t "Amen screen"`
Expected: PASS once Task 7's ShareButton `reflection` prop exists. If run before Task 7, expect a TS-level failure on the unknown `reflection` prop; proceed to Task 7 and re-run.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/Amen.tsx src/components/screens/screens.test.tsx
git commit -m "feat: Amen resolves the SOAP entry, drops free-note field"
```

---

## Task 7: ShareButton and share card — reflection

**Files:**
- Modify: `src/components/ShareButton.tsx`, `src/lib/shareCard.ts` (no logic change needed; confirm the `note` field), `src/components/share.test.tsx`

**Interfaces:**
- Consumes: `buildCardSvg` (its `note?: string` param is reused as the composed reflection).
- Produces: `ShareButton({ devotion, theme, reflection, className }: { devotion: Devotion; theme: Theme; reflection?: string; className?: string })`. Toggle label is "Include my reflection".

- [ ] **Step 1: Update `share.test.tsx`**

Replace the note-toggle tests with reflection ones:

```tsx
it("offers the reflection toggle only when a reflection is present", () => {
  const { rerender } = render(<ShareButton devotion={dev} theme={getTheme("peace")} />);
  fireEvent.click(screen.getByRole("button", { name: "Share this verse" }));
  expect(screen.queryByLabelText("Include my reflection")).toBeNull();

  rerender(<ShareButton devotion={dev} theme={getTheme("peace")} reflection="my response" />);
  expect(screen.getByLabelText("Include my reflection")).toBeInTheDocument();
});

it("adds the reflection to the card when the toggle is checked", () => {
  render(<ShareButton devotion={dev} theme={getTheme("peace")} reflection="my response" />);
  fireEvent.click(screen.getByRole("button", { name: "Share this verse" }));
  const before = screen.getByAltText("Peace verse card") as HTMLImageElement;
  expect(decodeURIComponent(before.src)).not.toContain("my response");
  fireEvent.click(screen.getByLabelText("Include my reflection"));
  const after = screen.getByAltText("Peace verse card") as HTMLImageElement;
  expect(decodeURIComponent(after.src)).toContain("my response");
});
```

(The first test in the file, "opens a preview dialog with the verse card image", is unchanged.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/share.test.tsx`
Expected: FAIL — `reflection` prop and "Include my reflection" label do not exist.

- [ ] **Step 3: Edit `ShareButton.tsx`**

Rename the prop and the derived state. Change the props block, `hasNote`, the `buildCardSvg` `note`, and the label:

```tsx
// signature
export function ShareButton({
  devotion,
  theme,
  reflection,
  className,
}: {
  devotion: Devotion;
  theme: Theme;
  reflection?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [includeReflection, setIncludeReflection] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasReflection = Boolean(reflection && reflection.trim() !== "");

  const svg = useMemo(
    () =>
      buildCardSvg({
        verseText: devotion.verseText,
        verseRef: devotion.verseRef,
        themeName: theme.name,
        accent: theme.accent,
        accentSoft: theme.accentSoft,
        note: includeReflection && hasReflection ? reflection : undefined,
      }),
    [devotion, theme, includeReflection, hasReflection, reflection],
  );
```

Then update the toggle JSX inside the dialog:

```tsx
{hasReflection && (
  <label className="mb-3 flex items-center justify-center gap-2 text-sm text-white/90">
    <input
      type="checkbox"
      checked={includeReflection}
      onChange={(e) => setIncludeReflection(e.target.checked)}
      className="h-4 w-4 accent-white"
    />
    Include my reflection
  </label>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/share.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ShareButton.tsx src/components/share.test.tsx
git commit -m "feat: share the SOAP reflection instead of a free note"
```

---

## Task 8: DevotionFlow — SOAP step machine

**Files:**
- Modify: `src/components/DevotionFlow.tsx`
- Test: `src/components/DevotionFlow.test.tsx`

**Interfaces:**
- Consumes: `getSoapPrompts` (Task 1); `getEntry`, `setSoapField`, `soapText`, `markComplete`, `toggleFavorite`, `isFavorite`, `computeStreak`, `loadProgress` (Task 2); `Scripture` (Task 4); `SoapStep` (Task 5); `Amen` (Task 6); existing `Arrival`, `Linger`, `Done`, `Atmosphere`.
- Produces: the `/today` experience with steps `arrival | scripture | observation | application | prayer | amen | linger | done`.

- [ ] **Step 1: Update `DevotionFlow.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DevotionFlow } from "@/components/DevotionFlow";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 12, 9, 0, 0));
});
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("DevotionFlow", () => {
  it("renders the arrival screen for the local day after mount", async () => {
    render(<DevotionFlow />);
    expect(await screen.findByText("Begin")).toBeInTheDocument();
    expect(screen.getByText("Good morning")).toBeInTheDocument();
  });

  it("walks Scripture into the Observation writing step", async () => {
    render(<DevotionFlow />);
    fireEvent.click(await screen.findByText("Begin"));
    expect(screen.getByLabelText("SOAP step 1 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByLabelText("SOAP step 2 of 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Observation")).toBeInTheDocument();
  });

  it("shows the done state when today is already completed", async () => {
    const d = new Date();
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: [local], favorites: [], entries: {} }));
    render(<DevotionFlow />);
    expect(await screen.findByText("You've already been here today.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DevotionFlow.test.tsx`
Expected: FAIL — no SOAP step / Observation label yet.

- [ ] **Step 3: Rewrite `DevotionFlow.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getPlaylistId, getTodayDevotion } from "@/lib/devotions/select";
import { getSoapPrompts } from "@/lib/soap/prompts";
import {
  computeStreak,
  loadProgress,
  markComplete,
  toggleFavorite,
  isFavorite,
  getEntry,
  setSoapField,
  soapText,
  type SoapEntry,
} from "@/lib/progress";
import { formatDisplayDate, greetingForHour } from "@/lib/dates";
import { Atmosphere } from "@/components/Atmosphere";
import { Arrival } from "@/components/screens/Arrival";
import { Scripture } from "@/components/screens/Scripture";
import { SoapStep } from "@/components/screens/SoapStep";
import { Amen } from "@/components/screens/Amen";
import { Linger } from "@/components/screens/Linger";
import { Done } from "@/components/screens/Done";

type Step = "arrival" | "scripture" | "observation" | "application" | "prayer" | "amen" | "linger" | "done";

function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function DevotionFlow() {
  const [today, setToday] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("arrival");
  const [progress, setProgress] = useState(() => loadProgress());
  const [entry, setEntry] = useState<SoapEntry>({ observation: "", application: "", prayer: "" });

  useEffect(() => {
    const t = localToday();
    setToday(t);
    const p = loadProgress();
    setProgress(p);
    setEntry(getEntry(p, t));
    if (p.completedDates.includes(t)) setStep("done");
  }, []);

  const devotion = useMemo(() => (today ? getTodayDevotion(DEVOTIONS, today) : null), [today]);
  const streak = useMemo(
    () => (today ? computeStreak(progress.completedDates, today) : 0),
    [progress.completedDates, today],
  );

  if (!devotion) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center bg-paper shadow-column">
        <div className="breathe h-16 w-16 rounded-full" style={{ ["--accent" as string]: "#0F6E56", background: "#E1F5EE", border: "1px solid #9FE1CB" }} aria-hidden="true" />
      </main>
    );
  }

  const theme = getTheme(devotion.theme);
  const playlistId = getPlaylistId(theme, devotion.date);
  const prompts = getSoapPrompts(devotion.theme);

  function writeField(field: keyof SoapEntry, text: string) {
    if (!today) return;
    setEntry((e) => ({ ...e, [field]: text }));
    setProgress(setSoapField(today, field, text));
  }

  function finishPrayer() {
    if (!today) return;
    setProgress(markComplete(today));
    setStep("amen");
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-sm flex-col bg-paper shadow-column" style={{ ["--accent" as string]: theme.accent }}>
      <Atmosphere accent={theme.accent} tone={step === "prayer" ? "night" : "day"} />
      <div key={step} className="fade-in relative z-10 flex min-h-screen flex-col">
        {step === "arrival" && (
          <Arrival
            theme={theme}
            today={formatDisplayDate(today ?? devotion.date)}
            streak={streak}
            greeting={greetingForHour(new Date().getHours())}
            onBegin={() => setStep("scripture")}
          />
        )}
        {step === "scripture" && <Scripture devotion={devotion} theme={theme} playlistId={playlistId} onContinue={() => setStep("observation")} />}
        {step === "observation" && (
          <SoapStep theme={theme} step={2} label="Observation" prompt={prompts.observation}
            value={entry.observation} onChange={(t) => writeField("observation", t)}
            onContinue={() => setStep("application")} continueLabel="Continue" nudge={devotion.reflection} />
        )}
        {step === "application" && (
          <SoapStep theme={theme} step={3} label="Application" prompt={prompts.application}
            value={entry.application} onChange={(t) => writeField("application", t)}
            onContinue={() => setStep("prayer")} continueLabel="Continue" />
        )}
        {step === "prayer" && (
          <SoapStep theme={theme} step={4} label="Prayer" prompt={prompts.prayer}
            value={entry.prayer} onChange={(t) => writeField("prayer", t)}
            onContinue={finishPrayer} continueLabel="Amen" nudge={devotion.prayer} />
        )}
        {step === "amen" && (
          <Amen
            devotion={devotion}
            theme={theme}
            streak={streak}
            favorite={isFavorite(progress, devotion.date)}
            onToggleFavorite={() => setProgress(toggleFavorite(devotion.date))}
            reflection={soapText(entry)}
          />
        )}
        {step === "amen" && (
          <button
            onClick={() => setStep("linger")}
            className="group mx-auto mb-7 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
            style={{ color: theme.accent }}
          >
            Linger a while
            <i className="ti ti-arrow-right transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        )}
        {step === "linger" && <Linger devotion={devotion} theme={theme} playlistId={playlistId} />}
        {step === "done" && <Done theme={theme} streak={streak} onReadAgain={() => setStep("scripture")} />}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/DevotionFlow.test.tsx src/components/screens/screens.test.tsx`
Expected: PASS (DevotionFlow walk + all screen tests, including the Task 6 Amen tests now that `reflection` exists).

- [ ] **Step 5: Commit**

```bash
git add src/components/DevotionFlow.tsx src/components/DevotionFlow.test.tsx
git commit -m "feat: SOAP step machine in DevotionFlow"
```

---

## Task 9: JournalView

**Files:**
- Create: `src/components/JournalView.tsx`, `src/components/journal.test.tsx`
- Create: `src/app/(hub)/journal/page.tsx`

**Interfaces:**
- Consumes: `DEVOTIONS`, `getTheme`, `getDevotionForDate`, `loadProgress`, `getEntry`, `entryDates`, `isFavorite`, `toggleFavorite`, `formatDisplayDate`, `soapText`, `ShareButton`.
- Produces: `JournalView()` client component; route default export at `(hub)/journal/page.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/journal.test.tsx
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JournalView } from "@/components/JournalView";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("JournalView", () => {
  it("shows the empty state when nothing is written", async () => {
    render(<JournalView />);
    expect(await screen.findByText("Your journal is empty.")).toBeInTheDocument();
  });

  it("renders a written entry beside its verse", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({ completedDates: [], favorites: [], entries: { "2026-06-25": { observation: "God is near", application: "", prayer: "quiet me" } } }),
    );
    render(<JournalView />);
    expect(await screen.findByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("God is near")).toBeInTheDocument();
    expect(screen.getByText("quiet me")).toBeInTheDocument();
  });

  it("filters to favorites", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({
        completedDates: [],
        favorites: ["2026-06-26"],
        entries: {
          "2026-06-25": { observation: "unfav", application: "", prayer: "" },
          "2026-06-26": { observation: "faved", application: "", prayer: "" },
        },
      }),
    );
    render(<JournalView />);
    expect(await screen.findByText("unfav")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Favorites/ }));
    expect(screen.queryByText("unfav")).toBeNull();
    expect(screen.getByText("faved")).toBeInTheDocument();
  });

  it("shows a legacy note when present without a structured entry", async () => {
    localStorage.setItem(
      "koino.progress.v1",
      JSON.stringify({ completedDates: [], favorites: [], entries: {}, notes: { "2026-06-25": "old reflection" } }),
    );
    render(<JournalView />);
    expect(await screen.findByText("old reflection")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/journal.test.tsx`
Expected: FAIL — cannot resolve `JournalView`.

- [ ] **Step 3: Write `JournalView.tsx`**

```tsx
// src/components/JournalView.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getDevotionForDate } from "@/lib/devotions/select";
import { loadProgress, getEntry, entryDates, isFavorite, toggleFavorite, soapText, type Progress } from "@/lib/progress";
import { formatDisplayDate } from "@/lib/dates";
import { ShareButton } from "@/components/ShareButton";

const PARTS = [
  { key: "observation", label: "Observation" },
  { key: "application", label: "Application" },
  { key: "prayer", label: "Prayer" },
] as const;

export function JournalView() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  useEffect(() => setProgress(loadProgress()), []);

  if (progress === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="breathe h-12 w-12 rounded-full" style={{ ["--accent" as string]: "#0F6E56", background: "#E1F5EE", border: "1px solid #9FE1CB" }} aria-hidden="true" />
      </div>
    );
  }

  const dates = entryDates(progress).filter((d) => !favOnly || isFavorite(progress, d));

  return (
    <div className="fade-in flex flex-col gap-5 p-5 pb-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Journal</h1>
          <p className="mt-1 text-xs text-ink-muted">What you wrote, kept with the verse that stirred it.</p>
        </div>
        {entryDates(progress).some((d) => isFavorite(progress, d)) && (
          <button
            onClick={() => setFavOnly((v) => !v)}
            aria-pressed={favOnly}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={favOnly ? { background: "#E1F5EE", color: "#0F6E56", border: "1px solid #9FE1CB" } : { background: "var(--paper)", color: "var(--ink-secondary)", border: "1px solid var(--hairline)" }}
          >
            <i className={favOnly ? "ti ti-heart-filled" : "ti ti-heart"} aria-hidden="true" /> Favorites
          </button>
        )}
      </header>

      {dates.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
            <i className="ti ti-book text-2xl text-brand" aria-hidden="true" />
          </span>
          <p className="text-sm text-ink-secondary">{favOnly ? "No favorites yet." : "Your journal is empty."}</p>
          <p className="max-w-[16rem] text-xs text-ink-muted">Finish a devotion and your Observation, Application, and Prayer will gather here.</p>
          <Link href="/today" className="btn-quiet mt-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform active:scale-95" style={{ ["--accent" as string]: "#0F6E56" }}>
            Go to today&apos;s devotion
          </Link>
        </div>
      ) : (
        dates.map((date) => {
          const d = getDevotionForDate(DEVOTIONS, date);
          const t = d ? getTheme(d.theme) : null;
          const entry = getEntry(progress, date);
          const legacyNote = progress.notes[date];
          const accent = t?.accent ?? "#0F6E56";
          return (
            <article key={date} className="rounded-well border bg-paper p-5 shadow-card" style={{ borderColor: "var(--hairline)", ["--accent" as string]: accent }}>
              <div className="flex items-center justify-between">
                {t && d ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: t.accentSoft, color: t.accent }}>
                    <i className={`ti ti-${t.icon}`} aria-hidden="true" /> {t.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-muted">Devotion</span>
                )}
                <span className="text-[10px] text-ink-muted">{formatDisplayDate(date)}</span>
              </div>

              {d && <p className="mt-3.5 font-serif text-xl leading-snug text-ink">{d.verseText}</p>}
              {d && <p className="mt-1.5 text-[10px] uppercase tracking-widest2 text-ink-muted">{d.verseRef}</p>}

              <div className="mt-4 flex flex-col gap-3">
                {PARTS.map(({ key, label }) =>
                  entry[key].trim() ? (
                    <div key={key} className="rounded-xl p-3.5" style={{ background: t?.accentSoft ?? "#E1F5EE" }}>
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>{label}</p>
                      <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${accent} 42%, var(--ink))` }}>{entry[key]}</p>
                    </div>
                  ) : null,
                )}
                {legacyNote && (
                  <div className="rounded-xl p-3.5" style={{ background: t?.accentSoft ?? "#E1F5EE" }}>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>Note</p>
                    <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed" style={{ color: `color-mix(in srgb, ${accent} 42%, var(--ink))` }}>{legacyNote}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3.5" style={{ borderColor: "var(--hairline)" }}>
                <button
                  onClick={() => setProgress(toggleFavorite(date))}
                  aria-pressed={isFavorite(progress, date)}
                  aria-label={isFavorite(progress, date) ? "Remove from favorites" : "Add to favorites"}
                  className="text-lg"
                  style={{ color: accent }}
                >
                  <i className={isFavorite(progress, date) ? "ti ti-heart-filled" : "ti ti-heart"} aria-hidden="true" />
                </button>
                {d && t && <ShareButton devotion={d} theme={t} reflection={soapText(entry)} className="flex items-center gap-1.5 text-xs font-medium" />}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create the route**

```tsx
// src/app/(hub)/journal/page.tsx
import { JournalView } from "@/components/JournalView";

export default function JournalPage() {
  return <JournalView />;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/journal.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/JournalView.tsx src/components/journal.test.tsx "src/app/(hub)/journal/page.tsx"
git commit -m "feat: Journal tab of SOAP entries"
```

---

## Task 10: Tabs, Home peek, and route cleanup

**Files:**
- Modify: `src/components/TabBar.tsx`, `src/components/HomeHub.tsx`, `src/components/hub.test.tsx`
- Delete: `src/app/(hub)/saved/page.tsx`, `src/app/(hub)/notes/page.tsx`, `src/components/SavedList.tsx`, `src/components/NotesView.tsx`, `src/components/notes.test.tsx`

**Interfaces:**
- Consumes: `entryDates`, `getEntry`, `soapText`, `getDevotionForDate` for the Home peek.
- Produces: TabBar with `/`, `/journal`, `/themes`, `/history`; HomeHub with a recent-journal peek.

- [ ] **Step 1: Update `hub.test.tsx`**

Replace the `SavedList` import/describe with `JournalView` and adjust the HomeHub peek assertion:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeHub } from "@/components/HomeHub";
import { ThemeExplorer } from "@/components/ThemeExplorer";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 6, 12, 9, 0, 0));
  localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("HomeHub", () => {
  it("greets, shows today's verse, and links to the devotion", async () => {
    render(<HomeHub />);
    expect(await screen.findByText("Good morning")).toBeInTheDocument();
    expect(screen.getByText("Create in me a clean heart, O God. Renew a right spirit within me.")).toBeInTheDocument();
    const cta = screen.getByText("Begin today's devotion").closest("a");
    expect(cta).toHaveAttribute("href", "/today");
  });

  it("shows the empty journal peek when nothing is written", async () => {
    render(<HomeHub />);
    expect(await screen.findByText(/Your journal is waiting/)).toBeInTheDocument();
  });
});

describe("ThemeExplorer", () => {
  it("lists all twelve themes", () => {
    render(<ThemeExplorer />);
    expect(screen.getByText("Peace")).toBeInTheDocument();
    expect(screen.getByText("Longing")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/hub.test.tsx`
Expected: FAIL — HomeHub still renders the "Nothing saved yet" Saved peek.

- [ ] **Step 3: Rewrite `TabBar.tsx` tabs**

Replace the `TABS` array:

```tsx
const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/journal", label: "Journal", icon: "book" },
  { href: "/themes", label: "Themes", icon: "sparkles" },
  { href: "/history", label: "History", icon: "chart-line" },
] as const;
```

(The rest of `TabBar.tsx` is unchanged.)

- [ ] **Step 4: Replace the Saved section in `HomeHub.tsx` with a journal peek**

In `HomeHub.tsx`, change the imports to add the entry helpers:

```tsx
import { computeStreak, loadProgress, entryDates, getEntry } from "@/lib/progress";
import { getTodayDevotion, getDevotionForDate } from "@/lib/devotions/select";
```

Replace the `const saved = ...` line with:

```tsx
const recent = entryDates(progress)
  .map((date) => ({ date, devotion: getDevotionForDate(DEVOTIONS, date), entry: getEntry(progress, date) }))
  .filter((r) => r.devotion !== null)
  .slice(0, 2);
```

Replace the entire `Saved` `<section>` (the one headed "Saved") with:

```tsx
<section>
  <div className="mb-3 flex items-center justify-between">
    <h2 className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Journal</h2>
    {recent.length > 0 && (
      <Link href="/journal" className="text-[11px] text-ink-muted transition-colors hover:text-ink">See all</Link>
    )}
  </div>
  {recent.length === 0 ? (
    <p className="rounded-2xl border bg-paper p-4 text-center text-xs text-ink-muted" style={{ borderColor: "var(--hairline)" }}>
      Your journal is waiting. Finish today&apos;s devotion to write your first entry.
    </p>
  ) : (
    <div className="flex flex-col gap-2.5">
      {recent.map(({ date, devotion: rd, entry }) => {
        const rt = getTheme(rd!.theme);
        const snippet = entry.observation || entry.application || entry.prayer;
        return (
          <Link key={date} href="/journal" className="block rounded-2xl border bg-paper p-3.5 shadow-card transition-transform active:scale-[0.99]" style={{ borderColor: "var(--hairline)" }}>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: rt.accent }}>
              <i className={`ti ti-${rt.icon}`} aria-hidden="true" /> {rt.name}
            </span>
            <p className="mt-1.5 line-clamp-2 font-serif text-sm leading-snug text-ink">{snippet}</p>
          </Link>
        );
      })}
    </div>
  )}
</section>
```

- [ ] **Step 5: Delete the dead routes and components**

```bash
git rm "src/app/(hub)/saved/page.tsx" "src/app/(hub)/notes/page.tsx" src/components/SavedList.tsx src/components/NotesView.tsx src/components/notes.test.tsx
```

- [ ] **Step 6: Run the suite to verify it passes**

Run: `npx vitest run src/components/hub.test.tsx`
Expected: PASS. Then `npx tsc --noEmit` — expect no references to the deleted files (see Task 11 for the final sweep).

- [ ] **Step 7: Commit**

```bash
git add src/components/TabBar.tsx src/components/HomeHub.tsx src/components/hub.test.tsx
git commit -m "feat: Home/Journal/Themes/History tabs and journal peek"
```

---

## Task 11: Remove superseded screens and full verification

**Files:**
- Delete: `src/components/screens/Verse.tsx`, `src/components/screens/Reflection.tsx`, `src/components/screens/Prayer.tsx`, `src/components/screens/StepDots.tsx`
- Modify: `src/components/screens/screens.test.tsx` (remove Verse/Reflection/Prayer blocks)

**Interfaces:**
- Consumes: nothing new.
- Produces: a clean tree with no references to the deleted screens.

- [ ] **Step 1: Remove the old screen tests**

In `screens.test.tsx`, delete the imports and `describe` blocks for `Verse`, `Reflection`, and the old read-only `Prayer` (the `getByRole("button", { name: "Tap when you're ready" })` test). Keep `SpotifyEmbed`, `Arrival`, `Done`, and the new `Scripture`, `SoapProgress`, `SoapStep`, and `Amen` blocks.

- [ ] **Step 2: Delete the superseded screen files**

```bash
git rm src/components/screens/Verse.tsx src/components/screens/Reflection.tsx src/components/screens/Prayer.tsx src/components/screens/StepDots.tsx
```

- [ ] **Step 3: Grep for stragglers**

Run: `npx tsc --noEmit`
Expected: no errors. If any file still imports `Verse`, `Reflection`, `Prayer`, `StepDots`, `SavedList`, or `NotesView`, fix that import.

- [ ] **Step 4: Full test + lint sweep**

Run: `npm test && npx tsc --noEmit && npx next lint`
Expected: all tests pass, no type errors, no lint errors.

- [ ] **Step 5: Design detector**

Run:
```bash
node "C:\Users\User\.claude\skills\impeccable\scripts\detect.mjs" --json src/components/screens/SoapStep.tsx src/components/screens/Scripture.tsx src/components/screens/SoapProgress.tsx src/components/screens/Amen.tsx src/components/DevotionFlow.tsx src/components/JournalView.tsx src/components/HomeHub.tsx src/components/TabBar.tsx src/components/ShareButton.tsx
```
Expected: `[]`.

- [ ] **Step 6: Live walk (dev server + browser tools)**

Start the `koino` preview, then verify (using the browser text tools since screenshots need the pane visible): navigate `/today`, click Begin, confirm `SOAP step 1 of 4`, Continue to Observation (`SOAP step 2 of 4`, editable field), type into O/A/P, finish Prayer to reach Amen (bloom + streak), then visit `/journal` (entry appears with what was typed), `/themes` (12 tiles), `/history` (streak + calendar). Confirm no console errors via `read_console_messages`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove pre-SOAP screens; final SOAP verification"
```

---

## Self-Review

**Spec coverage:**
- Prompted SOAP model, theme-aware prompts → Task 1, wired in Task 8.
- One step per letter, S O A P progress → Tasks 3, 4, 5, 8.
- Entries persistence, legacy-safe, no data loss → Task 2.
- Amen drops free note; entry auto-saved → Tasks 2, 6, 8.
- Journal replaces Notes/Saved; favorites filter; legacy note fallback → Tasks 9, 10.
- Tabs Home/Journal/Themes/History; Home peek → Task 10.
- Share reflection → Task 7.
- Visual world unchanged, tokens reused → all UI tasks reuse existing classes; detector in Task 11.
- Testing plan (add + update) → tests in every task; removals in Tasks 10, 11.

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N"; all prompt copy and component code is literal.

**Type consistency:** `SoapEntry` fields (`observation`/`application`/`prayer`) used identically in Tasks 2, 8, 9. `setSoapField(date, field, text)`, `getEntry(p, date)`, `soapText(entry)`, `entryDates(p)` names match across tasks. `SoapStep` prop names (`step`, `label`, `prompt`, `value`, `onChange`, `onContinue`, `continueLabel`, `nudge`) match between Task 5 definition and Task 8 usage. `ShareButton` `reflection` prop matches across Tasks 6, 7, 9. `SoapProgress` `current`/`accent` match across Tasks 3, 4, 5.

**Cross-task ordering note:** Task 6 (Amen) references `ShareButton`'s `reflection` prop introduced in Task 7; when executing strictly in order, expect Task 6's own test to go green only after Task 7. The plan flags this in Task 6 Step 4.
