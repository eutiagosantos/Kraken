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
        brand: {
          purple: "#7132f5",
          "purple-dark": "#5741d8",
          "purple-deep": "#5b1ecf",
          "purple-subtle": "rgba(133, 91, 251, 0.16)",
        },
        neutral: {
          black: "#101114",
          gray: "#686b82",
          silver: "#9497a9",
          border: "#dedee5",
          white: "#ffffff",
        },
        semantic: {
          green: "#149e61",
          "green-dark": "#026b3f",
          "green-bg": "rgba(20, 158, 97, 0.16)",
        },
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "IBM Plex Sans",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        ui: [
          "var(--font-display)",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-xl": [
          "48px",
          { lineHeight: "1.17", letterSpacing: "-0.020833em", fontWeight: "700" },
        ],
        "display-lg": [
          "36px",
          { lineHeight: "1.22", letterSpacing: "-0.013889em", fontWeight: "700" },
        ],
        "display-md": [
          "28px",
          { lineHeight: "1.29", letterSpacing: "-0.017857em", fontWeight: "700" },
        ],
      },
      boxShadow: {
        subtle: "0px 4px 24px rgba(0, 0, 0, 0.03)",
        micro: "0px 1px 4px rgba(16, 24, 40, 0.04)",
        card: "0px 8px 32px rgba(113, 50, 245, 0.10)",
        "card-hover": "0px 12px 40px rgba(113, 50, 245, 0.18)",
      },
      borderRadius: {
        btn: "12px",
        card: "16px",
        badge: "8px",
      },
      backgroundImage: {
        "mesh-hero":
          "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(113,50,245,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(87,65,216,0.08) 0%, transparent 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
