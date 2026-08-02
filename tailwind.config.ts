import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutral surfaces and ink are CSS-variable-backed so they flip in dark mode
        // (values live in globals.css :root and :root[data-theme="dark"]).
        paper: "var(--paper)",
        canvas: "var(--canvas)",
        brand: { DEFAULT: "#0F6E56", soft: "#E1F5EE", border: "#9FE1CB" },
        ink: { DEFAULT: "var(--ink)", secondary: "var(--ink-secondary)", muted: "var(--ink-muted)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      fontSize: {
        display: ["clamp(2rem, 8.5vw, 2.75rem)", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
        verse: ["clamp(1.6rem, 6.4vw, 2.15rem)", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
      },
      borderRadius: { card: "1.25rem", well: "1.75rem" },
      boxShadow: {
        card: "0 1px 2px rgba(38,37,33,0.04), 0 14px 30px -14px rgba(38,37,33,0.14)",
        lift: "0 2px 6px rgba(38,37,33,0.06), 0 26px 50px -18px rgba(38,37,33,0.22)",
        column: "0 1px 3px rgba(38,37,33,0.05), 0 30px 60px -30px rgba(38,37,33,0.24)",
      },
      letterSpacing: { widest2: "0.22em" },
    },
  },
  plugins: [],
};

export default config;
