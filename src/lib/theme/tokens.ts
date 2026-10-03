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

/** named hues a scene assigns to its quantities (reward = 'blue', mean = 'yellow' …) */
export type InkName =
  | 'blue'
  | 'teal'
  | 'green'
  | 'yellow'
  | 'gold'
  | 'red'
  | 'maroon'
  | 'purple'
  | 'grey'
  | 'white';

export interface ThemeFonts {
  /** running text (Korean + inline English): a serif in the blackboard look, Pretendard in the classic one */
  text: string;
  /** code and fixed-width tables */
  mono: string;
  /** numbers on charts and axes — tabular digits */
  num: string;
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
    /** diagram connectors / arrows (near-white on dark surfaces) */
    line: string;
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
  /** quantity hues — one per quantity, the same in the equation, the figure and the label */
  ink: Record<InkName, string>;
  /** how filled chart marks (bars, columns) are drawn; default: solid, softly rounded */
  marks?: {
    /** corner radius at the data end, px */
    radius: number;
    /** body opacity — below 1 the mark also gets a thin outline in its own hue */
    fillOpacity: number;
  };
  /** typefaces this look overrides (unset keys keep the theme defaults) */
  fonts?: Partial<ThemeFonts>;
}

export type TokenColor = keyof Palette['colors'];

export interface Theme {
  palette: Palette;
  fonts: ThemeFonts;
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

/** Resolve a TokenColor or InkName, or pass a raw CSS color through. */
export const resolveColor = (theme: Theme, c: string | undefined, fallback: string): string => {
  if (!c) return fallback;
  const colors = theme.palette.colors as Record<string, string>;
  const ink = theme.palette.ink as Record<string, string>;
  return colors[c] ?? ink[c] ?? c;
};

/** a #rrggbb hue at the given alpha */
export const tint = (hex: string, alpha: number): string =>
  `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')}, ${alpha})`;

/**
 * Colours of a diagram node. `variant` is normally a block role (`attention`,
 * `ffn` …); inside a scene it may instead be an ink name (`'blue'`), so a node
 * that stands for a quantity wears that quantity's colour.
 */
export const diagramVariant = (theme: Theme, variant: string): DiagramVariantColors => {
  const role = theme.palette.diagram[variant];
  if (role) return role;
  const hue = (theme.palette.ink as Record<string, string>)[variant];
  if (hue) return { fill: tint(hue, 0.16), stroke: hue, text: theme.palette.colors.text };
  return theme.palette.diagram['default']!;
};
