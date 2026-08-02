import type { Palette } from '../tokens';

/**
 * Paper-derived dark palette (Kimi-figure aesthetic): near-black canvas,
 * low-saturation deep node fills (navy / green / maroon / gray) with thin
 * lightened borders, near-white connectors, muted-salmon accent.
 * Series hues are CVD-validated for adjacent-pair separation and ≥3:1
 * contrast against the #111110 surface (dataviz validate_palette.js —
 * re-run it against the new surface whenever these change).
 */

const series = {
  blue: '#5e8dd3',
  terracotta: '#c06a52',
  teal: '#2fa895',
  gold: '#ac8838',
  rose: '#c26f9a',
  green: '#55a04e',
  violet: '#9583d6',
  red: '#c96a62',
};

export const darkDefault: Palette = {
  name: 'dark-default',
  colors: {
    page: '#0a0a09',
    bg: '#111110',
    surface: '#1b1b19',
    surfaceAlt: '#242422',
    border: 'rgba(255, 255, 255, 0.10)',
    text: '#f2f1ec',
    textSecondary: '#b8b6ac',
    muted: '#807e76',
    grid: '#1f1f1e',
    baseline: '#333331',
    line: '#d4d2ca',
    accent: '#d08f83',
    accentSoft: 'rgba(208, 143, 131, 0.16)',
    ok: '#79b17f',
    warn: '#c9a145',
    danger: '#cf5c4e',
  },
  series: [
    series.blue,
    series.terracotta,
    series.teal,
    series.gold,
    series.rose,
    series.green,
    series.violet,
    series.red,
  ],
  diagram: {
    default: { fill: '#2a2a2e', stroke: '#8f8f97', text: '#f2f1ec' },
    io: { fill: '#232327', stroke: '#7d7d85', text: '#f2f1ec' },
    embed: { fill: '#2a2a2e', stroke: '#8f8f97', text: '#f2f1ec' },
    attention: { fill: '#2b3a58', stroke: '#93a7cf', text: '#f2f1ec' },
    ffn: { fill: '#2d4636', stroke: '#8fb99a', text: '#f2f1ec' },
    norm: { fill: '#2e2e33', stroke: '#90909a', text: '#f2f1ec' },
    route: { fill: '#4d2f30', stroke: '#c9958d', text: '#f2f1ec' },
    /** learned projection (W↓/W↑/W_o) and the global-attention block that shares its hue */
    proj: { fill: '#5a3739', stroke: '#c9958d', text: '#f2f1ec' },
    /** full-width shared expert — always active */
    expertShared: { fill: '#3d5c46', stroke: '#8fb99a', text: '#f2f1ec' },
    /** latent-width routed expert — one of many, selected per token */
    expertRouted: { fill: '#3a4468', stroke: '#93a7cf', text: '#f2f1ec' },
    op: { fill: '#222226', stroke: '#77777f', text: '#f2f1ec' },
    annotation: { fill: 'transparent', stroke: 'transparent', text: '#b8b6ac' },
    group: { fill: 'rgba(255, 255, 255, 0.02)', stroke: 'rgba(255, 255, 255, 0.30)', text: '#b8b6ac' },
  },
};
