import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        mango: "#F97316",
        guava: "#EC4899",
        pineapple: "#84CC16",
        dragon: "#06B6D4",
        cream: "#FFF4E0",
        ink: "#1A1206",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      letterSpacing: {
        tightest: "-0.05em",
      },
    },
  },
  plugins: [],
};

export default config;
