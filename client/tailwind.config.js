/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        card: "#111a2f",
        accent: "#4f8cff",
        muted: "#9db0d5"
      }
    }
  },
  plugins: []
};
