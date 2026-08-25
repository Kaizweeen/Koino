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
| `npm run dev`            | Dev server                                       |
| `npm run build`          | Production build (web)                           |
| `npm run build:native`   | Static export into `out/` for the iOS shell      |
| `npm start`              | Serve the production build                       |
| `npm run lint`           | ESLint                                           |
| `npm run typecheck`      | `tsc --noEmit`                                   |
| `npm test`               | Vitest, once                                     |
| `npm run test:watch`     | Vitest, watching                                 |
| `npm run verify:verses`  | Check every verse against the WEB translation    |
| `npm run generate:splash`| Regenerate the iOS launch images                 |

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

## On an iPhone

### Home Screen install (no App Store)

Koino is a full PWA, so it installs straight from the web with no developer
account and no review:

1. Deploy, and open the site in **Safari** on the iPhone (Chrome on iOS cannot
   install to the Home Screen).
2. Share → **Add to Home Screen**.

It then launches full screen with its own icon and launch image, works with no
signal, and keeps everything on the device. Two things to know: **the site must
be served over HTTPS** or iOS will not install it, and because the practice
lives in `localStorage`, deleting the app clears it — the Settings screen has an
export/import file for moving or backing it up.

`/app` is the whole installed app: the manifest scopes it there, so the
marketing page at `/` opens in Safari rather than inside the installed window.

### App Store

The same codebase ships to the App Store wrapped in Capacitor. `npm run
build:native` produces the static bundle it loads (`out/`), and
`capacitor.config.json` is already written. The rest needs **a Mac with Xcode**
and an **Apple Developer membership ($99/yr)**:

```bash
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/ios
npm run build:native
npx cap add ios          # once; creates the (untracked) ios/ project
npx cap sync ios         # after every build:native
npx cap open ios         # opens Xcode to sign, archive, and upload
```

In Xcode: set the team and bundle identifier (`app.koino.devotion`), then
Product → Archive → Distribute.

Notes before submitting:

- Apple rejects thin website wrappers under **guideline 4.2 (minimum
  functionality)**. Koino has a real case — it works fully offline and stores
  nothing on a server — and leaning on native behaviour it cannot get on the
  web (notifications for the daily reminder, the native share sheet for verse
  cards) makes that case stronger.
- The App Store listing needs a privacy policy URL. Koino collects nothing and
  transmits nothing, but the page still has to exist.
- `npm run build` (not `build:native`) remains the web build. Static export has
  no server, so the security headers in `next.config.mjs` are silently dropped
  there; that is fine inside the native shell, which loads local files, but the
  web deploy needs the real build to keep them.

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
