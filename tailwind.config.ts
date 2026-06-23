import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Chinook Cyber semantic surfaces/text/borders (CSS vars own theming).
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        raised: "var(--bg-raised)",
        overlay: "var(--bg-overlay)",
        ink: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },
        line: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
        },
        // OAKOC tier vocabulary — meaning-bearing, theme-aware.
        oakoc: {
          observation: "var(--color-observation)",
          avenue: "var(--color-avenue)",
          obstacle: "var(--color-obstacle)",
          "key-terrain": "var(--color-key-terrain)",
          cover: "var(--color-cover)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        // The Chinook "whisper" — warm-tinted, two stacked layers (light mode).
        card: "0 1px 2px rgba(29,31,29,0.05), 0 1px 3px rgba(29,31,29,0.08)",
        subtle: "0 1px 2px rgba(29,31,29,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
