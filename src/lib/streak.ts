export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365] as const;

export interface Milestone {
  days: number;
  title: string;
}

const TITLES: Record<number, string> = {
  3: "Three days of showing up.",
  7: "A full week with God.",
  14: "Two steady weeks.",
  30: "A month of daily devotion.",
  50: "Fifty days. A real rhythm.",
  100: "One hundred days of faithfulness.",
  200: "Two hundred days.",
  365: "A full year with God.",
};

/** A milestone when the streak has just reached a notable number, otherwise null. */
export function milestoneFor(streak: number): Milestone | null {
  if (!(STREAK_MILESTONES as readonly number[]).includes(streak)) return null;
  return { days: streak, title: TITLES[streak] };
}
