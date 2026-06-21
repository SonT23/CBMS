/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        coral: "#F08A76", coralDark: "#E27860", coralLight: "#FCEAE4",
        teal: "#6FC3BA", tealLight: "#E3F4F1", cream: "#FFF8F3",
        ink: "#3F3A38", muted: "#8C817C", greenx: "#7FC8A0", gold: "#F2B85C"
      }
    }
  },
  plugins: []
};
