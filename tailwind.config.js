/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        panel: '1rem',
      },
      boxShadow: {
        panel: '0 12px 32px -18px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
}
