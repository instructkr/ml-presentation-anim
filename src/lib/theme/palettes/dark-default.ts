import type { Palette } from '../tokens';

/**
 * Placeholder palette — swap with paper-derived schemes as they come in.
 * Series hues are the dark-mode categorical set validated for CVD separation
 * and ≥3:1 contrast against the #1a1a19 surface (adjacent-pair ΔE ≥ 8).
 * When replacing, re-validate: the dataviz skill ships
 * scripts/validate_palette.js — run it against the new surface.
 */

const series = {
  blue: '#3987e5',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  magenta: '#d55181',
  green: '#008300',
  violet: '#9085e9',
  red: '#e66767',
};

const tint = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const variant = (stroke: string) => ({
  fill: tint(stroke, 0.16),
  stroke,
  text: '#ffffff',
});

export const darkDefault: Palette = {
  name: 'dark-default',
  colors: {
    page: '#0d0d0d',
    bg: '#1a1a19',
    surface: '#232322',
    surfaceAlt: '#2c2c2a',
    border: 'rgba(255, 255, 255, 0.10)',
    text: '#ffffff',
    textSecondary: '#c3c2b7',
    muted: '#898781',
    grid: '#2c2c2a',
    baseline: '#383835',
    accent: series.blue,
    accentSoft: tint(series.blue, 0.18),
    ok: '#0ca30c',
    warn: '#fab219',
    danger: '#d03b3b',
  },
  series: [
    series.blue,
    series.orange,
    series.aqua,
    series.yellow,
    series.magenta,
    series.green,
    series.violet,
    series.red,
  ],
  diagram: {
    default: { fill: '#232322', stroke: '#5a5a56', text: '#ffffff' },
    io: { fill: tint(series.aqua, 0.14), stroke: series.aqua, text: '#ffffff' },
    embed: variant(series.aqua),
    attention: variant(series.blue),
    ffn: variant(series.violet),
    norm: { fill: tint(series.yellow, 0.12), stroke: series.yellow, text: '#ffffff' },
    route: variant(series.orange),
    op: { fill: '#2c2c2a', stroke: '#6a6a64', text: '#ffffff' },
    annotation: { fill: 'transparent', stroke: 'transparent', text: '#c3c2b7' },
    group: { fill: 'rgba(255, 255, 255, 0.03)', stroke: 'rgba(255, 255, 255, 0.22)', text: '#c3c2b7' },
  },
};
