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
        background: "#FCFAF8",
        primary: "#684F31",
        secondary: "#9B7548",
      },
      fontFamily: {
        sans: ["Source Sans Pro", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
export default config;
