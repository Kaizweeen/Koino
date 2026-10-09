// Captures the real Koino app, frame by frame, for every phone clip in storyboard.json.
//
// The app's own CSS animations (the drifting Atmosphere, the breathing halo, the staggered rise
// of each step) are paused and stepped on a virtual clock, so each frame lands exactly on the
// video's 30fps grid no matter how long a screenshot takes.
//
// Usage: KOINO_URL=http://localhost:3000 node promo/capture.mjs [clip-id ...]
import fs from "node:fs";
import path from "node:path";
import { BUILD, loadPlaywright, rng, storyboard as SB } from "./lib.mjs";

const BASE = (process.env.KOINO_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const only = process.argv.slice(2);
const { chromium } = await loadPlaywright();

const dev = SB.device;
const viewport = { width: dev.width, height: dev.height - dev.statusBar - dev.homeBar };
const WARMUP_MS = 1800; // lets each screen's entrance animation finish before its first frame

// The devotion flow's header only clears the back button at lg; at phone width the button sits
// over the step label. Apply the same clearance here so the captures read cleanly.
const CAPTURE_CSS = `
  .lg\\:pl-14 { padding-left: 3.5rem; }
  html { scrollbar-width: none; }
  ::-webkit-scrollbar { display: none; }
`;

function priorDays(date, n) {
  const end = Date.parse(`${date}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(end - (n - i) * 86_400_000).toISOString().slice(0, 10));
}

function progressFor(clip) {
  const p = SB.presets[clip.preset];
  if (p.streakDays) return { completedDates: priorDays(clip.date, p.streakDays), favorites: [], entries: {}, notes: {} };
  return { completedDates: p.completedDates, favorites: p.favorites, entries: p.entries, notes: {} };
}

/** Per-character times for a typing action: an uneven, human rhythm that ends on time. */
function keyTimes(action, seed) {
  const rand = rng(seed);
  const gaps = [...action.text].map((ch, i) => {
    let g = 0.6 + rand() * 0.8;
    if (ch === " ") g *= 1.25;
    if (i > 0 && /[.,']/.test(action.text[i - 1])) g *= 2.2;
    return g;
  });
  const total = gaps.reduce((a, b) => a + b, 0);
  let acc = 0;
  return gaps.map((g) => action.t + ((acc += g) / total) * (action.until - action.t));
}

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const manifestPath = path.join(BUILD, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { clips: {} };

const browser = await chromium.launch();

for (const [ci, clip] of SB.clips.entries()) {
  if (only.length && !only.includes(clip.id)) continue;
  const dir = path.join(BUILD, "clips", clip.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dev.scale, reducedMotion: "no-preference", colorScheme: "light" });
  const page = await ctx.newPage();
  const [hh, mm] = dev.clock.split(":");
  await page.clock.setFixedTime(new Date(`${clip.date}T${hh.padStart(2, "0")}:${mm}:00`));
  await page.addInitScript(([progress]) => {
    localStorage.setItem("koino.progress.v1", JSON.stringify(progress));
    localStorage.setItem("koino.prefs.v1", JSON.stringify({ onboarded: true, theme: "light", textSize: "regular" }));
  }, [progressFor(clip)]);

  await page.goto(BASE + clip.path, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: CAPTURE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const starts = new WeakMap();
    window.__tick = (ms) => {
      for (const a of document.getAnimations()) {
        if (!starts.has(a)) starts.set(a, ms);
        a.pause();
        a.currentTime = ms - starts.get(a);
      }
    };
    window.__tick(0);
  });

  const actions = (clip.actions ?? []).map((a, i) => ({ ...a, keys: a.type === "type" ? keyTimes(a, 7 + ci * 31 + i) : null, done: false, typed: 0 }));
  const taps = [];
  const keys = [];
  const first = Math.round(clip.from * SB.fps);
  const last = Math.round(clip.to * SB.fps);

  for (let f = first; f <= last; f++) {
    const t = f / SB.fps;
    let caret = "hide";

    for (const a of actions) {
      if (a.type === "click" && !a.done && t >= a.t) {
        a.done = true;
        const target = page.getByRole(a.role, { name: a.name, exact: true });
        const box = await target.boundingBox();
        taps.push({ t: a.t, x: box.x + box.width / 2, y: box.y + box.height / 2, w: box.width, h: box.height });
        await target.click();
      }
      if (a.type === "type" && t >= a.t) {
        const n = a.keys.filter((k) => k <= t).length;
        if (n !== a.typed) {
          for (let k = a.typed; k < n; k++) keys.push(Math.round(a.keys[k] * 1000) / 1000);
          a.typed = n;
          await page.locator("textarea").fill(a.text.slice(0, n));
        }
        if (t <= a.until + 0.4) caret = "initial";
      }
      if (a.type === "scroll" && t >= a.t) {
        const x = Math.min(1, (t - a.t) / (a.until - a.t));
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(easeInOut(x) * a.y));
      }
    }

    await page.evaluate((ms) => window.__tick(ms), WARMUP_MS + (t - clip.from) * 1000);
    await page.screenshot({ path: path.join(dir, `${f}.jpg`), type: "jpeg", quality: 95, caret });
  }

  manifest.clips[clip.id] = { first, last, taps, keys };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`${clip.id}: frames ${first}-${last}, ${taps.length} taps, ${keys.length} keys`);
  await ctx.close();
}

await browser.close();
