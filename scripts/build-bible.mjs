/**
 * Builds the offline Bible data for every translation Koino ships.
 *
 * Koino's CSP is `connect-src 'self'` and the README commits to no third-party runtime requests,
 * so the text cannot be fetched from a Bible API at read time — it has to be served from Koino's
 * own origin. This script turns each upstream file into one small JSON file per chapter under
 * public/bible/<version>/, which the reader lazy-loads: opening Psalm 46 costs one ~4 KB request
 * rather than the ~4.5 MB a whole translation would.
 *
 * Every translation here must be public domain, because that is the only reason it can ship inside
 * the app at all. The mainstream modern translations (NIV, ESV, NASB, NLT) are all under copyright
 * and cannot be bundled, however much a reader might want them — adding one is a licensing
 * question, not a technical one.
 *
 * Adding a translation is one entry in VERSIONS below plus a re-run: the picker, the preference,
 * and the service worker all read from the generated manifest.
 *
 * Run: npm run build:bible
 * Output is committed, so this only needs re-running to correct, update, or add a translation.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_BASE = "https://raw.githubusercontent.com/seven1m/open-bibles/master";
const CACHE_DIR = join(ROOT, "node_modules", ".cache", "open-bibles");
const OUT_DIR = join(ROOT, "public", "bible");
const BOOKS_MODULE = join(ROOT, "src", "lib", "bible", "books.ts");

/**
 * The translations Koino ships, in the order the picker offers them. The first is the default.
 *
 * `id` is the URL segment under public/bible and the value stored in a person's preferences, so it
 * is a permanent identifier: renaming one silently resets everybody's choice. `blurb` is the line
 * under the name in Settings, and `notice` is the rights line set under a chapter.
 */
const VERSIONS = [
  {
    id: "web",
    name: "World English Bible",
    short: "WEB",
    blurb: "Modern English, close to the wording of the older literal translations.",
    notice: "public domain",
    format: "usfx",
    file: "eng-web.usfx.xml",
  },
  {
    id: "kjv",
    name: "King James Version",
    short: "KJV",
    blurb: "The Authorized Version of 1611, in its standard 1769 text.",
    // Public domain worldwide except the UK, where the Crown holds a perpetual patent. Koino
    // only displays the text, which that patent does not restrict, but the notice stays honest.
    notice: "public domain, Crown copyright in the UK",
    format: "osis",
    file: "eng-kjv.osis.xml",
  },
  {
    id: "bsb",
    name: "Berean Standard Bible",
    short: "BSB",
    blurb: "Contemporary English, translated for readability.",
    notice: "public domain",
    format: "usfx",
    file: "eng-bsb.usfx.xml",
  },
];

/**
 * The 66 canonical books, in order, keyed by USFX book id. The sources also carry a preface, a
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

/**
 * OSIS names the books differently from USFX ("Ps" rather than "PSA"), so an OSIS source is mapped
 * onto the USFX ids the rest of the app uses. Anything absent here — every deuterocanonical book,
 * which the KJV source does carry — is skipped.
 */
const OSIS_BOOK_IDS = new Map(Object.entries({
  Gen: "GEN", Exod: "EXO", Lev: "LEV", Num: "NUM", Deut: "DEU", Josh: "JOS", Judg: "JDG",
  Ruth: "RUT", "1Sam": "1SA", "2Sam": "2SA", "1Kgs": "1KI", "2Kgs": "2KI", "1Chr": "1CH",
  "2Chr": "2CH", Ezra: "EZR", Neh: "NEH", Esth: "EST", Job: "JOB", Ps: "PSA", Prov: "PRO",
  Eccl: "ECC", Song: "SNG", Isa: "ISA", Jer: "JER", Lam: "LAM", Ezek: "EZK", Dan: "DAN",
  Hos: "HOS", Joel: "JOL", Amos: "AMO", Obad: "OBA", Jonah: "JON", Mic: "MIC", Nah: "NAM",
  Hab: "HAB", Zeph: "ZEP", Hag: "HAG", Zech: "ZEC", Mal: "MAL", Matt: "MAT", Mark: "MRK",
  Luke: "LUK", John: "JHN", Acts: "ACT", Rom: "ROM", "1Cor": "1CO", "2Cor": "2CO", Gal: "GAL",
  Eph: "EPH", Phil: "PHP", Col: "COL", "1Thess": "1TH", "2Thess": "2TH", "1Tim": "1TI",
  "2Tim": "2TI", Titus: "TIT", Phlm: "PHM", Heb: "HEB", Jas: "JAS", "1Pet": "1PE", "2Pet": "2PE",
  "1John": "1JN", "2John": "2JN", "3John": "3JN", Jude: "JUD", Rev: "REV",
}));

/**
 * The traditional divisions, used to group the book list so finding a book is a glance down a
 * short section rather than a scan of 66 names. Each entry names the first book of a division;
 * a book belongs to the last division that opened at or before it.
 */
const SECTION_STARTS = [
  ["GEN", "Law"],
  ["JOS", "History"],
  ["JOB", "Wisdom"],
  ["ISA", "Major Prophets"],
  ["HOS", "Minor Prophets"],
  ["MAT", "Gospels"],
  ["ACT", "Acts"],
  ["ROM", "Paul's Letters"],
  ["HEB", "General Letters"],
  ["REV", "Revelation"],
];

const SECTION_BY_BOOK = (() => {
  const starts = new Map(SECTION_STARTS);
  const result = new Map();
  let current = null;
  for (const [id] of BOOKS) {
    current = starts.get(id) ?? current;
    result.set(id, current);
  }
  return result;
})();

async function loadSource(file) {
  const cache = join(CACHE_DIR, file);
  if (existsSync(cache)) return readFileSync(cache, "utf8");
  const url = `${SOURCE_BASE}/${file}`;
  process.stdout.write(`fetching ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`source fetch failed: HTTP ${res.status}`);
  const xml = await res.text();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cache, xml);
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
 * Reads one attribute out of a raw tag body, e.g. attr('id="3" n="4"', "n") === "4".
 *
 * Anchored to a word boundary so that asking for `id` on an OSIS `<verse osisID="…" n="…"/>`
 * comes back empty rather than matching the tail of `osisID`.
 */
const attr = (raw, name) => new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(raw)?.[1];

/** The element name of a raw tag body, with any leading slash removed. */
const tagName = (raw) => raw.replace(/^\//, "").split(/[\s/>]/)[0];

/**
 * Accumulates verses as a parser walks a source file.
 *
 * Both source formats mark a verse as a start/end pair rather than a container, so the text of a
 * verse is everything between those two markers, across whatever paragraph and poetry elements
 * happen to fall inside. This collects those runs and resolves them into a finished verse; the
 * format-specific walkers below decide only which tag means what.
 */
function collector() {
  const books = new Map();
  /**
   * Headings that sit outside the numbered verses, keyed "BOOK.chapter", each tagged with the
   * verse it introduces.
   *
   * Nearly always this is a psalm's superscription ("A Psalm by David…") standing before verse 1.
   * Psalm 119 is the exception that shapes the model: it carries twenty-two of them, one per
   * Hebrew-letter stanza, so a single title per chapter would label the whole psalm "Taw".
   */
  const headings = new Map();

  let book = null;
  let chapter = null;
  let verse = null;
  /**
   * Runs of the verse being read. A run is either text (flagged for whether it is spoken by Jesus)
   * or a marker opening a new poetic line.
   */
  let segments = [];
  let pendingHeadings = [];

  /**
   * Locates the words of Jesus inside the finished verse text.
   *
   * Rather than track offsets through normalisation — which rewrites whitespace and so shifts
   * every position — each red-letter run is tidied the same way the whole verse was and then found
   * in it. A run that cannot be found means the two normalisations disagreed, which would silently
   * mislocate the red text, so it throws instead. Runs separated only by whitespace are merged:
   * a footnote dropped from the middle of a quotation leaves two elements that are really one
   * continuous thing Jesus said.
   */
  const redLetters = (text) => {
    const ranges = [];
    let searchFrom = 0;
    for (const segment of segments) {
      if (segment.marker || !segment.wj) continue;
      const piece = tidy(segment.text);
      if (!piece) continue;
      const start = text.indexOf(piece, searchFrom);
      if (start === -1) throw new Error(`words of Jesus not located in verse: ${piece.slice(0, 60)}`);
      const end = start + piece.length;
      searchFrom = end;
      const previous = ranges[ranges.length - 1];
      if (previous && text.slice(previous[1], start).trim() === "") previous[1] = end;
      else ranges.push([start, end]);
    }
    return ranges;
  };

  /**
   * Locates each poetic line inside the finished verse text.
   *
   * Roughly two thirds of the Bible's poetry — the Psalms, Proverbs, Job, much of the prophets —
   * is written in lines, and running those together as prose loses the parallelism the poetry
   * is built on. Lines are found the same way the words of Jesus are: tidy the line's own text and
   * find it in the tidied verse, throwing rather than guessing if the two disagree.
   *
   * Returns [offset, indentLevel] pairs, plus a third element when a stanza break precedes the
   * line. An empty result means the verse is prose.
   */
  const poetryLines = (text) => {
    const lines = [];
    let current = null;
    for (const segment of segments) {
      if (segment.marker) {
        if (current) lines.push(current);
        current = { level: segment.level, spaced: segment.spaced, text: "" };
      } else if (current) {
        current.text += segment.text;
      }
    }
    if (current) lines.push(current);

    const result = [];
    let searchFrom = 0;
    let previousLevel = null;
    let previousEnd = -1;
    for (const line of lines) {
      const piece = tidy(line.text);
      if (!piece) continue;
      const start = text.indexOf(piece, searchFrom);
      if (start === -1) throw new Error(`poetic line not located in verse: ${piece.slice(0, 60)}`);
      const end = start + piece.length;
      searchFrom = end;
      // A same-level line resuming exactly where the previous one ended is one visual line split
      // by markup (a dropped footnote, an inline element), not a new one.
      if (previousLevel === line.level && start === previousEnd && !line.spaced) {
        previousEnd = end;
        continue;
      }
      result.push(line.spaced ? [start, line.level, 1] : [start, line.level]);
      previousLevel = line.level;
      previousEnd = end;
    }
    return result;
  };

  const flush = () => {
    if (book && chapter && verse !== null) {
      const text = tidy(segments.map((s) => (s.marker ? "" : s.text)).join(""));
      if (text) {
        const ranges = redLetters(text);
        const lines = poetryLines(text);
        const chapters = books.get(book);
        const verses = chapters.get(chapter) ?? [];
        // A verse can be interrupted and resumed (poetry, a chapter of mixed prose), so append
        // rather than overwrite when the same number comes back around.
        const existing = verses.find((v) => v.n === verse);
        if (existing) {
          const offset = existing.t.length + 1;
          existing.t = `${existing.t} ${text}`.trim();
          existing.w.push(...ranges.map(([a, b]) => [a + offset, b + offset]));
          existing.q.push(...lines.map((line) => [line[0] + offset, ...line.slice(1)]));
        } else {
          verses.push({ n: verse, t: text, w: ranges, q: lines });
        }
        chapters.set(chapter, verses);
      }
    }
    segments = [];
  };

  return {
    openBook(id) {
      flush();
      book = CANONICAL.has(id) ? id : null;
      chapter = null;
      verse = null;
      pendingHeadings = [];
      if (book && !books.has(book)) books.set(book, new Map());
    },
    openChapter(number) {
      flush();
      verse = null;
      pendingHeadings = [];
      chapter = Number.isFinite(number) ? number : null;
      if (book && chapter && !books.get(book).has(chapter)) books.get(book).set(chapter, []);
    },
    openVerse(number) {
      flush();
      verse = Number.isFinite(number) ? number : null;
      if (pendingHeadings.length > 0 && book && chapter && verse !== null) {
        const key = `${book}.${chapter}`;
        const list = headings.get(key) ?? [];
        list.push(...pendingHeadings.map((t) => ({ v: verse, t })));
        headings.set(key, list);
      }
      pendingHeadings = [];
    },
    closeVerse() {
      flush();
      verse = null;
    },
    /** True once a verse is open, which is when line markers and text are worth keeping. */
    inVerse: () => verse !== null,
    text(value, wj) {
      segments.push({ text: value, wj });
    },
    lineMark(level, spaced) {
      segments.push({ marker: true, level, spaced });
    },
    /** Held until the next verse opens, which is the verse this heading introduces. */
    heading(value) {
      if (value) pendingHeadings.push(value);
    },
    end() {
      flush();
      return { books, headings };
    },
  };
}

/**
 * Walks a tag stream, handing each tag and each run of text to `onTag` and `onText`.
 *
 * Both formats are read this way rather than with an XML parser: the files are 5–18 MB of markup
 * whose only interesting parts are a handful of elements, and a linear scan keeps this script
 * dependency-free.
 */
function walk(xml, { onText, onTag }) {
  let cursor = 0;
  while (cursor < xml.length) {
    const open = xml.indexOf("<", cursor);
    if (open === -1) {
      onText(xml.slice(cursor));
      break;
    }
    onText(xml.slice(cursor, open));

    const close = xml.indexOf(">", open);
    if (close === -1) break;
    const raw = xml.slice(open + 1, close);
    cursor = close + 1;

    onTag(raw, {
      name: tagName(raw),
      closing: raw.startsWith("/"),
      selfClosing: raw.endsWith("/"),
    });
  }
}

/**
 * USFX, the format the World English Bible and the Berean Standard Bible are published in.
 *
 * Footnotes (`<f>`) and cross-references (`<x>`) sit inline in the middle of a verse and are
 * dropped wholesale — they are editorial apparatus, not scripture, and reading them mid-sentence
 * is exactly the kind of clutter this app should not have. So are the parallel-passage lines
 * (`<p sfm="r">`) and the book titles (`<p sfm="mt">`) the BSB carries.
 */
function parseUsfx(xml) {
  const out = collector();
  let wjDepth = 0;
  /** Depth of the <f>/<x> subtree being discarded, or 0. */
  let skipDepth = 0;
  /** Inside a <p> whose style makes it apparatus rather than scripture. */
  let skippingParagraph = false;
  /** Indent level of the <q> currently open, or 0 in prose. */
  let qLevel = 0;
  /** A <b/> stanza break seen but not yet attached to the line that follows it. */
  let pendingBreak = false;
  /** Element name that opened the heading being read, and the text collected inside it. */
  let headingTag = null;
  let headingBuffer = "";

  /** Paragraph styles that are apparatus rather than scripture, and the ones that are headings. */
  const paragraphStyle = (raw) => attr(raw, "sfm") ?? attr(raw, "style") ?? "";
  const isSkippedParagraph = (style) => style === "r" || style.startsWith("mt");
  const isHeadingParagraph = (style) => style === "qa" || style.startsWith("ms");

  walk(xml, {
    onText(text) {
      if (skipDepth > 0 || skippingParagraph) return;
      if (headingTag) headingBuffer += text;
      else out.text(text, wjDepth > 0);
    },
    onTag(raw, { name, closing, selfClosing }) {
      // Footnotes and cross-references are skipped as whole subtrees, wherever they sit.
      if (name === "f" || name === "x") {
        if (closing) skipDepth = Math.max(0, skipDepth - 1);
        else if (!selfClosing) skipDepth += 1;
        return;
      }
      if (skipDepth > 0) return;

      // A paragraph carrying apparatus rather than scripture: the parallel-passage line the BSB
      // prints under a section title, and the book titles. Skipped up to its own close.
      if (skippingParagraph) {
        if (name === "p" && closing) skippingParagraph = false;
        return;
      }
      if (name === "p" && !closing && !selfClosing && isSkippedParagraph(paragraphStyle(raw))) {
        skippingParagraph = true;
        return;
      }

      // The words of Jesus, carried through so the reader can set them in red.
      if (name === "wj") {
        if (closing) wjDepth = Math.max(0, wjDepth - 1);
        else if (!selfClosing) wjDepth += 1;
        return;
      }

      // Headings standing outside the numbered verses: a psalm's superscription (<d>), a section
      // title (<s>), and the Psalter's book divisions and Psalm 119's Hebrew letters (<p sfm="qa">).
      if (headingTag) {
        if (closing && name === headingTag) {
          out.heading(tidy(headingBuffer));
          headingTag = null;
          headingBuffer = "";
        }
        // Markup inside a heading contributes its text and nothing else.
        return;
      }
      if (
        !closing &&
        !selfClosing &&
        (name === "d" || name === "s" || (name === "p" && isHeadingParagraph(paragraphStyle(raw))))
      ) {
        headingTag = name;
        headingBuffer = "";
        return;
      }

      // Poetic lines. Each <q> opens a line; level 2 is the indented half of a couplet.
      if (name === "q") {
        if (closing) {
          qLevel = 0;
        } else if (!selfClosing) {
          qLevel = Number.parseInt(attr(raw, "level") ?? "1", 10);
          if (out.inVerse()) {
            out.lineMark(qLevel, pendingBreak);
            pendingBreak = false;
          }
        }
        return;
      }

      // A stanza break, attached to whichever line comes next.
      if (name === "b") {
        pendingBreak = true;
        return;
      }

      if (name === "book") {
        out.openBook(attr(raw, "id") ?? null);
        wjDepth = 0;
        qLevel = 0;
        pendingBreak = false;
        headingTag = null;
        return;
      }
      if (name === "c") {
        out.openChapter(Number.parseInt(attr(raw, "id") ?? "", 10));
        qLevel = 0;
        pendingBreak = false;
        return;
      }
      if (name === "v") {
        // Merged verses appear as "1-2"; anchor them at the first number.
        out.openVerse(Number.parseInt(attr(raw, "id") ?? "", 10));
        // A verse opening inside a <q> begins on that line, so it needs the marker the <q> could
        // not push while there was no verse in progress to attach it to.
        if (out.inVerse() && qLevel > 0) {
          out.lineMark(qLevel, pendingBreak);
          pendingBreak = false;
        }
        return;
      }
      if (name === "ve") {
        out.closeVerse();
        return;
      }
      // Every other element (add, ref, k, qs, w, …) contributes its text, so nothing is done here
      // beyond letting the tag itself fall away.
    },
  });

  return out.end();
}

/**
 * OSIS, the format the King James Version is published in.
 *
 * Structurally simpler than USFX: the footnotes are already stripped upstream, and verses, chapters
 * and red letters are all milestone pairs rather than containers.
 *
 * The poetry markup is deliberately ignored. The source marks lines in the Psalms and nowhere else
 * — not Proverbs, not Job, not the prophets — so honouring it would set one book as verse and the
 * rest of the same poetry as prose. The KJV is traditionally typeset as running prose with verse
 * numbers, which is what this produces instead.
 */
function parseOsis(xml) {
  const out = collector();
  let wjDepth = 0;
  let skipDepth = 0;
  /** "psalm" while reading a superscription, "skip" while reading a title to discard. */
  let titleKind = null;
  let titleBuffer = "";

  walk(xml, {
    onText(text) {
      if (skipDepth > 0) return;
      if (titleKind === "psalm") titleBuffer += text;
      else if (titleKind) return;
      else out.text(text, wjDepth > 0);
    },
    onTag(raw, { name, closing, selfClosing }) {
      // The whole header block is metadata about the translation, not the translation.
      if (name === "header") {
        if (closing) skipDepth = Math.max(0, skipDepth - 1);
        else if (!selfClosing) skipDepth += 1;
        return;
      }
      if (skipDepth > 0) return;

      if (name === "title") {
        if (closing) {
          if (titleKind === "psalm") out.heading(tidy(titleBuffer));
          titleKind = null;
          titleBuffer = "";
        } else if (!selfClosing) {
          // Only a psalm's superscription is scripture; the book titles and running heads are not.
          titleKind = attr(raw, "type") === "psalm" ? "psalm" : "skip";
          titleBuffer = "";
        }
        return;
      }
      if (titleKind) return;

      // The words of Jesus, as a milestone pair: <q who="Jesus" sID=…/> … <q eID=…/>.
      if (name === "q") {
        if (attr(raw, "who") === "Jesus") wjDepth += 1;
        else if (attr(raw, "eID") !== undefined) wjDepth = Math.max(0, wjDepth - 1);
        return;
      }

      if (name === "div") {
        if (attr(raw, "type") !== "book") return;
        out.openBook(OSIS_BOOK_IDS.get(attr(raw, "osisID") ?? "") ?? null);
        wjDepth = 0;
        return;
      }
      if (name === "chapter") {
        if (attr(raw, "eID") !== undefined) out.openChapter(NaN);
        else out.openChapter(Number.parseInt(attr(raw, "n") ?? "", 10));
        return;
      }
      if (name === "verse") {
        if (attr(raw, "eID") !== undefined) out.closeVerse();
        else out.openVerse(Number.parseInt(attr(raw, "n") ?? "", 10));
        return;
      }
      // <transChange> marks the words the translators supplied, which the KJV sets in italics;
      // <lb/>, <p>, <lg> and <l> are layout. All of them contribute their text and nothing else.
    },
  });

  return out.end();
}

const PARSERS = { usfx: parseUsfx, osis: parseOsis };

/** Reads one translation and writes its chapter files, returning what it found. */
async function buildVersion(version) {
  const xml = await loadSource(version.file);
  const { books: parsed, headings } = PARSERS[version.format](xml);

  const versionDir = join(OUT_DIR, version.id);
  mkdirSync(versionDir, { recursive: true });

  const chapterCounts = new Map();
  let fileCount = 0;
  let verseCount = 0;
  let redLetterCount = 0;
  let poetryCount = 0;
  let headingCount = 0;

  for (const [id] of BOOKS) {
    const chapters = parsed.get(id);
    if (!chapters || chapters.size === 0) throw new Error(`${version.id}: no chapters parsed for ${id}`);
    const numbers = [...chapters.keys()].sort((a, b) => a - b);
    const expected = numbers.length;
    if (numbers[0] !== 1 || numbers[expected - 1] !== expected) {
      throw new Error(`${version.id} ${id}: chapters are not a contiguous 1..n range (got ${numbers.join(",")})`);
    }
    chapterCounts.set(id, expected);

    mkdirSync(join(versionDir, id), { recursive: true });
    for (const number of numbers) {
      const verses = chapters.get(number)
        .sort((a, b) => a.n - b.n)
        // Most verses carry no words of Jesus and are not poetry; empty arrays in each of 31,098 of
        // them are pure weight on the wire, so each field appears only where there is something in it.
        .map(({ n, t, w, q }) => ({ n, t, ...(w.length > 0 && { w }), ...(q.length > 0 && { q }) }));
      if (verses.length === 0) throw new Error(`${version.id} ${id} ${number}: no verses`);
      const chapterHeadings = headings.get(`${id}.${number}`);
      writeFileSync(
        join(versionDir, id, `${number}.json`),
        JSON.stringify({ book: id, chapter: number, ...(chapterHeadings && { headings: chapterHeadings }), verses }),
      );
      fileCount += 1;
      verseCount += verses.length;
      redLetterCount += verses.filter((v) => v.w).length;
      poetryCount += verses.filter((v) => v.q).length;
      headingCount += chapterHeadings?.length ?? 0;
    }
  }

  return { chapterCounts, fileCount, verseCount, redLetterCount, poetryCount, headingCount };
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

/**
 * Chapter counts come from the default translation and every other one has to agree with it,
 * because the book list, the chapter grid and every deep link are shared across versions: a
 * translation that divided a book differently would offer chapters the reader could not open.
 */
let canonicalCounts = null;

for (const version of VERSIONS) {
  const built = await buildVersion(version);

  if (!canonicalCounts) {
    canonicalCounts = built.chapterCounts;
  } else {
    for (const [id, count] of canonicalCounts) {
      const found = built.chapterCounts.get(id);
      if (found !== count) {
        throw new Error(
          `${version.id} ${id}: ${found} chapters, but ${VERSIONS[0].id} has ${count} — ` +
            "the versions must divide every book the same way",
        );
      }
    }
  }

  process.stdout.write(
    `${version.short}: ${built.fileCount} chapter files, ${built.verseCount} verses, ` +
      `${built.redLetterCount} with words of Jesus, ${built.poetryCount} poetic, ` +
      `${built.headingCount} headings\n`,
  );
}

const manifest = BOOKS.map(([id, name, testament]) => ({
  id,
  name,
  testament,
  section: SECTION_BY_BOOK.get(id),
  chapters: canonicalCounts.get(id),
}));

const versionManifest = VERSIONS.map(({ id, name, short, blurb, notice }) => ({
  id,
  name,
  short,
  blurb,
  notice,
}));

const generated = `/**
 * Generated by scripts/build-bible.mjs — do not edit by hand.
 *
 * Metadata only (66 books, ${VERSIONS.length} translations); the verse text lives in
 * public/bible/<version>/<book>/<chapter>.json and is fetched a chapter at a time. Run
 * \`npm run build:bible\` to regenerate.
 */
export type Testament = "ot" | "nt";

export interface BibleBook {
  /** USFX book id, e.g. "PSA" — also the directory name under public/bible/<version>. */
  id: string;
  name: string;
  testament: Testament;
  /** Traditional division: Law, History, Wisdom, Gospels, Paul's Letters, and so on. */
  section: string;
  chapters: number;
}

export interface BibleSection {
  name: string;
  testament: Testament;
  books: BibleBook[];
}

export interface BibleVersion {
  /** URL segment under public/bible, and the value stored in a person's preferences. */
  id: string;
  /** Full name, e.g. "World English Bible". */
  name: string;
  /** Abbreviation for tight spaces, e.g. "WEB". */
  short: string;
  /** One line describing how it reads, for the picker. */
  blurb: string;
  /** Rights line set under a chapter. */
  notice: string;
}

/** The 66 canonical books, in canonical order. */
export const BIBLE_BOOKS: readonly BibleBook[] = ${JSON.stringify(manifest, null, 2)};

/** The same books grouped into their traditional divisions, in canonical order. */
export const BIBLE_SECTIONS: readonly BibleSection[] = BIBLE_BOOKS.reduce<BibleSection[]>(
  (sections, book) => {
    const open = sections[sections.length - 1];
    if (open && open.name === book.section) open.books.push(book);
    else sections.push({ name: book.section, testament: book.testament, books: [book] });
    return sections;
  },
  [],
);

/**
 * The translations shipped in public/bible, in the order the picker offers them.
 *
 * All public domain — that is the whole reason they can ship inside the app. See
 * scripts/build-bible.mjs to add one.
 */
export const BIBLE_VERSIONS: readonly BibleVersion[] = ${JSON.stringify(versionManifest, null, 2)};

/** The translation a reader gets before they choose one. */
export const DEFAULT_VERSION_ID = ${JSON.stringify(VERSIONS[0].id)};
`;

mkdirSync(dirname(BOOKS_MODULE), { recursive: true });
writeFileSync(BOOKS_MODULE, generated);

process.stdout.write(`wrote ${VERSIONS.length} translations across ${manifest.length} books\n`);
