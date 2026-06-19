/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#07111F',
          900: '#0B1526',
          800: '#101C2F',
          700: '#162338',
          600: '#1E2D45',
        },
        accent: {
          cyan: '#00D4FF',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          teal: '#14B8A6',
          green: '#10B981',
          orange: '#F59E0B',
          red: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-blue': '0 0 25px rgba(59, 130, 246, 0.25)',
        'glow-purple': '0 0 25px rgba(139, 92, 246, 0.25)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        glass: '12px',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 212, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
