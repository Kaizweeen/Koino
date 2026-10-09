// Shared helpers for the promo scripts.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const BUILD = path.join(HERE, "build");
export const storyboard = JSON.parse(fs.readFileSync(path.join(HERE, "storyboard.json"), "utf8"));

/** Playwright isn't a dependency of the app, so fall back to a global install. */
export async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const root = execSync("npm root -g").toString().trim();
    return await import(pathToFileURL(path.join(root, "playwright", "index.mjs")).href);
  }
}

/** Seeded PRNG so every render of the video is identical. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".css": "text/css" };

/** A tiny static server for the promo folder (the composition fetches its JSON and frames). */
export function serve(root, port = 0) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const file = path.join(root, rel === "/" ? "composition.html" : rel);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(port, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}
