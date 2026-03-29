import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-inter)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
        },
        accent: "var(--accent)",
        hero: "var(--bg-hero)",
        page: "var(--bg-page)",
        card: "var(--bg-card)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        border: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        info: "var(--info)",
        danger: "var(--danger)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      boxShadow: {
        card: "0 2px 12px rgba(27, 42, 114, 0.06)",
        "card-hover": "0 8px 32px rgba(27, 42, 114, 0.12)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
