"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { isStorageAvailable } from "@/lib/storage";

/**
 * A quiet warning shown when the browser will not keep what Koino writes — Private Browsing, a
 * full quota, or site data switched off. The whole practice (streak, journal, favorites) lives in
 * localStorage, so without this a person would write a devotion and silently lose it. Worded to
 * inform rather than alarm, in keeping with the app's gentle voice.
 */
export function StorageNotice() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setBlocked(!isStorageAvailable());
  }, []);

  if (!blocked) return null;

  return (
    <div
      role="status"
      className="mx-4 mt-4 flex items-start gap-2.5 rounded-well border px-3.5 py-3 text-xs leading-relaxed"
      style={{ borderColor: "var(--hairline)", background: "var(--paper)", color: "var(--ink-secondary)" }}
    >
      <Icon name="cloud-off" className="mt-0.5 text-base" style={{ color: "var(--ink-secondary)" }} />
      <p>
        This browser isn&apos;t letting Koino save anything right now, so today&apos;s writing and your streak
        won&apos;t be kept. Private browsing is the usual reason — an ordinary window should work.
      </p>
    </div>
  );
}
