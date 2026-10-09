// Renders composition.html to video, frame by frame, and muxes in the soundtrack.
//
//   node promo/render.mjs                  full render → promo/koino-promo.mp4
//   node promo/render.mjs --stills 4,16.5  single frames → promo/build/stills/*.png
//   node promo/render.mjs --workers 6      parallel pages (default 4)
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { BUILD, HERE, loadPlaywright, serve, storyboard as SB } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const stills = opt("--stills")?.split(",").map(Number);
const workers = Number(opt("--workers") ?? 4);
const OUT = path.join(HERE, "koino-promo.mp4");

const { chromium } = await loadPlaywright();
const { server, url } = await serve(HERE);
const browser = await chromium.launch();

async function openPage() {
  const page = await browser.newPage({ viewport: { width: SB.width, height: SB.height }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`${url}/composition.html?t=0`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60_000 });
  return page;
}

async function frame(page, t) {
  await page.evaluate((t) => window.seek(t), t);
  return page.screenshot({ type: "png" });
}

if (stills) {
  const dir = path.join(BUILD, "stills");
  fs.mkdirSync(dir, { recursive: true });
  const page = await openPage();
  for (const t of stills) {
    fs.writeFileSync(path.join(dir, `${t.toFixed(2).padStart(5, "0")}.png`), await frame(page, t));
    console.log("still", t);
  }
} else {
  const total = Math.round(SB.duration * SB.fps);
  const per = Math.ceil(total / workers);
  const segDir = path.join(BUILD, "segments");
  fs.rmSync(segDir, { recursive: true, force: true });
  fs.mkdirSync(segDir, { recursive: true });
  const started = Date.now();
  let done = 0;

  await Promise.all(
    Array.from({ length: workers }, async (_, w) => {
      const from = w * per;
      const to = Math.min(total, from + per);
      if (from >= to) return;
      const page = await openPage();
      const seg = path.join(segDir, `${String(w).padStart(2, "0")}.mp4`);
      const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(SB.fps), "-c:v", "png", "-i", "-",
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(SB.fps), seg], { stdio: ["pipe", "inherit", "inherit"] });
      const closed = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
      for (let f = from; f < to; f++) {
        const png = await frame(page, f / SB.fps);
        if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
        if (++done % 60 === 0) console.log(`${done}/${total} frames, ${((Date.now() - started) / 1000).toFixed(0)}s`);
      }
      ff.stdin.end();
      await closed;
      await page.close();
    }),
  );

  const list = path.join(segDir, "list.txt");
  fs.writeFileSync(list, fs.readdirSync(segDir).filter((f) => f.endsWith(".mp4")).sort().map((f) => `file '${f}'`).join("\n"));
  const silent = path.join(BUILD, "video.mp4");
  run(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent]);

  const music = path.join(BUILD, "music.wav");
  if (fs.existsSync(music)) {
    run(["-i", silent, "-i", music, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", OUT]);
  } else {
    console.warn("No build/music.wav; run `python3 promo/music.py` for the soundtrack. Writing a silent cut.");
    run(["-i", silent, "-c", "copy", "-movflags", "+faststart", OUT]);
  }
  console.log(`wrote ${path.relative(process.cwd(), OUT)} in ${((Date.now() - started) / 1000).toFixed(0)}s`);
}

function run(ffArgs) {
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", ...ffArgs], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${ffArgs.join(" ")}`);
}

await browser.close();
server.close();
