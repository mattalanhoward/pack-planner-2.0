/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Generic color tokens (placeholder names, you can rename later)
      colors: {
        pine: "#163A28", // forest primary
        teal: "#172b4d", // alpine primary
        sand: "#fdf7e4", // desert background
        sunset: "#E0B251", // desert accent
        ember: "#E76F51", // alpine accent
      },
      height: {
        "d-screen": "100dvh",
        "s-screen": "100svh",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      // Forest theme
      {
        forest: {
          pine: "#283618",
          teal: "#606c38",
          sand: "#fefae0",
          sunset: "#dda15e",
          ember: "#bc6c25",
        },
      },
      // Desert theme
      {
        desert: {
          pine: "#163A28",
          teal: "#172b4d",
          sand: "#fdf7e4",
          sunset: "#E0B251",
          ember: "#E76F51",
        },
      },
      // Alpine theme
      {
        alpine: {
          pine: "#445E3B",
          teal: "#445E3B",
          sand: "#FFFFFF",
          sunset: "#BC8353",
          ember: "#E76F51",
        },
      },
      // Include some built-in themes for testing
      "light",
      "dark",
      "cupcake",
    ],
  },
};
