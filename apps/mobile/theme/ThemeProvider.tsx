import { createContext, useContext, type PropsWithChildren } from 'react';
import { palette, radius, space, fontSize } from './tokens';
import { fontFamily } from './fonts';

const themeValue = { palette, radius, space, fontSize, fontFamily };
type Theme = typeof themeValue;

const Ctx = createContext<Theme>(themeValue);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <Ctx.Provider value={themeValue}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  return useContext(Ctx);
}
