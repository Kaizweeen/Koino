# Koino

A calm daily devotion. One Scripture a day, then you write your Observation,
Application, and Prayer — a short arc you can actually finish, on a phone, in a
quiet moment.

See [PRODUCT.md](PRODUCT.md) for what Koino is and what it commits to, and
[DESIGN.md](DESIGN.md) for the visual system.

## Stack

- Next.js 14 (App Router) + TypeScript, fully statically rendered
- Tailwind CSS, with the Koino design tokens in `tailwind.config.ts`
- Vitest + Testing Library
- No backend, no accounts, no analytics, no third-party runtime requests

Everything a person writes stays in their own browser (`localStorage`), which is
the privacy position and also the main constraint: progress is per-device, and
the Settings screen offers an export/import file so it can be moved or backed up.

## Getting started

```bash
npm ci
npm run dev
```

Open http://localhost:3000 for the landing page, or
http://localhost:3000/app for the app itself.

## Scripts

| Command                 | What it does                                      |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Dev server                                        |
| `npm run build`         | Production build                                  |
| `npm start`             | Serve the production build                        |
| `npm run lint`          | ESLint                                            |
| `npm run typecheck`     | `tsc --noEmit`                                    |
| `npm test`              | Vitest, once                                      |
| `npm run test:watch`    | Vitest, watching                                  |
| `npm run verify:verses` | Check every verse against the WEB translation     |

CI runs lint, typecheck, test, and build on every pull request. Verse
verification runs weekly on its own schedule, because it calls a live Bible API
and an outage there should never block a merge.

## Deploying

The app builds to fully static output and needs no runtime services.

Set one environment variable:

```
NEXT_PUBLIC_SITE_URL=https://your-domain
```

It is the canonical origin used for `metadataBase`, `robots.txt`, and
`sitemap.xml`. Without it those fall back to `http://localhost:3000`, which
would publish wrong link previews and a wrong sitemap — so set it before going
live. Security headers and the Content-Security-Policy are defined in
`next.config.mjs`; a host that strips or overrides response headers will need
them configured there instead.

## Layout

```
src/
  app/
    page.tsx                marketing landing (a walkthrough of the real screens)
    app/                    the app itself
      page.tsx              hub: today, plans, themes
      today/                the guided SOAP devotion
      journal/  history/  themes/  settings/  plans/[slug]/
    layout.tsx              fonts, metadata, theme bootstrap
    manifest.ts  robots.ts  sitemap.ts
    error.tsx  global-error.tsx  not-found.tsx
  components/
    DevotionFlow.tsx        the devotion arc
    screens/                Arrival, Scripture, SOAP steps, Amen, Linger, Done
    Icon.tsx                self-hosted inline SVG icon set
    ...
  lib/
    devotions/content.ts    the curated devotions (WEB verse text)
    themes.ts  plans.ts     twelve emotional themes; curated series over them
    progress.ts  prefs.ts   what a person writes, and their settings
    storage.ts              localStorage that cannot throw
    backup.ts               export / import of a person's journal
    shareCard.ts            the shareable verse card (SVG rendered to PNG)
public/
  sw.js                     offline service worker
  icon-*.png / *.svg        app + install icons
  opengraph-image.png       link preview card
```

## Content

Devotions live in `src/lib/devotions/content.ts`: a date, a verse, its theme, a
reflection, and a prayer. Verse text is the World English Bible (WEB), and
keeping it accurate is a maintained constraint — run `npm run verify:verses`
after touching any verse.

The curated calendar currently covers a fixed range of dates. Past its end, the
day's devotion rotates deterministically through the whole pool by day index, so
the app never runs out; the practical effect is that the set repeats once a
person gets past it. Adding devotions is the way to lengthen that cycle.

## Credits

Icon geometry is from [Tabler Icons](https://tabler.io/icons) (MIT), extracted
into `src/components/Icon.tsx` so the app carries only the glyphs it draws and
depends on no icon CDN.
