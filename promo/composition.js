// The Koino promo, as one deterministic function of time: window.seek(t) paints the frame at t.
// render.mjs steps it at 30fps; open composition.html?t=12 to inspect a still, or ?play to preview.

const SB = await (await fetch("storyboard.json")).json();
let MF = { clips: {} };
try {
  MF = await (await fetch("build/manifest.json")).json();
} catch {
  console.warn("No build/manifest.json yet; run capture.mjs first. The phone will be blank.");
}

const THEMES = {
  peace: { name: "Peace", accent: "#0F6E56" },
  gratitude: { name: "Gratitude", accent: "#854F0B" },
  hope: { name: "Hope", accent: "#185FA5" },
  joy: { name: "Joy", accent: "#993C1D" },
  lament: { name: "Lament", accent: "#534AB7" },
  longing: { name: "Longing", accent: "#26215C" },
};

// ———————————————————————————————————— math

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const ease = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  outQuint: (x) => 1 - Math.pow(1 - x, 5),
  in: (x) => x * x * x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  back: (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2),
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, x) => a.map((v, i) => lerp(v, b[i], x));
const rgba = (c, a = 1) => `rgba(${c.map((v) => Math.round(v)).join(",")},${a.toFixed(3)})`;

/** Rise in from below out of a soft blur (the app's koino-lift), then drift up and away. */
function show(el, t, tIn, tOut, o = {}) {
  const { dur = 0.7, outDur = 0.38, dist = 30, blur = 10, outDist = 22, scale = 0 } = o;
  const a = ease.outQuint(prog(t, tIn, tIn + dur));
  const b = tOut == null ? 0 : ease.in(prog(t, tOut - outDur, tOut));
  const op = a * (1 - b);
  el.style.opacity = op.toFixed(4);
  const s = 1 - scale * (1 - a);
  el.style.transform = `translateY(${((1 - a) * dist - b * outDist).toFixed(2)}px)${scale ? ` scale(${s.toFixed(4)})` : ""}`;
  const bl = (1 - a) * blur + b * blur * 0.6;
  el.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : "none";
  el.style.visibility = op <= 0.001 ? "hidden" : "visible";
  return op;
}

function accentAt(t) {
  let col = hex(SB.accents[0].color);
  for (const s of SB.accents) {
    if (t < s.at) break;
    col = mix(col, hex(s.color), ease.sine(prog(t, s.at, s.at + 0.45)));
  }
  return col;
}

// ———————————————————————————————————— DOM

const $ = (sel) => document.querySelector(sel);
const stage = $("#stage");

const ICONS = {
  mail: '<path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"/><path d="M3 7l9 6l9 -6"/>',
  calendar: '<path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/>',
  chat: '<path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/>',
  news: '<path d="M16 6h3a1 1 0 0 1 1 1v11a2 2 0 0 1 -4 0v-13a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1v12a3 3 0 0 0 3 3h11"/><path d="M8 8h4"/><path d="M8 12h4"/><path d="M8 16h4"/>',
  heart: '<path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"/>',
  bell: '<path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/>',
  work: '<path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"/><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"/><path d="M3 13a20 20 0 0 0 18 0"/>',
  pulse: '<path d="M3 12h4l3 8l4 -16l3 8h4"/>',
  cart: '<path d="M4 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M15 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17h-11v-14h-2"/><path d="M6 5l14 1l-1 7h-13"/>',
  cloud: '<path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7"/><path d="M11 13v2m0 3v2m4 -5v2m0 3v2"/>',
};
const ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/></svg>';
const DROP = '<svg viewBox="0 0 512 512"><path d="M256 132c-58 66-116 100-116 182a116 116 0 0 0 232 0c0-82-58-116-116-182z" fill="none" stroke="#FBFAF7" stroke-width="26" stroke-linejoin="round"/></svg>';

// Generic morning noise: no real brands, nothing Koino would ever send.
const NOTES = [
  ["mail", "#2F7BEA", "Mail", "38 new messages · Re: Fwd: Q3 numbers, need by 9"],
  ["calendar", "#E8594A", "Calendar", "Standup in 10 minutes"],
  ["chat", "#31B95A", "Messages", "Family (24): did anyone see the news??"],
  ["news", "#D9443B", "News", "Breaking: 5 things to know before work"],
  ["heart", "#D9468F", "Social", "12 people liked your post"],
  ["bell", "#F0A019", "Reminders", "Pay the electricity bill · overdue"],
  ["work", "#6D5BD0", "Work Chat", "@you can you jump on a quick call?"],
  ["pulse", "#E2506A", "Fitness", "You missed your move goal yesterday"],
  ["cart", "#F27A1A", "Shopping", "Items in your cart are selling fast"],
  ["cloud", "#3BA4E8", "Weather", "Rain all day. Plan accordingly."],
  ["mail", "#2F7BEA", "Mail", "41 new messages"],
  ["chat", "#31B95A", "Messages", "Group chat (31): ok but WHO said that"],
  ["calendar", "#E8594A", "Calendar", "Dentist at 8:30 · leave now"],
  ["news", "#D9443B", "News", "Live: what everyone is talking about"],
];
// Each one lands a little sooner than the last; music.py drops a ding on the same beats.
const ARRIVALS = (() => {
  const out = [];
  let { first: t, gap } = SB.hook;
  for (let i = 0; i < Math.min(SB.hook.count, NOTES.length); i++) {
    out.push(t);
    t += gap;
    gap *= SB.hook.accel;
  }
  return out;
})();
const HOOK_END = SB.music.start;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

stage.innerHTML = `
  <div id="bg" class="layer">
    <div id="glowA" class="glow"></div><div id="glowB" class="glow"></div><div id="glowC" class="glow"></div>
  </div>

  <div id="still" class="layer center">
    <div id="stillHalo"></div>
    <div class="serif-xl" style="position:relative"><div id="still1">What if yours began</div><div id="still2">with <em>stillness?</em></div></div>
  </div>

  <div id="brand" class="layer center">
    <div id="brandMark" style="position:relative;width:420px;height:420px;display:flex;align-items:center;justify-content:center">
      <div id="brandHalo" class="halo" style="width:330px;height:330px"></div>
      <div id="brandRing" class="ring" style="width:330px;height:330px"></div>
      <div id="brandIcon" class="appicon">${DROP}</div>
    </div>
    <div id="brandWord" class="wordmark" style="margin-top:16px">Koino</div>
    <div id="brandTag" class="tagline" style="margin-top:26px">A calm daily devotion.</div>
    <div id="brandSub" class="label" style="margin-top:40px">From <i style="text-transform:none;letter-spacing:0.02em;font-family:var(--serif)">koinonia</i> · fellowship</div>
  </div>

  <div id="captions">
    <div id="soap">${["S", "O", "A", "P"].map((l) => `<span>${l}</span>`).join("")}</div>
    <div id="moodCap">
      <div class="kicker" id="moodKicker" style="font:500 27px/1.3 var(--sans);letter-spacing:0.22em;text-transform:uppercase">Come as you are</div>
      <div class="headline" id="moodHead" style="font:500 70px/1.14 var(--serif);letter-spacing:-0.02em">Every day meets you in a mood.</div>
      <div id="moodWords">${SB.moods.map((m) => `<span style="color:${THEMES[m.theme].accent}">${THEMES[m.theme].name}.</span>`).join("")}</div>
    </div>
    ${SB.captions
      .map(
        (c, i) => `<div class="cap${c.step ? " step" : ""}" id="cap${i}">
          <div class="kicker">${c.kicker}</div>
          <div class="headline">${c.headline}</div>
          ${c.sub ? `<div class="sub">${c.sub}</div>` : ""}
        </div>`,
      )
      .join("")}
  </div>

  <div id="phone"><canvas id="screen"></canvas><div id="phoneGlare"></div></div>

  <div id="promise" class="layer center">${SB.promises.lines.map((l) => `<p>${l}</p>`).join("")}</div>

  <div id="cta" class="layer center">
    <div id="ctaMark">
      <div id="ctaHalo" class="halo" style="width:330px;height:330px"></div>
      <div id="ctaRing" class="ring" style="width:330px;height:330px"></div>
      <div id="ctaIcon" class="appicon">${DROP}</div>
    </div>
    <div id="ctaWord" class="wordmark">Koino</div>
    <div id="ctaHead">Begin today, from rest.</div>
    <div id="ctaBtn">Begin today's devotion ${ARROW}</div>
    <div id="ctaFine">Free · No sign-up · Add it to your Home Screen</div>
    ${SB.url ? `<div id="ctaUrl">${SB.url}</div>` : ""}
  </div>

  <div id="hook" class="layer">
    <div id="lockDate">Thursday, June 25</div>
    <div id="lockTime">6:58</div>
    <div id="notes">${NOTES.map(
      ([icon, color, app, body]) => `<div class="note">
        <div class="ic" style="background:${color}"><svg viewBox="0 0 24 24">${ICONS[icon]}</svg></div>
        <div class="tx"><div class="row"><span class="ti">${app}</span><span class="tm">now</span></div><div class="bd">${body}</div></div>
      </div>`,
    ).join("")}</div>
    <div id="hookShade"></div>
    <div id="hookLine">Most mornings start with <em>noise.</em></div>
  </div>

  <div id="grain" class="layer" style="background-image:${GRAIN}"></div>
`;

const noteEls = [...document.querySelectorAll(".note")];
const capEls = SB.captions.map((_, i) => $(`#cap${i}`));
const soapEls = [...document.querySelectorAll("#soap span")];
const moodWordEls = [...document.querySelectorAll("#moodWords span")];
const promiseEls = [...document.querySelectorAll("#promise p")];

// ———————————————————————————————————— the phone screen

const dev = SB.device;
const S = dev.scale;
const VH = dev.height - dev.statusBar - dev.homeBar;
const canvas = $("#screen");
canvas.width = dev.width * S;
canvas.height = dev.height * S;
const ctx = canvas.getContext("2d");
const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });

const cache = new Map();
function load(src) {
  if (!cache.has(src)) {
    const img = new Image();
    img.src = src;
    cache.set(src, img.decode().then(() => img, () => null));
    if (cache.size > 160) cache.delete(cache.keys().next().value);
  }
  return cache.get(src);
}

function frameSrc(clip, t) {
  const m = MF.clips[clip];
  if (!m) return null;
  const f = clamp(Math.round(t * SB.fps), m.first, m.last);
  return `build/clips/${clip}/${f}.jpg`;
}

/** Whether a band of the frame (its top or bottom row) is dark, so the status bar can flip to white. */
function isDark(img, row) {
  const key = row === 0 ? "_darkTop" : "_darkBottom";
  if (img[key] === undefined) {
    probe.drawImage(img, 0, row, img.width, 1, 0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    img[key] = 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
  }
  return img[key];
}

function drawFrame(img, dx, alpha = 1, bandImg = img) {
  const W = dev.width * S;
  const top = dev.statusBar * S;
  const vh = VH * S;
  ctx.globalAlpha = alpha;
  // The app's own background continues under the status bar and home bar. A scrolled page
  // keeps the band it started with, as an opaque status bar would.
  ctx.drawImage(bandImg, 0, 0, W, 1, dx, 0, W, top + 1);
  ctx.drawImage(img, 0, 0, W, vh, dx, top, W, vh);
  ctx.drawImage(img, 0, vh - 1, W, 1, dx, top + vh - 1, W, dev.homeBar * S + 1);
  ctx.globalAlpha = 1;
}

function drawChrome(darkTop, darkBottom) {
  ctx.save();
  ctx.scale(S, S);
  const fg = darkTop ? "#fff" : "#111";
  ctx.fillStyle = "#000";
  roundRect(dev.width / 2 - 62, 11, 124, 36, 18);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = "600 17px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(dev.clock, 66, 30);
  // signal
  const sx = dev.width - 98;
  [4, 6.5, 9, 11.5].forEach((h, i) => {
    roundRect(sx + i * 5, 35.5 - h, 3.2, h, 1);
    ctx.fill();
  });
  // wifi
  ctx.strokeStyle = fg;
  ctx.lineCap = "round";
  ctx.lineWidth = 2.2;
  const wx = dev.width - 69;
  for (const r of [3.5, 7.5, 11.5]) {
    ctx.beginPath();
    ctx.arc(wx, 36, r, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
  }
  // battery
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  roundRect(dev.width - 54, 24.5, 25, 12, 3.5);
  ctx.stroke();
  roundRect(dev.width - 28.5, 28.5, 1.8, 4, 0.8);
  ctx.fill();
  ctx.globalAlpha = 1;
  roundRect(dev.width - 52, 26.5, 19, 8, 2);
  ctx.fill();
  // home indicator
  ctx.fillStyle = darkBottom ? "rgba(255,255,255,0.85)" : "rgba(17,17,17,0.85)";
  roundRect(dev.width / 2 - 67, dev.height - 13, 134, 5, 2.5);
  ctx.fill();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** A soft fingertip: presses in just before the tap lands, then releases outward. */
function drawTap(tap, t) {
  const t0 = tap.t - 0.22;
  const p = prog(t, t0, t0 + 0.72);
  if (p <= 0 || p >= 1) return;
  const press = ease.out(clamp(p / 0.3));
  const release = ease.out(clamp((p - 0.3) / 0.7));
  const r = lerp(lerp(40, 30, press), 64, release);
  const a = press * (1 - release);
  ctx.save();
  ctx.scale(S, S);
  ctx.translate(tap.x, tap.y + dev.statusBar);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${(0.42 * a).toFixed(3)})`;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = `rgba(38,37,33,${(0.32 * a).toFixed(3)})`;
  ctx.stroke();
  ctx.restore();
}

const scrolls = new Set(SB.clips.filter((c) => (c.actions ?? []).some((a) => a.type === "scroll")).map((c) => c.id));
const bandFor = (clip, t) => load(frameSrc(clip, scrolls.has(clip) ? 0 : t));

async function paintScreen(t) {
  const segs = SB.phone;
  let i = -1;
  for (let k = 0; k < segs.length; k++) if (segs[k].at <= t) i = k;
  if (i < 0) return;
  const cur = segs[i];
  const prev = segs[i - 1];
  const dur = cur.enter === "slide" ? 0.36 : 0.26;
  const x = prev && cur.enter ? prog(t, cur.at, cur.at + dur) : 1;

  const [curImg, prevImg, curBand, prevBand] = await Promise.all([
    load(frameSrc(cur.clip, t)),
    x < 1 ? load(frameSrc(prev.clip, t)) : null,
    bandFor(cur.clip, t),
    x < 1 ? bandFor(prev.clip, t) : null,
  ]);
  const W = canvas.width;
  ctx.fillStyle = "#FBFAF7";
  ctx.fillRect(0, 0, W, canvas.height);

  if (prevImg && x < 1 && cur.enter === "slide") {
    const e = ease.inOut(x);
    drawFrame(prevImg, -e * W * 0.3, 1, prevBand ?? prevImg);
    ctx.fillStyle = `rgba(20,20,18,${(0.14 * e).toFixed(3)})`;
    ctx.fillRect(0, 0, W, canvas.height);
    const dx = (1 - e) * W;
    const g = ctx.createLinearGradient(dx - 40, 0, dx, 0);
    g.addColorStop(0, "rgba(38,37,33,0)");
    g.addColorStop(1, "rgba(38,37,33,0.18)");
    ctx.fillStyle = g;
    ctx.fillRect(dx - 40, 0, 40, canvas.height);
    if (curImg) drawFrame(curImg, dx, 1, curBand ?? curImg);
  } else {
    if (prevImg && x < 1) drawFrame(prevImg, 0, 1, prevBand ?? prevImg);
    if (curImg) drawFrame(curImg, 0, prevImg && x < 1 ? ease.sine(x) : 1, curBand ?? curImg);
  }

  for (const tap of MF.clips[cur.clip]?.taps ?? []) drawTap(tap, t);
  const ref = curImg ?? prevImg;
  drawChrome(ref ? isDark(ref, 0) : false, ref ? isDark(ref, ref.height - 1) : false);

  // Warm the cache for the frames just ahead.
  for (let k = 1; k <= 3; k++) {
    const src = frameSrc(cur.clip, t + k / SB.fps);
    if (src) load(src);
  }
}

const flow = SB.clips.find((c) => c.id === "flow");
const ZOOMS = (flow?.actions ?? []).filter((a) => a.type === "type").map((a) => [a.t - 0.3, a.until + 0.62]);

function phoneTransform(t) {
  const enter = ease.out(prog(t, 8.6, 9.55));
  const exit = ease.in(prog(t, 45.0, 45.7));
  let z = 0;
  for (const [a, b] of ZOOMS) z = Math.max(z, ease.inOut(prog(t, a, a + 0.6)) * (1 - ease.inOut(prog(t, b - 0.6, b))));
  const ty = (1 - enter) * 1500 + exit * 1650 - 46 * z + Math.sin(t * 0.8) * 5 * (1 - z);
  const rot = (1 - enter) * 7 - exit * 4;
  return `translateY(${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${(1 + 0.13 * z).toFixed(4)})`;
}

// ———————————————————————————————————— frame

function glowIntensity(t) {
  let k = ease.sine(prog(t, HOOK_END - 0.1, HOOK_END + 1.6));
  k *= 1 + 0.25 * ease.sine(prog(t, 9.0, 10.0)) * (1 - prog(t, 14.25, 15.0));
  k *= 1 + 0.35 * ease.sine(prog(t, 27.0, 27.8)) * (1 - ease.sine(prog(t, 31.3, 32.2)));
  return k;
}

function paintBackground(t, accent) {
  const k = glowIntensity(t);
  const a = $("#glowA");
  const b = $("#glowB");
  const c = $("#glowC");
  a.style.cssText = `left:${-220 + Math.sin(t * 0.21) * 50}px;top:${-640 + Math.cos(t * 0.17) * 40}px;width:1520px;height:1520px;background:radial-gradient(circle, ${rgba(accent, 0.3 * k)} 0%, transparent 62%);transform:scale(${1 + 0.05 * Math.sin(t * 0.33)})`;
  b.style.cssText = `left:${420 + Math.cos(t * 0.19) * 40}px;top:${1180 + Math.sin(t * 0.23) * 50}px;width:1100px;height:1100px;background:radial-gradient(circle, ${rgba(accent, 0.2 * k)} 0%, transparent 60%)`;
  c.style.cssText = `left:${-520 + Math.sin(t * 0.15) * 40}px;top:${700 + Math.cos(t * 0.27) * 50}px;width:1000px;height:1000px;background:radial-gradient(circle, ${rgba(accent, 0.12 * k)} 0%, transparent 60%)`;
}

function paintHook(t) {
  const hook = $("#hook");
  const out = ease.out(prog(t, HOOK_END, HOOK_END + 0.7));
  if (out >= 1) {
    hook.style.display = "none";
    return;
  }
  hook.style.display = "";
  hook.style.opacity = (1 - out).toFixed(4);
  hook.style.filter = out > 0 ? `blur(${(40 * out).toFixed(2)}px)` : "none";
  hook.style.transform = `scale(${(1 + 0.035 * Math.min(t, HOOK_END) / HOOK_END + 0.06 * out).toFixed(4)})`;

  const th = Math.min(t, HOOK_END); // the noise freezes the instant stillness arrives
  let buzz = 0;
  noteEls.forEach((el, k) => {
    const at = ARRIVALS[k];
    if (th < at) {
      el.style.visibility = "hidden";
      return;
    }
    let slot = 0;
    for (let j = k + 1; j < ARRIVALS.length; j++) if (th >= ARRIVALS[j]) slot += ease.out(prog(th, ARRIVALS[j], ARRIVALS[j] + 0.26));
    const e = prog(th, at, at + 0.3);
    const y = 520 + slot * 170 - 40 * (1 - ease.out(e));
    const fade = 1 - prog(y, 1060, 1300);
    el.style.visibility = fade <= 0 ? "hidden" : "visible";
    el.style.opacity = (ease.out(clamp(e * 2)) * fade).toFixed(3);
    el.style.transform = `translateY(${y.toFixed(1)}px) scale(${(0.93 + 0.07 * ease.back(e)).toFixed(4)})`;
    const since = th - at;
    if (since < 0.22) buzz += Math.sin(since * Math.PI * 2 * 26) * 8 * (1 - since / 0.22);
  });
  $("#notes").style.transform = `translateX(${buzz.toFixed(2)}px)`;
  show($("#hookLine"), t, 0.5, null, { dur: 0.8, dist: 40 });
}

function paintStill(t) {
  const halo = $("#stillHalo");
  const op = ease.sine(prog(t, HOOK_END + 0.2, HOOK_END + 1.4)) * (1 - ease.sine(prog(t, 5.5, 6.0)));
  halo.style.opacity = op.toFixed(3);
  halo.style.transform = `scale(${(1 + 0.05 * Math.sin(((t - 3) * Math.PI * 2) / 4)).toFixed(4)})`;
  halo.style.background = "radial-gradient(circle, rgba(225,245,238,0.95) 0%, rgba(225,245,238,0.4) 45%, transparent 70%)";
  show($("#still1"), t, HOOK_END + 0.3, 5.9, { dur: 0.9, dist: 34, blur: 14 });
  show($("#still2"), t, HOOK_END + 0.6, 5.9, { dur: 0.9, dist: 34, blur: 14 });
}

function paintMark(prefix, t, t0, tOut) {
  const icon = $(`#${prefix}Icon`);
  const b = tOut == null ? 0 : ease.in(prog(t, tOut - 0.4, tOut));
  const bloom = prog(t, t0, t0 + 0.75);
  icon.style.opacity = (ease.out(clamp(bloom / 0.55)) * (1 - b)).toFixed(4);
  icon.style.transform = `translateY(${(-24 * b).toFixed(2)}px) scale(${(0.6 + 0.4 * ease.back(bloom)).toFixed(4)})`;
  const halo = $(`#${prefix}Halo`);
  halo.style.opacity = (ease.out(prog(t, t0 + 0.1, t0 + 0.9)) * (1 - b)).toFixed(4);
  halo.style.transform = `translateY(${(-24 * b).toFixed(2)}px) scale(${(1 + 0.045 * Math.sin(((t - t0) * Math.PI * 2) / 4)).toFixed(4)})`;
  const r = prog(t, t0 + 0.2, t0 + 1.6);
  const ring = $(`#${prefix}Ring`);
  ring.style.opacity = r > 0 && r < 1 ? (0.55 * (1 - ease.out(r))).toFixed(3) : "0";
  ring.style.transform = `scale(${(0.85 + 1.25 * ease.out(r)).toFixed(4)})`;
}

function paintBrand(t) {
  const brand = $("#brand");
  const live = t > 5.8 && t < 9.0;
  brand.style.display = live ? "" : "none";
  if (!live) return;
  paintMark("brand", t, 6.0, 8.8);
  show($("#brandWord"), t, 6.35, 8.8, { dist: 36, blur: 14 });
  show($("#brandTag"), t, 6.7, 8.8);
  show($("#brandSub"), t, 7.1, 8.8);
}

function pillStyle(state, accent) {
  if (state === "active") return { bg: [...accent, 1], fg: [255, 255, 255, 1] };
  if (state === "done") return { bg: [...accent, 0.15], fg: [...accent, 1] };
  return { bg: [38, 37, 33, 0.08], fg: [108, 106, 95, 1] };
}
const stepState = (i, step) => (step >= 5 || i < step ? "done" : i === step ? "active" : "todo");

const MOOD_ROLL = 176;

function paintCaptions(t, accent) {
  document.documentElement.style.setProperty("--accent", rgba(accent));

  // Mood caption
  const moodCap = $("#moodCap");
  const moodLive = t > 9.0 && t < 15.1;
  moodCap.style.display = moodLive ? "" : "none";
  if (moodLive) {
    show($("#moodKicker"), t, 9.2, 14.95);
    show($("#moodHead"), t, 9.28, 14.95);
    $("#moodKicker").style.color = rgba(accent);
    // The mood word rolls through a clipped slot like a ticker, so two words never overlap.
    SB.moods.forEach((m, k) => {
      const el = moodWordEls[k];
      const next = SB.moods[k + 1]?.at;
      let y;
      let op;
      let blur;
      if (k === 0) {
        const a = ease.outQuint(prog(t, 9.42, 10.0));
        [y, op, blur] = [(1 - a) * 60, a, (1 - a) * 10];
      } else {
        const a = ease.inOut(prog(t, m.at, m.at + 0.42));
        [y, op, blur] = [(1 - a) * MOOD_ROLL, t >= m.at ? 1 : 0, Math.sin(Math.PI * a) * 5];
      }
      if (next != null) {
        const b = ease.inOut(prog(t, next, next + 0.42));
        y -= b * MOOD_ROLL;
        blur += Math.sin(Math.PI * b) * 5;
        if (b >= 1) op = 0;
      } else {
        const b = ease.in(prog(t, 14.57, 14.95));
        op *= 1 - b;
        y -= b * 22;
      }
      el.style.opacity = op.toFixed(4);
      el.style.visibility = op < 0.001 ? "hidden" : "visible";
      el.style.transform = `translateY(${y.toFixed(2)}px)`;
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
    });
  }

  // Step and feature captions
  SB.captions.forEach((c, i) => {
    const el = capEls[i];
    const live = t > c.from - 0.05 && t < c.to + 0.05;
    el.style.display = live ? "" : "none";
    if (!live) return;
    [...el.children].forEach((child, j) => show(child, t, c.from + 0.08 * j, c.to, { dur: 0.7 }));
  });

  // S · O · A · P
  const soap = $("#soap");
  const steps = SB.captions.filter((c) => c.step);
  const first = steps[0];
  const last = steps[steps.length - 1];
  const op = show(soap, t, first.from, last.to, { dist: 20 });
  if (op > 0) {
    let curStep = 1;
    let prevStep = 1;
    let since = 1;
    for (const c of steps) {
      if (t >= c.from) {
        prevStep = curStep;
        curStep = c.step;
        since = prog(t, c.from, c.from + 0.25);
      }
    }
    soapEls.forEach((el, k) => {
      const from = pillStyle(stepState(k + 1, prevStep), accent);
      const to = pillStyle(stepState(k + 1, curStep), accent);
      const x = ease.sine(since);
      const bg = mix(from.bg, to.bg, x);
      const fg = mix(from.fg, to.fg, x);
      el.style.background = rgba(bg.slice(0, 3), bg[3]);
      el.style.color = rgba(fg.slice(0, 3), fg[3]);
      const pop = stepState(k + 1, curStep) === "active" ? Math.sin(Math.PI * clamp(since)) * 0.12 : 0;
      el.style.transform = `scale(${(1 + pop).toFixed(4)})`;
    });
  }
}

function paintPromise(t) {
  const p = SB.promises;
  $("#promise").style.display = t > p.from - 0.1 && t < p.to + 0.05 ? "" : "none";
  promiseEls.forEach((el, i) => show(el, t, p.from + i * p.step, p.to, { dur: 0.8, dist: 34, blur: 12 }));
}

function paintCta(t) {
  const t0 = SB.cta.from;
  $("#cta").style.display = t > t0 - 0.05 ? "" : "none";
  if (t < t0 - 0.05) return;
  paintMark("cta", t, t0, null);
  show($("#ctaWord"), t, t0 + 0.4, null, { dist: 36, blur: 14 });
  show($("#ctaHead"), t, t0 + 0.9, null);
  const btn = $("#ctaBtn");
  show(btn, t, t0 + 1.45, null, { dist: 30, scale: 0.06 });
  const pulse = 1 + 0.018 * Math.sin(Math.max(0, t - (t0 + 2.4)) * Math.PI * 2 / 2.4) * prog(t, t0 + 2.4, t0 + 3.0);
  if (t > t0 + 2.2) btn.style.transform = `scale(${pulse.toFixed(4)})`;
  show($("#ctaFine"), t, t0 + 1.95, null);
  if ($("#ctaUrl")) show($("#ctaUrl"), t, t0 + 2.3, null);
}

async function renderAt(t) {
  const accent = accentAt(t);
  paintBackground(t, accent);
  paintHook(t);
  paintStill(t);
  paintBrand(t);
  paintCaptions(t, accent);
  paintPromise(t);
  paintCta(t);

  const phone = $("#phone");
  const live = t >= 8.6 && t <= 45.75;
  phone.style.display = live ? "" : "none";
  if (live) {
    phone.style.transform = phoneTransform(t);
    await paintScreen(t);
  }
}

// ———————————————————————————————————— boot

await Promise.all(
  ["300 236px Inter", "400 40px Inter", "500 40px Inter", "600 40px Inter", "500 80px Lora", "italic 500 80px Lora", "italic 400 40px Lora", "600 17px Inter"].map((f) =>
    document.fonts.load(f),
  ),
);
await document.fonts.ready;

window.seek = renderAt;
window.__ready = true;

const params = new URLSearchParams(location.search);
if (params.has("play")) {
  const start = performance.now() - Number(params.get("play") || 0) * 1000;
  const loop = async () => {
    const t = ((performance.now() - start) / 1000) % SB.duration;
    await renderAt(t);
    requestAnimationFrame(loop);
  };
  loop();
} else {
  await renderAt(Number(params.get("t") ?? 0));
}
