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
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => {
          // The stylesheet, fonts, and chunks for this very page were requested before the worker
          // took control, so they never passed through its fetch handler. Report what the browser
          // actually loaded and let the worker store it, otherwise the first-ever visit is the one
          // that comes back unstyled offline.
          const urls = performance.getEntriesByType("resource").map((e) => e.name);
          reg.active?.postMessage({ type: "PRECACHE", urls });
        })
        .catch(() => undefined);
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
