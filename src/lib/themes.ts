export type ThemeSlug =
  | "peace" | "gratitude" | "hope" | "lament" | "surrender" | "awe"
  | "joy" | "repentance" | "strength" | "comfort" | "love" | "longing";

export interface Theme {
  slug: ThemeSlug;
  name: string;
  definition: string;
  moodProfile: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  icon: string;
  playlistIds: string[];
}

export const THEMES: Record<ThemeSlug, Theme> = {
  peace:      { slug: "peace",      name: "Peace",      definition: "Resting in God's nearness instead of striving.", moodProfile: "Ambient, slow, soft instrumental worship.", accent: "#0F6E56", accentSoft: "#E1F5EE", accentBorder: "#9FE1CB", icon: "ripple",      playlistIds: ["37i9dQZF1DWZqd5JICZI0u"] },
  gratitude:  { slug: "gratitude",  name: "Gratitude",  definition: "Naming and thanking God for his gifts.",          moodProfile: "Warm, gentle, acoustic, major-key.",        accent: "#854F0B", accentSoft: "#FAEEDA", accentBorder: "#FAC775", icon: "sun",         playlistIds: ["37i9dQZF1DX5trt9i14X7j"] },
  hope:       { slug: "hope",       name: "Hope",       definition: "Looking forward to God's promises.",              moodProfile: "Building, hopeful, light.",                 accent: "#185FA5", accentSoft: "#E6F1FB", accentBorder: "#B5D4F4", icon: "sunrise",     playlistIds: ["37i9dQZF1DX2sUQwD7tbmL"] },
  lament:     { slug: "lament",     name: "Lament",     definition: "Bringing grief honestly before God.",             moodProfile: "Sparse, minor, reflective, room to breathe.", accent: "#534AB7", accentSoft: "#EEEDFE", accentBorder: "#CECBF6", icon: "cloud-rain",  playlistIds: ["37i9dQZF1DWVrtsSlLKzro"] },
  surrender:  { slug: "surrender",  name: "Surrender",  definition: "Yielding control and trusting God.",              moodProfile: "Tender, yielding, contemplative.",          accent: "#0F6E56", accentSoft: "#E1F5EE", accentBorder: "#9FE1CB", icon: "hand-stop",   playlistIds: ["37i9dQZF1DWUvQoIOFMFUT"] },
  awe:        { slug: "awe",        name: "Awe",        definition: "Standing small before God's greatness.",          moodProfile: "Expansive, reverent, cinematic.",           accent: "#0C447C", accentSoft: "#E6F1FB", accentBorder: "#85B7EB", icon: "mountain",    playlistIds: ["37i9dQZF1DX4PP3DA4J0N8"] },
  joy:        { slug: "joy",        name: "Joy",        definition: "Celebrating God's goodness.",                     moodProfile: "Upbeat, bright, rhythmic.",                 accent: "#993C1D", accentSoft: "#FAECE7", accentBorder: "#F5C4B3", icon: "sparkles",    playlistIds: ["37i9dQZF1DX9wa6XirBPv8"] },
  repentance: { slug: "repentance", name: "Repentance", definition: "Turning back to God with humility.",              moodProfile: "Quiet, honest, stripped-back.",             accent: "#5F5E5A", accentSoft: "#F1EFE8", accentBorder: "#D3D1C7", icon: "flame",       playlistIds: ["37i9dQZF1DX1s9knjP51Oa"] },
  strength:   { slug: "strength",   name: "Strength",   definition: "Drawing courage from God's steadiness.",          moodProfile: "Steady, grounding, anthemic.",              accent: "#3B6D11", accentSoft: "#EAF3DE", accentBorder: "#C0DD97", icon: "shield",      playlistIds: ["37i9dQZF1DX0jgyAiPl8Af"] },
  comfort:    { slug: "comfort",    name: "Comfort",    definition: "Receiving God's nearness in pain.",               moodProfile: "Enveloping, soothing, soft pads.",          accent: "#185FA5", accentSoft: "#E6F1FB", accentBorder: "#B5D4F4", icon: "feather",     playlistIds: ["37i9dQZF1DWXe9gFZP0gtP"] },
  love:       { slug: "love",       name: "Love",       definition: "Resting in and reflecting God's love.",           moodProfile: "Warm, intimate, melodic.",                  accent: "#993556", accentSoft: "#FBEAF0", accentBorder: "#F4C0D1", icon: "heart",       playlistIds: ["37i9dQZF1DWVUhXYrJfk1c"] },
  longing:    { slug: "longing",    name: "Longing",    definition: "Seeking and waiting on God.",                     moodProfile: "Yearning, open, atmospheric.",              accent: "#26215C", accentSoft: "#EEEDFE", accentBorder: "#AFA9EC", icon: "compass",     playlistIds: ["37i9dQZF1DWSiZVO2J6WeI"] },
};

export function getTheme(slug: ThemeSlug): Theme {
  return THEMES[slug];
}
