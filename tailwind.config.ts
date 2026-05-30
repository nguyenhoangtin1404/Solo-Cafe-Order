import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cafe: {
          50: "#fdf8f0",
          100: "#faefd9",
          200: "#f4dba8",
          300: "#ecc06d",
          400: "#e3a040",
          500: "#d4821f",
          600: "#bc6616",
          700: "#9b4e15",
          800: "#7e3f18",
          900: "#683616",
          950: "#3a1a08",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
