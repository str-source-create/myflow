/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cleanitBlue: '#1E40AF',
        cleanitSky: '#38BDF8'
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0, 0, 0, 0.12)'
      }
    }
  },
  plugins: []
}
