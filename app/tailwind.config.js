/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fb',
          100: '#dce7f5',
          200: '#b9cfe9',
          300: '#8db0d9',
          400: '#5c8cc4',
          500: '#3a6ba8',
          600: '#2b548c',
          700: '#244470',
          800: '#1e3a5c',
          900: '#162942',
          950: '#0f1c2e',
        },
        accent: {
          50: '#ecfdf7',
          100: '#d1faec',
          200: '#a7f3da',
          300: '#6ee7c5',
          400: '#34d3ab',
          500: '#10b98a',
          600: '#059669',
          700: '#047857',
        },
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"',
          '"Malgun Gothic"',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
