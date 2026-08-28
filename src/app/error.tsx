"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 bg-paper px-7 text-center shadow-column lg:max-w-none lg:gap-8 lg:bg-transparent lg:px-16 lg:shadow-none"
      style={{ ["--accent" as string]: "#0F6E56" }}
    >
      <div className="breathe flex h-20 w-20 items-center justify-center rounded-full lg:h-28 lg:w-28" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
        <Icon name="cloud-off" className="text-3xl text-brand lg:text-4xl" />
      </div>
      <div>
        <h1 className="font-serif text-2xl text-ink lg:text-[2.75rem] lg:leading-tight">Something interrupted the quiet.</h1>
        <p className="mt-2 text-sm text-ink-secondary lg:mx-auto lg:mt-4 lg:max-w-[34rem] lg:text-lg">A small error got in the way. Your saved devotions are safe on this device.</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button onClick={reset} className="btn-primary rounded-full px-6 py-3 text-sm font-medium lg:px-10 lg:py-3.5 lg:text-base">Try again</button>
        <Link href="/app" className="text-xs text-ink-muted transition-colors hover:text-ink">Back to home</Link>
      </div>
    </main>
  );
}
