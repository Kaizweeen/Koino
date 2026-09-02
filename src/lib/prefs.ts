import { markStorageFailed, readRaw, writeRaw } from "@/lib/storage";
import { DEFAULT_VERSION, isVersionId } from "@/lib/bible/versions";

const KEY = "koino.prefs.v1";

export type ThemePref = "system" | "light" | "dark";
export type TextSize = "regular" | "large";

export interface Prefs {
  onboarded: boolean;
  theme: ThemePref;
  textSize: TextSize;
  /** Which bundled translation the reader opens in — a `BIBLE_VERSIONS` id. */
  bibleVersion: string;
}

const DEFAULT: Prefs = {
  onboarded: false,
  theme: "system",
  textSize: "regular",
  bibleVersion: DEFAULT_VERSION.id,
};

export function loadPrefs(): Prefs {
  const raw = readRaw(KEY);
  if (!raw) return { ...DEFAULT };
  try {
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      onboarded: p.onboarded === true,
      theme: p.theme === "light" || p.theme === "dark" ? p.theme : "system",
      textSize: p.textSize === "large" ? "large" : "regular",
      // A translation this build no longer ships falls back rather than leaving the reader
      // requesting chapters that are not there.
      bibleVersion: isVersionId(p.bibleVersion) ? p.bibleVersion : DEFAULT.bibleVersion,
    };
  } catch {
    return { ...DEFAULT };
  }
}

function save(p: Prefs): Prefs {
  if (!writeRaw(KEY, JSON.stringify(p))) markStorageFailed();
  return p;
}

export function setOnboarded(onboarded = true): Prefs {
  return save({ ...loadPrefs(), onboarded });
}

export function setThemePref(theme: ThemePref): Prefs {
  const next = save({ ...loadPrefs(), theme });
  applyPrefs(next);
  return next;
}

export function setTextSize(textSize: TextSize): Prefs {
  const next = save({ ...loadPrefs(), textSize });
  applyPrefs(next);
  return next;
}

export function setBibleVersion(bibleVersion: string): Prefs {
  return save({
    ...loadPrefs(),
    bibleVersion: isVersionId(bibleVersion) ? bibleVersion : DEFAULT.bibleVersion,
  });
}

/** Resolve "system" against the OS and stamp data-theme / data-text on <html>. */
export function applyPrefs(p: Prefs = loadPrefs()): void {
  if (typeof document === "undefined") return;
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = p.theme === "dark" || (p.theme === "system" && prefersDark);
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.text = p.textSize === "large" ? "large" : "regular";
}
