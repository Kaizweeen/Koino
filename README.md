# Koino

Mobile-first web app that helps newcomers feel known before they walk into a church.

This repo is the **real** build — Next.js (App Router) + Supabase. The first
slice wired up is **authentication** and the `profiles` table that everything
personal hangs off of.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (Koino design tokens in `tailwind.config.ts`)
- Supabase: Postgres + GoTrue auth, via `@supabase/ssr` (cookie sessions)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com, then copy your
   project URL and publishable/anon key from Settings → API.

3. **Environment variables** — copy the example and fill it in:

   ```bash
   cp .env.local.example .env.local
   # then edit .env.local
   ```

4. **Run the database migration** — open the Supabase SQL editor and run
   `supabase/migrations/0001_profiles.sql` (or use the Supabase CLI:
   `supabase db push`). This creates the `profiles` table, the trigger that
   auto-creates a profile on signup, and the RLS policies.

5. **Email confirmation redirect** — in Supabase, set the email template's
   confirmation URL to point at `/auth/confirm` (Authentication → URL
   Configuration / email templates). For local dev the default site URL is
   `http://localhost:3000`.

6. **Run it**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 — you'll be redirected to `/login`. Create an
   account, confirm via the emailed link, and you'll land on the protected
   home page showing your profile.

## What's here

```
src/
  middleware.ts                 session refresh + route protection
  lib/supabase/
    client.ts                   browser client (Client Components, realtime)
    server.ts                   server client (RSC, actions, route handlers)
    middleware.ts               updateSession helper
  app/
    login/
      page.tsx                  login + signup UI
      actions.ts                login / signup server actions
    auth/
      confirm/route.ts          email confirmation -> session
      signout/route.ts          sign out
    page.tsx                    protected home (proves auth works)
    layout.tsx                  fonts + globals
supabase/migrations/
  0001_profiles.sql             profiles table, signup trigger, RLS
```

## Next slices

- Vibe Check: `churches`, `vibe_dimensions`, `vibe_options`, `vibe_votes` +
  an aggregate RPC, wired to the panel UI from the prototype.
- Daily Alignment: `verses`, `songs`, thematic tags.
- PewBuddy messaging (needs a safety/moderation design first).
