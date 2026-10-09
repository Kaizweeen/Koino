# Koino promo video

`koino-promo.mp4` is a 55-second vertical (1080×1920, 30fps) promo for Reels, TikTok, Shorts, and
Stories. Every phone screen in it is the real app, captured frame by frame. The soundtrack is
synthesized from code, so there is no licensed music or stock footage to clear.

## What it says, beat by beat

| Time | Beat | On screen |
| --- | --- | --- |
| 0–3s | Hook | A lock screen fills with notifications. *Most mornings start with noise.* |
| 3–6s | Turn | It all blurs away. *What if yours began with stillness?* |
| 6–9s | Brand | The Koino mark blooms in. *A calm daily devotion.* |
| 9–15s | Come as you are | The Arrival screen re-lights through Peace, Gratitude, Hope, Joy, Lament, Longing |
| 15–31s | SOAP | Real taps and typing through Scripture → Observation → Application → Prayer |
| 31–36s | Amen | The completion bloom and the 7-day milestone. *Four steps. A few minutes.* |
| 36–45s | Keepsakes | Verse card, streak, history, journal, the whole Bible |
| 45–49s | Promise | No feed. No ads. No sign-up. Works offline. Your words stay on your phone. |
| 49–55s | Call to action | *Begin today, from rest.* |

Every claim on screen is true of the app as built (see `PRODUCT.md`): it is free, has no
account, no ads or analytics, works offline, and keeps everything in the browser. The video
invents no users, ratings, quotes, or download counts. The journal entries and streaks are sample
data, typed into the real app.

## Re-rendering

Change the copy, timing, or chords in `storyboard.json`, then:

```bash
npm run build && npx next start -p 3000          # the real app, production build (leave running)

# in a second terminal:
KOINO_URL=http://localhost:3000 node promo/capture.mjs   # ~2 min: app frames → promo/build/clips
python3 promo/music.py                           # soundtrack → promo/build/music.wav
node promo/render.mjs                            # ~10 min: video → promo/koino-promo.mp4
```

Requirements: Node 20+, Python 3 with `numpy` and `scipy`, `ffmpeg`, and Playwright with
Chromium (`npm i -g playwright` works; the scripts fall back to a global install because the app
itself doesn't depend on it).

- `capture.mjs [clip-id …]` recaptures only the named clips.
- `render.mjs --stills 4,16.5` writes single frames to `promo/build/stills/` for a quick look.
- Open `composition.html?t=12` through any static server rooted at `promo/` to inspect a moment,
  or `composition.html?play` to watch it in real time (frames load as they play).
- Set `"url"` in `storyboard.json` once Koino has a public address, and it appears on the end
  card under the button.

## How it works

- **`capture.mjs`** drives the production app in headless Chromium at phone size (384×754 CSS
  pixels at 2×), with the clock fixed to each scene's date and `localStorage` seeded with that
  scene's progress. It pauses every CSS animation and steps them on a virtual clock, so the
  drifting Atmosphere, the breathing halo, and each step's rise land exactly on the 30fps grid.
  Taps and keystrokes happen at the times in `storyboard.json`, and their positions and timings
  go into `build/manifest.json`.
- **`composition.html` / `composition.js`** lay out the video as a pure function of time
  (`window.seek(t)`): the hook, the captions, a phone mockup that composites the captured
  frames (with status bar, Dynamic Island, and tap ripples drawn on top), the promise, and the
  end card.
- **`music.py`** builds the soundtrack from the same storyboard: notification dings that land on
  each card in the hook, a hard cut to silence, then a warm pad and felt-piano arpeggio that
  change chord with the scenes, chimes on Amen and the end card, and soft key clicks under the
  real typing.
- **`render.mjs`** steps the composition in parallel pages, pipes the frames to `ffmpeg`
  (H.264, CRF 17), and muxes the soundtrack loudness-normalized to -16 LUFS.

The fonts in `fonts/` are Lora and Inter under the SIL Open Font License (see the `OFL-*.txt`
files), bundled so a render never depends on the network.
