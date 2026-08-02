/**
 * Design-token contract. Every kit component reads colors/sizes from here —
 * nothing hardcodes a hex value. Swap palettes by editing/adding files in
 * ./palettes and changing the default in ThemeProvider.
 */

export interface DiagramVariantColors {
  fill: string;
  stroke: string;
  text: string;
}

export interface Palette {
  name: string;
  colors: {
    /** page behind the canvas (deck chrome) */
    page: string;
    /** slide / canvas background */
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textSecondary: string;
    muted: string;
    grid: string;
    baseline: string;
    accent: string;
    accentSoft: string;
    ok: string;
    warn: string;
    danger: string;
  };
  /** categorical series — fixed order, never cycled (CVD-validated) */
  series: string[];
  /** diagram node variant roles; must include 'default' and 'group' */
  diagram: Record<string, DiagramVariantColors>;
}

export type TokenColor = keyof Palette['colors'];

export interface Theme {
  palette: Palette;
  fonts: { sans: string; mono: string };
  /** sized for 1920×1080 read on a compressed livestream — do not shrink */
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    title: number;
  };
  /** 8px grid: space(2) = 16 */
  space: (n: number) => number;
  radius: { sm: number; md: number; lg: number };
  stroke: { thin: number; med: number; thick: number };
}

/** Resolve a TokenColor name or pass a raw CSS color through. */
export const resolveColor = (theme: Theme, c: string | undefined, fallback: string): string => {
  if (!c) return fallback;
  const colors = theme.palette.colors as Record<string, string>;
  return colors[c] ?? c;
};

export const diagramVariant = (theme: Theme, variant: string): DiagramVariantColors =>
  theme.palette.diagram[variant] ?? theme.palette.diagram['default']!;
