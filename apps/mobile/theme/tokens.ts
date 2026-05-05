export const palette = {
  // New atmospheric palette
  bg: '#0A0E1A',
  bgElevated: '#131826',
  bgDeep: '#070912',
  border: '#1F2735',
  borderGlow: '#C9A96E',
  parchment: '#F5EFE0',
  mist: '#A8A496',
  shadow: '#4A4538',
  forge: '#C9A96E',
  ember: '#E8C376',
  rune: '#D7C99A',
  clottedBlood: '#8B2F2F',
  moss: '#5A8C5C',
  twilight: '#2A1F3D',
  horizon: '#4A2F2A',
  // Legacy aliases (keep existing screens working without changes)
  textHigh: '#F5EFE0',
  textMid: '#A8A496',
  textLow: '#4A4538',
  accent: '#C9A96E',
  accentMuted: '#8C7349',
  danger: '#8B2F2F',
  success: '#5A8C5C',
} as const;

export const radius = { sm: 6, md: 12, lg: 20, xl: 28, full: 9999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 19,
  xl: 24,
  xxl: 32,
  hero: 44,
  mega: 56,
} as const;

// Letter-spacing presets (em-relative would be nice but RN uses points; use small numbers)
export const tracking = {
  tight: -0.5,
  normal: 0,
  wide: 1.5,
  rune: 3, // for caps caption text
} as const;
