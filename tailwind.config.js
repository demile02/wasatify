/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Poppins', 'Inter', 'ui-sans-serif'],
      },
      colors: {
        cream: '#fff7e6',
        gold: '#f5bc42',
        ink: '#0e2530',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 35, 45, 0.08)',
        card: '0 14px 34px rgba(6, 78, 59, 0.09)',
      },
      backgroundImage: {
        'soft-grid':
          'linear-gradient(rgba(6,78,59,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(6,78,59,.045) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
