import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#0A0A0A',
          mid: '#111111',
          card: '#161616',
          hover: '#1E1E1E',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C06A',
          dim: '#8A6E2E',
        },
        terra: {
          DEFAULT: '#C4622D',
          light: '#D97A45',
        },
        ivory: {
          DEFAULT: '#F2ECD9',
          mid: '#C8BFA8',
          dim: '#7A7060',
        },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        baskerville: ['Libre Baskerville', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        '2xl': '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.6)',
        gold: '0 0 30px rgba(201,168,76,0.2)',
        'gold-strong': '0 0 30px rgba(201,168,76,0.4)',
        terra: '0 0 24px rgba(196,98,45,0.25)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'kente-flow': 'kenteFlow 8s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'typing': 'typing 1.2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        kenteFlow: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '60px 60px' },
        },
        typing: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'kente': `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(201,168,76,0.03) 10px,
          rgba(201,168,76,0.03) 20px
        ), repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 10px,
          rgba(196,98,45,0.02) 10px,
          rgba(196,98,45,0.02) 20px
        )`,
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C9A84C, #E2C06A)',
        'terra-gradient': 'linear-gradient(135deg, #C4622D, #D97A45)',
      },
    },
  },
  plugins: [],
}

export default config
