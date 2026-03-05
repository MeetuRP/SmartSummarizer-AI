/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "Space Grotesk", "Segoe UI", "sans-serif"],
        body: ["Space Grotesk", "Segoe UI", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,.25), 0 18px 45px rgba(2,132,199,.35)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise .5s ease-out both",
      },
    },
  },
  plugins: [],
};
