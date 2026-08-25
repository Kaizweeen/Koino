/**
 * localStorage access that cannot throw.
 *
 * Browsers reject `setItem` in more situations than is obvious: Safari in Private Browsing, iOS
 * when the origin's quota is exhausted, and any browser configured to block site data all raise
 * on write. Koino keeps a person's entire practice — streak, journal, favorites — in localStorage,
 * and an unguarded write would surface as a crashed error boundary in the middle of a devotion.
 * Here a failed write degrades to a session that simply is not persisted, which is recoverable;
 * the caller learns about it from the return value and can tell the person their work is not
 * being saved.
 */

export function readRaw(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Persist a value. Returns false when storage is unavailable or full. */
export function writeRaw(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

let storageFailed = false;

/** True once any write has been rejected in this session. Drives the "not saving" notice. */
export function hasStorageFailed(): boolean {
  return storageFailed;
}

export function markStorageFailed(): void {
  storageFailed = true;
}

/** Test seam: clears the sticky failure flag. */
export function resetStorageFailed(): void {
  storageFailed = false;
}

const PROBE_KEY = "koino.probe";

/**
 * Whether this browser will actually keep what we write. Probed with a throwaway key on mount so
 * a person is told their practice is not being saved before they spend a devotion writing into it,
 * rather than after the work is already lost.
 */
export function isStorageAvailable(): boolean {
  if (!writeRaw(PROBE_KEY, "1")) return false;
  try {
    window.localStorage.removeItem(PROBE_KEY);
  } catch {
    // Nothing to do: the write succeeded, so storage works; the stray key is harmless.
  }
  return true;
}
