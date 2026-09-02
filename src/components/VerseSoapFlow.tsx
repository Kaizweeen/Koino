"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BibleRef } from "@/lib/bible/refs";
import type { Verse } from "@/lib/devotions/types";
import { loadPassage, type Passage } from "@/lib/bible/passage";
import { getMood, type MoodSlug } from "@/lib/themes";
import { getSoapPrompts } from "@/lib/soap/prompts";
import {
  getReflection,
  loadProgress,
  reflectionIdFor,
  setReflectionField,
  soapText,
  toggleReflectionFavorite,
  type ReflectionSeed,
  type SoapEntry,
} from "@/lib/progress";
import { Atmosphere } from "@/components/Atmosphere";
import { Scripture } from "@/components/screens/Scripture";
import { ChapterScripture } from "@/components/screens/ChapterScripture";
import { SoapStep } from "@/components/screens/SoapStep";
import { Amen } from "@/components/screens/Amen";
import { Icon } from "@/components/Icon";

type Step = "scripture" | "observation" | "application" | "prayer" | "amen";

const EMPTY: SoapEntry = { observation: "", application: "", prayer: "" };

function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * The SOAP arc, run on a verse the reader chose.
 *
 * The same four steps and the same screens as the daily devotion, with three deliberate
 * differences. There is no Arrival — you have already decided what you are sitting with, so
 * greeting you again would only stand between you and it. There is no nudge under the prompts,
 * because a chosen passage has no curated reflection to fall back on. And finishing does not mark
 * the day complete: the streak counts the daily devotion, and a passage picked up at noon should
 * neither inflate it nor be measured against it.
 */
export function VerseSoapFlow({ reference, mood }: { reference: BibleRef; mood: MoodSlug }) {
  const [today, setToday] = useState<string | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [step, setStep] = useState<Step>("scripture");
  const [entry, setEntry] = useState<SoapEntry>(EMPTY);
  const [favorite, setFavorite] = useState(false);

  const theme = getMood(mood);
  const prompts = getSoapPrompts(mood);

  useEffect(() => setToday(localToday()), []);

  useEffect(() => {
    let active = true;
    setPassage(null);
    setFailed(false);

    loadPassage(reference)
      .then((loaded) => {
        if (active) setPassage(loaded);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [reference, attempt]);

  // The id is derived from the day and the reference, so anything already written against this
  // passage today comes back with it rather than being stranded behind a new, empty entry.
  const seed: ReflectionSeed | null = useMemo(
    () =>
      today && passage
        ? { id: reflectionIdFor(today, passage.ref), date: today, verseRef: passage.ref, verseText: passage.text, mood }
        : null,
    [today, passage, mood],
  );

  useEffect(() => {
    if (!seed) return;
    const existing = getReflection(loadProgress(), seed.id);
    setEntry(existing?.soap ?? EMPTY);
    setFavorite(existing?.favorite ?? false);
  }, [seed]);

  if (failed) {
    return (
      <Frame accent={theme.accent}>
        <div className="my-auto flex flex-col items-center gap-3 px-7 text-center">
          <p className="font-serif text-xl text-ink">We couldn&apos;t find that passage.</p>
          <p className="max-w-[20rem] text-sm text-ink-secondary">
            The text didn&apos;t load. It may be the reference, or it may just be the connection.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setAttempt((n) => n + 1)} className="btn-quiet rounded-full px-5 py-2.5 text-sm font-medium">
              Try again
            </button>
            <Link href="/app/soap" className="rounded-full px-5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
              Choose another passage
            </Link>
          </div>
        </div>
      </Frame>
    );
  }

  if (!passage || !seed) {
    return (
      <Frame accent={theme.accent}>
        <div className="my-auto flex justify-center" aria-live="polite">
          <span className="sr-only">Loading the passage</span>
          <span
            className="breathe h-12 w-12 rounded-full"
            style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}
            aria-hidden="true"
          />
        </div>
      </Frame>
    );
  }

  const verse: Verse = { verseRef: passage.ref, verseText: passage.text };

  function write(field: keyof SoapEntry, text: string) {
    if (!seed) return;
    setEntry((e) => ({ ...e, [field]: text }));
    setReflectionField(seed, field, text);
  }

  return (
    <Frame accent={theme.accent} tone={step === "prayer" ? "night" : "day"}>
      <div key={step} className="fade-in flex flex-1 flex-col">
        {step === "scripture" &&
          (reference.wholeChapter ? (
            <ChapterScripture
              book={reference.book}
              chapter={reference.chapter}
              theme={theme}
              onContinue={() => setStep("observation")}
            />
          ) : (
            <Scripture verse={verse} theme={theme} onContinue={() => setStep("observation")} />
          ))}
        {step === "observation" && (
          <SoapStep theme={theme} step={2} label="Observation" prompt={prompts.observation}
            value={entry.observation} onChange={(t) => write("observation", t)}
            onContinue={() => setStep("application")} continueLabel="Continue" />
        )}
        {step === "application" && (
          <SoapStep theme={theme} step={3} label="Application" prompt={prompts.application}
            value={entry.application} onChange={(t) => write("application", t)}
            onContinue={() => setStep("prayer")} continueLabel="Continue" />
        )}
        {step === "prayer" && (
          <SoapStep theme={theme} step={4} label="Prayer" prompt={prompts.prayer}
            value={entry.prayer} onChange={(t) => write("prayer", t)}
            onContinue={() => setStep("amen")} continueLabel="Amen" />
        )}
        {step === "amen" && (
          <>
            <Amen
              verse={verse}
              theme={theme}
              favorite={favorite}
              onToggleFavorite={() => {
                toggleReflectionFavorite(seed.id);
                setFavorite((f) => !f);
              }}
              reflection={soapText(entry)}
            />
            <div className="flex flex-col items-center gap-1 pb-7">
              <Link
                href="/app/journal"
                className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
                style={{ color: theme.accent }}
              >
                Read it back in your journal
                <Icon name="arrow-right" className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/app/soap" className="rounded-full px-4 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink">
                Reflect on another passage
              </Link>
            </div>
          </>
        )}
      </div>
    </Frame>
  );
}

/**
 * The flow's canvas: the mood's light behind it, and the height a step needs to centre itself in.
 *
 * `flex-1` rather than a viewport height: the hub frame around this already reserves the tab bar's
 * strip, so filling the space it hands down is what puts the last button just above the bar
 * instead of leaving a band of bare paper under the light.
 */
function Frame({
  accent,
  tone = "day",
  children,
}: {
  accent: string;
  tone?: "day" | "night";
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col" style={{ ["--accent" as string]: accent }}>
      <Atmosphere accent={accent} tone={tone} />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
