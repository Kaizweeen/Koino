import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 bg-paper px-7 text-center shadow-column"
      style={{ ["--accent" as string]: "#0F6E56" }}
    >
      <div className="breathe flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
        <Icon name="compass" className="text-3xl text-brand" />
      </div>
      <div>
        <h1 className="font-serif text-2xl text-ink">This page wandered off.</h1>
        <p className="mt-2 text-sm text-ink-secondary">The page you were looking for isn&apos;t here. Let&apos;s get you back to the quiet.</p>
      </div>
      <Link href="/" className="btn-primary rounded-full px-6 py-3 text-sm font-medium">Back to home</Link>
    </main>
  );
}
