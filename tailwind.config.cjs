const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "bottom-bounce": "bottom-bounce 1s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
      },
      keyframes: {
        "bottom-bounce": {
          "0%, 100%": {
            transform: "none",
            "animation-timing-function": "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "translateY(-10%)",
            "animation-timing-function": "cubic-bezier(0,0,0.2,1)",
          },
        },
      },
    },
  },
  plugins: [],
};
