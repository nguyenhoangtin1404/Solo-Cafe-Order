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
        // ─── Coffee Heritage Palette ───────────────────────────────────
        vibe: {
          50:  "#FEF8EF",
          100: "#FEF3DC",
          200: "#FDEAB8",
          300: "#F9D988",
          400: "#F2BF4D",
          500: "#E8A020",
          600: "#C87941",  // Caramel — primary accent
          700: "#A06030",
          800: "#7A4118",
          900: "#5C2E0A",
          950: "#3D1C02",  // Roast — brand dark
        },
        espresso: "#1C0A00",
        cream:    "#FEF3DC",
        foam:     "#FAFAF5",

        // ─── Clean AI Neutrals ─────────────────────────────────────────
        surface: {
          DEFAULT: "#FFFFFF",
          muted:   "#F9FAFB",
          subtle:  "#F3F4F6",
        },
        border: {
          DEFAULT: "#E5E7EB",
          strong:  "#D1D5DB",
        },

        // ─── AI Accent (sparingly) ─────────────────────────────────────
        ai: {
          DEFAULT: "#7C3AED",   // violet — for AI badges/tags only
          light:   "#EDE9FE",
          muted:   "#8B5CF6",
        },

        // ─── Semantic ─────────────────────────────────────────────────
        coral: {
          DEFAULT: "#E8543A",
          hover:   "#D44026",
          light:   "#FEE9E4",
        },
        matcha: {
          DEFAULT: "#2D6A4F",
          light:   "#D8F3DC",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "card":   "0 1px 4px 0 rgba(0,0,0,0.06), 0 2px 12px 0 rgba(0,0,0,0.04)",
        "hover":  "0 4px 20px 0 rgba(0,0,0,0.10)",
        "float":  "0 12px 40px 0 rgba(0,0,0,0.14)",
        "inner-sm": "inset 0 1px 3px 0 rgba(0,0,0,0.06)",
      },
      backgroundImage: {
        "vibe-gradient":  "linear-gradient(135deg, #1C0A00 0%, #3D1C02 50%, #7A4118 100%)",
        "caramel-gradient": "linear-gradient(135deg, #C87941 0%, #E8A020 100%)",
        "coral-gradient": "linear-gradient(135deg, #E8543A 0%, #C43C24 100%)",
        "ai-gradient":    "linear-gradient(135deg, #7C3AED 0%, #C87941 100%)",
        "dot-pattern":    "radial-gradient(circle, #E5E7EB 1px, transparent 1px)",
      },
      backgroundSize: {
        "dot-sm": "16px 16px",
        "dot-md": "24px 24px",
      },
      animation: {
        "signal":     "signal 2.4s ease-in-out infinite",
        "signal-2":   "signal 2.4s ease-in-out infinite 0.4s",
        "signal-3":   "signal 2.4s ease-in-out infinite 0.8s",
        "slide-up":   "slideUp 0.3s cubic-bezier(0.16,1,0.3,1)",
        "fade-in":    "fadeIn 0.35s ease-out",
        "scale-in":   "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)",
      },
      keyframes: {
        signal: {
          "0%, 100%": { opacity: "0.3", transform: "translateY(0)" },
          "50%":       { opacity: "1",   transform: "translateY(-3px)" },
        },
        slideUp: {
          from: { transform: "translateY(10px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to:   { transform: "scale(1)",    opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
