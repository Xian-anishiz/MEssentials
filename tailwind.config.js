/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx,html,svelte}"],
  theme: {
    extend: {
      colors: {
        primary: "#6750A4",
        "on-primary": "#FFFFFF",
        "primary-container": "#EADDFF",
        "on-primary-container": "#21005D",
        secondary: "#625B71",
        "on-secondary": "#FFFFFF",
        "secondary-container": "#E8DEF8",
        "on-secondary-container": "#1D192B",
        error: "#B3261E",
        "on-error": "#FFFFFF",
        "error-container": "#F9DEDC",
        "on-error-container": "#410E0B",
        background: "#FEF7FF",
        surface: "#FFFFFF",
        "surface-container": "#F3EDF7",
        "surface-variant": "#E7E0EC",
        "on-surface": "#1D1B20",
        "on-surface-variant": "#49454F",
        outline: "#79747E",
        "outline-variant": "#CAC4D0",
      },
      fontFamily: {
        sans: ["Roboto", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "m3-xs": "4px",
        "m3-sm": "8px",
        "m3-md": "12px",
        "m3-lg": "16px",
        "m3-xl": "28px",
        "m3-full": "9999px",
      },
      spacing: {
        rail: "80px",
        panel: "360px",
      },
      boxShadow: {
        "m3-1": "0 1px 2px rgba(0,0,0,.30), 0 1px 3px 1px rgba(0,0,0,.15)",
        "m3-2": "0 1px 2px rgba(0,0,0,.30), 0 2px 6px 2px rgba(0,0,0,.15)",
      },
    },
  },
  plugins: [],
};
