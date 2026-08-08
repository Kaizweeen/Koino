import type { Devotion } from "@/lib/devotions/types";

export function getDevotionForDate(devotions: Devotion[], date: string): Devotion | null {
  return devotions.find((d) => d.date === date) ?? null;
}

/**
 * The devotion a person would have seen on a given date: an exact match, else the most recent
 * prior devotion, else the earliest. Used for "today" and for resolving past journal entries so
 * an entry never orphans when the content has no devotion dated exactly to that day.
 */
export function getDevotionShownOn(devotions: Devotion[], date: string): Devotion {
  if (devotions.length === 0) throw new Error("no devotions available");
  const exact = getDevotionForDate(devotions, date);
  if (exact) return exact;
  const last = devotions[devotions.length - 1];
  // Past the curated calendar, rotate deterministically through the whole pool by day-index so a
  // fresh devotion appears every day and the app never "runs out" of content.
  if (date > last.date) return devotions[dayIndex(date) % devotions.length];
  const past = devotions.filter((d) => d.date <= date);
  if (past.length > 0) return past[past.length - 1];
  return devotions[0];
}

export function getTodayDevotion(devotions: Devotion[], today: string): Devotion {
  return getDevotionShownOn(devotions, today);
}

function dayIndex(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

/** The devotions for a set of saved dates, most recent first; unknown dates are skipped. */
export function getSavedDevotions(devotions: Devotion[], favorites: string[]): Devotion[] {
  return [...favorites]
    .sort()
    .reverse()
    .map((date) => getDevotionForDate(devotions, date))
    .filter((d): d is Devotion => d !== null);
}
