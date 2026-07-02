/** @type {import('tailwindcss').Config} */
// trigger tailwind rebuild 2
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif']
      },
      colors: {
        primary: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6df',
          300: '#5eecc8',
          400: '#2dd4aa',
          500: '#14b88a',
          600: '#0d9370',
          700: '#0f7559',
          800: '#115d48',
          900: '#124d3c',
        },
        accent: {
          500: '#6366f1',
          600: '#4f46e5',
        },
        warning: {
          400: '#fb923c',
          500: '#f97316',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.07)',
          medium: 'rgba(255, 255, 255, 0.12)',
          heavy: 'rgba(255, 255, 255, 0.18)',
          border: 'rgba(255, 255, 255, 0.15)',
        },
        dark: {
          900: '#040d21',
          800: '#07112e',
          700: '#0c1a3f',
          600: '#132150',
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
        'primary-gradient': 'linear-gradient(135deg, #14b88a, #0d9370)',
        'danger-gradient': 'linear-gradient(135deg, #ef4444, #dc2626)',
        'warning-gradient': 'linear-gradient(135deg, #f97316, #ea580c)',
        'accent-gradient': 'linear-gradient(135deg, #6366f1, #4f46e5)',
        'hero-gradient': 'radial-gradient(ellipse at 20% 50%, rgba(20, 184, 138, 0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99, 102, 241, 0.2) 0%, transparent 50%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-primary': '0 0 24px rgba(20, 184, 138, 0.35)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.4)',
        'glow-warning': '0 0 20px rgba(249, 115, 22, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
