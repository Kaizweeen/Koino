import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DevotionFlow } from "@/components/DevotionFlow";

describe("DevotionFlow", () => {
  it("renders the arrival screen for the local day after mount", async () => {
    render(<DevotionFlow />);
    expect(await screen.findByText("Begin")).toBeInTheDocument();
    expect(screen.getByText("Good morning")).toBeInTheDocument();
  });
});
