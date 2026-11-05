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
        panel: '1.25rem',
        soft: '1rem',
        pill: '999px',
      },
      boxShadow: {
        panel: '0 4px 20px rgba(20, 20, 50, 0.08)',
        soft: '0 4px 16px rgba(20, 20, 50, 0.05)',
      },
      colors: {
        canvas: 'var(--app-bg)',
        surface: 'var(--surface)',
        muted: 'var(--text-muted)',
      },
    },
  },
  plugins: [],
}
