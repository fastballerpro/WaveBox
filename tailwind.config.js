/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#06060a',
          soft: '#0c0c12',
          card: '#13131a',
          hover: '#1c1c25',
        },
        border: {
          DEFAULT: '#26262e',
          soft: '#1c1c22',
        },
        accent: {
          DEFAULT: '#ff5500',
          hover: '#ff7733',
          soft: '#3a1a05',
        },
        text: {
          DEFAULT: '#f1f1f4',
          dim: '#a4a4af',
          mute: '#74747e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(255, 85, 0, 0.35)',
        'glass-sm':
          '0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.25)',
        glass:
          '0 12px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.30)',
        'glass-lg':
          '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '8px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 220ms ease-out',
        'slide-up': 'slideUp 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scaleIn 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        'blob-1': 'blob1 22s ease-in-out infinite',
        'blob-2': 'blob2 28s ease-in-out infinite',
        'blob-3': 'blob3 34s ease-in-out infinite',
        'blob-4': 'blob4 26s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        blob1: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(8vw, 6vh) scale(1.15)' },
          '66%': { transform: 'translate(-6vw, 10vh) scale(0.92)' },
        },
        blob2: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-10vw, 8vh) scale(1.18)' },
        },
        blob3: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '40%': { transform: 'translate(12vw, -8vh) scale(1.1)' },
          '80%': { transform: 'translate(-4vw, 6vh) scale(0.9)' },
        },
        blob4: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(6vw, -10vh) scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
};
