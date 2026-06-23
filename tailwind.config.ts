import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#FDFBF7", deep: "#F5F0E6" },
        navy: { DEFAULT: "#1E293B", soft: "#475569" },
        clay: { DEFAULT: "#E29578", deep: "#D17A5C" },
        sage: { DEFAULT: "#83C5BE", deep: "#5FA8A0" },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
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
