# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a practicing Christian who wants a short, consistent daily quiet-time and is
building the habit of returning day after day. Mobile-first; typically used in a quiet moment
(often morning) on a phone, one sitting at a time. They are not looking for a study tool or a
reading plan to grind through, but for a calm, guided moment they can actually finish.

## Product Purpose

Koino is a guided daily devotion: one verse, a short reflection, a guided prayer, and a
moment to linger with music, arranged as a single calm arc a person can complete in a few
minutes. It exists so a believer can begin the day from rest rather than striving, and keep a
steady spiritual rhythm without pressure. Success is the practice sticking: the person returns
the next day, and the next, because the moment is gentle, finishable, and worth coming back to.

## Positioning

Koino meets you in a mood, not a checklist. Four things are core and must be preserved together
(no single one, in isolation, is the product):

- **Emotion / theme-first.** You come as you are. Each day is drawn from an emotional theme
  (peace, lament, joy, longing, awe, comfort, and others) rather than a sequential reading plan.
- **Music matched to the mood.** Every theme carries a curated Spotify playlist matched to its
  emotional profile. The music is part of the devotion, not decoration.
- **A short, finishable ritual.** A clear arc with a beginning and an end (arrive, verse,
  reflection, prayer, amen, linger), completable in minutes. No infinite feed.
- **Habit plus keepsakes.** Streaks, saved verses, personal notes, and shareable verse cards
  that make the practice stick and let a moment travel beyond the app.

The combination (a devotion that meets you in an emotional theme, scores it with matched music,
keeps it short and finishable, and leaves you something to keep) is the distinctive position.

## Operating Context

Used on a phone in a quiet setting, usually once per day. The guided flow lives at `/today` and
moves through a fixed arc: Arrival, Verse, Reflection, Prayer, Amen, Linger, Done. A hub (Home,
Saved, Notes, Themes, History) lets the person revisit past days, browse the themes, keep notes,
and track their streak. Music plays inline via embedded Spotify playlists. One devotion is
surfaced per calendar day.

## Capabilities and Constraints

- Twelve rotating emotional themes, each with its own curated verses and a matched Spotify
  playlist (`src/lib/themes.ts`, `src/lib/devotions/content.ts`).
- One devotion selected per calendar day; the same day is stable on repeat visits.
- Progress is tracked as streaks, completion history, saved favorites, and per-day notes.
- Persistence is browser `localStorage` (`koino.progress.v1`). The active `devotion-pivot`
  build has no account or sign-in; Supabase scaffolding exists in the repo but is not wired into
  the devotion experience. Consequence: progress is per-device and not synced across devices.
- Shareable verse cards are generated client-side (SVG rendered to PNG) for saving or sharing.
- Verse text uses the World English Bible (WEB) translation; keeping verse text accurate against
  that source is a maintained constraint.
- Music depends on external Spotify embeds, which require a network connection and Spotify's
  availability in the user's region.
- Open / undecided (do not assert as settled): whether accounts and cross-device sync return,
  and whether the curated content set expands beyond its current range.

## Brand Commitments

- Name: **Koino** (evoking *koinonia*, the Greek word for fellowship / communion). Keep the name.
- Voice: warm, calm, reverent, unhurried, and invitational. Never preachy, never aggressively
  gamified, never shaming. Scripture is given room to speak in a serif reading voice.
- Tone toward the user: gentle and non-judgmental. Missed days are shown softly, not as failure.

## Evidence on Hand

- Real curated devotion content exists in `src/lib/devotions/content.ts` (WEB verses,
  reflections, prayers) and twelve real themes with real Spotify playlist IDs in
  `src/lib/themes.ts`.
- This is a real project in active build. There is no live user base, testimonials, press, or
  usage metrics yet. Future work must not fabricate users, quotes, ratings, download counts, or
  any business claim that does not exist.

## Product Principles

1. **Rest, not striving.** The practice should calm and settle; it must never pressure or rush.
2. **Meet the person where they are.** Emotion-first, come as you are; the day adapts to the mood.
3. **Finishable, not endless.** A short arc with a real beginning and end; no feed to fall into.
4. **Gentle habit, no shame.** Encourage return without guilt; hold missed days softly.
5. **Music is part of the devotion.** Sound carries the mood; it is content, not ornament.

## Accessibility & Inclusion

Designed for calm, low-stimulation use: readable typographic contrast, motion that respects
`prefers-reduced-motion`, and language that is gentle and non-shaming toward the user's practice.
