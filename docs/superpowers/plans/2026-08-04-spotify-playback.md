# Spotify Playback + Worship Songs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full in-app Spotify playback (Web Playback SDK, persistent app-level player) with the existing embed as a graceful fallback, and replace theme music with real per-theme worship playlists.

**Architecture:** Server-side OAuth (Authorization Code) via four Next.js route handlers that keep the refresh token in an httpOnly cookie and hand the client short-lived access tokens; a single app-level `SpotifyProvider` owns the SDK device so playback survives navigation; `MusicPanel` and `MiniPlayer` render per connection/Premium status, degrading to `SpotifyEmbed` when the SDK cannot run.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, Vitest + @testing-library/react (jsdom), Spotify Web API + Web Playback SDK.

## Global Constraints

- Next.js 14 App Router + TypeScript; Tailwind with existing tokens only (no new fonts/radii/shadows; see `DESIGN.md`).
- No database. Tokens live in httpOnly cookies (`koino.sp.rt`, `koino.sp.state`). Supabase deps stay unused.
- Secrets are server-only: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`. Never `NEXT_PUBLIC_*`, never in client code.
- Scopes (exact): `streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state`.
- Cookie flags: `httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production"`.
- Music never disappears: any non-`ready` state must still surface the `SpotifyEmbed`.
- Do NOT invent Spotify IDs. Every playlist ID must be verified live before it lands in `themes.ts`.
- Keep existing copy/DOM contracts stable (greeting, streak, "Begin today's devotion", `SOAP step N of 4`, SOAP field labels). Run `npm test` (93 tests) green after each task.
- Playback itself needs Premium and cannot be verified in this environment; those steps are manual and marked "requires Premium".

---

### Task 1: Spotify auth helpers

**Files:**
- Create: `src/lib/spotify/auth.ts`
- Test: `src/lib/spotify/auth.test.ts`

**Interfaces:**
- Produces:
  - `SCOPES: string`
  - `RT_COOKIE = "koino.sp.rt"`, `STATE_COOKIE = "koino.sp.state"`
  - `spotifyEnv(): { clientId: string; clientSecret: string; redirectUri: string }` (throws if any missing)
  - `buildAuthorizeUrl(opts: { clientId: string; redirectUri: string; state: string }): string`
  - `interface TokenResponse { access_token: string; token_type: string; expires_in: number; refresh_token?: string; scope?: string }`
  - `exchangeCode(opts: { clientId; clientSecret; redirectUri; code; fetchFn?: typeof fetch }): Promise<TokenResponse>`
  - `refreshToken(opts: { clientId; clientSecret; refreshToken; fetchFn?: typeof fetch }): Promise<TokenResponse>`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/spotify/auth.test.ts
import { describe, it, expect, vi } from "vitest";
import { buildAuthorizeUrl, exchangeCode, refreshToken, SCOPES } from "@/lib/spotify/auth";

describe("buildAuthorizeUrl", () => {
  it("includes code flow, client id, redirect, scopes and state", () => {
    const url = new URL(buildAuthorizeUrl({ clientId: "cid", redirectUri: "http://127.0.0.1:4620/api/spotify/callback", state: "st8" }));
    expect(url.origin + url.pathname).toBe("https://accounts.spotify.com/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("cid");
    expect(url.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:4620/api/spotify/callback");
    expect(url.searchParams.get("state")).toBe("st8");
    expect(url.searchParams.get("scope")).toBe(SCOPES);
  });
});

describe("exchangeCode", () => {
  it("posts an authorization_code grant with basic auth", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: "a", token_type: "Bearer", expires_in: 3600, refresh_token: "r" }), { status: 200 }));
    const out = await exchangeCode({ clientId: "cid", clientSecret: "sec", redirectUri: "http://127.0.0.1:4620/api/spotify/callback", code: "abc", fetchFn });
    expect(out.access_token).toBe("a");
    const [urlArg, init] = fetchFn.mock.calls[0];
    expect(urlArg).toBe("https://accounts.spotify.com/api/token");
    expect(init.headers.Authorization).toBe("Basic " + Buffer.from("cid:sec").toString("base64"));
    const body = new URLSearchParams(init.body as string);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("abc");
  });
});

describe("refreshToken", () => {
  it("posts a refresh_token grant", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: "a2", token_type: "Bearer", expires_in: 3600 }), { status: 200 }));
    const out = await refreshToken({ clientId: "cid", clientSecret: "sec", refreshToken: "r", fetchFn });
    expect(out.access_token).toBe("a2");
    const body = new URLSearchParams(fetchFn.mock.calls[0][1].body as string);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("r");
  });
  it("throws on non-ok", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("no", { status: 400 }));
    await expect(refreshToken({ clientId: "c", clientSecret: "s", refreshToken: "r", fetchFn })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/spotify/auth.test.ts`
Expected: FAIL ("Cannot find module '@/lib/spotify/auth'").

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/spotify/auth.ts
export const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

export const RT_COOKIE = "koino.sp.rt";
export const STATE_COOKIE = "koino.sp.state";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export function spotifyEnv() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REDIRECT_URI");
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthorizeUrl(opts: { clientId: string; redirectUri: string; state: string }): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: opts.clientId,
    scope: SCOPES,
    redirect_uri: opts.redirectUri,
    state: opts.state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function basicAuth(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function postToken(init: { clientId: string; clientSecret: string; body: URLSearchParams; fetchFn: typeof fetch }): Promise<TokenResponse> {
  const res = await init.fetchFn(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(init.clientId, init.clientSecret),
    },
    body: init.body,
  });
  if (!res.ok) throw new Error(`spotify token request failed: ${res.status}`);
  return (await res.json()) as TokenResponse;
}

export async function exchangeCode(opts: { clientId: string; clientSecret: string; redirectUri: string; code: string; fetchFn?: typeof fetch }): Promise<TokenResponse> {
  return postToken({
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    fetchFn: opts.fetchFn ?? fetch,
    body: new URLSearchParams({ grant_type: "authorization_code", code: opts.code, redirect_uri: opts.redirectUri }),
  });
}

export async function refreshToken(opts: { clientId: string; clientSecret: string; refreshToken: string; fetchFn?: typeof fetch }): Promise<TokenResponse> {
  return postToken({
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    fetchFn: opts.fetchFn ?? fetch,
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: opts.refreshToken }),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/spotify/auth.test.ts`
Expected: PASS (5 assertions across 4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/spotify/auth.ts src/lib/spotify/auth.test.ts
git commit -m "feat(spotify): auth helpers (authorize url, token exchange/refresh)"
```

---

### Task 2: Spotify Web API helpers

**Files:**
- Create: `src/lib/spotify/api.ts`
- Test: `src/lib/spotify/api.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `interface SpotifyProfile { id: string; display_name: string | null; product: string; email?: string }`
  - `getMe(accessToken: string, fetchFn?: typeof fetch): Promise<SpotifyProfile>`
  - `isPremium(profile: SpotifyProfile): boolean`
  - `startPlaylist(opts: { accessToken: string; deviceId: string; playlistId: string; fetchFn?: typeof fetch }): Promise<void>`
  - `interface PlaylistMeta { id: string; name: string; images: { url: string }[] }`
  - `getPlaylist(accessToken: string, playlistId: string, fetchFn?: typeof fetch): Promise<PlaylistMeta>`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/spotify/api.test.ts
import { describe, it, expect, vi } from "vitest";
import { getMe, isPremium, startPlaylist, getPlaylist } from "@/lib/spotify/api";

describe("getMe / isPremium", () => {
  it("reads the profile and detects premium", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "u1", display_name: "Kai", product: "premium" }), { status: 200 }));
    const me = await getMe("tok", fetchFn);
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
    expect(isPremium(me)).toBe(true);
    expect(isPremium({ ...me, product: "free" })).toBe(false);
  });
});

describe("startPlaylist", () => {
  it("PUTs a playlist context to the given device", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await startPlaylist({ accessToken: "tok", deviceId: "dev1", playlistId: "pl1", fetchFn });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.spotify.com/v1/me/player/play?device_id=dev1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ context_uri: "spotify:playlist:pl1" });
  });
});

describe("getPlaylist", () => {
  it("fetches id/name/images and throws on 404", async () => {
    const ok = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "pl1", name: "Peaceful Worship", images: [{ url: "x" }] }), { status: 200 }));
    expect((await getPlaylist("tok", "pl1", ok)).name).toBe("Peaceful Worship");
    const bad = vi.fn().mockResolvedValue(new Response("nope", { status: 404 }));
    await expect(getPlaylist("tok", "dead", bad)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/spotify/api.test.ts`
Expected: FAIL ("Cannot find module '@/lib/spotify/api'").

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/spotify/api.ts
const API = "https://api.spotify.com/v1";

export interface SpotifyProfile {
  id: string;
  display_name: string | null;
  product: string;
  email?: string;
}

export interface PlaylistMeta {
  id: string;
  name: string;
  images: { url: string }[];
}

function auth(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getMe(accessToken: string, fetchFn: typeof fetch = fetch): Promise<SpotifyProfile> {
  const res = await fetchFn(`${API}/me`, { headers: auth(accessToken) });
  if (!res.ok) throw new Error(`spotify /me failed: ${res.status}`);
  return (await res.json()) as SpotifyProfile;
}

export function isPremium(profile: SpotifyProfile): boolean {
  return profile.product === "premium";
}

export async function startPlaylist(opts: { accessToken: string; deviceId: string; playlistId: string; fetchFn?: typeof fetch }): Promise<void> {
  const fetchFn = opts.fetchFn ?? fetch;
  const res = await fetchFn(`${API}/me/player/play?device_id=${encodeURIComponent(opts.deviceId)}`, {
    method: "PUT",
    headers: { ...auth(opts.accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ context_uri: `spotify:playlist:${opts.playlistId}` }),
  });
  if (!res.ok && res.status !== 204) throw new Error(`spotify play failed: ${res.status}`);
}

export async function getPlaylist(accessToken: string, playlistId: string, fetchFn: typeof fetch = fetch): Promise<PlaylistMeta> {
  const res = await fetchFn(`${API}/playlists/${playlistId}?fields=id,name,images`, { headers: auth(accessToken) });
  if (!res.ok) throw new Error(`spotify playlist ${playlistId} failed: ${res.status}`);
  return (await res.json()) as PlaylistMeta;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/spotify/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/spotify/api.ts src/lib/spotify/api.test.ts
git commit -m "feat(spotify): web api helpers (me, premium, play, playlist)"
```

---

### Task 3: OAuth route handlers

**Files:**
- Create: `src/app/api/spotify/login/route.ts`
- Create: `src/app/api/spotify/callback/route.ts`
- Create: `src/app/api/spotify/token/route.ts`
- Create: `src/app/api/spotify/logout/route.ts`

**Interfaces:**
- Consumes (Task 1): `buildAuthorizeUrl`, `exchangeCode`, `refreshToken`, `spotifyEnv`, `RT_COOKIE`, `STATE_COOKIE`.
- Produces (HTTP contract for Task 4):
  - `GET /api/spotify/login` -> 302 to Spotify.
  - `GET /api/spotify/callback?code&state` -> 302 to `/app/today?spotify=connected|error`.
  - `GET /api/spotify/token` -> JSON `{ status: "disconnected" }` or `{ status: "connected", access_token: string, expires_at: number }`.
  - `POST /api/spotify/logout` -> JSON `{ ok: true }`.

- [ ] **Step 1: Write `login/route.ts`**

```ts
// src/app/api/spotify/login/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl, STATE_COOKIE, spotifyEnv } from "@/lib/spotify/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { clientId, redirectUri } = spotifyEnv();
  const state = crypto.randomUUID();
  cookies().set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(buildAuthorizeUrl({ clientId, redirectUri, state }));
}
```

- [ ] **Step 2: Write `callback/route.ts`**

```ts
// src/app/api/spotify/callback/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeCode, RT_COOKIE, STATE_COOKIE, spotifyEnv } from "@/lib/spotify/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  const back = new URL("/app/today", url.origin);
  if (!code || !state || state !== expected) {
    back.searchParams.set("spotify", "error");
    return NextResponse.redirect(back);
  }

  try {
    const { clientId, clientSecret, redirectUri } = spotifyEnv();
    const tokens = await exchangeCode({ clientId, clientSecret, redirectUri, code });
    if (tokens.refresh_token) {
      jar.set(RT_COOKIE, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    back.searchParams.set("spotify", "connected");
  } catch {
    back.searchParams.set("spotify", "error");
  }
  return NextResponse.redirect(back);
}
```

- [ ] **Step 3: Write `token/route.ts`**

```ts
// src/app/api/spotify/token/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshToken, RT_COOKIE, spotifyEnv } from "@/lib/spotify/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = cookies();
  const rt = jar.get(RT_COOKIE)?.value;
  if (!rt) return NextResponse.json({ status: "disconnected" });

  try {
    const { clientId, clientSecret } = spotifyEnv();
    const tokens = await refreshToken({ clientId, clientSecret, refreshToken: rt });
    if (tokens.refresh_token) {
      jar.set(RT_COOKIE, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return NextResponse.json({ status: "connected", access_token: tokens.access_token, expires_at: Date.now() + tokens.expires_in * 1000 });
  } catch {
    jar.delete(RT_COOKIE);
    return NextResponse.json({ status: "disconnected" });
  }
}
```

- [ ] **Step 4: Write `logout/route.ts`**

```ts
// src/app/api/spotify/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RT_COOKIE } from "@/lib/spotify/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  cookies().delete(RT_COOKIE);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Typecheck + build the routes**

Run: `npx tsc --noEmit`
Expected: no errors. (Routes cannot be exercised without env + Spotify; they are verified end-to-end in Task 9's manual pass once env is set.)

- [ ] **Step 6: Commit**

```bash
git add src/app/api/spotify
git commit -m "feat(spotify): oauth route handlers (login, callback, token, logout)"
```

---

### Task 4: SpotifyProvider (app-level SDK + context)

**Files:**
- Create: `src/components/spotify/SpotifyProvider.tsx`

**Interfaces:**
- Consumes (Task 3 HTTP): `GET /api/spotify/token`, `POST /api/spotify/logout`.
- Consumes (Task 2): `getMe`, `isPremium`, `startPlaylist`.
- Produces (for Tasks 5, 6, 8):
  - `useSpotify(): SpotifyContextValue`
  - `type SpotifyStatus = "disconnected" | "connecting" | "connected-free" | "ready" | "error"`
  - `interface TrackInfo { title: string; artist: string; artUrl: string | null }`
  - `interface SpotifyContextValue { status: SpotifyStatus; track: TrackInfo | null; isPlaying: boolean; play(playlistId: string): Promise<void>; toggle(): void; next(): void; prev(): void; connect(): void; disconnect(): Promise<void> }`

- [ ] **Step 1: Write the provider**

```tsx
// src/components/spotify/SpotifyProvider.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getMe, isPremium, startPlaylist } from "@/lib/spotify/api";

export type SpotifyStatus = "disconnected" | "connecting" | "connected-free" | "ready" | "error";

export interface TrackInfo {
  title: string;
  artist: string;
  artUrl: string | null;
}

export interface SpotifyContextValue {
  status: SpotifyStatus;
  track: TrackInfo | null;
  isPlaying: boolean;
  play(playlistId: string): Promise<void>;
  toggle(): void;
  next(): void;
  prev(): void;
  connect(): void;
  disconnect(): Promise<void>;
}

const noop = () => {};
const SpotifyContext = createContext<SpotifyContextValue>({
  status: "disconnected",
  track: null,
  isPlaying: false,
  play: async () => {},
  toggle: noop,
  next: noop,
  prev: noop,
  connect: noop,
  disconnect: async () => {},
});

export function useSpotify(): SpotifyContextValue {
  return useContext(SpotifyContext);
}

// Minimal typings for the Web Playback SDK we rely on.
type SdkPlayer = {
  connect(): Promise<boolean>;
  disconnect(): void;
  togglePlay(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  addListener(event: string, cb: (arg: unknown) => void): void;
};
declare global {
  interface Window {
    Spotify?: { Player: new (opts: { name: string; getOAuthToken: (cb: (t: string) => void) => void; volume?: number }) => SdkPlayer };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

async function fetchToken(): Promise<{ status: string; access_token?: string }> {
  const res = await fetch("/api/spotify/token", { cache: "no-store" });
  return res.json();
}

function loadSdkScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Spotify) return resolve();
    const prev = document.getElementById("spotify-sdk");
    if (prev) {
      window.onSpotifyWebPlaybackSDKReady = () => resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = "spotify-sdk";
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.async = true;
    s.onerror = () => reject(new Error("sdk load failed"));
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    document.body.appendChild(s);
  });
}

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SpotifyStatus>("disconnected");
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<SdkPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("connecting");
      const t = await fetchToken().catch(() => ({ status: "disconnected" as const }));
      if (cancelled) return;
      if (t.status !== "connected" || !t.access_token) {
        setStatus("disconnected");
        return;
      }
      tokenRef.current = t.access_token;
      const me = await getMe(t.access_token).catch(() => null);
      if (cancelled) return;
      if (!me || !isPremium(me)) {
        setStatus("connected-free");
        return;
      }
      try {
        await loadSdkScript();
        if (cancelled) return;
        const player = new window.Spotify!.Player({
          name: "Koino",
          getOAuthToken: (cb) => {
            fetchToken().then((r) => {
              if (r.access_token) {
                tokenRef.current = r.access_token;
                cb(r.access_token);
              }
            });
          },
          volume: 0.8,
        });
        player.addListener("ready", (arg) => {
          deviceIdRef.current = (arg as { device_id: string }).device_id;
          setStatus("ready");
        });
        player.addListener("not_ready", () => setStatus("connected-free"));
        player.addListener("player_state_changed", (arg) => {
          const s = arg as null | { paused: boolean; track_window: { current_track: { name: string; artists: { name: string }[]; album: { images: { url: string }[] } } } };
          if (!s) return;
          const ct = s.track_window.current_track;
          setTrack({ title: ct.name, artist: ct.artists.map((a) => a.name).join(", "), artUrl: ct.album.images[0]?.url ?? null });
          setIsPlaying(!s.paused);
        });
        player.addListener("initialization_error", () => setStatus("error"));
        player.addListener("authentication_error", () => setStatus("error"));
        player.addListener("account_error", () => setStatus("connected-free"));
        await player.connect();
        playerRef.current = player;
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, []);

  const play = useCallback(async (playlistId: string) => {
    if (!tokenRef.current || !deviceIdRef.current) return;
    await startPlaylist({ accessToken: tokenRef.current, deviceId: deviceIdRef.current, playlistId }).catch(() => {});
  }, []);
  const toggle = useCallback(() => { playerRef.current?.togglePlay(); }, []);
  const next = useCallback(() => { playerRef.current?.nextTrack(); }, []);
  const prev = useCallback(() => { playerRef.current?.previousTrack(); }, []);
  const connect = useCallback(() => { window.location.href = "/api/spotify/login"; }, []);
  const disconnect = useCallback(async () => {
    playerRef.current?.disconnect();
    playerRef.current = null;
    await fetch("/api/spotify/logout", { method: "POST" }).catch(() => {});
    setStatus("disconnected");
    setTrack(null);
    setIsPlaying(false);
  }, []);

  return (
    <SpotifyContext.Provider value={{ status, track, isPlaying, play, toggle, next, prev, connect, disconnect }}>
      {children}
    </SpotifyContext.Provider>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/spotify/SpotifyProvider.tsx
git commit -m "feat(spotify): app-level provider owning the Web Playback SDK device"
```

---

### Task 5: MusicPanel (replaces the embed on Scripture + Linger)

**Files:**
- Create: `src/components/spotify/MusicPanel.tsx`
- Test: `src/components/spotify/MusicPanel.test.tsx`
- Modify: `src/components/screens/Scripture.tsx` (swap `SpotifyEmbed` -> `MusicPanel`)
- Modify: `src/components/screens/Linger.tsx` (swap `SpotifyEmbed` -> `MusicPanel`)

**Interfaces:**
- Consumes (Task 4): `useSpotify`.
- Consumes (existing): `SpotifyEmbed`.
- Produces: `MusicPanel({ playlistId, themeName, accent }: { playlistId: string; themeName: string; accent: string })`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/spotify/MusicPanel.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MusicPanel } from "@/components/spotify/MusicPanel";
import * as ctx from "@/components/spotify/SpotifyProvider";

function mockStatus(status: ctx.SpotifyStatus) {
  vi.spyOn(ctx, "useSpotify").mockReturnValue({
    status, track: null, isPlaying: false,
    play: vi.fn(), toggle: vi.fn(), next: vi.fn(), prev: vi.fn(), connect: vi.fn(), disconnect: vi.fn(),
  });
}

describe("MusicPanel fallback", () => {
  it("shows the embed and a connect prompt when disconnected", () => {
    mockStatus("disconnected");
    render(<MusicPanel playlistId="pl1" themeName="Peace" accent="#0F6E56" />);
    expect(screen.getByTitle(/playlist/i)).toBeInTheDocument(); // the SpotifyEmbed iframe
    expect(screen.getByRole("button", { name: /connect spotify/i })).toBeInTheDocument();
  });
  it("shows a premium note plus the embed when connected-free", () => {
    mockStatus("connected-free");
    render(<MusicPanel playlistId="pl1" themeName="Peace" accent="#0F6E56" />);
    expect(screen.getByText(/premium/i)).toBeInTheDocument();
    expect(screen.getByTitle(/playlist/i)).toBeInTheDocument();
  });
  it("shows a Play control (no embed) when ready", () => {
    mockStatus("ready");
    render(<MusicPanel playlistId="pl1" themeName="Peace" accent="#0F6E56" />);
    expect(screen.getByRole("button", { name: /play the peace playlist/i })).toBeInTheDocument();
    expect(screen.queryByTitle(/playlist/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/spotify/MusicPanel.test.tsx`
Expected: FAIL ("Cannot find module ... MusicPanel").

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/spotify/MusicPanel.tsx
"use client";

import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { useSpotify } from "@/components/spotify/SpotifyProvider";

export function MusicPanel({ playlistId, themeName, accent }: { playlistId: string; themeName: string; accent: string }) {
  const { status, isPlaying, play, toggle } = useSpotify();

  if (status === "ready") {
    return (
      <button
        onClick={() => (isPlaying ? toggle() : play(playlistId))}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-transform active:scale-[0.99]"
        style={{ background: "color-mix(in srgb, " + accent + " 12%, var(--paper))", border: `1px solid ${accent}` }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: accent }}>
          <i className={`ti ti-${isPlaying ? "player-pause" : "player-play"} text-sm`} aria-hidden="true" />
        </span>
        <span className="text-xs font-medium" style={{ color: accent }}>
          {isPlaying ? `Playing the ${themeName} worship playlist` : `Play the ${themeName} playlist`}
        </span>
      </button>
    );
  }

  const note =
    status === "connected-free"
      ? "Full playback needs Spotify Premium. Here is the playlist to listen along."
      : null;

  return (
    <div className="flex flex-col gap-2">
      {note && <p className="text-[11px] text-ink-muted">{note}</p>}
      <SpotifyEmbed playlistId={playlistId} title={`${themeName} playlist`} />
      {status === "disconnected" && <ConnectPrompt accent={accent} />}
    </div>
  );
}

function ConnectPrompt({ accent }: { accent: string }) {
  const { connect } = useSpotify();
  return (
    <button
      onClick={connect}
      className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-[11px] font-medium transition-transform active:scale-95"
      style={{ color: accent, background: `color-mix(in srgb, ${accent} 10%, transparent)` }}
    >
      <i className="ti ti-brand-spotify" aria-hidden="true" /> Connect Spotify for full playback
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/spotify/MusicPanel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Swap `SpotifyEmbed` for `MusicPanel` in Scripture**

In `src/components/screens/Scripture.tsx`, replace the import `import { SpotifyEmbed } from "@/components/SpotifyEmbed";` with `import { MusicPanel } from "@/components/spotify/MusicPanel";` and replace `<SpotifyEmbed playlistId={playlistId} title={`${theme.name} playlist`} />` with:

```tsx
<MusicPanel playlistId={playlistId} themeName={theme.name} accent={theme.accent} />
```

- [ ] **Step 6: Swap `SpotifyEmbed` for `MusicPanel` in Linger**

In `src/components/screens/Linger.tsx`, make the same import swap and replace `<SpotifyEmbed playlistId={playlistId} title={`${theme.name} playlist`} />` with:

```tsx
<MusicPanel playlistId={playlistId} themeName={theme.name} accent={theme.accent} />
```

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS (93 existing + 3 new).

- [ ] **Step 8: Commit**

```bash
git add src/components/spotify/MusicPanel.tsx src/components/spotify/MusicPanel.test.tsx src/components/screens/Scripture.tsx src/components/screens/Linger.tsx
git commit -m "feat(spotify): MusicPanel with per-status rendering and embed fallback"
```

---

### Task 6: MiniPlayer

**Files:**
- Create: `src/components/spotify/MiniPlayer.tsx`

**Interfaces:**
- Consumes (Task 4): `useSpotify`.
- Produces: `MiniPlayer()` (self-gating; renders `null` unless `status === "ready"` and a track exists).

- [ ] **Step 1: Write the implementation**

```tsx
// src/components/spotify/MiniPlayer.tsx
"use client";

import { useSpotify } from "@/components/spotify/SpotifyProvider";

export function MiniPlayer() {
  const { status, track, isPlaying, toggle, next } = useSpotify();
  if (status !== "ready" || !track) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center gap-3 px-4 py-2.5 backdrop-blur-md lg:bottom-4 lg:right-4 lg:left-auto lg:mx-0 lg:max-w-sm lg:rounded-full lg:shadow-lift"
      style={{ background: "color-mix(in srgb, var(--paper) 92%, transparent)", borderTop: "1px solid var(--hairline)" }}
    >
      {track.artUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{track.title}</p>
        <p className="truncate text-[11px] text-ink-muted">{track.artist}</p>
      </div>
      <button onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"} className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:text-brand">
        <i className={`ti ti-${isPlaying ? "player-pause" : "player-play"} text-xl`} aria-hidden="true" />
      </button>
      <button onClick={next} aria-label="Next track" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink">
        <i className="ti ti-player-track-next text-lg" aria-hidden="true" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/spotify/MiniPlayer.tsx
git commit -m "feat(spotify): persistent MiniPlayer bar (ready state only)"
```

---

### Task 7: Mount provider + mini-player in the root layout

**Files:**
- Modify: `src/app/layout.tsx` (wrap `{children}` in `SpotifyProvider`, render `MiniPlayer`)

**Interfaces:**
- Consumes (Tasks 4, 6): `SpotifyProvider`, `MiniPlayer`.

- [ ] **Step 1: Edit the layout body**

In `src/app/layout.tsx`, add imports at the top:

```tsx
import { SpotifyProvider } from "@/components/spotify/SpotifyProvider";
import { MiniPlayer } from "@/components/spotify/MiniPlayer";
```

Replace `<body>{children}</body>` with:

```tsx
<body>
  <SpotifyProvider>
    {children}
    <MiniPlayer />
  </SpotifyProvider>
</body>
```

- [ ] **Step 2: Verify mobile tab bar spacing**

The mini-player is fixed at the bottom and only appears in the `ready` state, so it never overlaps content in this environment (no Premium). Note for the Premium pass: if the mini-player covers the mobile `TabBar`, add `pb-16` to the hub content wrapper only while `ready`. Leave unchanged for now.

- [ ] **Step 3: Run the suite + typecheck**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; 96 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(spotify): mount provider + mini-player at the app root"
```

---

### Task 8: Settings "Music" section

**Files:**
- Modify: `src/components/SettingsView.tsx` (add a Music section with connect/disconnect + status)

**Interfaces:**
- Consumes (Task 4): `useSpotify`.

- [ ] **Step 1: Add the Music section**

In `src/components/SettingsView.tsx`, add the import `import { useSpotify } from "@/components/spotify/SpotifyProvider";`, read the context inside the component (`const { status, connect, disconnect } = useSpotify();`), and add this section after the "Your data" section (before the closing `</div>`):

```tsx
<section className="flex flex-col gap-3">
  <h2 className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Music</h2>
  <div className="flex items-center justify-between rounded-2xl border bg-paper p-4" style={{ borderColor: "var(--hairline)" }}>
    <div className="min-w-0">
      <p className="text-sm font-medium text-ink">Spotify</p>
      <p className="text-xs text-ink-muted">
        {status === "ready"
          ? "Connected. Full playback is on."
          : status === "connected-free"
            ? "Connected, free tier. Full playback needs Premium."
            : status === "connecting"
              ? "Checking your connection..."
              : status === "error"
                ? "Something went wrong. Try reconnecting."
                : "Not connected. You will hear the embedded playlist."}
      </p>
    </div>
    {status === "disconnected" || status === "error" ? (
      <button onClick={connect} className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white" style={{ background: BRAND }}>
        Connect
      </button>
    ) : (
      <button onClick={() => disconnect()} className="shrink-0 rounded-full px-4 py-2 text-sm font-medium" style={{ color: BRAND, background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
        Disconnect
      </button>
    )}
  </div>
</section>
```

- [ ] **Step 2: Run the suite**

Run: `npm test`
Expected: PASS (existing settings test still green; if it asserts exact section count, update it to include "Music").

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsView.tsx src/components/settings.test.tsx
git commit -m "feat(spotify): connect/disconnect + status in Settings"
```

---

### Task 9: Worship playlists (curate, verify, swap) + env + setup docs

**Files:**
- Create: `scripts/verify-playlists.mjs`
- Create: `.env.local.example`
- Modify: `src/lib/themes.ts` (worship `playlistIds` + `moodProfile` rewrite)
- Modify: `README.md` (Spotify setup section)
- Modify: `package.json` (add `"verify:playlists"` script)

**Interfaces:**
- Consumes (Task 1): reuses the client-credentials token endpoint indirectly; the script fetches its own app token.

- [ ] **Step 1: Write `.env.local.example`**

```bash
# .env.local.example
# Spotify app credentials (create an app at https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
# Dev must use the loopback IP, not "localhost" (Spotify rejects localhost):
SPOTIFY_REDIRECT_URI=http://127.0.0.1:4620/api/spotify/callback
```

- [ ] **Step 2: Write `scripts/verify-playlists.mjs`**

```js
// scripts/verify-playlists.mjs
// Verifies every theme playlist id resolves on Spotify. Requires SPOTIFY_CLIENT_ID/SECRET.
import { readFileSync } from "node:fs";

const id = process.env.SPOTIFY_CLIENT_ID;
const secret = process.env.SPOTIFY_CLIENT_SECRET;
if (!id || !secret) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first.");
  process.exit(1);
}

const themes = readFileSync(new URL("../src/lib/themes.ts", import.meta.url), "utf8");
const ids = [...themes.matchAll(/playlistIds:\s*\[([^\]]*)\]/g)]
  .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));

const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64") },
  body: new URLSearchParams({ grant_type: "client_credentials" }),
});
const { access_token } = await tokenRes.json();

let failed = 0;
for (const pid of ids) {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${pid}?fields=id,name`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!res.ok) { console.error(`DEAD  ${pid}  (${res.status})`); failed++; }
  else { const j = await res.json(); console.log(`ok    ${pid}  ${j.name}`); }
}
if (failed) { console.error(`\n${failed} playlist(s) failed to resolve.`); process.exit(1); }
console.log(`\nAll ${ids.length} playlists resolve.`);
```

- [ ] **Step 3: Add the npm script**

In `package.json` `scripts`, add: `"verify:playlists": "node scripts/verify-playlists.mjs"`.

- [ ] **Step 4: GATE — research + present candidate worship playlists**

Do NOT edit `themes.ts` yet. Research a live, mood-matched **worship** playlist for each of the 12 themes (peace, gratitude, hope, lament, surrender, awe, joy, repentance, strength, comfort, love, longing). Present all 12 (name + id + why it fits) to the user and get explicit approval. Only approved ids proceed.

- [ ] **Step 5: Apply approved ids + worship mood profiles to `themes.ts`**

For each theme, set `playlistIds` to the approved worship playlist id(s) and rewrite `moodProfile` to a worship-song description. Example shape (peace) once approved:

```ts
peace: { slug: "peace", name: "Peace", definition: "Resting in God's nearness instead of striving.", moodProfile: "Peaceful, ambient worship for stillness.", accent: "#0F6E56", accentSoft: "#E1F5EE", accentBorder: "#9FE1CB", icon: "ripple", playlistIds: ["<APPROVED_PEACE_ID>"] },
```

Repeat for all 12 themes with their approved ids and worship mood-profile copy.

- [ ] **Step 6: Verify the ids resolve**

Run: `npm run verify:playlists`
Expected: `All 12 playlists resolve.` (Fix or re-source any `DEAD` id before proceeding.)

- [ ] **Step 7: Run the suite**

Run: `npm test`
Expected: PASS (`themes.test.ts` invariant "every theme has at least one playlist" still holds).

- [ ] **Step 8: Write the README setup section**

Add a "Spotify" section to `README.md` documenting: create a Spotify app; add your account email to the app user allowlist; set the three env vars in `.env.local`; the `127.0.0.1:4620` redirect URI and the reason `localhost` is rejected; that full playback needs Premium; `npm run verify:playlists`.

- [ ] **Step 9: Commit**

```bash
git add scripts/verify-playlists.mjs .env.local.example src/lib/themes.ts package.json README.md
git commit -m "feat(spotify): per-theme worship playlists + verify script + setup docs"
```

---

### Task 10: End-to-end manual verification (requires your Spotify app)

**Files:** none (verification only).

- [ ] **Step 1: Configure env**

Copy `.env.local.example` to `.env.local`, fill in the Client ID/Secret from your Spotify app, and confirm the redirect URI is registered in the Spotify dashboard.

- [ ] **Step 2: Run and open on the loopback IP**

Run the dev server, then open `http://127.0.0.1:4620/app/settings` (not `localhost`). Click Connect, complete the Spotify consent, and confirm you land back on `/app/today?spotify=connected`.

- [ ] **Step 3: Verify status**

In Settings, confirm the status reads "Connected, free tier..." for a free account (or "Connected. Full playback is on." with Premium). On Scripture, confirm the `MusicPanel` shows the embed + note (free) or the Play control (Premium). requires Premium for full playback + MiniPlayer.

- [ ] **Step 4: Verify disconnect**

Click Disconnect; confirm status returns to "Not connected" and the embed reappears on Scripture.

---

## Self-Review

- **Spec coverage:** auth/tokens (Tasks 1, 3), provider/SDK (Task 4), MiniPlayer + MusicPanel + Settings (Tasks 5, 6, 8), playback (Tasks 2, 4), worship content + verification (Task 9), env/setup/deploy docs (Tasks 9, 10), error/edge states (provider listeners + MusicPanel fallbacks), testing (per-task). All spec sections map to a task.
- **Placeholders:** the only deferred content is the 12 worship playlist ids, which are a deliberate human-approval gate (Task 9 Step 4), not a code placeholder; every code step contains complete code.
- **Type consistency:** `SpotifyStatus`, `TrackInfo`, `SpotifyContextValue`, `useSpotify`, `getMe`/`isPremium`/`startPlaylist`, `spotifyEnv`, `RT_COOKIE`/`STATE_COOKIE`, and the `/api/spotify/token` response shape are used identically across tasks.
