# Design: Full in-app Spotify playback + real worship songs

Date: 2026-08-04
Status: Approved for planning

## Summary

Today Koino plays theme music through a lightweight Spotify **iframe embed**
(`SpotifyEmbed`), and each theme points at an ambient/instrumental/generic-mood
playlist. This design adds **full in-app playback** via Spotify's Web Playback
SDK (a custom, persistent, on-brand player), keeps the **embed as a graceful
fallback**, and replaces the theme music with **actual worship songs** matched to
each theme's emotional tone.

The custom player only functions for listeners who **connect Spotify and have
Premium** (an SDK hard requirement). Everyone else (logged out, or free tier)
keeps the working embed. Music never disappears.

## Decisions (from brainstorming)

- **Model:** optional "Connect Spotify". Premium + connected gets the custom
  player; everyone else keeps the embed. Preserves the no-signup default.
- **Premium reality:** the project owner does not currently have Premium, so full
  playback cannot be tested end to end yet. The connect flow, `connected-free`
  upsell, token refresh, error states, embed fallback, and the pure auth helpers
  are all testable now; live full-track playback is verifiable only with Premium.
- **Player placement:** one **app-level** player instance with a small persistent
  mini-player, so music plays continuously across the devotion arc.
- **Music content:** real, **mood-matched worship playlists** for all 12 themes,
  curated by research, approved by the owner, and verified live. No invented IDs.
- **Storage:** httpOnly cookies + Next.js route handlers. No database (the repo's
  Supabase deps stay unused).

## Architecture

### 1. Auth and tokens (server, no DB)

Four route handlers under `src/app/api/spotify/`:

- **`login/route.ts`** (`GET`): generate a random `state`, store it in a
  short-lived httpOnly cookie (CSRF), and redirect to Spotify's authorize
  endpoint with `client_id`, `redirect_uri`, `response_type=code`, and scopes:
  `streaming user-read-email user-read-private user-read-playback-state
  user-modify-playback-state`.
- **`callback/route.ts`** (`GET`): verify `state` against the cookie, exchange
  `code` for tokens (`POST https://accounts.spotify.com/api/token`, Basic auth
  with client id + **secret**, server-only). Store the **refresh token** in an
  httpOnly, `Secure`, `SameSite=Lax` cookie (`koino.sp.rt`). Redirect back to the
  return path (default `/app/today`).
- **`token/route.ts`** (`GET`): read the refresh-token cookie. If absent, return
  `{ status: "disconnected" }`. Otherwise refresh (`grant_type=refresh_token`),
  and return `{ access_token, expires_at }`. The refresh token never reaches the
  browser; the client only ever holds short-lived access tokens.
- **`logout/route.ts`** (`POST`): clear the cookies.

Pure, unit-testable helpers in `src/lib/spotify/`:

- `auth.ts` — `buildAuthorizeUrl()`, `exchangeCode()`, `refreshToken()`,
  `SCOPES`, cookie name constants.
- `api.ts` — thin typed `fetch` wrappers: `getMe(token)` (reads `product` for
  Premium), `startPlaylist(token, deviceId, playlistId)`
  (`PUT /me/player/play` with `context_uri`), `getPlaylist(token, id)`
  (used for verification + cover art).

### 2. Player provider (client, app-level)

`src/components/spotify/SpotifyProvider.tsx` (`"use client"`), mounted once in
`src/app/layout.tsx` so it survives route changes (a single SDK device).

Lifecycle:

1. On mount, call `/api/spotify/token`. No token cookie -> `status:
   "disconnected"`.
2. With a token, `getMe()`. `product !== "premium"` -> `status:
   "connected-free"` (cannot use the SDK).
3. Premium -> inject `https://sdk.scdn.co/spotify-player.js`, create one
   `Spotify.Player` whose `getOAuthToken` callback fetches `/api/spotify/token`
   (auto-refreshing). On `ready` (device_id received) -> `status: "ready"`.

Context value:
`{ status, track, isPlaying, position, duration, play(playlistId), toggle(),
next(), prev(), seek(ms), connect(), disconnect() }`.
`connect()` navigates to `/api/spotify/login`; `disconnect()` POSTs
`/api/spotify/logout` and tears down the player.

Status enum: `disconnected | connecting | connected-free | ready | error`.

### 3. UI components

- **`MiniPlayer.tsx`**: a small, calm, day-accent-themed bar pinned to the bottom
  of the viewport (above the mobile `TabBar`; full-width beneath the content on
  desktop). Cover art, title/artist, play-pause, next, a thin progress line.
  Rendered only when `status === "ready"` and a track is loaded. Honors
  `prefers-reduced-motion`.
- **`MusicPanel.tsx`**: replaces `SpotifyEmbed` usage on Scripture + Linger.
  - `ready` -> "Play the {theme} playlist" button (calls `play(themePlaylistId)`),
    or a "Now playing" line if already playing.
  - `connected-free` -> gentle "Full playback needs Spotify Premium" note, with
    the embed below so music still works.
  - `disconnected` -> "Connect Spotify for full playback" (calls `connect()`),
    with the embed below.
  - `SpotifyEmbed` is retained and used as the fallback surface.
- **Settings** (`SettingsView.tsx`): a "Music" section with Connect / Disconnect
  and live status (Connected as Premium / Connected, free tier / Not connected).

### 4. Playback

`play(playlistId)` resolves the day's theme playlist via `getPlaylistId(theme,
date)` and starts it as the playback **context** on the web-player device
(`startPlaylist`). `toggle/next/prev/seek` use the SDK player methods. Playback
persists across steps because the provider is above the pages. Client-side
playback commands use the short-lived access token directly against
`api.spotify.com`; no per-command server proxy.

### 5. Music content: worship songs

- Replace every theme's `playlistIds` in `src/lib/themes.ts` with a real,
  mood-matched **worship** playlist, and rewrite each `moodProfile` to describe a
  worship-song style (e.g. Peace -> peaceful/ambient worship, Lament -> songs of
  sorrow and honesty, Joy -> celebratory praise, Awe -> big anthemic worship).
- Sourcing is a bounded sub-task: research live candidates, present all 12 to the
  owner for approval, then wire in only approved IDs.
- Verification: add `scripts/verify-playlists.mjs` (mirrors
  `scripts/verify-verses.mjs`) that resolves every theme playlist via the Spotify
  API using client-credentials, failing loudly if any ID is dead. This keeps
  playlists honest the way verse text is kept honest.
- Benefits both paths: the custom player and the embed fallback both play worship
  songs.

## Data flow

**Connect:** user clicks Connect -> `/api/spotify/login` -> Spotify consent ->
`/api/spotify/callback` (code -> tokens, set refresh cookie) -> redirect back ->
provider re-checks `/api/spotify/token` + `getMe` -> `ready` or `connected-free`.

**Refresh:** provider / SDK requests a token -> `/api/spotify/token` refreshes
server-side using the cookie -> returns a fresh short-lived access token.

**Play:** the listener presses Play in `MusicPanel` -> `play(themePlaylistId)` ->
`startPlaylist` on the web device -> `player_state_changed` updates
`{ track, isPlaying, position }` -> `MiniPlayer` reflects it. Playback is always
user-initiated (browser autoplay policy needs a gesture, and it suits the calm
tone), matching the current embed's click-to-play behavior.

## Error and edge states

- No token cookie -> `disconnected` (embed shown).
- Premium check fails / free tier -> `connected-free` (embed shown, upsell note).
- Token refresh fails (revoked / expired refresh token) -> clear cookies, drop to
  `disconnected`, show a calm "reconnect" message.
- SDK script load fails or `initialization_error` / `account_error` /
  `authentication_error` -> `error`, fall back to embed.
- `play` with no active device / 404 -> re-assert the web device, retry once, else
  a soft toast; never a crash.
- CSRF: `state` mismatch on callback -> reject and return to app without linking.

## Setup (owner-only, cannot be automated)

- Register a Spotify app at the Developer Dashboard -> Client ID + Client Secret.
- Add the owner's Spotify account email to the app's **user allowlist**
  (development-mode apps only serve allowlisted users until quota-extended).
- Redirect URIs: dev `http://127.0.0.1:4620/api/spotify/callback` (Spotify rejects
  `localhost`; OAuth must run at `127.0.0.1:4620`), prod
  `https://<domain>/api/spotify/callback`.
- Env (server-only, git-ignored; add a `.env.local.example`):
  `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`.
- Deployment: on Vercel, set the same env vars and register the prod redirect URI.

## Testing

- **Vitest (now):** `lib/spotify/auth.ts` (authorize URL shape, scope string,
  token exchange/refresh request bodies) and `api.ts` with `fetch` mocked;
  `MusicPanel` rendering per status (`disconnected` / `connected-free` show the
  embed + correct affordance); `themes.ts` still passes existing invariants after
  the playlist swap.
- **Manual (now, no Premium):** connect flow end to end, callback, the
  `connected-free` upsell, disconnect, embed fallback, error states.
- **Deferred (needs Premium):** live full-track playback, the `ready` MiniPlayer,
  play/pause/next/seek, cross-step continuity.
- Keep the copy/DOM contracts the existing suite guards (greeting, streak,
  "Begin today's devotion", SOAP labels) unchanged.

## File inventory

New:
- `src/app/api/spotify/{login,callback,token,logout}/route.ts`
- `src/lib/spotify/{auth.ts,api.ts}` (+ tests)
- `src/components/spotify/{SpotifyProvider.tsx,MiniPlayer.tsx,MusicPanel.tsx}`
- `scripts/verify-playlists.mjs`
- `.env.local.example`

Changed:
- `src/app/layout.tsx` (mount `SpotifyProvider`, host `MiniPlayer`)
- `src/components/screens/{Scripture.tsx,Linger.tsx}` (use `MusicPanel`)
- `src/components/SettingsView.tsx` (Music / Connect section)
- `src/lib/themes.ts` (worship `playlistIds` + `moodProfile` rewrite)
- `README.md` (Spotify setup section)

Retained:
- `src/components/SpotifyEmbed.tsx` (now the fallback surface)

## Out of scope (future)

- Cross-device token sync / user accounts (no DB by design).
- Lyrics, queue management, offline.
- Non-Spotify providers.
- Requesting Spotify "extended quota" (removes the 25-user allowlist cap) — a
  later step if Koino ships publicly.
