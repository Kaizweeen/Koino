# SOAP Method Devotion — Design Spec

**Date:** 2026-08-01
**Status:** Approved (design), pending spec review
**Project:** Koino (`C:\Users\User\Koino`, branch `devotion-pivot`)

## Goal

Turn Koino from a *guided* devotion (pre-written verse, reflection, and prayer that the user
reads) into an *active* devotion built on the **SOAP method**: **S**cripture, **O**bservation,
**A**pplication, **P**rayer. The user reads the Scripture, then writes their own Observation,
Application, and Prayer, guided by a theme-aware prompt at each step. Rebuild every screen for
this flow within the existing "Light through paper" visual world (see `DESIGN.md`).

## Confirmed decisions

1. **Model: Prompted SOAP.** Koino gives the Scripture and a short guiding question for each of
   O / A / P; the user writes their own response. Not pure blank-page, not pre-written answers.
2. **Flow: one step per letter.** S, O, A, P are each their own full screen, preserving Koino's
   calm one-thing-at-a-time pacing.
3. **Visual world: keep and evolve "Light through paper."** No changes to `DESIGN.md`; apply the
   existing system to the new screens.
4. **Journal replaces Notes and Saved.** A single Journal holds every SOAP entry; favoriting is a
   filter inside it. Tabs become **Home / Journal / Themes / History**.
5. **Prompts: theme-aware.** One Observation, Application, and Prayer prompt per theme (12 x 3).
   The existing pre-written `reflection` and `prayer` become an optional "Need a nudge?" reveal.

## Product context

Per `PRODUCT.md`: Koino is a real daily-devotion app for practicing Christians building a habit.
Its confirmed principles include *rest not striving*, *meet the person where they are*,
*finishable not endless*, *gentle habit no shame*, and *music is part of the devotion*. SOAP
reinforces "meet the person where they are" (they bring their own words) while keeping the
finishable, gentle character: the prompts lower the blank-page barrier, and the flow still has a
clear beginning and end.

## The daily flow

Route: `/today`, driven by `DevotionFlow`. Step order:

```
arrival -> scripture -> observation -> application -> prayer -> amen -> linger -> done
```

Progress indicator: a labeled **S O A P** row (replacing the current 3-dot `StepDots`). The four
letters map to Scripture (read) + Observation/Application/Prayer (write). Scripture is shown as
"read"; the current write-step letter is highlighted in the day's accent; completed letters are
filled; upcoming letters are faint. The indicator appears on the S/O/A/P screens (not Arrival,
Amen, Linger, Done).

### Screens

- **Arrival** — unchanged in spirit: date kicker, serif greeting, theme pill, breathing halo,
  "Begin" primary button, streak. A single quiet line naming the practice (e.g. "A SOAP
  reflection") may sit under the theme pill. No functional change.

- **S · Scripture** — the verse as the luminous typographic center (today's `Verse` screen,
  relabeled). Verse (serif, balanced, ~19rem measure), hairline divider, reference, the theme's
  Spotify playlist, and a "Continue" advance affordance. Read-only. SOAP progress shows S active.

- **O · Observation** — header with theme label + SOAP progress (O active). A **prompt** (the
  theme's observation question, serif, calm) and a **writing field** (serif textarea, auto-save,
  paper surface, focus shifts border to accent). An optional **"Need a nudge?"** disclosure that
  reveals the day's pre-written `reflection` in a soft accent-tinted panel. Advance affordance
  ("Continue"); back navigation preserved.

- **A · Application** — same structure as Observation, with the theme's application prompt and its
  own writing field. **No nudge** on this step: there is no pre-written application text, and
  Application is intentionally left as the user's own work. SOAP progress A active.

- **P · Prayer** — same structure, with the theme's prayer prompt and writing field. Nudge reveal
  shows the day's pre-written `prayer` as an example. Finishing this step marks the day complete
  and advances to Amen. SOAP progress P active.

- **Amen** — the authored bloom moment (check blooms with a ring), "Amen.", streak, favorite
  toggle, and share. No separate free-note field anymore (the SOAP entry is the writing). A
  quiet "Linger a while" advance to the music.

- **Linger / Done** — unchanged: Linger shows completion + music + "new devotion tomorrow";
  Done is the already-completed state with "Read it again" (re-enters at Scripture) and the
  streak. "Read it again" preserves the saved SOAP entry (does not clear it).

### Writing and auto-save behavior

- Each write step (O/A/P) auto-saves on change to `entries[today]`, mirroring today's note
  auto-save. A subtle "Saved" affordance is acceptable but not required per step.
- Moving back and forward between steps never clears written text. Re-entering a step shows what
  was written.
- The day is marked complete (`completedDates`) when the user finishes the Prayer step. Partial
  progress (some fields written, not finished) still persists in `entries` but does not count as
  completed.

## Data model

### Content: SOAP prompts

New file `src/lib/soap/prompts.ts`:

```ts
export interface SoapPrompts {
  observation: string;
  application: string;
  prayer: string;
}
export const SOAP_PROMPTS: Record<ThemeSlug, SoapPrompts> = { /* 12 entries */ };
export function getSoapPrompts(theme: ThemeSlug): SoapPrompts;
```

**Authoring pattern** (applied to all 12 themes; questions are short, warm, second person,
non-leading):

- **Observation** — draws attention to what the text says about God, the world, or the self,
  colored by the theme. Example (peace): "What does this verse show you about where true rest is
  found?"
- **Application** — invites one concrete, gentle step for today, colored by the theme. Example
  (peace): "Where do you most need to stop striving and trust today?"
- **Prayer** — invites turning the moment into prayer, colored by the theme. Example (peace):
  "Ask God to quiet one thing you are carrying."

Two more worked examples to lock the voice:

- **Lament** — O: "What honest thing does this passage give you permission to bring to God?"
  A: "What grief or weight do you need to carry to God today, rather than hold alone?"
  P: "Tell God plainly what hurts, and ask him to sit with you in it."
- **Joy** — O: "What goodness of God does this verse point you toward?"
  A: "What is one gift today that you could stop and actually celebrate?"
  P: "Thank God for something specific, out loud in your prayer."

The remaining nine themes (gratitude, hope, surrender, awe, repentance, strength, comfort, love,
longing) follow the same three-part pattern in the theme's emotional register. Full text authored
during implementation and reviewable in `src/lib/soap/prompts.ts`.

### Content: existing devotion fields

`Devotion.reflection` and `Devotion.prayer` are **retained unchanged** in `content.ts`. They are
no longer rendered as the primary experience; they become the optional "Need a nudge?" content on
the Observation/Application (reflection) and Prayer (prayer) steps.

### Persistence: progress store

Extend `src/lib/progress.ts` and its stored shape (`koino.progress.v1`):

```ts
interface SoapEntry { observation: string; application: string; prayer: string; }

interface Progress {
  completedDates: string[];
  favorites: string[];
  entries: Record<string, SoapEntry>;   // NEW: keyed by YYYY-MM-DD
  notes?: Record<string, string>;        // LEGACY: read-only, surfaced in Journal if present
}
```

- New helpers: `getEntry(progress, date): SoapEntry`, `setSoapField(date, field, text): Progress`
  (auto-save one field), and updated `loadProgress()` that defaults `entries` to `{}` and
  tolerates old stored shapes (missing `entries`, present `notes`).
- `markComplete(date)` unchanged in signature; called when Prayer is finished.
- `toggleFavorite` / `isFavorite` unchanged.
- Backward compatibility: an existing store with `notes` but no `entries` loads fine; legacy
  notes remain visible in the Journal (labeled), and are never destroyed. No lossy migration.

## Information architecture

Tabs (`TabBar`): **Home / Journal / Themes / History** (icons: home, book/notebook, sparkles,
chart/calendar). Routing under the `(hub)` group:

- `/` — **Home** (`HomeHub`): greeting, today's card into the SOAP flow (CTA copy unchanged:
  "Begin today's devotion" / "Revisit today"), streak + week strip, a **recent journal peek**
  (replaces the "Saved" peek; shows the last 1-2 entries' verse + a snippet), explore themes.
- `/journal` — **Journal** (new `JournalView`, replaces `SavedList` + `NotesView`): reverse-chron
  list of entries. Each entry card shows date, theme pill, verse + reference, and the user's
  S/O/A/P (Observation/Application/Prayer shown; empty parts omitted gracefully), a favorite
  heart, and share. A **favorites filter** toggles to show only favorited entries. Legacy free
  `notes` render as a single "Note" block on that day's card when no structured entry exists.
- `/themes` — **Themes** (`ThemeExplorer`): unchanged.
- `/history` — **History** (`HistoryView`): unchanged content, now a primary tab.

Removed routes/components: `/saved` (`SavedList`), `/notes` (`NotesView`). Their tests are
replaced by Journal tests.

## Visual application

No `DESIGN.md` changes. New/changed component treatments, all within the documented world:

- **SOAP progress** (`SoapProgress`, replaces `StepDots`): a labeled `S O A P` row; active letter
  in `--accent`, completed filled, upcoming faint. `aria-label` communicates step and total.
- **Writing step** (shared `SoapStep` component): the prompt (serif), the auto-saving serif
  textarea (paper, hairline, focus -> accent per the Note Field pattern), and the optional
  disclosure. Reuses atmosphere via the flow-level `--accent`.
- **"Need a nudge?" disclosure**: a quiet accent-tinted reveal (accentSoft panel) showing the
  pre-written text; collapsed by default so the person writes their own first.
- **Journal entry card**: the documented card language (well radius, hairline, `shadow-card`),
  with the S/O/A/P laid out as small labeled sections; note treatment uses the soft accent inset
  from the current Saved card (never a colored `border-left`).

## Share

`ShareButton` / `shareCard.ts`: the card keeps the verse + reference as the hero. The single
"Include my note" option becomes "Include my reflection", which appends all non-empty parts of
the user's Observation / Application / Prayer. There is no per-field selection UI in this
iteration (YAGNI). The `buildCardSvg` note parameter generalizes to accept the composed SOAP text. Verse-only sharing
remains the default.

## Component inventory

**New:** `src/lib/soap/prompts.ts`, `src/lib/soap/types.ts` (or fold into progress), `SoapStep`
(shared writing screen), `SoapProgress`, screens `Scripture` (from `Verse`), `Observation`,
`Application`, `PrayerWrite` (SOAP prayer), `JournalView`, route `(hub)/journal/page.tsx`.

**Changed:** `DevotionFlow` (new step machine + `entries` wiring), `HomeHub` (recent-journal peek,
tab-aware links), `TabBar` (Home/Journal/Themes/History), `progress.ts` (entries + helpers),
`Amen` (drop free-note field; entry already saved), `ShareButton`/`shareCard.ts` (reflection
option), `Done` (re-read preserves entry).

**Removed:** `SavedList`, `NotesView`, `(hub)/saved`, `(hub)/notes`, old `Reflection` and read-only
`Prayer` screens and `StepDots` (superseded by SOAP screens + `SoapProgress`). The pre-written
`Prayer` read screen is replaced by the `PrayerWrite` step; its text lives on as the nudge.

## Testing plan

Preserve the project's test discipline (vitest). 

**Add:**
- `soap/prompts` — `getSoapPrompts` returns all three prompts for every theme; all 12 present.
- `progress` — `entries` round-trip: `setSoapField` persists per field; `loadProgress` tolerates
  legacy stores (with `notes`, without `entries`); `markComplete` on Prayer finish.
- Screen render tests: each SOAP step shows its prompt, an editable field, and the nudge toggle;
  `SoapProgress` exposes the right `aria-label`; Scripture shows verse/reference/playlist.
- `JournalView` — empty state; renders a saved entry's verse + written O/A/P; favorites filter;
  legacy note fallback.

**Update:**
- Replace `hub.test` assertions for `SavedList`/`NotesView` with `JournalView`.
- Replace `screens.test` assertions for the pre-written `Reflection`/`Prayer` with the new
  Observation/Application/PrayerWrite steps. Keep `Arrival`, `Done`, `Amen` (minus note field),
  and `SpotifyEmbed` assertions.
- `DevotionFlow.test` — arrival still renders after mount; completed day still shows Done; add a
  walk that reaches the Prayer step.
- `share.test` — verse card still builds; the toggle label is "Include my reflection" and appends
  entry text.

**Definition of done:** all tests green, `tsc` clean, `next lint` clean, the impeccable detector
returns no issues over changed files, and a live walk of `/today` (Arrival -> S -> O -> A -> P ->
Amen) plus each tab shows no console errors.

## Non-goals / out of scope

- No accounts, sync, or backend; persistence stays `localStorage`, per `PRODUCT.md`.
- No change to the 12 themes, their accents, icons, or playlists.
- No change to `DESIGN.md` or the visual token system.
- No AI-generated or dynamic prompts; the 12 x 3 set is static, authored content.
- No export/print of the journal in this iteration (share card only).

## Open questions

None blocking. Prompt wording for the nine un-worked themes will be authored during
implementation following the stated pattern and is reviewable in `src/lib/soap/prompts.ts`.
