"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Theme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";
import { buildCardSvg, shareFilename, svgToPngBlob } from "@/lib/shareCard";
import { Icon } from "@/components/Icon";

export function ShareButton({
  devotion,
  theme,
  reflection,
  className,
}: {
  devotion: Devotion;
  theme: Theme;
  reflection?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [includeReflection, setIncludeReflection] = useState(false);
  const [busy, setBusy] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // The dialog can be dismissed by clicking the backdrop, which leaves a keyboard or screen-reader
  // user with no way out. Escape closes it, and focus moves in on open and back to the Share
  // button on close so the reading position is never lost.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    openerRef.current?.focus();
  };

  const hasReflection = Boolean(reflection && reflection.trim() !== "");

  const svg = useMemo(
    () =>
      buildCardSvg({
        verseText: devotion.verseText,
        verseRef: devotion.verseRef,
        themeName: theme.name,
        accent: theme.accent,
        accentSoft: theme.accentSoft,
        note: includeReflection && hasReflection ? reflection : undefined,
      }),
    [devotion, theme, includeReflection, hasReflection, reflection],
  );

  const previewUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  function download(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = shareFilename(devotion.verseRef);
    a.click();
    URL.revokeObjectURL(url);
  }

  async function shareOrDownload() {
    setBusy(true);
    try {
      const blob = await svgToPngBlob(svg);
      const file = new File([blob], shareFilename(devotion.verseRef), { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file] });
      } else {
        download(blob);
      }
    } catch {
      // Swallow user-cancelled shares and unsupported environments silently.
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Share this verse"
        className={className ?? "flex items-center justify-center gap-1.5 rounded-full border py-3 text-sm font-medium"}
        style={{ borderColor: "var(--hairline)", color: theme.accent, background: "var(--paper)", borderWidth: 1, borderStyle: "solid" }}
      >
        <Icon name="share" /> Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/60 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Share verse card"
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- preview of a generated data-URL SVG; next/image can't optimize an inline data URI */}
          <img
            src={previewUrl}
            alt={`${theme.name} verse card`}
            className="max-h-[62vh] w-auto rounded-2xl shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            {hasReflection && (
              <label className="mb-3 flex items-center justify-center gap-2 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={includeReflection}
                  onChange={(e) => setIncludeReflection(e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                Include my reflection
              </label>
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={shareOrDownload}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-sm font-medium text-ink disabled:opacity-60"
              >
                <Icon name="download" /> {busy ? "Preparing…" : "Save image"}
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="rounded-full border border-white/40 px-5 py-2.5 text-sm text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
