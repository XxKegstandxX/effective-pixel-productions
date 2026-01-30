import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Rich, moody palette
        'ep': {
          'black': '#0c0c0c',
          'charcoal': '#161616',
          'slate': '#1e1e1e',
          'graphite': '#2a2a2a',
          'gray': '#525252',
          'silver': '#9a9a9a',
          'mist': '#e8e6e3',
          'cream': '#f4f2ef',
          'white': '#fafaf9',
          // Sophisticated sage accent
          'accent': '#7d8c7a',
          'accent-light': '#9aab96',
          'accent-dark': '#5c6b59',
        }
      },
      fontFamily: {
        'display': ['var(--font-syne)', 'sans-serif'],
        'body': ['var(--font-outfit)', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['7rem', { lineHeight: '0.9', letterSpacing: '-0.03em' }],
        'display-xl': ['5.5rem', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 0.8s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
        'reveal': 'reveal 1s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        reveal: {
          '0%': { opacity: '0', clipPath: 'inset(0 100% 0 0)' },
          '100%': { opacity: '1', clipPath: 'inset(0 0 0 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
