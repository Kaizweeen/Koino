import type { ThemeSlug } from "@/lib/themes";

/**
 * A passage on screen: the part of a devotion that is scripture, and all a screen showing the
 * verse actually needs. A verse the reader chose for themselves has no date, theme, or curated
 * reflection, so the screens they share with the daily devotion ask only for this.
 */
export interface Verse {
  verseRef: string;
  verseText: string;
}

export interface Devotion extends Verse {
  date: string;       // YYYY-MM-DD
  theme: ThemeSlug;
  reflection: string;
  prayer: string;
}
