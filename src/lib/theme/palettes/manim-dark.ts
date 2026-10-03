import { FONT_SERIF } from '../stacks';
import { tint, type Palette } from '../tokens';

/**
 * The 3Blue1Brown look: a black canvas and Manim's own colour set (the `_C`
 * shade of each hue, with `_D`/`_E` where a darker neighbour is needed).
 * Shapes are thin bright outlines over a faint tint of the same hue, and text
 * sits directly on the background — there is no card surface in this look.
 *
 * Colour means a quantity here, not a mood: scenes map each quantity to one
 * `ink` hue and every equation term, chart mark and label reads it from there.
 */

const ink = {
  blue: '#58C4DD',
  teal: '#5CD0B3',
  green: '#83C167',
  yellow: '#FFFF00',
  gold: '#F0AC5F',
  red: '#FC6255',
  maroon: '#C55F73',
  purple: '#9A72AC',
  grey: '#888888',
  white: '#FFFFFF',
} as const;

/** outline in the hue, body in a faint tint of it */
const outlined = (hue: string, alpha = 0.16) => ({
  fill: tint(hue, alpha),
  stroke: hue,
  text: '#FFFFFF',
});

export const manimDark: Palette = {
  name: 'manim-dark',
  colors: {
    page: '#000000',
    bg: '#000000',
    surface: '#141414',
    surfaceAlt: '#222222',
    border: 'rgba(255, 255, 255, 0.16)',
    text: '#FFFFFF',
    textSecondary: '#BBBBBB',
    muted: '#888888',
    grid: '#222222',
    baseline: '#888888',
    line: '#DDDDDD',
    accent: ink.yellow,
    accentSoft: 'rgba(255, 255, 0, 0.14)',
    ok: ink.green,
    warn: ink.gold,
    danger: ink.red,
  },
  series: [ink.blue, ink.red, ink.green, ink.gold, ink.purple, ink.teal, ink.maroon, ink.yellow],
  diagram: {
    default: outlined('#BBBBBB', 0.08),
    io: outlined('#DDDDDD', 0.06),
    embed: outlined(ink.purple),
    attention: outlined(ink.blue),
    ffn: outlined(ink.green),
    norm: outlined('#888888', 0.1),
    route: outlined(ink.gold),
    proj: outlined(ink.maroon, 0.2),
    expertShared: outlined(ink.green),
    expertRouted: outlined('#29ABCA'),
    op: outlined('#BBBBBB', 0.08),
    annotation: { fill: 'transparent', stroke: 'transparent', text: '#BBBBBB' },
    group: { fill: 'transparent', stroke: 'rgba(255, 255, 255, 0.38)', text: '#BBBBBB' },
  },
  ink,
  // square, slightly translucent bars with an outline — drawn shapes, not UI blocks
  marks: { radius: 0, fillOpacity: 0.82 },
  // text and numbers share the equations' typeface (Computer Modern digits are tabular)
  fonts: { text: FONT_SERIF, num: `'KaTeX_Main', 'JetBrains Mono', monospace` },
};
