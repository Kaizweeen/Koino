/**
 * Builds the offline Bible data from the World English Bible USFX source.
 *
 * Koino's CSP is `connect-src 'self'` and the README commits to no third-party runtime requests,
 * so the text cannot be fetched from a Bible API at read time — it has to be served from Koino's
 * own origin. This script turns the single upstream USFX file into one small JSON file per
 * chapter under public/bible/, which the reader lazy-loads: opening Psalm 46 costs one ~4 KB
 * request rather than the ~4.5 MB the whole Bible would.
 *
 * The WEB is public domain ("it can be freely copied, distributed, and redistributed without any
 * payment of royalties" — WEB preface), which is why it can ship inside the app at all. Keep it
 * as the translation unless a replacement is also public domain; the mainstream modern
 * translations (NIV, ESV, NASB, NLT) are all under copyright and cannot be bundled.
 *
 * Run: npm run build:bible
 * Output is committed, so this only needs re-running to correct or update the text.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_URL = "https://raw.githubusercontent.com/seven1m/open-bibles/master/eng-web.usfx.xml";
const CACHE = join(ROOT, "node_modules", ".cache", "eng-web.usfx.xml");
const OUT_DIR = join(ROOT, "public", "bible");
const BOOKS_MODULE = join(ROOT, "src", "lib", "bible", "books.ts");

/**
 * The 66 canonical books, in order, keyed by USFX book id. The source also carries a preface, a
 * glossary, and the deuterocanonical books; those are dropped so the reader matches the canon the
 * devotions draw from. `name` is the display name — note Psalms, whose devotion references use
 * the singular "Psalm" (see src/lib/bible/refs.ts).
 */
const BOOKS = [
  ["GEN", "Genesis", "ot"], ["EXO", "Exodus", "ot"], ["LEV", "Leviticus", "ot"],
  ["NUM", "Numbers", "ot"], ["DEU", "Deuteronomy", "ot"], ["JOS", "Joshua", "ot"],
  ["JDG", "Judges", "ot"], ["RUT", "Ruth", "ot"], ["1SA", "1 Samuel", "ot"],
  ["2SA", "2 Samuel", "ot"], ["1KI", "1 Kings", "ot"], ["2KI", "2 Kings", "ot"],
  ["1CH", "1 Chronicles", "ot"], ["2CH", "2 Chronicles", "ot"], ["EZR", "Ezra", "ot"],
  ["NEH", "Nehemiah", "ot"], ["EST", "Esther", "ot"], ["JOB", "Job", "ot"],
  ["PSA", "Psalms", "ot"], ["PRO", "Proverbs", "ot"], ["ECC", "Ecclesiastes", "ot"],
  ["SNG", "Song of Solomon", "ot"], ["ISA", "Isaiah", "ot"], ["JER", "Jeremiah", "ot"],
  ["LAM", "Lamentations", "ot"], ["EZK", "Ezekiel", "ot"], ["DAN", "Daniel", "ot"],
  ["HOS", "Hosea", "ot"], ["JOL", "Joel", "ot"], ["AMO", "Amos", "ot"],
  ["OBA", "Obadiah", "ot"], ["JON", "Jonah", "ot"], ["MIC", "Micah", "ot"],
  ["NAM", "Nahum", "ot"], ["HAB", "Habakkuk", "ot"], ["ZEP", "Zephaniah", "ot"],
  ["HAG", "Haggai", "ot"], ["ZEC", "Zechariah", "ot"], ["MAL", "Malachi", "ot"],
  ["MAT", "Matthew", "nt"], ["MRK", "Mark", "nt"], ["LUK", "Luke", "nt"],
  ["JHN", "John", "nt"], ["ACT", "Acts", "nt"], ["ROM", "Romans", "nt"],
  ["1CO", "1 Corinthians", "nt"], ["2CO", "2 Corinthians", "nt"], ["GAL", "Galatians", "nt"],
  ["EPH", "Ephesians", "nt"], ["PHP", "Philippians", "nt"], ["COL", "Colossians", "nt"],
  ["1TH", "1 Thessalonians", "nt"], ["2TH", "2 Thessalonians", "nt"], ["1TI", "1 Timothy", "nt"],
  ["2TI", "2 Timothy", "nt"], ["TIT", "Titus", "nt"], ["PHM", "Philemon", "nt"],
  ["HEB", "Hebrews", "nt"], ["JAS", "James", "nt"], ["1PE", "1 Peter", "nt"],
  ["2PE", "2 Peter", "nt"], ["1JN", "1 John", "nt"], ["2JN", "2 John", "nt"],
  ["3JN", "3 John", "nt"], ["JUD", "Jude", "nt"], ["REV", "Revelation", "nt"],
];

const CANONICAL = new Map(BOOKS.map(([id, name, testament]) => [id, { name, testament }]));

async function loadSource() {
  if (existsSync(CACHE)) return readFileSync(CACHE, "utf8");
  process.stdout.write(`fetching ${SOURCE_URL}\n`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`source fetch failed: HTTP ${res.status}`);
  const xml = await res.text();
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, xml);
  return xml;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(text) {
  return text.replace(/&(?:([a-z]+)|#(\d+)|#x([0-9a-f]+));/gi, (whole, name, dec, hex) => {
    if (name) return ENTITIES[name.toLowerCase()] ?? whole;
    return String.fromCodePoint(parseInt(dec ?? hex, dec ? 10 : 16));
  });
}

const tidy = (text) =>
  decode(text)
    .replace(/\s+/g, " ")
    // The source puts a space before punctuation where a stripped footnote used to sit.
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

/**
 * Walks the USFX tag stream and collects verse text.
 *
 * USFX marks a verse as a `<v id="n"/>` … `<ve/>` pair rather than a container, so the text of a
 * verse is everything between those two markers, across whatever paragraph and poetry elements
 * happen to fall inside. Footnotes (`<f>`) and cross-references (`<x>`) sit inline in that same
 * span and are dropped wholesale — they are editorial apparatus, not scripture, and reading them
 * mid-sentence is exactly the kind of clutter this app should not have.
 */
function parse(xml) {
  const books = new Map();
  let book = null;
  let chapter = null;
  let verse = null;
  let buffer = "";
  let skipDepth = 0;
  let cursor = 0;

  const flush = () => {
    if (book && chapter && verse !== null) {
      const text = tidy(buffer);
      if (text) {
        const chapters = books.get(book);
        const verses = chapters.get(chapter) ?? [];
        // A verse can be interrupted and resumed (poetry, a chapter of mixed prose), so append
        // rather than overwrite when the same number comes back around.
        const existing = verses.find((v) => v.n === verse);
        if (existing) existing.t = `${existing.t} ${text}`.trim();
        else verses.push({ n: verse, t: text });
        chapters.set(chapter, verses);
      }
    }
    buffer = "";
  };

  while (cursor < xml.length) {
    const open = xml.indexOf("<", cursor);
    if (open === -1) {
      if (skipDepth === 0) buffer += xml.slice(cursor);
      break;
    }
    if (skipDepth === 0) buffer += xml.slice(cursor, open);

    const close = xml.indexOf(">", open);
    if (close === -1) break;
    const raw = xml.slice(open + 1, close);
    cursor = close + 1;

    const selfClosing = raw.endsWith("/");
    const closing = raw.startsWith("/");
    const name = raw.replace(/^\//, "").split(/[\s/>]/)[0];

    // Footnotes and cross-references are skipped as whole subtrees.
    if (name === "f" || name === "x") {
      if (closing) skipDepth = Math.max(0, skipDepth - 1);
      else if (!selfClosing) skipDepth += 1;
      continue;
    }
    if (skipDepth > 0) continue;

    if (name === "book") {
      flush();
      const id = /id="([^"]+)"/.exec(raw)?.[1] ?? null;
      book = CANONICAL.has(id) ? id : null;
      chapter = null;
      verse = null;
      if (book && !books.has(book)) books.set(book, new Map());
      continue;
    }
    if (name === "c") {
      flush();
      verse = null;
      const id = /id="([^"]+)"/.exec(raw)?.[1];
      chapter = id ? Number.parseInt(id, 10) : null;
      if (book && chapter && !books.get(book).has(chapter)) books.get(book).set(chapter, []);
      continue;
    }
    if (name === "v") {
      flush();
      const id = /id="([^"]+)"/.exec(raw)?.[1] ?? "";
      // Merged verses appear as "1-2"; anchor them at the first number.
      const n = Number.parseInt(id, 10);
      verse = Number.isNaN(n) ? null : n;
      continue;
    }
    if (name === "ve") {
      flush();
      verse = null;
      continue;
    }
    // Every other element (p, q, wj, add, ref, k, qs, …) contributes its text, so nothing is done
    // here beyond letting the tag itself fall away.
  }
  flush();
  return books;
}

const xml = await loadSource();
const parsed = parse(xml);

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];
let fileCount = 0;
let verseCount = 0;

for (const [id, name, testament] of BOOKS) {
  const chapters = parsed.get(id);
  if (!chapters || chapters.size === 0) throw new Error(`no chapters parsed for ${id}`);
  const numbers = [...chapters.keys()].sort((a, b) => a - b);
  const expected = numbers.length;
  if (numbers[0] !== 1 || numbers[expected - 1] !== expected) {
    throw new Error(`${id}: chapters are not a contiguous 1..n range (got ${numbers.join(",")})`);
  }

  mkdirSync(join(OUT_DIR, id), { recursive: true });
  for (const number of numbers) {
    const verses = chapters.get(number).sort((a, b) => a.n - b.n);
    if (verses.length === 0) throw new Error(`${id} ${number}: no verses`);
    writeFileSync(
      join(OUT_DIR, id, `${number}.json`),
      JSON.stringify({ book: id, chapter: number, verses }),
    );
    fileCount += 1;
    verseCount += verses.length;
  }
  manifest.push({ id, name, testament, chapters: expected });
}

const generated = `/**
 * Generated by scripts/build-bible.mjs — do not edit by hand.
 *
 * Metadata only (66 entries); the verse text lives in public/bible/<book>/<chapter>.json and is
 * fetched a chapter at a time. Run \`npm run build:bible\` to regenerate.
 */
export type Testament = "ot" | "nt";

export interface BibleBook {
  /** USFX book id, e.g. "PSA" — also the directory name under public/bible. */
  id: string;
  name: string;
  testament: Testament;
  chapters: number;
}

/** The 66 canonical books, in canonical order. */
export const BIBLE_BOOKS: readonly BibleBook[] = ${JSON.stringify(manifest, null, 2)};

/** The translation shipped in public/bible — public domain, hence bundleable. */
export const TRANSLATION = "World English Bible";
export const TRANSLATION_SHORT = "WEB";
`;

mkdirSync(dirname(BOOKS_MODULE), { recursive: true });
writeFileSync(BOOKS_MODULE, generated);

process.stdout.write(
  `wrote ${fileCount} chapter files (${verseCount} verses) across ${manifest.length} books\n`,
);
