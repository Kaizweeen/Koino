function addDays(date: string, delta: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + delta * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** The n calendar days ending at `today`, oldest first (length n, inclusive). */
export function lastNDays(today: string, n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) days.push(addDays(today, -i));
  return days;
}

const INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/** Single-letter weekday label for an ISO date (Sun→"S", Mon→"M", …). */
export function weekdayInitial(isoDate: string): string {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return INITIALS[day];
}
