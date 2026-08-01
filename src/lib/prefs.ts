const KEY = "koino.prefs.v1";

export interface Prefs {
  onboarded: boolean;
}

const DEFAULT: Prefs = { onboarded: false };

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { onboarded: parsed.onboarded === true };
  } catch {
    return { ...DEFAULT };
  }
}

function save(p: Prefs): Prefs {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

export function setOnboarded(onboarded = true): Prefs {
  return save({ ...loadPrefs(), onboarded });
}
