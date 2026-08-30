"use client";

import { useEffect, useMemo, useState } from "react";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getTodayDevotion } from "@/lib/devotions/select";
import { getSoapPrompts } from "@/lib/soap/prompts";
import {
  computeStreak,
  loadProgress,
  markComplete,
  toggleFavorite,
  isFavorite,
  getEntry,
  setSoapField,
  soapText,
  type SoapEntry,
} from "@/lib/progress";
import { formatDisplayDate, greetingForHour } from "@/lib/dates";
import { Atmosphere } from "@/components/Atmosphere";
import { Arrival } from "@/components/screens/Arrival";
import { Scripture } from "@/components/screens/Scripture";
import { SoapStep } from "@/components/screens/SoapStep";
import { Amen } from "@/components/screens/Amen";
import { Linger } from "@/components/screens/Linger";
import { Done } from "@/components/screens/Done";
import { Icon } from "@/components/Icon";

type Step = "arrival" | "scripture" | "observation" | "application" | "prayer" | "amen" | "linger" | "done";

function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function DevotionFlow() {
  const [today, setToday] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("arrival");
  const [progress, setProgress] = useState(() => loadProgress());
  const [entry, setEntry] = useState<SoapEntry>({ observation: "", application: "", prayer: "" });

  useEffect(() => {
    const t = localToday();
    setToday(t);
    const p = loadProgress();
    setProgress(p);
    setEntry(getEntry(p, t));
    if (p.completedDates.includes(t)) setStep("done");
  }, []);

  const devotion = useMemo(() => (today ? getTodayDevotion(DEVOTIONS, today) : null), [today]);
  const streak = useMemo(
    () => (today ? computeStreak(progress.completedDates, today) : 0),
    [progress.completedDates, today],
  );

  if (!devotion) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center bg-paper shadow-column lg:max-w-none lg:bg-transparent lg:shadow-none">
        <div className="breathe h-16 w-16 rounded-full lg:h-24 lg:w-24" style={{ ["--accent" as string]: "#0F6E56", background: "#E1F5EE", border: "1px solid #9FE1CB" }} aria-hidden="true" />
      </main>
    );
  }

  const theme = getTheme(devotion.theme);
  const prompts = getSoapPrompts(devotion.theme);

  function writeField(field: keyof SoapEntry, text: string) {
    if (!today) return;
    setEntry((e) => ({ ...e, [field]: text }));
    setProgress(setSoapField(today, field, text));
  }

  function finishPrayer() {
    if (!today) return;
    setProgress(markComplete(today));
    setStep("amen");
  }

  // The hub layout hands the flow the height left over after the TabBar, so every frame here
  // claims it with flex-1 — asking for a full 100vh would push each step's bottom-anchored
  // button under the bar.
  return (
    <div className="relative flex flex-1 flex-col" style={{ ["--accent" as string]: theme.accent }}>
      {/* Desktop-only ambient light that fills the whole canvas the flow spreads across */}
      <Atmosphere accent={theme.accent} tone={step === "prayer" ? "night" : "day"} className="hidden lg:block" />
      {/* Mobile keeps the floating phone-width paper column; at lg the frame drops the
          max-width, paper fill, and shadow so each step lays itself out full-screen. */}
      <main className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col bg-paper shadow-column lg:max-w-none lg:bg-transparent lg:shadow-none">
        <Atmosphere accent={theme.accent} tone={step === "prayer" ? "night" : "day"} className="lg:hidden" />
        <div key={step} className="fade-in relative z-10 flex flex-1 flex-col">
        {step === "arrival" && (
          <Arrival
            theme={theme}
            today={formatDisplayDate(today ?? devotion.date)}
            streak={streak}
            greeting={greetingForHour(new Date().getHours())}
            onBegin={() => setStep("scripture")}
          />
        )}
        {step === "scripture" && <Scripture devotion={devotion} theme={theme} onContinue={() => setStep("observation")} />}
        {step === "observation" && (
          <SoapStep theme={theme} step={2} label="Observation" prompt={prompts.observation}
            value={entry.observation} onChange={(t) => writeField("observation", t)}
            onContinue={() => setStep("application")} continueLabel="Continue" nudge={devotion.reflection} />
        )}
        {step === "application" && (
          <SoapStep theme={theme} step={3} label="Application" prompt={prompts.application}
            value={entry.application} onChange={(t) => writeField("application", t)}
            onContinue={() => setStep("prayer")} continueLabel="Continue" />
        )}
        {step === "prayer" && (
          <SoapStep theme={theme} step={4} label="Prayer" prompt={prompts.prayer}
            value={entry.prayer} onChange={(t) => writeField("prayer", t)}
            onContinue={finishPrayer} continueLabel="Amen" nudge={devotion.prayer} />
        )}
        {step === "amen" && (
          <Amen
            devotion={devotion}
            theme={theme}
            streak={streak}
            favorite={isFavorite(progress, devotion.date)}
            onToggleFavorite={() => setProgress(toggleFavorite(devotion.date))}
            reflection={soapText(entry)}
          />
        )}
        {step === "amen" && (
          <button
            onClick={() => setStep("linger")}
            className="group mx-auto mb-7 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
            style={{ color: theme.accent }}
          >
            Linger a while
            <Icon name="arrow-right" className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        )}
        {step === "linger" && <Linger devotion={devotion} theme={theme} />}
        {step === "done" && <Done theme={theme} streak={streak} onReadAgain={() => setStep("scripture")} />}
        </div>
      </main>
    </div>
  );
}
