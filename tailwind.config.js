/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8FA',
        surface: '#FFFFFF',
        ink: '#202B36',
        muted: '#667085',
        accent: { DEFAULT: '#244C66', dark: '#1B3A4F', tint: '#EAF0F4' },
        line: '#DCE1E6',
        ok: { DEFAULT: '#247548', tint: '#E8F3EC' },
        warn: { DEFAULT: '#A86612', tint: '#F8F0E3' },
        crit: { DEFAULT: '#B42318', tint: '#FBEAE8' },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '3px', md: '4px' },
    },
  },
  plugins: [],
};
