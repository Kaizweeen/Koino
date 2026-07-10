"use client";

import { useEffect, useMemo, useState } from "react";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTheme } from "@/lib/themes";
import { getPlaylistId, getTodayDevotion } from "@/lib/devotions/select";
import { computeStreak, loadProgress, markComplete, toggleFavorite, isFavorite } from "@/lib/progress";
import { Arrival } from "@/components/screens/Arrival";
import { Verse } from "@/components/screens/Verse";
import { Reflection } from "@/components/screens/Reflection";
import { Prayer } from "@/components/screens/Prayer";
import { Amen } from "@/components/screens/Amen";
import { Linger } from "@/components/screens/Linger";

type Step = "arrival" | "verse" | "reflection" | "prayer" | "amen" | "linger";

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
    setToday(localToday());
  }, []);

  const devotion = useMemo(
    () => (today ? getTodayDevotion(DEVOTIONS, today) : null),
    [today],
  );

  const streak = useMemo(
    () => (devotion ? computeStreak(progress.completedDates, devotion.date) : 0),
    [progress.completedDates, devotion],
  );

  if (!devotion) {
    return <main className="mx-auto flex min-h-screen max-w-sm flex-col bg-paper" />;
  }

  const theme = getTheme(devotion.theme);
  const playlistId = getPlaylistId(theme, devotion.date);

  function complete() {
    if (!devotion) return;
    setProgress(markComplete(devotion.date));
    setStep("amen");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col bg-paper">
      <div className="flex min-h-screen flex-col">
        {step === "arrival" && <Arrival theme={theme} today={devotion.date} streak={streak} onBegin={() => setStep("verse")} />}
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
      </div>
    </main>
  );
}
