import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef7f2", 100: "#d5ecdf", 300: "#9ae6b4", 400: "#68d391", 500: "#2f855a", 600: "#276749", 700: "#22543d", 900: "#1c4532" },
      },
    },
  },
  plugins: [],
} satisfies Config;
