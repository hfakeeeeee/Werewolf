/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ashen: {
          DEFAULT: "#0f1115",
          100: "#f1f4f7",
          200: "#c9d1da",
          300: "#9aa4b2",
          400: "#6c7686",
          500: "#434b58",
          600: "#2b313c",
          700: "#1d222b",
          800: "#141821",
          900: "#0f1219",
        },
        ember: "#f5b04c",
      },
      fontFamily: {
        display: ["\"Cinzel\"", "serif"],
        body: ["\"Manrope\"", "system-ui", "sans-serif"],
      },
      boxShadow: {
        ember: "0 10px 40px rgba(245, 176, 76, 0.35)",
        inky: "0 30px 60px rgba(5, 7, 12, 0.55)",
      },
    },
  },
  plugins: [],
}
