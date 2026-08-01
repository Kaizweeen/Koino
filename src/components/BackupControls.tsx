"use client";

import { useRef, useState } from "react";
import { exportProgress, backupFilename, importProgress } from "@/lib/backup";

export function BackupControls({ onImported }: { onImported?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function download() {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFilename();
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: "Backup downloaded to your device." });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      importProgress(await file.text());
      setMsg({ ok: true, text: "Backup restored." });
      onImported?.();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Could not read that file." });
    }
  }

  return (
    <section
      className="mt-1 rounded-2xl border bg-paper p-4"
      style={{ borderColor: "var(--hairline)", ["--accent" as string]: "#0F6E56" }}
    >
      <p className="text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">Backup</p>
      <p className="mt-1 text-xs text-ink-muted">
        Your journal is saved on this device only. Export a copy so a cleared browser never loses it.
      </p>
      <div className="mt-3 flex gap-2.5">
        <button onClick={download} className="btn-quiet flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium">
          <i className="ti ti-download" aria-hidden="true" /> Export
        </button>
        <button onClick={() => fileRef.current?.click()} className="btn-quiet flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium">
          <i className="ti ti-upload" aria-hidden="true" /> Import
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="hidden" aria-label="Import a Koino backup file" />
      </div>
      {msg && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-secondary">
          <i className={msg.ok ? "ti ti-circle-check" : "ti ti-alert-triangle"} style={{ color: msg.ok ? "#0F6E56" : "var(--ink-secondary)" }} aria-hidden="true" />
          {msg.text}
        </p>
      )}
    </section>
  );
}
