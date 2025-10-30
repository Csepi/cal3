const themeColorFamilies = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
];

const themeColorShades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

const colorUtilityPattern = new RegExp(
  `^(bg|text|border|hover:bg|focus:ring|focus:border)-(?:${themeColorFamilies.join("|")})-(?:${themeColorShades.join("|")})$`,
);

const gradientUtilityPattern = new RegExp(
  `^(from|via|to)-(?:${themeColorFamilies.join("|")})-(?:${themeColorShades.join("|")})$`,
);

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [{ pattern: colorUtilityPattern }, { pattern: gradientUtilityPattern }],
  theme: {
    extend: {},
  },
  plugins: [],
};
