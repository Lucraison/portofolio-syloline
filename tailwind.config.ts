import type { Config } from "tailwindcss";

// Single source of truth for the brand palette.
// The accent (`brand`) is intentionally near-black so we can use it as
// a subtle highlight (links, focus rings, hover states) without it
// dominating the page. Don't use it as a fill — it'll just look black.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        surface: "#141414",
        "surface-2": "#1C1C1C",
        text: "#EDEDED",
        muted: "#888888",
        brand: "#003B04",
        "brand-hi": "#0A6F11", // brighter shade for cases where #003B04 is too dark to register
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
