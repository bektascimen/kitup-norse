import { Cinzel_400Regular, Cinzel_600SemiBold, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import {
  CrimsonPro_400Regular,
  CrimsonPro_500Medium,
  CrimsonPro_600SemiBold,
  CrimsonPro_400Regular_Italic,
} from '@expo-google-fonts/crimson-pro';

export const fontMap = {
  Cinzel_400Regular,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
  CrimsonPro_400Regular,
  CrimsonPro_500Medium,
  CrimsonPro_600SemiBold,
  CrimsonPro_400Regular_Italic,
};

export const fontFamily = {
  display: 'Cinzel_700Bold',
  displayRegular: 'Cinzel_400Regular',
  displayMid: 'Cinzel_600SemiBold',
  body: 'CrimsonPro_400Regular',
  bodyMedium: 'CrimsonPro_500Medium',
  bodyItalic: 'CrimsonPro_400Regular_Italic',
} as const;
