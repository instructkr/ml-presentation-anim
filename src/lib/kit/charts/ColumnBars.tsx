import React from 'react';
import { resolveColor, useTheme } from '../../theme';

export type ColumnBarsScale = 'linear' | 'log';

export interface ColumnBarsRefLine {
  value: number;
  /** drawn right of the plot at the line, in the line's color; dodges other gutter labels */
  label?: string;
  /** token name or raw CSS (default `accent`) */
  color?: string;
  /** default true */
  dashed?: boolean;
  /** 0..1 — scenes fade a line in by driving this (keep the entry in the array from frame 0) */
  opacity?: number;
}

export interface ColumnBarsBand {
  from: number;
  to: number;
  /** drawn right of the plot, centred on the band — or in its longest free stretch when a refLine label sits there */
  label?: string;
  /** token name or raw CSS (default `accent`) */
  color?: string;
  /** fill opacity (default 0.14); the label follows it proportionally */
  opacity?: number;
}

export interface ColumnBarsProps {
  /** target values, signed */
  values: number[];
  /** morph source (same length); drawn = lerp(from, values, morph) */
  from?: number[];
  /** 0..1 (scene drives with useStepProgress) */
  morph?: number;
  /** 0..1 grow-in from the baseline (default 1) */
  progress?: number;
  /** under each column (e.g. 'τ₁', 't₃') */
  labels?: string[];
  /** token name or CSS per bar; default: positive = series[0], negative = series[1] */
  colors?: (string | undefined)[];
  /** indices drawn faded (masked tokens, dropped rollouts) */
  muted?: number[];
  /** indices emphasised */
  highlight?: number[];
  refLines?: ColumnBarsRefLine[];
  /** shaded y-ranges, drawn under the bars */
  bands?: ColumnBarsBand[];
  /** fixed domain so morphs never rescale */
  yDomain?: [number, number];
  /** log: baseline at 1 (ratio plots), bars grow up/down from 1 */
  yScale?: ColumnBarsScale;
  /** receives the drawn (morphed) value */
  valueFormat?: (v: number) => string;
  /** 0..1 value labels on bar ends (scene fades them in); also held back until `progress` completes */
  valueOpacity?: number;
  /** only these columns carry a value label (default: all) — for dense groups where every label would collide */
  valueIndices?: number[];
  /** y-axis ticks + faint grid lines; auto when omitted, `[]` hides them; ticks outside the domain are dropped */
  yTicks?: number[];
  yFormat?: (v: number) => string;
  /** rotated axis title left of the ticks */
  yLabel?: string;
  width: number;
  height: number;
}

/** thin marks: a column never exceeds this, whatever the slot width */
const MAX_BAR_WIDTH = 72;
/** share of the slot a column may take, so neighbours stay separate at 16 columns */
const BAR_FILL = 0.62;
const CORNER_R = 4;
const TARGET_TICKS = 4;
const DASH = '10 7';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const round = (v: number) => Number(v.toFixed(10));

const niceStep = (raw: number): number => {
  const exp = Math.floor(Math.log10(raw));
  const f = raw / 10 ** exp;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return m * 10 ** exp;
};

/** true minus sign, trimmed to three decimals */
const defaultFormat = (v: number): string => {
  const s = String(round(Number(v.toFixed(3))));
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
};

/** rough advance width — Hangul/CJK are full-width, latin ~0.56em */
const estWidth = (s: string, fontSize: number): number => {
  let w = 0;
  for (const ch of s) w += /[ᄀ-ᇿ　-ヿ㐀-鿿가-힯]/.test(ch) ? 1 : 0.56;
  return w * fontSize;
};

const autoDomain = (values: number[], scale: ColumnBarsScale): [number, number] => {
  if (scale === 'log') {
    const pos = values.filter((v) => v > 0);
    const lo = Math.min(1, ...pos);
    const hi = Math.max(1, ...pos);
    const d0 = 10 ** Math.floor(Math.log10(lo));
    const d1 = 10 ** Math.ceil(Math.log10(hi));
    return d1 > d0 ? [d0, d1] : [d0 / 10, d1 * 10];
  }
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  if (hi === lo) return [lo - 1, hi + 1];
  const s = niceStep((hi - lo) / TARGET_TICKS);
  return [round(Math.floor(lo / s) * s), round(Math.ceil(hi / s) * s)];
};

const autoTicks = (domain: [number, number], scale: ColumnBarsScale): number[] => {
  const [d0, d1] = domain;
  if (scale === 'log') {
    // 1-2-5 per decade reads better than bare powers of ten on a short ratio axis
    const out: number[] = [];
    for (let e = Math.floor(Math.log10(d0)); e <= Math.ceil(Math.log10(d1)); e += 1) {
      for (const m of [1, 2, 5]) {
        const v = round(m * 10 ** e);
        if (v >= d0 - 1e-9 && v <= d1 + 1e-9) out.push(v);
      }
    }
    return out;
  }
  if (!(d1 > d0)) return [];
  const s = niceStep((d1 - d0) / TARGET_TICKS);
  // whole multiples of the step inside the domain; the 1e-6 only absorbs float error
  const out: number[] = [];
  for (let k = Math.ceil(d0 / s - 1e-6); k * s <= d1 + s * 1e-6; k += 1) out.push(round(k * s));
  return out;
};

/**
 * 1-D dodge: keeps the order, spaces centres at least `gap` apart with the least
 * total movement (overlapping runs settle on their mean), then clamps into [lo, hi].
 */
const dodge = (ys: number[], gap: number, lo: number, hi: number): number[] => {
  const order = ys.map((_, i) => i).sort((a, b) => ys[a]! - ys[b]! || a - b);
  const runs: { members: number[]; top: number }[] = [];
  for (const i of order) {
    let run = { members: [i], top: ys[i]! };
    let prev = runs[runs.length - 1];
    while (prev && prev.top + prev.members.length * gap > run.top) {
      const members = [...prev.members, ...run.members];
      run = { members, top: members.reduce((sum, j, k) => sum + ys[j]! - k * gap, 0) / members.length };
      runs.pop();
      prev = runs[runs.length - 1];
    }
    runs.push(run);
  }
  const placed = runs.flatMap((r) => r.members.map((_, k) => r.top + k * gap));
  for (let k = 0; k < placed.length; k += 1) placed[k] = Math.max(placed[k]!, k > 0 ? placed[k - 1]! + gap : lo);
  for (let k = placed.length - 1; k >= 0; k -= 1)
    placed[k] = Math.min(placed[k]!, k < placed.length - 1 ? placed[k + 1]! - gap : hi);
  const out: number[] = new Array(ys.length);
  order.forEach((i, k) => (out[i] = placed[k]!));
  return out;
};

/**
 * Right-gutter label centres. refLine labels stay on their line and only dodge
 * each other; a band label keeps the band's middle when that is free, otherwise
 * it takes the middle of the longest free stretch inside its band, and with no
 * room there the nearest free spot outside it. A last pass separates anything
 * still closer than `gap`, so no two labels ever overlap.
 */
const placeSideLabels = (
  lineYs: number[],
  bandSpans: [number, number][],
  gap: number,
  lo: number,
  hi: number,
): { lines: number[]; bands: number[] } => {
  const lines = dodge(lineYs, gap, lo, hi);
  const taken = [...lines];
  /** stretches of [s, e] where a label centre keeps `gap` from every taken one */
  const freeIn = (s0: number, e0: number) =>
    taken.reduce<[number, number][]>(
      (free, y) =>
        free.flatMap(([s, e]) => {
          const keep: [number, number][] = [];
          if (s <= y - gap) keep.push([s, Math.min(e, y - gap)]);
          if (y + gap <= e) keep.push([Math.max(s, y + gap), e]);
          return keep;
        }),
      [[s0, e0]],
    );
  const bands = bandSpans.map(([top, bottom]) => {
    const mid = (top + bottom) / 2;
    const inside = freeIn(Math.min(mid, top + gap / 2), Math.max(mid, bottom - gap / 2));
    const longest = inside.reduce<[number, number] | null>((best, f) => (!best || f[1] - f[0] > best[1] - best[0] ? f : best), null);
    // no room inside the band: the nearest free spot just outside it, before shoving refLine labels off their lines
    const nearest = freeIn(lo, hi)
      .map(([s, e]) => Math.max(s, Math.min(e, mid)))
      .reduce<number | null>((best, y) => (best === null || Math.abs(y - mid) < Math.abs(best - mid) ? y : best), null);
    const y = inside.some(([s, e]) => s <= mid && mid <= e)
      ? mid
      : longest
        ? (longest[0] + longest[1]) / 2
        : (nearest ?? mid);
    taken.push(y);
    return y;
  });
  const all = [...lines, ...bands];
  const sorted = [...all].sort((a, b) => a - b);
  if (sorted.every((y, k) => k === 0 || y - sorted[k - 1]! >= gap - 1e-6)) return { lines, bands };
  const settled = dodge(all, gap, lo, hi);
  return { lines: settled.slice(0, lines.length), bands: settled.slice(lines.length) };
};

/** Column rect as a path — square at the baseline, rounded only at the data end (up or down). */
const columnPath = (x0: number, w: number, yBase: number, yEnd: number, r: number): string => {
  const h = Math.abs(yEnd - yBase);
  if (h < 0.5) return '';
  const rr = Math.max(0, Math.min(r, h, w / 2));
  const x1 = x0 + w;
  if (yEnd < yBase) {
    return [
      `M ${x0} ${yBase}`,
      `L ${x0} ${yEnd + rr}`,
      `Q ${x0} ${yEnd} ${x0 + rr} ${yEnd}`,
      `L ${x1 - rr} ${yEnd}`,
      `Q ${x1} ${yEnd} ${x1} ${yEnd + rr}`,
      `L ${x1} ${yBase}`,
      'Z',
    ].join(' ');
  }
  return [
    `M ${x0} ${yBase}`,
    `L ${x0} ${yEnd - rr}`,
    `Q ${x0} ${yEnd} ${x0 + rr} ${yEnd}`,
    `L ${x1 - rr} ${yEnd}`,
    `Q ${x1} ${yEnd} ${x1} ${yEnd - rr}`,
    `L ${x1} ${yBase}`,
    'Z',
  ].join(' ');
};

/**
 * Vertical SVG columns on a zero baseline (1 under `yScale="log"`) — the chart
 * for a group of rollouts, per-token advantages or ratios. Pure props: drive
 * `progress` (grow-in) and `morph` (from → values) with useStepProgress, and pin
 * `yDomain` whenever values morph so the axis never rescales. Plot margins are
 * sized from every label in the props regardless of opacity, so keep refLines
 * and bands in the array from frame 0 and fade them with `opacity`.
 */
export const ColumnBars: React.FC<ColumnBarsProps> = ({
  values,
  from,
  morph = 1,
  progress = 1,
  labels,
  colors,
  muted = [],
  highlight = [],
  refLines = [],
  bands = [],
  yDomain,
  yScale = 'linear',
  valueFormat = defaultFormat,
  valueOpacity = 1,
  valueIndices,
  yTicks,
  yFormat = defaultFormat,
  yLabel,
  width,
  height,
}) => {
  const t = useTheme();
  const c = t.palette.colors;
  const m = clamp01(morph);
  const p = clamp01(progress);
  const log = yScale === 'log';

  const drawn = values.map((v, i) => {
    const src = from?.[i] ?? v;
    return src + (v - src) * m;
  });

  const domain =
    yDomain ??
    autoDomain(
      [
        ...values,
        ...(from ?? []),
        ...refLines.map((r) => r.value),
        ...bands.flatMap((b) => [b.from, b.to]),
      ],
      yScale,
    );
  const [d0, d1] = domain;
  const frac = log
    ? (v: number) => {
        const l0 = Math.log10(d0);
        return (Math.log10(Math.max(v, Number.MIN_VALUE)) - l0) / (Math.log10(d1) - l0 || 1);
      }
    : (v: number) => (v - d0) / (d1 - d0 || 1);
  // a tick outside the domain would be clamped onto the plot edge under the wrong number
  const ticks = (yTicks ?? autoTicks(domain, yScale)).filter((v) => frac(v) >= -1e-9 && frac(v) <= 1 + 1e-9);

  const tickFont = Math.max(22, t.fontSize.xs);
  const labelFont = Math.max(22, t.fontSize.xs);
  const valueFont = Math.max(22, t.fontSize.xs);

  const sideLabels = [...refLines.map((r) => r.label), ...bands.map((b) => b.label)].filter(
    (s): s is string => !!s,
  );
  const padLeft =
    (ticks.length > 0 ? Math.max(0, ...ticks.map((v) => estWidth(yFormat(v), tickFont))) + t.space(2) : 0) +
    (yLabel ? labelFont + t.space(2) : 0);
  const padRight =
    sideLabels.length > 0 ? Math.max(...sideLabels.map((s) => estWidth(s, labelFont))) + t.space(3) : t.space(1);
  // value labels may sit past either end of the domain, and column labels sit below that
  const valueRoom = valueFont + t.space(1);
  const padTop = valueRoom;
  const padBottom = valueRoom + labelFont + t.space(1);

  const plotX = padLeft;
  const plotY = padTop;
  const plotW = Math.max(1, width - padLeft - padRight);
  const plotH = Math.max(1, height - padTop - padBottom);

  const toY = (v: number) => plotY + plotH * (1 - Math.max(0, Math.min(1, frac(v))));

  const baseValue = log ? 1 : 0;
  const yBase = toY(Math.max(d0, Math.min(d1, baseValue)));

  const n = values.length;
  const slot = n > 0 ? plotW / n : 0;
  const barW = Math.max(2, Math.min(MAX_BAR_WIDTH, slot * BAR_FILL));

  // placed from every gutter label in the props regardless of opacity, so a fade-in never shifts the others
  const sideGap = labelFont * 1.25;
  const lineIdx = refLines.flatMap((r, i) => (r.label ? [i] : []));
  const bandIdx = bands.flatMap((b, i) => (b.label ? [i] : []));
  const side = placeSideLabels(
    lineIdx.map((i) => toY(refLines[i]!.value)),
    bandIdx.map((i): [number, number] => {
      const b = bands[i]!;
      return [toY(Math.max(b.from, b.to)), toY(Math.min(b.from, b.to))];
    }),
    sideGap,
    sideGap / 2,
    height - sideGap / 2,
  );
  const lineLabelY = new Map(lineIdx.map((i, k) => [i, side.lines[k]!]));
  const bandLabelY = new Map(bandIdx.map((i, k) => [i, side.bands[k]!]));

  const mutedSet = new Set(muted);
  const highlightSet = new Set(highlight);
  const valueSet = valueIndices ? new Set(valueIndices) : null;
  // values land once the grow-in has (almost) finished, never ahead of the bars
  const valueAlpha = clamp01(valueOpacity) * clamp01((p - 0.9) / 0.1);

  const posColor = t.palette.series[0] ?? c.accent;
  const negColor = t.palette.series[1] ?? c.warn;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {ticks.map((v) => (
        <line
          key={`grid-${v}`}
          x1={plotX}
          y1={toY(v)}
          x2={plotX + plotW}
          y2={toY(v)}
          stroke={c.grid}
          strokeWidth={1}
        />
      ))}

      {bands.map((b, i) => {
        const color = resolveColor(t, b.color, c.accent);
        const op = b.opacity ?? 0.14;
        const yA = toY(Math.max(b.from, b.to));
        const yB = toY(Math.min(b.from, b.to));
        return (
          <g key={`band-${i}`}>
            <rect x={plotX} y={yA} width={plotW} height={Math.max(0, yB - yA)} fill={color} opacity={op} />
            {b.label ? (
              <text
                x={plotX + plotW + t.space(2)}
                y={bandLabelY.get(i) ?? (yA + yB) / 2}
                dominantBaseline="central"
                fill={color}
                opacity={clamp01(op / 0.14)}
                fontFamily={t.fonts.sans}
                fontSize={labelFont}
              >
                {b.label}
              </text>
            ) : null}
          </g>
        );
      })}

      <line x1={plotX} y1={plotY} x2={plotX} y2={plotY + plotH} stroke={c.baseline} strokeWidth={t.stroke.thin} />
      <line x1={plotX} y1={yBase} x2={plotX + plotW} y2={yBase} stroke={c.baseline} strokeWidth={t.stroke.thin} />

      {drawn.map((v, i) => {
        const cx = plotX + slot * (i + 0.5);
        const yVal = toY(v);
        const yEnd = yBase + (yVal - yBase) * p;
        const up = yEnd <= yBase;
        const color = resolveColor(t, colors?.[i], up ? posColor : negColor);
        const isMuted = mutedSet.has(i);
        const isHi = highlightSet.has(i);
        const path = columnPath(cx - barW / 2, barW, yBase, yEnd, CORNER_R);
        const showValue = valueAlpha > 0 && (!valueSet || valueSet.has(i));
        return (
          <g key={`col-${i}`}>
            {path ? (
              <path
                d={path}
                fill={color}
                opacity={isMuted ? 0.28 : 1}
                // color-mix, not a hex alpha suffix: `color` may be rgba() or a named CSS color
                style={
                  isHi
                    ? { filter: `brightness(1.35) drop-shadow(0 0 10px color-mix(in srgb, ${color} 53%, transparent))` }
                    : undefined
                }
              />
            ) : null}
            {showValue ? (
              <text
                x={cx}
                y={up ? yEnd - t.space(1) : yEnd + t.space(1)}
                textAnchor="middle"
                dominantBaseline={up ? 'auto' : 'hanging'}
                fill={isMuted ? c.muted : isHi ? c.text : c.textSecondary}
                opacity={valueAlpha}
                fontFamily={t.fonts.mono}
                fontSize={valueFont}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {valueFormat(v)}
              </text>
            ) : null}
            {labels?.[i] !== undefined ? (
              <text
                x={cx}
                y={plotY + plotH + valueRoom}
                textAnchor="middle"
                dominantBaseline="hanging"
                fill={isMuted ? c.muted : isHi ? c.text : c.textSecondary}
                fontWeight={isHi ? 700 : 400}
                fontFamily={t.fonts.sans}
                fontSize={labelFont}
              >
                {labels[i]}
              </text>
            ) : null}
          </g>
        );
      })}

      {refLines.map((r, i) => {
        const op = clamp01(r.opacity ?? 1);
        if (op <= 0) return null;
        const color = resolveColor(t, r.color, c.accent);
        const y = toY(r.value);
        return (
          <g key={`ref-${i}`} opacity={op}>
            <line
              x1={plotX}
              y1={y}
              x2={plotX + plotW}
              y2={y}
              stroke={color}
              strokeWidth={t.stroke.thin}
              strokeDasharray={r.dashed === false ? undefined : DASH}
            />
            {r.label ? (
              <text
                x={plotX + plotW + t.space(2)}
                y={lineLabelY.get(i) ?? y}
                dominantBaseline="central"
                fill={color}
                fontFamily={t.fonts.sans}
                fontSize={labelFont}
              >
                {r.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {ticks.map((v) => (
        <text
          key={`tick-${v}`}
          x={plotX - t.space(1)}
          y={toY(v)}
          textAnchor="end"
          dominantBaseline="central"
          fill={c.textSecondary}
          fontFamily={t.fonts.mono}
          fontSize={tickFont}
        >
          {yFormat(v)}
        </text>
      ))}
      {yLabel ? (
        <text
          transform={`translate(${labelFont * 0.8}, ${plotY + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          fill={c.muted}
          fontFamily={t.fonts.sans}
          fontSize={labelFont}
        >
          {yLabel}
        </text>
      ) : null}
    </svg>
  );
};
