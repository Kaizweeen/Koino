import { DEVOTIONS } from "@/lib/devotions/content";
import type { Devotion } from "@/lib/devotions/types";
import type { ThemeSlug } from "@/lib/themes";

export interface Plan {
  slug: string;
  title: string;
  subtitle: string;
  theme: ThemeSlug;
}

// Plans are curated journeys built from the existing (verified) devotion content, grouped by the
// theme that carries them. No new Scripture is authored here, so every day is accurate.
export const PLANS: Plan[] = [
  { slug: "rest", title: "Beginning in Rest", subtitle: "Verses to steady a restless heart.", theme: "peace" },
  { slug: "honest", title: "Honest with God", subtitle: "Bringing grief and doubt into the open.", theme: "lament" },
  { slug: "gifts", title: "Counting the Gifts", subtitle: "Learning, slowly, to give thanks.", theme: "gratitude" },
  { slug: "courage", title: "Strength for the Day", subtitle: "Where real courage comes from.", theme: "strength" },
  { slug: "wonder", title: "The Bigness of God", subtitle: "Standing small before his greatness.", theme: "awe" },
  { slug: "held", title: "When You're Hurting", subtitle: "God drawing near in pain.", theme: "comfort" },
  { slug: "forward", title: "A Reason to Hope", subtitle: "Leaning into what God has promised.", theme: "hope" },
];

export function getPlan(slug: string): Plan | null {
  return PLANS.find((p) => p.slug === slug) ?? null;
}

/** The devotions that make up a plan, in date order. */
export function getPlanDevotions(plan: Plan, devotions: Devotion[] = DEVOTIONS): Devotion[] {
  return devotions.filter((d) => d.theme === plan.theme).sort((a, b) => a.date.localeCompare(b.date));
}

/** Only the plans that actually have devotions behind them, safe to surface in the UI. */
export function availablePlans(devotions: Devotion[] = DEVOTIONS): Plan[] {
  return PLANS.filter((p) => getPlanDevotions(p, devotions).length > 0);
}
