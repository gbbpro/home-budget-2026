import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef7f2", 100: "#d5ecdf", 500: "#2f855a", 600: "#276749", 700: "#22543d" },
      },
    },
  },
  plugins: [],
} satisfies Config;
