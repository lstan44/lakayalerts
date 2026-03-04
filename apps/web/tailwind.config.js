import baseConfig from "@citadel/config-tailwind/tailwind.config.js";

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
};
