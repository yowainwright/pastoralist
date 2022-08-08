/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["index.html", ".,/src/**/*.{tsx,mdx}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        acid: {
          "primary": "#570DF8",
          "secondary": "#F000B8",
          "accent": "#37CDBE",
          "neutral": "#3D4451",
          "base-100": "#FFFFFF",
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        },
      },
    ],
  },
  plugins: [require("@tailwindcss/typography"),require("daisyui")],
}
