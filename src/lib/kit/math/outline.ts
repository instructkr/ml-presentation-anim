import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import type { LiteElement } from 'mathjax-full/js/adaptors/lite/Element.js';
import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js';
import 'mathjax-full/js/input/tex/html/HtmlConfiguration.js';
import 'mathjax-full/js/input/tex/configmacros/ConfigMacrosConfiguration.js';
import 'mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js';

/**
 * LaTeX → glyph outlines. KaTeX (`Tex`) lays a formula out as text, which can
 * only fade; here every glyph is an SVG path with its own placement, so a
 * formula can be traced stroke by stroke and its terms can travel into the next
 * form (`Formula`). Pure and synchronous — no DOM, no fonts to wait for — so the
 * deck and Remotion renders get identical geometry.
 *
 * Coordinates: 1000 units per em, x right, y DOWN, baseline at y = 0.
 */

/** [a, b, c, d, e, f]: x' = a·x + c·y + e, y' = b·x + d·y + f */
export type Matrix = [number, number, number, number, number, number];
export type Box = { x0: number; y0: number; x1: number; y1: number };

export interface Glyph {
  /** outline in the glyph's own units; empty for `raw` items */
  d: string;
  /** glyph → formula placement */
  m: Matrix;
  /** what the glyph is (codepoint, or 'rect' for a rule) — forms match on it */
  c: string;
  /** quantity key from `\q{key}{…}` */
  key?: string;
  /** `key#n` — the n-th `\q{key}{…}` of the form (the innermost tag around the glyph) */
  group?: string;
  /** every tag around the glyph, outermost first — a mark on an outer tag covers the terms nested in it */
  groups: string[];
  /** markup for the few things that are not one path (stretched delimiters, non-TeX text) */
  raw?: string;
  /** bounds in formula coordinates */
  box: Box;
}

export interface Outline {
  glyphs: Glyph[];
  /** the formula's own extent (what MathJax reports as the viewBox) */
  box: Box;
}

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** `a ∘ b`: apply b first */
export const multiply = (a: Matrix, b: Matrix): Matrix => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];

export const translation = (x: number, y: number): Matrix => [1, 0, 0, 1, x, y];

/** the uniform scale a matrix applies (glyph placements never shear) */
export const scaleOf = (m: Matrix): number => Math.hypot(m[0], m[1]);

export const unionBox = (a: Box | null, b: Box): Box =>
  a
    ? { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }
    : b;

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

const parseTransform = (value: string | undefined): Matrix => {
  if (!value) return IDENTITY;
  let m = IDENTITY;
  for (const [, fn, args] of value.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const n = (args!.match(NUMBER) ?? []).map(Number);
    if (fn === 'translate') m = multiply(m, translation(n[0] ?? 0, n[1] ?? 0));
    else if (fn === 'scale') m = multiply(m, [n[0] ?? 1, 0, 0, n[1] ?? n[0] ?? 1, 0, 0]);
    else if (fn === 'matrix' && n.length === 6) m = multiply(m, n as Matrix);
  }
  return m;
};

/** control-point bounds of a path — a little generous on curves, which is what a box or brace wants */
const pathBounds = (d: string): Box | null => {
  let x = 0;
  let y = 0;
  let box: Box | null = null;
  const add = (px: number, py: number) => {
    box = unionBox(box, { x0: px, y0: py, x1: px, y1: py });
  };
  for (const [, cmd, args] of d.matchAll(/([a-zA-Z])([^a-zA-Z]*)/g)) {
    const n = (args!.match(NUMBER) ?? []).map(Number);
    const rel = cmd !== cmd!.toUpperCase();
    const C = cmd!.toUpperCase();
    if (C === 'H') {
      for (const v of n) add((x = rel ? x + v : v), y);
    } else if (C === 'V') {
      for (const v of n) add(x, (y = rel ? y + v : v));
    } else if (C !== 'Z') {
      // M L T: one point; Q S: control + end; C: two controls + end
      const pairs = C === 'C' ? 3 : C === 'Q' || C === 'S' ? 2 : 1;
      for (let i = 0; i + pairs * 2 <= n.length; i += pairs * 2) {
        let ex = x;
        let ey = y;
        for (let k = 0; k < pairs; k += 1) {
          ex = rel ? x + n[i + k * 2]! : n[i + k * 2]!;
          ey = rel ? y + n[i + k * 2 + 1]! : n[i + k * 2 + 1]!;
          add(ex, ey);
        }
        x = ex;
        y = ey;
      }
    }
  }
  return box;
};

const placeBox = (b: Box, m: Matrix): Box => {
  const xs = [b.x0, b.x1].flatMap((px) => [b.y0, b.y1].map((py) => m[0] * px + m[2] * py + m[4]));
  const ys = [b.x0, b.x1].flatMap((px) => [b.y0, b.y1].map((py) => m[1] * px + m[3] * py + m[5]));
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', {
  InputJax: new TeX({
    packages: ['base', 'ams', 'newcommand', 'html', 'configmacros', 'boldsymbol'],
    // \q{key}{…} tags a term as a quantity: it takes the key's colour and is what forms match on
    macros: { q: ['\\class{q-#1}{#2}', 2] },
  }),
  OutputJax: new SVG({ fontCache: 'none' }),
});

const cache = new Map<string, Outline>();

/** Lay out one formula and flatten it to placed glyph outlines. Memoised per (tex, display). */
export const outlineTex = (tex: string, display = true): Outline => {
  const cacheKey = `${display ? 'D' : 'T'}${tex}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const container = doc.convert(tex, { display }) as LiteElement;
  const svg = container.children.find((c): c is LiteElement => (c as LiteElement).kind === 'svg');
  const vb = ((svg?.attributes.viewBox as string | undefined)?.match(NUMBER) ?? []).map(Number);
  const box: Box = { x0: vb[0] ?? 0, y0: vb[1] ?? 0, x1: (vb[0] ?? 0) + (vb[2] ?? 0), y1: (vb[1] ?? 0) + (vb[3] ?? 0) };

  const glyphs: Glyph[] = [];
  const seen = new Map<string, number>();

  const walk = (node: LiteElement, parent: Matrix, key: string | undefined, groups: string[]) => {
    const group = groups[groups.length - 1];
    const attr = node.attributes as Record<string, string | undefined>;
    const m = multiply(parent, parseTransform(attr.transform));
    if (node.kind === 'g') {
      const tagged = attr.class?.match(/(?:^|\s)q-(\S+)/)?.[1];
      let k = key;
      let chain = groups;
      if (tagged) {
        const n = seen.get(tagged) ?? 0;
        seen.set(tagged, n + 1);
        k = tagged;
        chain = [...groups, `${tagged}#${n}`];
      }
      for (const child of node.children) {
        if ((child as LiteElement).kind && (child as LiteElement).kind !== '#text') walk(child as LiteElement, m, k, chain);
      }
      return;
    }
    if (node.kind === 'path') {
      const d = attr.d ?? '';
      const b = d ? pathBounds(d) : null;
      if (b) glyphs.push({ d, m, c: attr['data-c'] ?? 'path', key, group, groups, box: placeBox(b, m) });
      return;
    }
    if (node.kind === 'rect') {
      const [x, y, w, h] = [attr.x, attr.y, attr.width, attr.height].map((v) => Number(v ?? 0)) as [number, number, number, number];
      const d = `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
      glyphs.push({ d, m, c: 'rect', key, group, groups, box: placeBox({ x0: x, y0: y, x1: x + w, y1: y + h }, m) });
      return;
    }
    // stretched delimiters (nested <svg>), characters outside the TeX fonts (<text>) — kept as markup
    const parentM = parent;
    let local: Box;
    if (node.kind === 'svg') {
      const [x, y, w, h] = [attr.x, attr.y, attr.width, attr.height].map((v) => Number.parseFloat(v ?? '0')) as [number, number, number, number];
      local = { x0: x, y0: y, x1: x + w, y1: y + h };
    } else {
      const size = Number.parseFloat(attr['font-size'] ?? '880');
      const chars = [...adaptor.textContent(node)].length;
      local = { x0: 0, y0: -0.2 * size, x1: chars * size, y1: 0.85 * size };
    }
    glyphs.push({ d: '', m: parentM, c: `raw:${node.kind}`, key, group, groups, raw: adaptor.outerHTML(node), box: placeBox(local, parentM) });
  };

  for (const child of svg?.children ?? []) {
    if ((child as LiteElement).kind === 'g') walk(child as LiteElement, IDENTITY, undefined, []);
  }

  const outline: Outline = { glyphs, box };
  cache.set(cacheKey, outline);
  return outline;
};
