import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsView } from "@/components/SettingsView";
import { loadPrefs } from "@/lib/prefs";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});
afterEach(() => localStorage.clear());

describe("SettingsView", () => {
  it("switches the theme, persists it, and stamps the document", async () => {
    render(<SettingsView />);
    fireEvent.click(await screen.findByRole("button", { name: /Dark/ }));
    expect(loadPrefs().theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("switches the text size", async () => {
    render(<SettingsView />);
    fireEvent.click(await screen.findByRole("button", { name: /^Large$/ }));
    expect(loadPrefs().textSize).toBe("large");
  });
});
