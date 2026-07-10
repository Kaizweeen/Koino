import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBFAF7",
        ink: { DEFAULT: "#2C2C2A", muted: "#9A988F", secondary: "#6F6E68" },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      borderRadius: { card: "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgba(30,41,59,0.04), 0 8px 24px rgba(30,41,59,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
