/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in':    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-out':   { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        'zoom-in':    { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-up':   { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-down': { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in':    'fade-in 200ms ease-out',
        'fade-out':   'fade-out 150ms ease-in',
        'zoom-in':    'zoom-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':   'slide-up 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 250ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
