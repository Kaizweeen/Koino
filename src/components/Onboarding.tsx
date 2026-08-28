"use client";

import { useState } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { Icon } from "@/components/Icon";

const BRAND = "#0F6E56";

const SOAP = [
  { letter: "S", name: "Scripture", line: "Read the day's verse slowly." },
  { letter: "O", name: "Observation", line: "Notice what it says about God, or you." },
  { letter: "A", name: "Application", line: "Name one way it could shape today." },
  { letter: "P", name: "Prayer", line: "Turn what you saw into a prayer." },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === 2;

  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex max-w-sm flex-col bg-paper shadow-column lg:max-w-none lg:bg-canvas lg:shadow-none"
      style={{ ["--accent" as string]: BRAND }}
      role="dialog"
      aria-label="Welcome to Koino"
    >
      <Atmosphere accent={BRAND} />
      <div key={step} className="fade-in relative z-10 mx-auto flex w-full flex-1 flex-col px-7 py-8 lg:max-w-2xl lg:px-10 lg:py-14">
        <button onClick={onDone} className="ml-auto text-xs font-medium text-ink-muted transition-colors hover:text-ink">
          Skip
        </button>

        <div className="stagger my-auto flex flex-col items-center gap-6 text-center lg:gap-8">
          {step === 0 && (
            <>
              <div className="breathe flex h-24 w-24 items-center justify-center rounded-full lg:h-32 lg:w-32" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
                <Icon name="plant-2" className="text-4xl text-brand lg:text-5xl" />
              </div>
              <div className="flex flex-col gap-3">
                <h1 className="font-serif text-display text-ink lg:text-[3.25rem] lg:leading-[1.1]">Welcome to Koino</h1>
                <p className="max-w-[18rem] text-sm leading-relaxed text-ink-secondary lg:max-w-[32rem] lg:text-lg lg:leading-relaxed">
                  A few unhurried minutes with God each day. One verse, and space to respond in your own words.
                </p>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-serif text-3xl text-ink lg:text-[2.75rem]">The SOAP path</h1>
              <div className="flex w-full flex-col gap-3 text-left lg:grid lg:grid-cols-2 lg:gap-4">
                {SOAP.map((s) => (
                  <div key={s.letter} className="flex items-center gap-3.5 rounded-2xl border bg-paper p-3.5 shadow-card" style={{ borderColor: "var(--hairline)" }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white" style={{ background: BRAND }}>
                      {s.letter}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-ink-muted">{s.line}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="breathe flex h-24 w-24 items-center justify-center rounded-full lg:h-32 lg:w-32" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
                <Icon name="lock" className="text-4xl text-brand lg:text-5xl" />
              </div>
              <div className="flex flex-col gap-3">
                <h1 className="font-serif text-3xl text-ink lg:text-[2.75rem]">Yours, and private</h1>
                <p className="max-w-[18rem] text-sm leading-relaxed text-ink-secondary lg:max-w-[32rem] lg:text-lg lg:leading-relaxed">
                  Everything you write stays on this device. Nothing is sent anywhere. You can export a backup anytime from your Journal.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((n) => (
              <span
                key={n}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: n === step ? 20 : 6, background: n === step ? BRAND : "color-mix(in srgb, var(--ink) 14%, transparent)" }}
              />
            ))}
          </div>
          <button
            onClick={() => (last ? onDone() : setStep((s) => s + 1))}
            className="btn-primary w-full rounded-full py-3.5 text-[15px] font-medium lg:w-auto lg:px-24 lg:py-4 lg:text-base"
          >
            {last ? "Begin" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
