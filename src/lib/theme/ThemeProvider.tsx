import React, { createContext, useContext, useMemo } from 'react';
import type { Palette, Theme, ThemeFonts } from './tokens';
import { manimDark } from './palettes/manim-dark';
import { FONT_MONO, FONT_SANS } from './stacks';

export { FONT_MONO, FONT_SANS, FONT_SERIF } from './stacks';

/** the look new work gets; earlier weeks pin their own via `WeekManifest.palette` */
export const DEFAULT_PALETTE: Palette = manimDark;

export const makeTheme = (palette: Palette, fonts?: Partial<ThemeFonts>): Theme => ({
  palette,
  fonts: { text: FONT_SANS, mono: FONT_MONO, num: FONT_MONO, ...palette.fonts, ...fonts },
  fontSize: { xs: 20, sm: 26, md: 34, lg: 44, xl: 60, title: 76 },
  space: (n) => n * 8,
  radius: { sm: 8, md: 14, lg: 22 },
  stroke: { thin: 2, med: 3, thick: 5 },
});

interface ThemeSource {
  palette: Palette;
  fonts?: Partial<ThemeFonts>;
}

const SourceContext = createContext<ThemeSource | null>(null);
const ThemeContext = createContext<Theme>(makeTheme(DEFAULT_PALETTE));

/**
 * Props left out are inherited from the nearest provider above, so the bare
 * `<ThemeProvider>` inside defineScene() keeps whatever look its week (Remotion
 * Root / the deck) wrapped it in.
 */
export const ThemeProvider: React.FC<
  React.PropsWithChildren<{ palette?: Palette; fonts?: Partial<ThemeFonts> }>
> = ({ palette, fonts, children }) => {
  const parent = useContext(SourceContext);
  const source = useMemo<ThemeSource>(
    () => ({
      palette: palette ?? parent?.palette ?? DEFAULT_PALETTE,
      fonts: fonts || parent?.fonts ? { ...parent?.fonts, ...fonts } : undefined,
    }),
    [palette, fonts, parent],
  );
  const theme = useMemo(() => makeTheme(source.palette, source.fonts), [source]);
  return (
    <SourceContext.Provider value={source}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </SourceContext.Provider>
  );
};

export const useTheme = (): Theme => useContext(ThemeContext);
