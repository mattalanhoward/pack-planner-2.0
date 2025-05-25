// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'], // This should be fine for a standard Vite React app
  theme: {
    extend: {
      colors: {
pine:   '#163A28',  // rgb(22, 58, 40)
teal:   '#25554D',  // rgb(37, 85, 77)
sand:   '#FCEFC9',  // rgb(252, 239, 201)
sunset: '#E0B251',  // rgb(224, 178, 81)
ember: '#E76F51',
      },
    },
  },
  plugins: [],
}
