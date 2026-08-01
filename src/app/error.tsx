"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 bg-paper px-7 text-center shadow-column"
      style={{ ["--accent" as string]: "#0F6E56" }}
    >
      <div className="breathe flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
        <i className="ti ti-cloud-off text-3xl text-brand" aria-hidden="true" />
      </div>
      <div>
        <h1 className="font-serif text-2xl text-ink">Something interrupted the quiet.</h1>
        <p className="mt-2 text-sm text-ink-secondary">A small error got in the way. Your saved devotions are safe on this device.</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button onClick={reset} className="btn-primary rounded-full px-6 py-3 text-sm font-medium">Try again</button>
        <Link href="/" className="text-xs text-ink-muted transition-colors hover:text-ink">Back to home</Link>
      </div>
    </main>
  );
}
