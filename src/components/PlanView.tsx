import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlan, getPlanDevotions } from "@/lib/plans";
import { getTheme } from "@/lib/themes";

export function PlanView({ slug }: { slug: string }) {
  const plan = getPlan(slug);
  if (!plan) notFound();
  const t = getTheme(plan.theme);
  const devs = getPlanDevotions(plan);

  return (
    <div className="fade-in flex flex-col gap-5 p-5 pb-6" style={{ ["--accent" as string]: t.accent }}>
      <Link href="/" className="inline-flex w-fit items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink">
        <i className="ti ti-chevron-left" aria-hidden="true" /> Home
      </Link>

      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: t.accentSoft, color: t.accent }}>
          <i className={`ti ti-${t.icon}`} aria-hidden="true" /> {t.name}
        </span>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-ink">{plan.title}</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">{plan.subtitle}</p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-widest2 text-ink-muted">{devs.length} days</p>
      </header>

      <ol className="flex flex-col gap-3">
        {devs.map((d, i) => (
          <li key={d.date} className="rounded-well border bg-paper p-5 shadow-card" style={{ borderColor: "var(--hairline)" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white" style={{ background: t.accent }}>
              {i + 1}
            </span>
            <p className="mt-3 font-serif text-lg leading-snug text-ink">{d.verseText}</p>
            <p className="mt-1.5 text-[10px] uppercase tracking-widest2 text-ink-muted">{d.verseRef}</p>
            <p className="reading-text mt-3 text-sm leading-relaxed text-ink-secondary">{d.reflection}</p>
          </li>
        ))}
      </ol>

      <Link href="/today" className="btn-primary block rounded-full py-3.5 text-center text-[15px] font-medium">
        Begin today&apos;s devotion
      </Link>
    </div>
  );
}
