import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/devotions/content.ts", import.meta.url), "utf8");
const entries = [...src.matchAll(/verseRef:\s*"([^"]+)"[\s\S]*?verseText:\s*"((?:[^"\\]|\\.)*)"/g)]
  .map((m) => ({ ref: m[1], text: m[2].replace(/\\"/g, '"') }));

const norm = (s) =>
  s.toLowerCase().replace(/[‘’“”]/g, "'").replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ").trim();

let flagged = 0;
for (const { ref, text } of entries) {
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=web`);
  if (!res.ok) {
    console.log(`?? ${ref}: HTTP ${res.status}`);
    flagged++;
    continue;
  }
  const data = await res.json();
  const api = norm(data.text ?? "");
  const ours = norm(text);
  if (api.includes(ours)) {
    console.log(`ok ${ref}`);
  } else {
    console.log(`!! ${ref}\n   ours: ${text}\n   web : ${(data.text ?? "").trim().replace(/\s+/g, " ")}`);
    flagged++;
  }
  await new Promise((r) => setTimeout(r, 300));
}
console.log(`\n${flagged} of ${entries.length} flagged`);
// Verse text matching the WEB translation is a product constraint, so a mismatch has to fail
// loudly rather than scroll past in a log.
if (flagged > 0) process.exitCode = 1;
