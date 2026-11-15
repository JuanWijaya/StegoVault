/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          dark: '#070B19',
          panel: '#0D1527',
          card: '#13203D',
          border: 'rgba(56, 189, 248, 0.2)',
          accent: '#2563EB',
          glow: '#38BDF8',
          cyan: '#06B6D4',
          emerald: '#10B981',
          rose: '#EF4444',
          amber: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(56, 189, 248, 0.3)',
        'glow-lg': '0 0 30px -5px rgba(37, 99, 235, 0.4)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [],
};
