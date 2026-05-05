import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0E14',
        bgElevated: '#141923',
        border: '#1F2735',
        textHigh: '#E8E6DC',
        textMid: '#A8A496',
        accent: '#C9A96E',
        accentMuted: '#8C7349',
        danger: '#B0413E',
        success: '#5A8C5C',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
