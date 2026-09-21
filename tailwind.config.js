/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        flipkart: {
          50: '#f0f4f9',
          100: '#dce5f1',
          200: '#b8cce3',
          300: '#8baed1',
          400: '#477db5',
          500: '#1b365d', // Deep Luxury Navy Blue (Ultimate trust, security & prestige)
          600: '#142947',
          700: '#0f2038',
          800: '#0a1626',
          900: '#050c17',
          950: '#03060c',
        },
        charcoal: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#f59e0b', // Rich Gold / Amber (Premium deals & excitement)
          500: '#d97706', // Deep Gold Amber
          600: '#b45309',
          700: '#92400e',
        },
        gold: {
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
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
