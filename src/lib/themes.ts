export type ThemeSlug =
  | "peace" | "gratitude" | "hope" | "lament" | "surrender" | "awe"
  | "joy" | "repentance" | "strength" | "comfort" | "love" | "longing";

export interface Theme {
  slug: ThemeSlug;
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

export function getTheme(slug: ThemeSlug): Theme {
  return THEMES[slug];
}
