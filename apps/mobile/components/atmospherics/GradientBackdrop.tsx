import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { palette } from '../../theme';

const variants = {
  dawn: [palette.bgDeep, palette.twilight, palette.horizon, palette.bg],
  night: [palette.bgDeep, palette.bg, palette.bgElevated, palette.bg],
  ember: [palette.bg, palette.twilight, palette.bgDeep, palette.bgDeep],
} as const;

export function GradientBackdrop({ variant = 'night' }: { variant?: keyof typeof variants }) {
  return (
    <LinearGradient
      colors={variants[variant] as unknown as readonly [string, string, ...string[]]}
      locations={[0, 0.4, 0.75, 1]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
