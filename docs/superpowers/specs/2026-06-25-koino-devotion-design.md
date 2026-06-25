# Koino — Guided Devotion + Spotify: Design Spec

- **Date:** 2026-06-25
- **Status:** Approved direction, pre-implementation
- **Owner:** Gabriel (Kaizweeen)

## 1. The pivot

Koino was originally a church-welcome app (auth + profiles, with planned church
"vibe-check" ratings and PewBuddy messaging). The actual application source was
never committed — the repo holds only Next.js + TypeScript + Tailwind + Supabase
config scaffolding. We are reusing that scaffold and repurposing the product.

**New Koino:** a daily *guided devotion* app. Each day delivers one scripture,
a short reflection, and a guided prayer, set to a curated Spotify playlist that
matches the day's theme — an immersive, atmospheric few minutes of worship and
study. The goal is a single calm daily moment done beautifully, not a feature
buffet.

## 2. Goals and non-goals

**Goals**
- One unhurried daily devotion: verse → reflection → prayer → music.
- Themed, curated Spotify music that makes the moment atmospheric.
- A habit loop light enough to feel gentle (streak, reminder, save).
- Sustainable content operations via a human-reviewed hybrid pipeline.

**Non-goals (MVP)**
- Social features (messaging, feeds, the old church vibe-check).
- Algorithmic, per-user music generation.
- In-app full playback control / building playlists on the user's account.

## 3. Core decisions (locked)

| Decision | Choice | Why |
|---|---|---|
| Music model | **Curated, theme-tagged Spotify playlists, embedded** (no Spotify login) | Lowest API risk (Spotify deprecated Recommendations/Audio-Features for new apps in late 2024); full curation control; no Premium gate to start |
| Content source | **Hybrid:** thematic calendar → AI-drafted reflection/prayer → human review → publish | Scales without losing voice or theological soundness |
| First-30-days content | **Reviewed flat content files**, admin CMS deferred | Reach a working app faster; build the CMS once the rhythm is proven |
| Platform | **Mobile-first responsive web app (PWA-capable)** | Reuses existing Next.js scaffold; installable; push-capable |
| Accounts | **Anonymous-first**, optional Supabase sign-in | Daily experience needs no login; sign-in persists streak/favorites + enables reminders |
| Verse text | Bible API (translation TBD — see Open decisions) | Avoid bundling/licensing scripture text manually |

## 4. Feature list

### MVP — the daily experience (must-have)
1. **Verse of the Day** — one passage/day from a Bible API, scheduled on a
   thematic calendar; each day carries one **theme tag**.
2. **Reflection + Guided Prayer** — short reflection (2–4 sentences) and a brief
   prayer tied to the verse/theme; AI-drafted, human-approved, stored per day.
3. **Themed Spotify playlist** — the day's theme maps to a curated playlist,
   embedded on the devotion screen via Spotify's iframe. No Spotify login.
4. **The "Today" screen** — one mobile-first screen sequencing
   verse → reflection → prayer → music as a single guided moment.

### MVP — light habit/retention (minimal)
5. **Streak** — gentle "days in a row" count.
6. **Save / favorite** — bookmark a day's verse+reflection to revisit.
7. **Morning reminder** — daily nudge (web push, email fallback).

### MVP — foundation
8. **Optional accounts (Supabase)** — anonymous-first; sign-in persists
   streak/favorites across devices and enables reminders.

### Deferred (explicitly not MVP)
- Content admin/CMS tool (replaced for now by reviewed flat content files).
- Spotify OAuth, building playlists on the user's account, in-app playback SDK.
- Algorithmic mood-matching.
- Social: messaging, sharing feeds, church vibe-check.
- Multi-translation toggles, multi-day reading plans, audio narration.

## 5. User flow — opening Koino in the morning

Principle: **a held breath, not a dashboard.** One path, start to "amen." No
tab bar; navigation *is* the devotion's sequence.

0. **Nudge** — reminder at the user's chosen time opens straight to Today.
1. **Arrival** — calm landing: greeting, date, the day's **theme word**, one
   action: **Begin**.
2. **Verse** — Verse of the Day, serif, centered, generous whitespace.
3. **Press play** — unobtrusive affordance starts the embedded themed playlist;
   fully optional.
4. **Reflection** — short reflection beneath the verse, read at the user's pace.
5. **Guided prayer** — the prayer as invitation; a "pause to pray" option dims
   the screen to just the prayer text (the app's one dark moment).
6. **Amen** — the single "success" action: marks the day complete, updates the
   streak, offers save-to-favorites.
7. **Linger** — a still Today screen: streak updated, day marked done, music
   still playing if desired. Tomorrow's devotion stays closed until tomorrow.

**Edge cases:** not signed in → everything works, sign-in invited at the save
moment; returning later same day → content persists, shows "done" state;
no notification permission → identical flow, no nudge; offline (PWA) → today's
text cached and readable, only the Spotify embed needs a connection.

## 6. Spotify integration strategy

**Core idea:** map music to **themes**, not verses. Hang both the verse and the
playlist off the theme. Curate ~12 playlists once; assign each day a theme.

```
Day (date) ──> Theme ──> Playlist
     │            │
  Verse ─────────┘
Reflection / Prayer
```

### Theme taxonomy (MVP ~12)
Peace/Stillness, Gratitude, Hope, Lament/Grief, Surrender/Trust, Awe/Worship,
Joy/Celebration, Repentance/Humility, Strength/Courage, Comfort/Refuge, Love,
Longing/Seeking.

Each theme stores a **one-line definition** (keeps AI drafts and curation
aligned) and a **musical mood profile** (tempo/instrumentation/energy guidance
for consistent playlist curation).

### Verse → theme assignment
When scheduling a day, the AI **suggests** a theme from the verse; a human
confirms or overrides. This is the one editorial decision per day that matters
most.

### Embed mechanics (why curated-library is low-risk)
- Sanctioned iframe: `https://open.spotify.com/embed/playlist/{id}` — no OAuth,
  no SDK. Premium → full tracks; free → previews. Embed brings its own player.
- Embedding by **playlist ID** means re-curating playlist contents inside
  Spotify updates the app automatically — no code deploy to refresh music.
- Host playlists under a **Koino-owned Spotify account** for control/permanence.

### Freshness
Each theme holds 2–3 playlists and rotates (e.g., weekly), so a recurring theme
doesn't always play the same set. Pure data once the rotation rule exists.

## 7. Content pipeline

1. **Plan** — a thematic calendar assigns each date a verse reference + theme.
2. **Draft** — an LLM drafts the reflection (2–4 sentences) and guided prayer
   from the verse + theme definition + mood profile.
3. **Review** — a human approves/edits before publish (theological soundness,
   voice). For MVP this happens by editing flat content files.
4. **Publish** — the approved day becomes available at its date.

MVP seeds the first ~30 days as reviewed flat files. The admin/CMS tool that
operationalizes steps 1–3 in-app is a fast follow, not MVP.

## 8. Data model (initial)

- `themes` — `slug` (PK), `name`, `definition`, `mood_profile`,
  `accent_color`, `icon`.
- `playlists` — `id`, `theme_slug` (FK), `spotify_playlist_id`, `title`,
  `why_it_fits`, `rotation_order`.
- `daily_devotions` — `date` (PK), `verse_ref`, `theme_slug` (FK),
  `reflection`, `prayer`. (Verse text fetched from the Bible API at read time;
  may be cached.)
- `profiles` — existing Supabase profile; extend with devotion state.
- `user_progress` — `user_id`, `date`, `completed_at` (drives streak).
- `favorites` — `user_id`, `date` (saved devotions).

Anonymous users keep streak/favorites in local storage until they sign in, at
which point local state migrates to their account.

## 9. UI/UX direction

**Vibe:** a quiet room, not an app — sacred, warm, unhurried; closer to a paper
devotional than a feed.

**Visual language**
- **Warm paper** canvas (`#FBFAF7`), not stark white.
- **Scripture in serif, interface in sans** — the verse is the one sacred voice
  and gets the serif + the most space; functional UI recedes in quiet sans.
- **One accent that *is* the theme** — each day's theme owns a color (Peace=teal,
  Gratitude=amber, Lament=indigo, Joy=coral). The whole screen tints to the
  day's mood; layout never changes, so the app feels familiar but never
  monotonous.

**Layout principles**
- One thing per moment; vertically centered; one primary action per screen
  (`Begin` → `Continue` → `Amen`). No bottom tab bar.
- A calm focal anchor (the theme emblem) on Arrival.
- The music card sits low and unobtrusive — the embedded Spotify iframe styled
  to sit quietly at the bottom edge.

**Motion & feel (design toward, build later)**
- Slow cross-fades between moments; a faint pulse on the theme emblem; the
  prayer screen dims everything but the text. Nothing bounces or demands
  attention — the app should feel like exhaling.

Reference mockups produced during brainstorming: Arrival + Verse detail; the
six-screen morning flow (Arrival → Verse → Reflection → Prayer → Amen →
Linger); and the four-theme tint set.

## 10. Tech stack & architecture

- **Next.js 14 App Router + TypeScript** (existing scaffold).
- **Tailwind CSS** with Koino design tokens (warm paper, serif/sans pairing,
  per-theme accent tokens).
- **Supabase** (Postgres + auth via `@supabase/ssr`) for accounts, progress,
  favorites, and devotion/theme/playlist data.
- **Bible API** for verse text (translation TBD).
- **Spotify embed** via iframe (no SDK, no OAuth).
- **PWA** for installability + web push; email reminders as fallback.

## 11. Open decisions & risks

- **Bible translation/licensing** — a public-domain translation (WEB/KJV) is
  free to display; ESV/NIV require a licensed API with display terms. Pick before
  building the verse fetch.
- **Bible API choice** — depends on the translation decision.
- **Next.js security** — current pin `next@14.2.15` has a known vulnerability;
  upgrade to a patched 14.2.x during setup.
- **Web push reliability** — iOS Safari web push requires the PWA be installed
  to the home screen; email fallback covers the gap.
- **Playlist curation labor** — building/maintaining ~12 quality playlists is
  ongoing work, owned by Gabriel under a Koino Spotify account.

## 12. Rough milestones

1. **Foundation** — upgrade Next.js, design tokens, Supabase schema (themes,
   playlists, daily_devotions, progress, favorites), seed ~12 themes.
2. **Daily experience** — Today screen flow (Arrival → Verse → Reflection →
   Prayer → Amen → Linger) with seeded flat content + embedded playlists.
3. **Habit loop** — streak, favorites, anonymous→account migration.
4. **Reminders + PWA** — installability and morning push/email.
5. **Content tooling** — admin/CMS for the calendar + AI-draft + review pipeline.
