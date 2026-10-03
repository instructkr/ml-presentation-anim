import React, { useMemo } from 'react';
import { Easing, interpolateColors, useCurrentFrame } from 'remotion';
import { useSceneMeta } from '../../timeline/context';
import type { StepMeta } from '../../timeline/types';
import { resolveColor, useTheme } from '../../theme';
import { useQuantityColors } from '../text/quantities';
import { multiply, outlineTex, scaleOf, translation, unionBox, type Box, type Glyph, type Matrix } from './outline';

export interface FormulaForm {
  /** the form morphs in during this step */
  step: string;
  tex: string;
}

export interface FormulaMark {
  /** quantity key from `\q{key}{…}` (first occurrence; `key#1` for the second) */
  key: string;
  /** step the mark is drawn on */
  step: string;
  /** seconds into the step — let a morph land first */
  delay?: number;
  /** step on which it fades away (default: stays while the term is on screen) */
  until?: string;
  /** token / ink name or raw CSS (default: the accent yellow) */
  color?: string;
}

export interface FormulaBrace extends FormulaMark {
  /** plain text under (or over) the brace — what the term means, in a few words */
  label: string;
  side?: 'below' | 'above';
}

export interface FormulaProps {
  /** the first form, raw LaTeX; tag quantities as `\\q{key}{…}` so they take a colour and survive morphs */
  children: string;
  /** step on which the first form is written on; omit to show it from frame 0 (a frame-0 anchor) */
  write?: string;
  /** later forms — matching terms travel to their new place, the rest fade out / are written in */
  then?: FormulaForm[];
  /** `2xl` is for an equation that has the board to itself */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** key → colour; overrides the scene's `Quantities` */
  colors?: Record<string, string>;
  /**
   * how the forms line up with each other. `center` (default): each form is
   * centred. `equals`: every form's main `=` sits at the same place, so in a
   * derivation only the side that changes moves. `left`: a shared left edge.
   */
  align?: 'center' | 'left' | 'equals';
  box?: FormulaMark | FormulaMark[];
  brace?: FormulaBrace | FormulaBrace[];
  /** a brief swell-and-glow on a term: "look here" */
  indicate?: FormulaMark | FormulaMark[];
  style?: React.CSSProperties;
}

/** px per em — the same scale as `Tex`, so a Formula and a Tex at one size match */
const SIZES = { sm: 28, md: 38, lg: 50, xl: 66, '2xl': 88 } as const;

const MORPH_SECONDS = 1.1;
const MARK_SECONDS = 0.6;
const INDICATE_SECONDS = 0.9;
const FADE_SECONDS = 0.3;
/** gap between a term and its box / brace, in formula units (1000 per em) */
const MARK_PAD = 110;
const BRACE_DEPTH = 190;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = Easing.inOut(Easing.cubic);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const asList = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

interface PlacedGlyph extends Glyph {
  /** placement inside the shared frame all forms are drawn in */
  pm: Matrix;
  pbox: Box;
}

interface PlacedForm {
  glyphs: PlacedGlyph[];
  box: Box;
  /** bounds per `key#n` */
  groups: Map<string, Box>;
}

const shiftBox = (b: Box, dx: number): Box => ({ x0: b.x0 + dx, y0: b.y0, x1: b.x1 + dx, y1: b.y1 });

const place = (tex: string, align: 'center' | 'left' | 'equals'): PlacedForm => {
  const o = outlineTex(tex);
  // forms share a baseline (y = 0) and a centre line, a left edge, or their main `=` (not one inside a limit)
  const equals = align === 'equals' ? o.glyphs.find((g) => g.c === '3D' && scaleOf(g.m) > 0.99) : undefined;
  const dx =
    align === 'left' ? -o.box.x0 : equals ? -(equals.box.x0 + equals.box.x1) / 2 : -(o.box.x0 + o.box.x1) / 2;
  const groups = new Map<string, Box>();
  const glyphs = o.glyphs.map((g) => {
    const pbox = shiftBox(g.box, dx);
    for (const id of g.groups) groups.set(id, unionBox(groups.get(id) ?? null, pbox));
    return { ...g, pm: multiply(translation(dx, 0), g.m), pbox };
  });
  return { glyphs, box: shiftBox(o.box, dx), groups };
};

interface Plan {
  /** same glyph in both forms: it travels */
  moves: { a: PlacedGlyph; b: PlacedGlyph }[];
  /** only in the old form: fades, drifting toward where its term went */
  outs: { g: PlacedGlyph; dx: number; dy: number }[];
  /** only in the new form: written on, arriving from where its term was */
  ins: { g: PlacedGlyph; dx: number; dy: number }[];
}

const centre = (b: Box): [number, number] => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];

/**
 * Pair the glyphs of two forms. A tagged term (`\q{key}{…}`) with the same
 * content in both travels glyph by glyph; with different content (`R_i` → `1`)
 * the old glyphs fade toward the new term's place. Untagged glyphs pair up in
 * reading order when they are the same character at the same size.
 */
const planMorph = (a: PlacedForm, b: PlacedForm): Plan => {
  const plan: Plan = { moves: [], outs: [], ins: [] };
  const usedA = new Set<PlacedGlyph>();
  const usedB = new Set<PlacedGlyph>();
  const byGroup = (f: PlacedForm, id: string) => f.glyphs.filter((g) => g.group === id);

  for (const id of a.groups.keys()) {
    if (!b.groups.has(id)) continue;
    const ga = byGroup(a, id);
    const gb = byGroup(b, id);
    if (ga.length === gb.length && ga.every((g, i) => g.c === gb[i]!.c)) {
      ga.forEach((g, i) => {
        plan.moves.push({ a: g, b: gb[i]! });
        usedA.add(g);
        usedB.add(gb[i]!);
      });
    } else {
      const [ax, ay] = centre(a.groups.get(id)!);
      const [bx, by] = centre(b.groups.get(id)!);
      for (const g of ga) {
        plan.outs.push({ g, dx: bx - ax, dy: by - ay });
        usedA.add(g);
      }
      for (const g of gb) {
        plan.ins.push({ g, dx: ax - bx, dy: ay - by });
        usedB.add(g);
      }
    }
  }

  // Everything still unpaired — untagged glyphs, and tagged ones whose term has no
  // counterpart in the other form — pairs up by shape: the same character at the
  // same size, nearest first, so a glyph that did not move is never sent flying.
  const signature = (g: PlacedGlyph) => `${g.c}@${scaleOf(g.m).toFixed(2)}`;
  const loose = (g: PlacedGlyph, other: PlacedForm) => !g.raw && (!g.group || !other.groups.has(g.group));
  const restA = a.glyphs.filter((g) => !usedA.has(g) && loose(g, b));
  const restB = b.glyphs.filter((g) => !usedB.has(g) && loose(g, a));
  const pairs = restA
    .flatMap((ga) => restB.filter((gb) => signature(gb) === signature(ga)).map((gb) => ({ ga, gb })))
    .map((p) => ({ ...p, dist: Math.hypot(p.ga.pm[4] - p.gb.pm[4], p.ga.pm[5] - p.gb.pm[5]) }))
    .sort((x, y) => x.dist - y.dist);
  for (const { ga, gb } of pairs) {
    if (usedA.has(ga) || usedB.has(gb)) continue;
    plan.moves.push({ a: ga, b: gb });
    usedA.add(ga);
    usedB.add(gb);
  }
  for (const g of b.glyphs) if (!usedB.has(g)) plan.ins.push({ g, dx: 0, dy: 0 });
  for (const g of a.glyphs) if (!usedA.has(g)) plan.outs.push({ g, dx: 0, dy: 0 });
  return plan;
};

/** rough advance width of a plain-text label — Hangul is full-width, latin ~0.56em */
const estWidth = (s: string, size: number): number => {
  let w = 0;
  for (const ch of s) w += /[ᄀ-ᇿ　-ヿ㐀-鿿가-힯]/.test(ch) ? 1 : 0.56;
  return w * size;
};

/** a curly brace from (x1,y1) to (x2,y2), bulging `depth` to the left of that direction */
const bracePath = (x1: number, y1: number, x2: number, y2: number, depth: number): string => {
  const len = Math.hypot(x1 - x2, y1 - y2) || 1;
  const dx = (x1 - x2) / len;
  const dy = (y1 - y2) / len;
  const q = 0.6;
  const at = (t: number, w: number) => `${x1 - t * len * dx + w * dy} ${y1 - t * len * dy - w * dx}`;
  const tip = at(0.5, depth);
  return `M${x1} ${y1}Q${at(0, q * depth)} ${at(0.25, (1 - q) * depth)}T${tip}M${x2} ${y2}Q${at(1, q * depth)} ${at(0.75, (1 - q) * depth)}T${tip}`;
};

/**
 * The line a brace sits on in one form: the term's own edge, pushed out past any
 * neighbouring glyph the (usually wider) label would otherwise run into.
 */
const braceLine = (form: PlacedForm, id: string, side: 'below' | 'above', labelWidth: number): number | null => {
  const term = form.groups.get(id);
  if (!term) return null;
  const cx = (term.x0 + term.x1) / 2;
  const x0 = Math.min(term.x0, cx - labelWidth / 2);
  const x1 = Math.max(term.x1, cx + labelWidth / 2);
  let line = side === 'above' ? term.y0 : term.y1;
  for (const g of form.glyphs) {
    if (g.groups.includes(id) || g.pbox.x1 < x0 || g.pbox.x0 > x1) continue;
    // only neighbours on the brace's side of the term can be in the label's way
    if (side === 'above' ? g.pbox.y0 < term.y0 : g.pbox.y1 > term.y1) {
      line = side === 'above' ? Math.min(line, g.pbox.y0) : Math.max(line, g.pbox.y1);
    }
  }
  return line;
};

const matrixAttr = (m: Matrix) => `matrix(${m.map((v) => Number(v.toFixed(3))).join(' ')})`;

/**
 * One equation as glyph outlines, 3Blue1Brown style: it is written on stroke by
 * stroke, and each later form morphs out of the previous one — tagged terms
 * (`\q{key}{…}`) travel to their new place and keep their colour, which comes
 * from the scene's `Quantities`. `box`, `brace` and `indicate` point at a term.
 *
 * Every form is laid out in one shared frame sized to their union (marks
 * included), so the equation never reflows the slot it sits in.
 *
 * Must render inside a defineScene() component (it reads the scene's steps).
 */
export const Formula: React.FC<FormulaProps> = ({
  children,
  write,
  then,
  size = 'lg',
  colors,
  align = 'center',
  box,
  brace,
  indicate,
  style,
}) => {
  const t = useTheme();
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  const quantityColors = useQuantityColors();
  const fontPx = SIZES[size];
  /** formula units per px */
  const unit = 1000 / fontPx;
  // a brace label reads at half the equation's size, never below the small text size
  const labelSize = Math.max(t.fontSize.sm, fontPx * 0.5) * unit;

  const stepOf = (id: string | undefined): StepMeta | undefined => meta.steps.find((s) => s.id === id);
  /** 0→1 across `seconds`, starting `delay` seconds into the step, done by the step's animEndFrame */
  const windowed = (s: StepMeta, delay: number, seconds: number): number => {
    const start = s.startFrame + delay * meta.fps;
    const end = Math.max(start + 1, Math.min(start + seconds * meta.fps, s.animEndFrame));
    return clamp01((frame - start) / (end - start));
  };

  const boxes = asList(box);
  const braces = asList(brace);
  const indicates = asList(indicate);

  const laterKey = JSON.stringify(then ?? []);
  const forms = useMemo(() => {
    const later = [...(then ?? [])]
      .map((f) => ({ ...f, at: meta.steps.find((s) => s.id === f.step) }))
      .filter((f): f is FormulaForm & { at: StepMeta } => !!f.at)
      .sort((x, y) => x.at.startFrame - y.at.startFrame);
    return [{ placed: place(children, align), at: undefined as StepMeta | undefined }, ...later.map((f) => ({ placed: place(f.tex, align), at: f.at }))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, laterKey, align, meta]);

  const plans = useMemo(
    () => forms.slice(1).map((f, i) => planMorph(forms[i]!.placed, f.placed)),
    [forms],
  );

  const groupId = (key: string) => (key.includes('#') ? key : `${key}#0`);

  /** everything any form or mark can occupy — the frame never changes size */
  const frameBox = useMemo(() => {
    let b: Box | null = null;
    for (const f of forms) b = unionBox(b, f.placed.box);
    for (const f of forms) {
      for (const m of boxes) {
        const g = f.placed.groups.get(groupId(m.key));
        if (g) b = unionBox(b, { x0: g.x0 - MARK_PAD, y0: g.y0 - MARK_PAD, x1: g.x1 + MARK_PAD, y1: g.y1 + MARK_PAD });
      }
      for (const m of braces) {
        const g = f.placed.groups.get(groupId(m.key));
        const side = m.side ?? 'below';
        const labelWidth = estWidth(m.label, labelSize);
        const line = braceLine(f.placed, groupId(m.key), side, labelWidth);
        if (!g || line === null) continue;
        const cx = (g.x0 + g.x1) / 2;
        const reach = MARK_PAD + BRACE_DEPTH + labelSize * 1.5;
        b = unionBox(b, {
          x0: Math.min(g.x0, cx - labelWidth / 2),
          x1: Math.max(g.x1, cx + labelWidth / 2),
          y0: side === 'above' ? line - reach : g.y0,
          y1: side === 'above' ? g.y1 : line + reach,
        });
      }
    }
    const pad = 60;
    const bb = b ?? { x0: 0, y0: 0, x1: 1, y1: 1 };
    return { x0: bb.x0 - pad, y0: bb.y0 - pad, x1: bb.x1 + pad, y1: bb.y1 + pad };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms, JSON.stringify(boxes), JSON.stringify(braces), labelSize]);

  const unknownSteps = [
    ...new Set(
      [write, ...(then ?? []).map((f) => f.step), ...[...boxes, ...braces, ...indicates].flatMap((m) => [m.step, m.until])].filter(
        (id): id is string => !!id && !stepOf(id),
      ),
    ),
  ];

  // a mark that starts after its step's animation window would still be drawing on the pause frame
  const lateMarks = [...boxes, ...braces, ...indicates].filter((m) => {
    const s = stepOf(m.step);
    return !!s && s.startFrame + (m.delay ?? 0) * meta.fps >= s.animEndFrame - 1;
  });

  // ── where the equation is right now ───────────────────────────────────────
  let current = 0;
  forms.forEach((f, i) => {
    if (i > 0 && f.at && frame >= f.at.startFrame) current = i;
  });
  const morphRaw = current > 0 ? windowed(forms[current]!.at!, 0, MORPH_SECONDS) : 1;
  const morphing = current > 0 && morphRaw < 1;
  const e = smooth(morphRaw);
  const now = forms[current]!.placed;
  const before = current > 0 ? forms[current - 1]!.placed : null;

  const writeStep = stepOf(write);
  const first = forms[0]!.placed;
  const writeSeconds = Math.min(2, Math.max(1, 0.7 + 0.05 * first.glyphs.length));
  const written = write ? (writeStep ? windowed(writeStep, 0, writeSeconds) : 0) : 1;

  const text = t.palette.colors.text;
  const flash = t.palette.colors.accent;

  /** current bounds of a tagged term, following it through a morph */
  const boundsOf = (key: string): { box: Box; alpha: number } | null => {
    const id = groupId(key);
    const b = now.groups.get(id);
    if (!morphing || !before) return b ? { box: b, alpha: current === 0 ? clamp01((written - 0.6) / 0.4) : 1 } : null;
    const a = before.groups.get(id);
    if (a && b) {
      return { box: { x0: lerp(a.x0, b.x0, e), y0: lerp(a.y0, b.y0, e), x1: lerp(a.x1, b.x1, e), y1: lerp(a.y1, b.y1, e) }, alpha: 1 };
    }
    if (b) return { box: b, alpha: e };
    return a ? { box: a, alpha: 1 - e } : null;
  };

  /** the swell a term is under right now: 0 at rest, 1 at the peak */
  const swellOf = (g: Glyph): { env: number; about: [number, number] } | null => {
    for (const m of indicates) {
      const s = stepOf(m.step);
      if (!s || !g.groups.includes(groupId(m.key))) continue;
      const p = windowed(s, m.delay ?? 0, INDICATE_SECONDS);
      if (p <= 0 || p >= 1) continue;
      const b = boundsOf(m.key);
      if (b) return { env: Math.sin(Math.PI * p), about: centre(b.box) };
    }
    return null;
  };

  const colorOf = (g: Glyph): string => {
    const named = g.key ? (colors?.[g.key] ?? quantityColors[g.key]) : undefined;
    return resolveColor(t, named, text);
  };

  /**
   * One glyph. `ink` 0→1 is the write-on: the outline is traced first, then the
   * body fills in and the trace fades — Manim's `Write`.
   */
  const glyph = (g: PlacedGlyph, id: string, m: Matrix, ink: number, opacity: number) => {
    if (ink <= 0 || opacity <= 0) return null;
    const swell = swellOf(g);
    let color = colorOf(g);
    let placed = m;
    if (swell) {
      const k = 1 + 0.22 * swell.env;
      const [cx, cy] = swell.about;
      placed = multiply([k, 0, 0, k, cx - k * cx, cy - k * cy], m);
      color = interpolateColors(swell.env, [0, 1], [color, flash]);
    }
    if (g.raw) {
      return (
        <g key={id} transform={matrixAttr(placed)} fill={color} opacity={opacity * ink} dangerouslySetInnerHTML={{ __html: g.raw }} />
      );
    }
    if (ink >= 1) return <path key={id} d={g.d} transform={matrixAttr(placed)} fill={color} opacity={opacity} />;
    const trace = clamp01(ink / 0.6);
    return (
      <path
        key={id}
        d={g.d}
        transform={matrixAttr(placed)}
        fill={color}
        fillOpacity={clamp01((ink - 0.4) / 0.6)}
        stroke={color}
        strokeWidth={(1.6 * unit) / scaleOf(m)}
        strokeOpacity={ink < 0.6 ? 1 : 1 - (ink - 0.6) / 0.4}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - trace}
        opacity={opacity}
      />
    );
  };

  /** staggered write-on progress of the i-th of n glyphs (each starts a beat after the last) */
  const staggered = (p: number, i: number, n: number): number => {
    if (n <= 1) return p;
    const lag = Math.min(4 / n, 0.2);
    const total = 1 + lag * (n - 1);
    return clamp01(p * total - lag * i);
  };

  const body: React.ReactNode[] = [];
  if (morphing && before) {
    const plan = plans[current - 1]!;
    const fade = 1 - clamp01(morphRaw / 0.45);
    plan.outs.forEach(({ g, dx, dy }, i) => {
      body.push(glyph(g, `o${i}`, multiply(translation(dx * e, dy * e), g.pm), 1, fade));
    });
    plan.moves.forEach(({ a, b }, i) => {
      const m = a.pm.map((v, k) => lerp(v, b.pm[k]!, e)) as Matrix;
      body.push(glyph(b, `m${i}`, m, 1, 1));
    });
    const arrive = clamp01((morphRaw - 0.35) / 0.65);
    plan.ins.forEach(({ g, dx, dy }, i) => {
      const m = multiply(translation(dx * (1 - e), dy * (1 - e)), g.pm);
      body.push(glyph(g, `i${i}`, m, staggered(arrive, i, plan.ins.length), 1));
    });
  } else {
    now.glyphs.forEach((g, i) => {
      body.push(glyph(g, `g${i}`, g.pm, current === 0 ? staggered(written, i, now.glyphs.length) : 1, 1));
    });
  }

  /** a mark's own timeline: drawn in over its step, faded on `until` */
  const markState = (m: FormulaMark): { draw: number; alpha: number; box: Box } | null => {
    const s = stepOf(m.step);
    if (!s || frame < s.startFrame) return null;
    const b = boundsOf(m.key);
    if (!b) return null;
    const until = stepOf(m.until);
    const gone = until ? windowed(until, 0, FADE_SECONDS) : 0;
    const draw = Easing.out(Easing.cubic)(windowed(s, m.delay ?? 0, MARK_SECONDS));
    const alpha = b.alpha * (1 - gone);
    return draw > 0 && alpha > 0 ? { draw, alpha, box: b.box } : null;
  };

  const marks: React.ReactNode[] = [];
  boxes.forEach((m, i) => {
    const st = markState(m);
    if (!st) return;
    const { x0, y0, x1, y1 } = st.box;
    marks.push(
      <rect
        key={`box${i}`}
        x={x0 - MARK_PAD}
        y={y0 - MARK_PAD}
        width={x1 - x0 + MARK_PAD * 2}
        height={y1 - y0 + MARK_PAD * 2}
        fill="none"
        stroke={resolveColor(t, m.color, flash)}
        strokeWidth={t.stroke.med * unit}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - st.draw}
        opacity={st.alpha}
      />,
    );
  });
  braces.forEach((m, i) => {
    const st = markState(m);
    if (!st) return;
    const { x0, x1 } = st.box;
    const side = m.side ?? 'below';
    const above = side === 'above';
    const labelWidth = estWidth(m.label, labelSize);
    const lineNow = braceLine(now, groupId(m.key), side, labelWidth);
    const lineBefore = morphing && before ? braceLine(before, groupId(m.key), side, labelWidth) : null;
    const line = lineNow !== null && lineBefore !== null ? lerp(lineBefore, lineNow, e) : (lineNow ?? lineBefore);
    if (line === null) return;
    const y = above ? line - MARK_PAD : line + MARK_PAD;
    // left → right bulges down (below the term); right → left bulges up
    const d = above ? bracePath(x1, y, x0, y, BRACE_DEPTH) : bracePath(x0, y, x1, y, BRACE_DEPTH);
    const color = resolveColor(t, m.color, t.palette.colors.textSecondary);
    marks.push(
      <g key={`brace${i}`} opacity={st.alpha}>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={t.stroke.thin * unit}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - st.draw}
        />
        <text
          x={(x0 + x1) / 2}
          y={above ? y - BRACE_DEPTH - labelSize * 0.45 : y + BRACE_DEPTH + labelSize * 1.1}
          textAnchor="middle"
          fill={resolveColor(t, m.color, text)}
          fontFamily={t.fonts.text}
          fontSize={labelSize}
          opacity={clamp01((st.draw - 0.4) / 0.6)}
        >
          {m.label}
        </text>
      </g>,
    );
  });

  const w = frameBox.x1 - frameBox.x0;
  const h = frameBox.y1 - frameBox.y0;
  return (
    <div style={{ maxWidth: '100%', ...style }}>
      <svg
        viewBox={`${frameBox.x0} ${frameBox.y0} ${w} ${h}`}
        width={w / unit}
        height={h / unit}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          overflow: 'visible',
          margin: align === 'left' ? 0 : '0 auto',
        }}
      >
        {body}
        {marks}
      </svg>
      {unknownSteps.length > 0 || lateMarks.length > 0 ? (
        <span
          style={{
            display: 'inline-block',
            background: t.palette.colors.danger,
            color: '#fff',
            fontSize: 22,
            fontFamily: t.fonts.mono,
            padding: '6px 12px',
            borderRadius: 8,
          }}
        >
          Formula:{unknownSteps.length > 0 ? ` unknown steps: ${unknownSteps.join(', ')}` : ''}
          {lateMarks.length > 0 ? ` delay past the step's seconds: ${lateMarks.map((m) => `${m.key}@${m.step}`).join(', ')}` : ''}
        </span>
      ) : null}
    </div>
  );
};
