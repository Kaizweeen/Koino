"use client";

import { useEffect, useMemo, useState } from "react";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getPlaylistId, getTodayDevotion } from "@/lib/devotions/select";
import { computeStreak, loadProgress, markComplete, toggleFavorite, isFavorite } from "@/lib/progress";
import { formatDisplayDate, greetingForHour } from "@/lib/dates";
import { Arrival } from "@/components/screens/Arrival";
import { Verse } from "@/components/screens/Verse";
import { Reflection } from "@/components/screens/Reflection";
import { Prayer } from "@/components/screens/Prayer";
import { Amen } from "@/components/screens/Amen";
import { Linger } from "@/components/screens/Linger";
import { Done } from "@/components/screens/Done";

type Step = "arrival" | "verse" | "reflection" | "prayer" | "amen" | "linger" | "done";

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

  useEffect(() => {
    const t = localToday();
    setToday(t);
    if (loadProgress().completedDates.includes(t)) setStep("done");
  }, []);

  const devotion = useMemo(
    () => (today ? getTodayDevotion(DEVOTIONS, today) : null),
    [today],
  );

  const streak = useMemo(
    () => (today ? computeStreak(progress.completedDates, today) : 0),
    [progress.completedDates, today],
  );

  if (!devotion) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center border-x border-black/5 bg-paper">
        <div className="breathe h-16 w-16 rounded-full border border-ink-muted/30 bg-white/60" aria-hidden="true" />
      </main>
    );
  }

  const theme = getTheme(devotion.theme);
  const playlistId = getPlaylistId(theme, devotion.date);

  function complete() {
    if (!today) return;
    setProgress(markComplete(today));
    setStep("amen");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col border-x border-black/5 bg-paper">
      <div className="flex min-h-screen flex-col">
        {step === "arrival" && (
          <Arrival
            theme={theme}
            today={formatDisplayDate(today ?? devotion.date)}
            streak={streak}
            greeting={greetingForHour(new Date().getHours())}
            onBegin={() => setStep("verse")}
          />
        )}
        {step === "verse" && <Verse devotion={devotion} theme={theme} onContinue={() => setStep("reflection")} />}
        {step === "reflection" && <Reflection devotion={devotion} theme={theme} onContinue={() => setStep("prayer")} />}
        {step === "prayer" && <Prayer devotion={devotion} theme={theme} onContinue={complete} />}
        {step === "amen" && (
          <Amen
            theme={theme}
            streak={streak}
            favorite={isFavorite(progress, devotion.date)}
            onToggleFavorite={() => setProgress(toggleFavorite(devotion.date))}
          />
        )}
        {step === "amen" && (
          <button onClick={() => setStep("linger")} className="mb-6 mx-auto flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
            Continue <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        )}
        {step === "linger" && <Linger devotion={devotion} theme={theme} playlistId={playlistId} />}
        {step === "done" && <Done theme={theme} streak={streak} onReadAgain={() => setStep("verse")} />}
      </div>
    </main>
  );
}
