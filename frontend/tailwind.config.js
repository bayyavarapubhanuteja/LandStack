/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        navy: { 50: "#eef3fb", 100: "#d9e3f5", 200: "#b3c6ea", 300: "#83a1d9", 400: "#5479c2", 500: "#345ca8", 600: "#24478a", 700: "#1c3870", 800: "#152a55", 900: "#0f1f40", 950: "#0a1429" },
        teal: { 50: "#ecfdf8", 100: "#d0f7ec", 200: "#a3eedb", 300: "#6bdec5", 400: "#35c6aa", 500: "#16a992", 600: "#0d8877", 700: "#0e6d61", 800: "#10574f", 900: "#114842" },
      },
      boxShadow: { card: "0 1px 2px rgba(15,31,64,.06), 0 1px 3px rgba(15,31,64,.08)" },
      keyframes: {
        "fade-in": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "none" } },
        dash: { to: { strokeDashoffset: "-20" } },
      },
      animation: { "fade-in": "fade-in .35s ease-out both", dash: "dash 1.2s linear infinite" },
    },
  },
  plugins: [],
};
