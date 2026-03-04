/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        citadel: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc8fc",
          400: "#36adf8",
          500: "#0c93e9",
          600: "#0074c7",
          700: "#015ca1",
          800: "#064f85",
          900: "#0b426e",
          950: "#072a49",
        },
        danger: {
          50: "#fff1f1",
          100: "#ffe0e0",
          200: "#ffc7c7",
          300: "#ffa0a0",
          400: "#ff6b6b",
          500: "#f83b3b",
          600: "#e51d1d",
          700: "#c11414",
          800: "#a01414",
          900: "#841818",
          950: "#480707",
        },
        warning: {
          50: "#fffbeb",
          100: "#fff3c6",
          200: "#ffe588",
          300: "#ffd24a",
          400: "#ffbe20",
          500: "#f99b07",
          600: "#dd7302",
          700: "#b75006",
          800: "#943d0c",
          900: "#7a330d",
          950: "#461902",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
