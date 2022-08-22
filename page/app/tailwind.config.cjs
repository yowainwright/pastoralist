/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["index.html", "./src/**/*.{cjs,ts,js,tsx,mdx}", 'node_modules/daisyui/dist/**/*.js', 'node_modules/react-daisyui/dist/**/*.js'],
  daisyui: {
    darkTheme: "acid",
  },
  plugins: [require("@tailwindcss/typography"),require("daisyui")],
}
