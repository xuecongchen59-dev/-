/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 22px 70px rgba(120, 73, 26, 0.14)',
        card: '0 14px 36px rgba(101, 63, 24, 0.10)',
        button: '0 16px 34px rgba(249, 115, 22, 0.28)',
      },
    },
  },
  plugins: [],
};
