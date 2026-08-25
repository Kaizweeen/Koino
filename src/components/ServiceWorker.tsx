"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker after the page has settled, so it never competes with
 * first paint. Registration is best-effort: unsupported browsers and blocked registrations
 * (Private Browsing, some enterprise policies) simply leave the app online-only.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
