// client/tailwind.config.js
// /** @type {import('tailwindcss').Config} */
// export default {
//   content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'], // This should be fine for a standard Vite React app
//   theme: {
//     extend: {
//       colors: {
//         pine:   '#163A28',  
//         teal:   '#25554D',  
//         sand:   '#FCEFC9',  
//         sunset: '#E0B251',  
//         ember:   '#E76F51',
//       },
//     },
//   },
//   plugins: [],
// }


/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'], // This should be fine for a standard Vite React app
  theme: {
    // extend: {
    //   colors: {
    //     pine:   '#445E3B',  
    //     teal:   '#445E3B',  
    //     sand:   '#FFFFFF',  
    //     sunset: '#BC8353',  
    //     ember:   '#E76F51',
    //   },
      //   extend: {
      // colors: {
      //   pine:   '#283618',  
      //   teal:   '#606c38',  
      //   sand:   '#fefae0',  
      //   sunset: '#dda15e',  
      //   ember:   '#bc6c25',
      // },
      //     
      extend: {
      colors: {
        pine:   '#163A28',  
        teal:   '#25554D',  
        sand:   '#FCEFC9',  
        sunset: '#E0B251',  
        ember:   '#E76F51',
      },
    },
  },
  plugins: [],
}

