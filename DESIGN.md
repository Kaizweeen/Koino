---
name: Koino
description: A calm daily devotion where each day is light in its own color, poured over warm paper.
colors:
  koinonia-green: "#0F6E56"
  green-mist: "#E1F5EE"
  green-reed: "#9FE1CB"
  warm-paper: "#FBFAF7"
  bone-canvas: "#EEEBE3"
  deep-umber-ink: "#262521"
  stone-ink: "#55544D"
  driftwood-ink: "#6C6A5F"
  hairline: "rgba(38,37,33,0.09)"
  prayer-night: "#1C1B18"
typography:
  display:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "clamp(2rem, 8.5vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  verse:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "clamp(1.6rem, 6.4vw, 2.15rem)"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.22em"
rounded:
  inset: "0.75rem"
  soft: "1rem"
  card: "1.25rem"
  well: "1.75rem"
  full: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.75rem"
components:
  button-primary:
    backgroundColor: "{colors.koinonia-green}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "0.875rem 1.5rem"
  button-quiet:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.deep-umber-ink}"
    rounded: "{rounded.full}"
    padding: "0.875rem 1.5rem"
  chip-theme:
    backgroundColor: "{colors.green-mist}"
    textColor: "{colors.koinonia-green}"
    rounded: "{rounded.full}"
    padding: "0.375rem 0.875rem"
  card:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.deep-umber-ink}"
    rounded: "{rounded.well}"
    padding: "1.25rem"
  input-note:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.deep-umber-ink}"
    rounded: "{rounded.soft}"
    padding: "0.875rem"
---

# Design System: Koino

## Overview

**Creative North Star: "Light through paper"**

Koino is a quiet, reverent daily devotion, and the interface is built to feel like a moment of
morning light landing on a warm sheet of paper. The whole product runs on a single idea: each
day belongs to an emotional theme, and that theme is expressed not as a label or a colored bar
but as *atmosphere*, a soft, slowly drifting glow in the day's accent color, poured behind the
words. You do not read about the mood; you sit inside it.

The system is deliberately calm and unhurried. Type does most of the expressive work: Scripture
and prayer are set in a serif reading voice, sized as genuine typographic moments, while
everything functional recedes into a clean sans. Depth is warm and gentle, never hard. Motion
behaves like breath and light, one authored moment per screen (a halo that breathes, a verse
that rises into place, a completion that blooms), never a scatter of effects. The result should
read as confident and still at the same time: bold in atmosphere and typography, reverent in
its chrome.

The one hard rejection is loudness. Koino refuses the gamified, high-contrast, notification-red
energy of most habit apps. It also refuses flat "colored card" theming, where a mood is a solid
fill; that is the anti-reference the Atmosphere layer exists to replace.

**Key Characteristics:**
- Each day is a colored atmosphere of light over warm paper, driven by one `--accent` variable.
- A serif voice for Scripture; a quiet sans for everything else.
- Warm, soft depth and a floating reading column, never harsh edges or flat fills.
- Motion as breath and light: one authored moment per screen, reduced-motion honored.
- A fixed brand green for identity chrome, a rotating accent for the day.

## Colors

A warm, low-saturation paper world lit by a single accent that changes with the day's emotional
theme. Neutrals carry the paper metaphor; one green anchors identity; the day supplies the color.

### Primary
- **Koinonia Green** (#0F6E56): The fixed brand accent, taken from the app's leaf mark. Reserved
  for identity chrome that is *not* tied to the day's theme: the active tab, the History streak
  hero, empty-state marks, and loading halos. It is Koino's constant voice underneath the
  rotating themes.
- **The Day's Accent** (dynamic, per theme): The single most important color on any given screen
  is not fixed. Each of the twelve themes (peace, gratitude, hope, lament, surrender, awe, joy,
  repentance, strength, comfort, love, longing) carries its own accent trio, defined in
  `src/lib/themes.ts` and injected at runtime as the `--accent` custom property. Every
  accent-bearing element on a devotion screen (the atmosphere glow, theme pill, primary button,
  step dots, streak) reads from that one variable. Koinonia Green is simply the accent of the
  `peace` theme promoted to brand duty.

### Neutral
- **Warm Paper** (#FBFAF7): The raised reading surface, cards, and the devotion column itself.
- **Bone Canvas** (#EEEBE3): The page base the paper column floats on; also the well behind note
  fields. A soft top-lit radial gradient over this canvas gives the page its ambient warmth.
- **Deep Umber Ink** (#262521): Primary text and Scripture. Warm near-black, never pure `#000`.
- **Stone Ink** (#55544D): Secondary and reflection body text on paper (7.3:1 on Warm Paper).
- **Driftwood Ink** (#6C6A5F): Muted micro-labels, dates, metadata (5.2:1 on Warm Paper).
- **Hairline** (rgba(38,37,33,0.09)): The only border weight. 1px, warm, barely there.

### Supporting (theme-derived, fixed instances)
- **Green Mist** (#E1F5EE) / **Green Reed** (#9FE1CB): Koinonia Green's soft fill and border,
  used for brand halos, streak chips, and empty-state wells. Each theme has its own equivalents.
- **Prayer Night** (#1C1B18): The single dark surface in the product, the Prayer screen, over
  which the accent glows brightest.

### Named Rules
**The Day's Light Rule.** One screen, one accent. Every themed element keys off a single
`--accent`; you never mix two theme accents on the same screen, and you never restyle a themed
element to a static hex. Change the day, and the whole screen re-lights from one variable.

**The Tint-Not-Gray Rule.** Secondary text on any colored (accent-tinted) surface is mixed from
that hue toward ink (`color-mix(in srgb, var(--accent) 40%, var(--ink))`), never flat gray. Gray
secondary text is only for the neutral paper surface.

## Typography

**Display / Reading Font:** Lora (with Georgia, serif) — carries all Scripture, prayer,
greetings, page titles, and saved notes.
**Body / Interface Font:** Inter (with system-ui, sans-serif) — carries reflection prose,
controls, metadata, and every micro-label.

**Character:** A humanist serif with warmth and a literary calm, paired with a neutral,
unfussy grotesque. The serif is the voice of the sacred text; the sans is the voice of the app.
The contrast between them is the point: the words you meditate on look and feel different from
the interface around them.

### Hierarchy
- **Display** (Lora 500, clamp(2rem, 8.5vw, 2.75rem), lh 1.12, -0.02em): The arrival greeting
  ("Good morning"). A single serif moment that opens the day.
- **Headline** (Lora 500, 1.875rem/30px, lh 1.15): Hub page titles ("Saved", "Notes", "Themes",
  "Your history").
- **Verse** (Lora 500, clamp(1.6rem, 6.4vw, 2.15rem), lh 1.4, -0.01em): The Scripture itself,
  centered and balanced, held to a ~19rem measure. The luminous center of the flow.
- **Title** (Lora 500, 1.125rem/18px, lh 1.3): Card and theme-tile headings, the "Amen." mark.
- **Body** (Inter 400, 0.9375rem/15px, lh 1.75): Reflection prose, notes, definitions. Set at a
  generous leading and a ~20rem measure for calm reading.
- **Label** (Inter 500, 0.6875rem/11px, 0.22em tracking, UPPERCASE): Dates, section headers,
  and kickers. The recurring quiet metadata voice.

### Named Rules
**The Serif-for-Scripture Rule.** Lora is reserved for the words that carry weight: the verse,
the prayer, the greeting, page titles, the "Amen.", and the user's own saved notes. Inter carries
everything that is interface. If it is God's word or the user's response, it is serif; if it is
chrome, it is sans.

## Layout

Mobile-first, single-column, always. The app lives in a `max-w-sm` (24rem) column that floats on
the Bone Canvas with a soft drop shadow, reading like a phone-sized sheet even on desktop. There
is no multi-column or grid layout anywhere; width is a constraint, not a canvas.

**Devotion flow** screens (`/today`) are full-height flex arcs: a light header row, the content
optically centered with `my-auto`, and the primary action pinned to the bottom of the viewport.
Screen padding is generous (`px-7` / 1.75rem horizontal). Each step is its own full screen; you
move through them one at a time, never scrolling a long page.

**Hub** surfaces scroll vertically under a sticky bottom tab bar, with `p-5` (1.25rem) padding
and a consistent `gap-6`/`gap-7` (1.5–1.75rem) rhythm between sections. Section headers use the
uppercase Label style; content sits in soft cards or inline lists. The tab bar respects the
device safe-area inset.

Spacing follows a tight-groups / generous-separation rhythm: related items sit close (0.5–0.75rem),
distinct sections breathe (1.5–1.75rem), and headings carry more space above than below.

## Elevation & Depth

Depth is warm and quiet, and it comes from two sources: soft ink-tinted shadows, and *light*.
The signature depth device is not a shadow at all but the Atmosphere layer, a drifting radial
glow in the day's accent that sits behind content and gives every screen an ambient sense of
space. Shadows are always offset with a soft blur; there are no hard, zero-blur, or purely
decorative shadows anywhere.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(38,37,33,0.04), 0 14px 30px -14px rgba(38,37,33,0.14)`):
  The default resting elevation for cards, tiles, and the floating back button.
- **Lift** (`box-shadow: 0 2px 6px rgba(38,37,33,0.06), 0 26px 50px -18px rgba(38,37,33,0.22)`):
  A higher elevation for prominent or hovered surfaces.
- **Column** (`box-shadow: 0 1px 3px rgba(38,37,33,0.05), 0 30px 60px -30px rgba(38,37,33,0.24)`):
  The single large, soft shadow that lets the whole reading column float on the canvas.
- **Accent glow** (on primary buttons): a two-layer shadow mixed from the current `--accent`
  (`0 1px 2px, 0 14px 26px -12px`, both `color-mix`ed toward the accent). The CTA looks lit from
  within by the day's color.

### Named Rules
**The Warm-Depth Rule.** Every shadow is ink-tinted (toward #262521), offset, and soft-blurred.
Primary actions additionally carry an accent-tinted glow. No hard shadows, no zero-blur blocks,
no gray-black drop shadows.

**The Atmosphere-Not-Fill Rule.** A theme's presence on screen is light (the drifting Atmosphere
glow), never a flat colored background block. When a surface needs the theme color as a fill
(hero card, theme tile), it uses the soft accent tint plus a faint corner glow, not a saturated
slab.

## Shapes

Soft, rounded, and pill-forward. The form language moves between three shapes: **pills** for all
actions and status (`rounded-full` — buttons, theme chips, streak badges, step dots), **soft
wells** for content (cards and articles at `1.75rem`, standard cards at `1.25rem`, insets and
inputs at `0.75–1rem`), and **circles** for the breathing motifs (the arrival halo, completion
marks, the loading orb). Borders are always a single 1px Hairline; the system never uses heavy or
colored borders as structure. Corners are never sharp.

## Components

### Buttons
- **Shape:** Fully pill (`rounded-full`, 9999px), typically full-width in the flow.
- **Primary:** The day's accent fill with white text and the accent glow shadow; used for the
  one decisive action per screen ("Begin", "Begin today's devotion"). Hover lifts 1px and deepens
  the glow; active settles back with a subtle scale.
- **Quiet:** Warm Paper fill, ink text, 1px Hairline border, faint accent wash; used for
  secondary actions ("Read it again", empty-state links). Hover warms the border toward the accent.
- **Advance affordance:** In the flow, "Continue"/"Linger a while" is a borderless accent text
  button with an arrow that nudges right on hover, not a filled button. The forward motion is
  quiet, not demanding.

### Chips
- **Style:** Theme pills use the theme's soft tint background with the accent as text/icon color
  (`chip-theme`). Always paired with the theme's Tabler icon.
- **State:** Non-interactive status (theme label, streak) and navigational (Explore themes) share
  the same pill; there is no selected/unselected toggle state.

### Cards / Containers
- **Corner Style:** Soft wells (`1.75rem`) for primary content cards and hub articles; `1.25rem`
  for the note field container.
- **Background:** Warm Paper for neutral cards; the theme's soft accent tint for hero/today and
  theme tiles, with a faint radial corner glow.
- **Shadow Strategy:** Card elevation at rest (see Elevation). Themed hero cards may omit shadow
  in favor of the accent tint + glow.
- **Border:** 1px Hairline on neutral cards; the theme's accent border on tinted cards.
- **Internal Padding:** 1.25rem (`p-5`) to 1.5rem (`p-6`).

### Inputs / Fields
- **Style:** Warm Paper or faint-canvas fill, 1px Hairline border, `1rem` radius, serif text
  (notes are the user's own words, so they get the Scripture voice).
- **Focus:** The Hairline border shifts to the live `--accent` color; no heavy glow ring. Focus
  is a warm border shift, not an outline block.

### Navigation
- **Style:** A sticky bottom tab bar over a translucent Warm Paper backdrop with blur and a 1px
  Hairline top edge. Four tabs, icon over a tiny uppercase label.
- **States:** Inactive tabs are Driftwood Ink; the active tab is Koinonia Green with a short
  rounded brand-green indicator bar at the top edge. Active state is the one place brand green
  overrides the day's accent, because navigation is identity, not content.

### The Atmosphere (signature component)
A pointer-events-none layer (`src/components/Atmosphere.tsx`) rendered behind every devotion
screen and the home hub. It paints two soft radial glows from the current `--accent` that drift
and breathe on a 15–19s loop, self-clipping to its container. A `night` tone raises the glow
intensity for the dark Prayer screen. This is the mechanism that turns "theme" from a label into
a felt atmosphere; it is the most Koino thing in the system.

## Do's and Don'ts

### Do:
- **Do** drive every themed element from the single `--accent` variable, set per screen from
  `theme.accent`, so a whole surface re-lights when the day changes (The Day's Light Rule).
- **Do** set Scripture, prayer, greetings, page titles, and user notes in Lora; keep Inter for
  all interface text (The Serif-for-Scripture Rule).
- **Do** express a theme as atmosphere (the drifting glow) plus soft tint, not a flat colored
  block (The Atmosphere-Not-Fill Rule).
- **Do** tint secondary text on colored surfaces from the hue toward ink, never gray
  (The Tint-Not-Gray Rule).
- **Do** keep depth warm and soft: offset + blur shadows, accent-glow on primary CTAs, the
  floating column shadow (The Warm-Depth Rule).
- **Do** give each screen exactly one authored motion moment (breathe, rise, or bloom) and honor
  `prefers-reduced-motion`.
- **Do** reserve Koinonia Green (#0F6E56) for identity chrome (active tab, History, brand marks),
  not for a devotion screen's themed accents.

### Don't:
- **Don't** mix two theme accents on one screen, or hardcode a themed element to a static hex.
- **Don't** use flat, saturated colored fills as a stand-in for theming.
- **Don't** use gray for secondary text on an accent-tinted surface.
- **Don't** introduce hard or zero-blur shadows, or a colored `border-left` heavier than 1px, as
  structure.
- **Don't** add a new font or a new radius/shadow primitive; the paper world is complete as
  defined here.
- **Don't** raise the volume: no gamified reds, urgency badges, or shame-based "missed" states.
  Missed days are shown softly.
