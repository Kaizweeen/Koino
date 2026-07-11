import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

export function getDevotionForDate(devotions: Devotion[], date: string): Devotion | null {
  return devotions.find((d) => d.date === date) ?? null;
}

export function getTodayDevotion(devotions: Devotion[], today: string): Devotion {
  if (devotions.length === 0) throw new Error("no devotions available");
  const exact = getDevotionForDate(devotions, today);
  if (exact) return exact;
  const past = devotions.filter((d) => d.date <= today);
  if (past.length > 0) return past[past.length - 1];
  return devotions[0];
}

function dayIndex(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

export function getPlaylistId(theme: Theme, date: string): string {
  if (theme.playlistIds.length === 0) throw new Error("no playlists for theme");
  const ids = theme.playlistIds;
  return ids[dayIndex(date) % ids.length];
}
