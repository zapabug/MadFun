/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'madeira-blue': '#0063B2',
        'madeira-yellow': '#FFC800',
      },
    },
  },
  plugins: [],
};
