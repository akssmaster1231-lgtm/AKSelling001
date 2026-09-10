/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        flipkart: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#2874f0',
          600: '#1e5fd6',
          700: '#174ab3',
          800: '#103680',
          900: '#0a2350',
        },
        accent: {
          400: '#ff9f00',
          500: '#ff9f00',
          600: '#e68a00',
        },
        success: {
          500: '#388e3c',
          600: '#2e7d32',
        },
        warning: {
          500: '#f57c00',
        },
        error: {
          500: '#d32f2f',
          600: '#c62828',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
