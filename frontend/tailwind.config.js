/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgba(129, 140, 248, 0.4), 0 14px 40px rgba(79, 70, 229, 0.2)",
      },
    },
  },
  plugins: [],
};
