import React, { useId } from 'react';
import { resolveColor, useTheme } from '../../theme';

export interface LineChartPoint {
  x: number;
  y: number;
}

export interface LineChartSeries {
  label: string;
  /** overrides the series slot — pass a token name or raw CSS color */
  color?: string;
  /** drawn in the order given (no sorting), so authored order is the line order */
  points: LineChartPoint[];
}

export type LineChartScale = 'linear' | 'log';

export interface LineChartProps {
  series: LineChartSeries[];
  width: number;
  height: number;
  /** 0..1 — linear left→right reveal sweep over every series at once */
  progress?: number;
  xScale?: LineChartScale;
  yScale?: LineChartScale;
  xTicks?: number[];
  yTicks?: number[];
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  xLabel?: string;
  yLabel?: string;
  /** dot on every data point; the end dot that carries the direct label is always drawn */
  markers?: boolean;
  /** brightens one line; every other line is left at full opacity (no dimming) */
  highlightSeries?: number;
}

const TARGET_TICKS = 4;
const MARKER_R = 5;
/** surface-colored ring so dots stay legible where lines cross */
const RING = 2;
/** px of run-up over which a direct label fades in as the sweep reaches its line end */
const LABEL_FADE_PX = 60;
/** px within which an axis tick label counts as sitting on the plot edge */
const EDGE_SNAP = 12;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const niceStep = (raw: number): number => {
  const exp = Math.floor(Math.log10(raw));
  const f = raw / 10 ** exp;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return m * 10 ** exp;
};

const round = (v: number) => Number(v.toFixed(10));

const withCommas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const defaultFormat = (v: number): string => {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e5 || a < 1e-3) {
    const e = Math.floor(Math.log10(a));
    return `${round(Number((v / 10 ** e).toFixed(1)))}e${e}`;
  }
  const s = String(round(v));
  const [int, frac] = s.split('.');
  return frac ? `${withCommas(int!)}.${frac}` : withCommas(int!);
};

/** rough advance width — Hangul/CJK are full-width, latin ~0.56em */
const estWidth = (s: string, fontSize: number): number => {
  let w = 0;
  for (const ch of s) w += /[ᄀ-ᇿ　-ヿ㐀-鿿가-힯]/.test(ch) ? 1 : 0.56;
  return w * fontSize;
};

const domainOf = (values: number[], scale: LineChartScale): [number, number] => {
  const usable = scale === 'log' ? values.filter((v) => v > 0) : values;
  if (usable.length === 0) return scale === 'log' ? [1, 10] : [0, 1];
  const lo = Math.min(...usable);
  const hi = Math.max(...usable);
  if (scale === 'log') {
    const d0 = 10 ** Math.floor(Math.log10(lo));
    const d1 = 10 ** Math.ceil(Math.log10(hi));
    return d1 > d0 ? [d0, d1] : [d0, d0 * 10];
  }
  if (hi === lo) return [lo - 1, hi + 1];
  const stepSize = niceStep((hi - lo) / TARGET_TICKS);
  return [round(Math.floor(lo / stepSize) * stepSize), round(Math.ceil(hi / stepSize) * stepSize)];
};

const ticksFor = (domain: [number, number], scale: LineChartScale): number[] => {
  const [d0, d1] = domain;
  if (scale === 'log') {
    const out: number[] = [];
    for (let e = Math.round(Math.log10(d0)); e <= Math.round(Math.log10(d1)); e += 1) out.push(10 ** e);
    return out;
  }
  const stepSize = niceStep((d1 - d0) / TARGET_TICKS);
  const out: number[] = [];
  for (let v = d0; v <= d1 + stepSize / 2; v += stepSize) out.push(round(v));
  return out;
};

const projector = (domain: [number, number], scale: LineChartScale) => {
  const [d0, d1] = domain;
  if (scale === 'log') {
    const l0 = Math.log10(d0);
    const span = Math.log10(d1) - l0 || 1;
    return (v: number) => (Math.log10(Math.max(v, Number.MIN_VALUE)) - l0) / span;
  }
  const span = d1 - d0 || 1;
  return (v: number) => (v - d0) / span;
};

/**
 * SVG line chart for trend/scaling plots; drive `progress` with useStepProgress.
 * Series identity comes from a direct label at each line's end (the legend) plus
 * the end dot beside it — never from coloring the text.
 */
export const LineChart: React.FC<LineChartProps> = ({
  series,
  width,
  height,
  progress = 1,
  xScale = 'linear',
  yScale = 'linear',
  xTicks,
  yTicks,
  xFormat = defaultFormat,
  yFormat = defaultFormat,
  xLabel,
  yLabel,
  markers = false,
  highlightSeries,
}) => {
  const t = useTheme();
  const c = t.palette.colors;
  const clipId = `lc-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const p = clamp01(progress);

  const allX = series.flatMap((s) => s.points.map((pt) => pt.x));
  const allY = series.flatMap((s) => s.points.map((pt) => pt.y));
  const xDomain = domainOf(xTicks ? [...allX, ...xTicks] : allX, xScale);
  const yDomain = domainOf(yTicks ? [...allY, ...yTicks] : allY, yScale);
  const xt = xTicks ?? ticksFor(xDomain, xScale);
  const yt = yTicks ?? ticksFor(yDomain, yScale);

  const tickFont = Math.max(22, t.fontSize.xs);
  const labelFont = Math.max(24, t.fontSize.sm);

  const padLeft =
    Math.max(0, ...yt.map((v) => estWidth(yFormat(v), tickFont))) +
    t.space(2) +
    (yLabel ? labelFont + t.space(2) : 0);
  const padRight =
    Math.max(0, ...series.map((s) => estWidth(s.label, labelFont))) + t.space(2) + MARKER_R + RING;
  const padBottom = tickFont + t.space(2) + (xLabel ? labelFont + t.space(2) : 0);
  const padTop = t.space(2);

  const plotX = padLeft;
  const plotY = padTop;
  const plotW = Math.max(1, width - padLeft - padRight);
  const plotH = Math.max(1, height - padTop - padBottom);

  const px = projector(xDomain, xScale);
  const py = projector(yDomain, yScale);
  const toX = (v: number) => plotX + plotW * px(v);
  const toY = (v: number) => plotY + plotH * (1 - py(v));

  const sweepX = plotX + plotW * p;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={plotX} y={plotY - MARKER_R - RING} width={plotW * p} height={plotH + 2 * (MARKER_R + RING)} />
        </clipPath>
      </defs>

      {yt.map((v) => (
        <line key={`gy-${v}`} x1={plotX} y1={toY(v)} x2={plotX + plotW} y2={toY(v)} stroke={c.grid} strokeWidth={1} />
      ))}
      {xt.map((v) => (
        <line key={`gx-${v}`} x1={toX(v)} y1={plotY} x2={toX(v)} y2={plotY + plotH} stroke={c.grid} strokeWidth={1} />
      ))}
      <line
        x1={plotX}
        y1={plotY + plotH}
        x2={plotX + plotW}
        y2={plotY + plotH}
        stroke={c.baseline}
        strokeWidth={t.stroke.thin}
      />
      <line x1={plotX} y1={plotY} x2={plotX} y2={plotY + plotH} stroke={c.baseline} strokeWidth={t.stroke.thin} />

      <g clipPath={`url(#${clipId})`}>
        {series.map((s, i) => {
          const color = resolveColor(t, s.color, t.palette.series[i % t.palette.series.length] ?? c.accent);
          const d = s.points.map((pt, j) => `${j === 0 ? 'M' : 'L'} ${toX(pt.x)} ${toY(pt.y)}`).join(' ');
          const glow =
            highlightSeries === i
              ? { filter: `brightness(1.35) drop-shadow(0 0 10px ${color}88)` }
              : undefined;
          return (
            <g key={`${s.label}-${i}`} style={glow}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={t.stroke.thin}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {markers
                ? s.points.map((pt, j) => (
                    <circle
                      key={`m-${j}`}
                      cx={toX(pt.x)}
                      cy={toY(pt.y)}
                      r={MARKER_R}
                      fill={color}
                      stroke={c.bg}
                      strokeWidth={RING}
                    />
                  ))
                : null}
            </g>
          );
        })}
      </g>

      {series.map((s, i) => {
        const last = s.points[s.points.length - 1];
        if (!last) return null;
        const endX = toX(last.x);
        // each label lands exactly as the sweep reaches its own line's end, so
        // the dot is never stranded ahead of the line it belongs to
        const opacity = clamp01((sweepX - endX + LABEL_FADE_PX) / LABEL_FADE_PX);
        if (opacity <= 0) return null;
        const color = resolveColor(t, s.color, t.palette.series[i % t.palette.series.length] ?? c.accent);
        return (
          <g key={`end-${s.label}-${i}`} opacity={opacity}>
            <circle cx={endX} cy={toY(last.y)} r={MARKER_R} fill={color} stroke={c.bg} strokeWidth={RING} />
            <text
              x={endX + MARKER_R + t.space(1)}
              y={toY(last.y)}
              dominantBaseline="central"
              fill={c.text}
              fontFamily={t.fonts.text}
              fontSize={labelFont}
            >
              {s.label}
            </text>
          </g>
        );
      })}

      {yt.map((v) => (
        <text
          key={`ty-${v}`}
          x={plotX - t.space(1)}
          y={toY(v)}
          textAnchor="end"
          dominantBaseline="central"
          fill={c.textSecondary}
          fontFamily={t.fonts.num}
          fontSize={tickFont}
        >
          {yFormat(v)}
        </text>
      ))}
      {xt.map((v) => {
        const x = toX(v);
        // a centered label on the first/last tick would hang past the plot and
        // crowd the y ticks / the end labels
        const anchor =
          x - plotX < EDGE_SNAP ? 'start' : plotX + plotW - x < EDGE_SNAP ? 'end' : 'middle';
        return (
          <text
            key={`tx-${v}`}
            x={x}
            y={plotY + plotH + t.space(1)}
            textAnchor={anchor}
            dominantBaseline="hanging"
            fill={c.textSecondary}
            fontFamily={t.fonts.num}
            fontSize={tickFont}
          >
            {xFormat(v)}
          </text>
        );
      })}

      {xLabel ? (
        <text
          x={plotX + plotW / 2}
          y={height - t.space(1)}
          textAnchor="middle"
          fill={c.muted}
          fontFamily={t.fonts.text}
          fontSize={labelFont}
        >
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text
          transform={`translate(${labelFont * 0.8}, ${plotY + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          fill={c.muted}
          fontFamily={t.fonts.text}
          fontSize={labelFont}
        >
          {yLabel}
        </text>
      ) : null}
    </svg>
  );
};
