import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        paper: "#FAF7F2",
        ink: "#1C1917",
        terracotta: "#C2410C",
        "terracotta-light": "#EA580C",
        "bottle-green": "#166534",
        "bottle-green-light": "#16A34A",
      },
      fontFamily: {
        headline: ["Fraunces", "serif"],
        body: ["Instrument Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
