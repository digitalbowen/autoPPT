/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        edu: {
          blue: '#EFF6FF',
          cream: '#FFFDF7',
          ink: '#1E293B',
          accent: '#3B82F6',
          accentDark: '#2563EB',
          soft: '#DBEAFE',
        },
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        card: '0 4px 20px -4px rgba(59, 130, 246, 0.15)',
        soft: '0 2px 10px -2px rgba(30, 41, 59, 0.08)',
      },
    },
  },
  plugins: [],
}
