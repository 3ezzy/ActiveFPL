/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fpl: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#38bdf8',
          green: '#22c55e',
          red: '#ef4444',
          yellow: '#eab308',
        },
        'fpl-light': {
          dark: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
};
