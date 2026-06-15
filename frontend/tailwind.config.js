/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f3ff',
          100: '#e1e7fe',
          200: '#c8d3fe',
          300: '#a2b4fd',
          400: '#758cfb',
          500: '#4c61f7',
          600: '#3440ed',
          700: '#252cd9',
          800: '#2125b0',
          900: '#20248c',
          950: '#141554',
        },
        darkbg: {
          DEFAULT: '#0B0F19',
          card: '#161D30',
          border: '#222F4D',
          hover: '#1D2A47'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
