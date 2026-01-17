/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'fl-bg-base': '#0a0a0f',
        'fl-bg-surface': 'rgba(255, 255, 255, 0.03)',
        'fl-bg-elevated': 'rgba(255, 255, 255, 0.05)',
        'fl-border': 'rgba(255, 255, 255, 0.1)',
        'fl-border-strong': 'rgba(255, 255, 255, 0.2)',
        'fl-text-primary': 'rgba(255, 255, 255, 0.95)',
        'fl-text-secondary': 'rgba(255, 255, 255, 0.7)',
        'fl-text-muted': 'rgba(255, 255, 255, 0.5)',
        'fl-primary': '#0ea5e9',
        'fl-primary-hover': '#38bdf8',
        'fl-success': '#22c55e',
        'fl-warning': '#f59e0b',
        'fl-error': '#ef4444',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
