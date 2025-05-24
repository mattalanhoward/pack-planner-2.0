// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'], // This should be fine for a standard Vite React app
  theme: {
    extend: {
      colors: {
        midnight: '#121063',
        tahiti: '#3ab7bf',
        bermuda: '#78dcca',
        pine: '#264653',
        teal: '#2A9D8F',
        sand: '#E9C46A',
        sunset: '#F4A261',
        ember: '#E76F51',
      },
    },
  },
  plugins: [],
}