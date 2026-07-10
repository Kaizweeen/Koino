import type { ThemeSlug } from "@/lib/themes";

export interface Devotion {
  date: string;       // YYYY-MM-DD
  verseRef: string;
  verseText: string;
  theme: ThemeSlug;
  reflection: string;
  prayer: string;
}
