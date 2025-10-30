/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'cinzel': ['Cinzel', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'cosmic-purple': '#8a2be2',
        'cosmic-pink': '#db2777',
        'cosmic-dark': '#0c001f',
      },
      animation: {
        'spin-slow': 'spin 240s linear infinite',
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'cosmic': '0 0 20px rgba(138, 43, 226, 0.3)',
        'cosmic-lg': '0 0 40px rgba(138, 43, 226, 0.5)',
      }
    },
  },
  plugins: [],
}