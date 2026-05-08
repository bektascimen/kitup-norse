import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0E14',
        bgElevated: '#141923',
        bgDeep: '#070912',
        border: '#1F2735',
        borderStrong: '#2A3344',
        textHigh: '#E8E6DC',
        textMid: '#A8A496',
        textLow: '#6E6A5C',
        accent: '#C9A96E',
        accentMuted: '#8C7349',
        accentSoft: 'rgba(201, 169, 110, 0.10)',
        moss: '#5A8C5C',
        ember: '#C97D38',
        danger: '#B0413E',
        success: '#5A8C5C',
      },
      fontFamily: {
        display: ['var(--font-cinzel)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-crimson)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      letterSpacing: {
        rune: '0.18em',
        carved: '0.32em',
      },
      boxShadow: {
        'forge-glow':
          '0 0 0 1px rgba(201, 169, 110, 0.35), 0 8px 24px -12px rgba(201, 169, 110, 0.4)',
        'card-rest': '0 1px 0 0 rgba(255, 255, 255, 0.02) inset',
      },
      keyframes: {
        'pulse-rune': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-rune': 'pulse-rune 1.8s ease-in-out infinite',
        'reveal-up': 'reveal-up 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
export default config;
