export type ThemeSlug =
  | "peace" | "gratitude" | "hope" | "lament" | "surrender" | "awe"
  | "joy" | "repentance" | "strength" | "comfort" | "love" | "longing";

/**
 * A theme, or `"open"` — the mood a verse carries when the reader chose the verse themselves and
 * named no feeling for it. The twelve themes stay the shape of the daily devotion; "open" exists
 * only so a self-chosen passage has a colour and a name to wear.
 */
export type MoodSlug = ThemeSlug | "open";

export interface Theme {
  slug: MoodSlug;
  name: string;
  definition: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  icon: string;
}

export const THEMES: Record<ThemeSlug, Theme> = {
  peace:      { slug: "peace",      name: "Peace",      definition: "Resting in God's nearness instead of striving.", accent: "#0F6E56", accentSoft: "#E1F5EE", accentBorder: "#9FE1CB", icon: "ripple" },
  gratitude:  { slug: "gratitude",  name: "Gratitude",  definition: "Naming and thanking God for his gifts.",          accent: "#854F0B", accentSoft: "#FAEEDA", accentBorder: "#FAC775", icon: "sun" },
  hope:       { slug: "hope",       name: "Hope",       definition: "Looking forward to God's promises.",              accent: "#185FA5", accentSoft: "#E6F1FB", accentBorder: "#B5D4F4", icon: "sunrise" },
  lament:     { slug: "lament",     name: "Lament",     definition: "Bringing grief honestly before God.",             accent: "#534AB7", accentSoft: "#EEEDFE", accentBorder: "#CECBF6", icon: "cloud-rain" },
  surrender:  { slug: "surrender",  name: "Surrender",  definition: "Yielding control and trusting God.",              accent: "#0F6E56", accentSoft: "#E1F5EE", accentBorder: "#9FE1CB", icon: "hand-stop" },
  awe:        { slug: "awe",        name: "Awe",        definition: "Standing small before God's greatness.",          accent: "#0C447C", accentSoft: "#E6F1FB", accentBorder: "#85B7EB", icon: "mountain" },
  joy:        { slug: "joy",        name: "Joy",        definition: "Celebrating God's goodness.",                     accent: "#993C1D", accentSoft: "#FAECE7", accentBorder: "#F5C4B3", icon: "sparkles" },
  repentance: { slug: "repentance", name: "Repentance", definition: "Turning back to God with humility.",              accent: "#5F5E5A", accentSoft: "#F1EFE8", accentBorder: "#D3D1C7", icon: "flame" },
  strength:   { slug: "strength",   name: "Strength",   definition: "Drawing courage from God's steadiness.",          accent: "#3B6D11", accentSoft: "#EAF3DE", accentBorder: "#C0DD97", icon: "shield" },
  comfort:    { slug: "comfort",    name: "Comfort",    definition: "Receiving God's nearness in pain.",               accent: "#185FA5", accentSoft: "#E6F1FB", accentBorder: "#B5D4F4", icon: "feather" },
  love:       { slug: "love",       name: "Love",       definition: "Resting in and reflecting God's love.",           accent: "#993556", accentSoft: "#FBEAF0", accentBorder: "#F4C0D1", icon: "heart" },
  longing:    { slug: "longing",    name: "Longing",    definition: "Seeking and waiting on God.",                     accent: "#26215C", accentSoft: "#EEEDFE", accentBorder: "#AFA9EC", icon: "compass" },
};

/**
 * What a verse you chose for yourself wears: Koino's own green, and a name that says whose verse
 * it is rather than naming a feeling you never claimed. Deliberately outside THEMES — it is not a
 * thirteenth theme, it never comes up on a day of its own, and it does not belong in the explorer.
 */
export const OPEN_THEME: Theme = {
  slug: "open",
  name: "Your verse",
  definition: "A passage you chose to sit with.",
  accent: "#0F6E56",
  accentSoft: "#E1F5EE",
  accentBorder: "#9FE1CB",
  icon: "book-2",
};

export function getTheme(slug: ThemeSlug): Theme {
  return THEMES[slug];
}

/** The palette for a mood, which is either one of the twelve themes or the neutral "open". */
export function getMood(slug: MoodSlug): Theme {
  return slug === "open" ? OPEN_THEME : THEMES[slug];
}

/**
 * Whether a stored or query-string value names a mood we know.
 *
 * `hasOwnProperty` rather than `in`, because `in` walks the prototype chain: `?m=toString` would
 * otherwise pass here and hand `getMood` a function to read an accent off.
 */
export function isMoodSlug(value: unknown): value is MoodSlug {
  return typeof value === "string" && (value === "open" || Object.prototype.hasOwnProperty.call(THEMES, value));
}
