// tailwind.config.js
import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/(button|input|ripple|spinner|form).js"
],
  theme: {
    extend: {},
  },
  darkMode: "selector",
  plugins: [heroui()],
};