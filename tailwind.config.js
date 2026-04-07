/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.{js,ts,jsx,tsx}",
    "./index.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        heading: ['Oswald', 'sans-serif'],
        editorial: ['Cormorant Garamond', 'serif'],
      },
      colors: {
        brand: {
          red: '#E61E25',
          dark: '#0F172A',
          charcoal: '#1E293B',
          gray: '#94A3B8'
        }
      }
    },
  },
  plugins: [],
}
