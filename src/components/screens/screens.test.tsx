import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Amen } from "@/components/screens/Amen";
import { Arrival } from "@/components/screens/Arrival";
import { Done } from "@/components/screens/Done";
import { SoapProgress } from "@/components/screens/SoapProgress";
import { Scripture } from "@/components/screens/Scripture";
import { SoapStep } from "@/components/screens/SoapStep";
import { getTheme } from "@/lib/themes";
import type { Devotion } from "@/lib/devotions/types";

const dev: Devotion = {
  date: "2026-06-25", verseRef: "Psalm 46:10", verseText: "Be still, and know that I am God.",
  theme: "peace", reflection: "r", prayer: "p",
};

describe("Amen screen", () => {
  it("shows the streak and the save/share actions, without a note field", () => {
    render(<Amen devotion={dev} theme={getTheme("peace")} streak={8} favorite={false} onToggleFavorite={() => {}} reflection="my observation" />);
    expect(screen.getByText(/8-day streak/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share this verse" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("What is God stirring in you today?")).toBeNull();
  });

  it("toggles favorite", () => {
    const onToggleFavorite = vi.fn();
    render(<Amen devotion={dev} theme={getTheme("peace")} streak={1} favorite={false} onToggleFavorite={onToggleFavorite} reflection="" />);
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it("celebrates a streak milestone but stays quiet on ordinary days", () => {
    const { rerender } = render(<Amen devotion={dev} theme={getTheme("peace")} streak={7} favorite={false} onToggleFavorite={() => {}} reflection="" />);
    expect(screen.getByText("A full week with God.")).toBeInTheDocument();
    rerender(<Amen devotion={dev} theme={getTheme("peace")} streak={8} favorite={false} onToggleFavorite={() => {}} reflection="" />);
    expect(screen.queryByText("A full week with God.")).toBeNull();
  });
});

describe("Arrival screen", () => {
  it("hides the streak at zero and shows the greeting", () => {
    render(<Arrival theme={getTheme("peace")} today="Saturday · July 11" streak={0} greeting="Good evening" onBegin={() => {}} />);
    expect(screen.getByText("Good evening")).toBeInTheDocument();
    expect(screen.queryByText(/day streak/)).toBeNull();
  });
});

describe("Done screen", () => {
  it("offers a re-read", () => {
    render(<Done theme={getTheme("peace")} streak={3} onReadAgain={() => {}} />);
    expect(screen.getByText("You've already been here today.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read it again" })).toBeInTheDocument();
  });
});

describe("SoapProgress", () => {
  it("labels the current step and renders all four letters", () => {
    render(<SoapProgress current={2} accent="#0F6E56" />);
    expect(screen.getByLabelText("SOAP step 2 of 4")).toBeInTheDocument();
    for (const letter of ["S", "O", "A", "P"]) {
      expect(screen.getByText(letter)).toBeInTheDocument();
    }
  });
});

describe("Scripture screen", () => {
  it("shows the verse, reference, and SOAP progress at S", () => {
    render(<Scripture devotion={dev} theme={getTheme("peace")} onContinue={() => {}} />);
    expect(screen.getByText("Be still, and know that I am God.")).toBeInTheDocument();
    expect(screen.getByText("Psalm 46:10")).toBeInTheDocument();
    expect(screen.getByLabelText("SOAP step 1 of 4")).toBeInTheDocument();
  });
});

describe("SoapStep", () => {
  it("shows the prompt, an editable field, and emits typed text", () => {
    const onChange = vi.fn();
    render(
      <SoapStep theme={getTheme("peace")} step={2} label="Observation" prompt="What do you notice?"
        value="" onChange={onChange} onContinue={() => {}} continueLabel="Continue" nudge="a hint" />,
    );
    expect(screen.getByText("What do you notice?")).toBeInTheDocument();
    expect(screen.getByLabelText("Observation")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Observation"), { target: { value: "peace here" } });
    expect(onChange).toHaveBeenCalledWith("peace here");
  });

  it("reveals the nudge text and hides the disclosure when no nudge is given", () => {
    const { rerender } = render(
      <SoapStep theme={getTheme("peace")} step={2} label="Observation" prompt="p"
        value="" onChange={() => {}} onContinue={() => {}} continueLabel="Continue" nudge="the hidden hint" />,
    );
    expect(screen.getByText("the hidden hint")).toBeInTheDocument();
    expect(screen.getByText("Need a nudge?")).toBeInTheDocument();

    rerender(
      <SoapStep theme={getTheme("peace")} step={3} label="Application" prompt="p"
        value="" onChange={() => {}} onContinue={() => {}} continueLabel="Continue" />,
    );
    expect(screen.queryByText("Need a nudge?")).toBeNull();
  });

  it("advances with the given continue label", () => {
    const onContinue = vi.fn();
    render(
      <SoapStep theme={getTheme("peace")} step={4} label="Prayer" prompt="p"
        value="" onChange={() => {}} onContinue={onContinue} continueLabel="Amen" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Amen" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
