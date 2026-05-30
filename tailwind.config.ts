import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Vibe Coffee Brand Palette ────────────────────────────────
        vibe: {
          50:  "#FEF8EF",
          100: "#FEF3DC",
          200: "#FDEAB8",
          300: "#F9D988",
          400: "#F2BF4D",
          500: "#E8A020",  // Honey — highlights
          600: "#C87941",  // Caramel — brand accent
          700: "#A06030",  // Warm brown
          800: "#7A4118",  // Dark caramel
          900: "#5C2E0A",  // Deep roast
          950: "#3D1C02",  // Roast — primary
        },
        espresso: "#1C0A00",  // Darkest — headings, icons
        cream:    "#FEF3DC",  // Warm background
        foam:     "#FAFAF5",  // Light surface
        coral: {
          DEFAULT: "#E8543A",
          hover:   "#D44026",
          light:   "#FEE9E4",
        },
        matcha: {
          DEFAULT: "#2D6A4F",
          light:   "#D8F3DC",
        },
        // ─── Semantic aliases ─────────────────────────────────────────
        brand:   "var(--color-brand)",
        accent:  "var(--color-accent)",
        surface: "var(--color-surface)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "card":  "0 2px 12px 0 rgba(28,10,0,0.08)",
        "hover": "0 8px 32px 0 rgba(28,10,0,0.14)",
        "float": "0 16px 48px 0 rgba(28,10,0,0.18)",
      },
      backgroundImage: {
        "vibe-gradient":   "linear-gradient(135deg, #3D1C02 0%, #7A4118 50%, #C87941 100%)",
        "cream-gradient":  "linear-gradient(180deg, #FEF8EF 0%, #FEF3DC 100%)",
        "coral-gradient":  "linear-gradient(135deg, #E8543A 0%, #C43C24 100%)",
        "noise":           "url('/noise.png')",
      },
      animation: {
        "steam": "steam 2s ease-in-out infinite",
        "pulse-soft": "pulse 3s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        steam: {
          "0%, 100%": { transform: "translateY(0) scaleX(1)", opacity: "0.6" },
          "50%":       { transform: "translateY(-6px) scaleX(1.15)", opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(12px)", opacity: "0" },
          to:   { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
