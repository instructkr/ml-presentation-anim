import React, { createContext, useContext, useMemo } from 'react';
import type { Palette, Theme } from './tokens';
import { darkDefault } from './palettes/dark-default';

export const FONT_SANS = `'Pretendard', 'Apple SD Gothic Neo', sans-serif`;
export const FONT_MONO = `'JetBrains Mono', 'Pretendard', monospace`;

export const makeTheme = (palette: Palette): Theme => ({
  palette,
  fonts: { sans: FONT_SANS, mono: FONT_MONO },
  fontSize: { xs: 20, sm: 26, md: 34, lg: 44, xl: 60, title: 76 },
  space: (n) => n * 8,
  radius: { sm: 8, md: 14, lg: 22 },
  stroke: { thin: 2, med: 3, thick: 5 },
});

const ThemeContext = createContext<Theme>(makeTheme(darkDefault));

export const ThemeProvider: React.FC<React.PropsWithChildren<{ palette?: Palette }>> = ({
  palette,
  children,
}) => {
  const theme = useMemo(() => makeTheme(palette ?? darkDefault), [palette]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => useContext(ThemeContext);
