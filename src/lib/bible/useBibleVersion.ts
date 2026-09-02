"use client";

import { useCallback, useEffect, useState } from "react";
import type { BibleVersion } from "@/lib/bible/books";
import { DEFAULT_VERSION, getVersion } from "@/lib/bible/versions";
import { loadPrefs, setBibleVersion } from "@/lib/prefs";

/**
 * Everything on screen that is currently showing scripture.
 *
 * The chosen translation is one app-wide preference but it is read in several places at once — the
 * reader, the chapter sheet a devotion opens, Settings — and changing it in one of them should
 * take effect in the others immediately rather than on their next mount. `localStorage` fires no
 * event in the tab that wrote it, so the writer tells the readers directly.
 */
const listeners = new Set<() => void>();

/**
 * The translation to read in, and a way to change it.
 *
 * Starts on the default and reads the stored preference in an effect rather than during render, so
 * the server-rendered markup and the first client render agree.
 */
export function useBibleVersion(): { version: BibleVersion; choose: (id: string) => void } {
  const [version, setVersion] = useState<BibleVersion>(DEFAULT_VERSION);

  useEffect(() => {
    const sync = () => setVersion(getVersion(loadPrefs().bibleVersion));
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const choose = useCallback((id: string) => {
    setBibleVersion(id);
    for (const listener of [...listeners]) listener();
  }, []);

  return { version, choose };
}
