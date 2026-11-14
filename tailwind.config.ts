import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F3EC",
        ink: "#1C1A17",
        "ink-2": "#4A453F",
        line: "#E4DDD2",
        rosa: "#C8006A",
        jade: "#1E6B55",
        terracota: "#A9512E",
      },
      fontFamily: {
        sans: ["var(--font-instrument-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      fontSize: {
        display: ["clamp(2.25rem, 1.6rem + 3vw, 4.25rem)", { lineHeight: "1.02", letterSpacing: "-0.01em" }],
        h2: ["clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        h3: ["1.25rem", { lineHeight: "1.25" }],
        body: ["1.0625rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.45" }],
        micro: ["0.8125rem", { lineHeight: "1.45" }],
      },
      borderRadius: {
        md: "8px",
        xl: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,26,23,.06), 0 0 0 1px #E4DDD2",
      },
    },
  },
  plugins: [],
};

export default config;
