import React, { useId } from 'react';
import { resolveColor, useTheme } from '../../theme';

export type LaneSegmentVariant = 'solid' | 'hatch' | 'outline';

export interface LaneSegment {
  from: number;
  to: number;
  /** token name, ink name or raw CSS (default: the first series colour) */
  color?: string;
  /** solid: work being done · hatch: a slot that waits · outline: an empty box (planned, or no longer usable) */
  variant?: LaneSegmentVariant;
  /** 0..1 — scenes fade a segment in or out by driving this */
  opacity?: number;
  /** a few characters inside the segment; drawn only once the visible part is wide enough for it */
  label?: string;
}

export interface Lane {
  /** left of the lane, on screen from frame 0 */
  label?: string;
  segments: LaneSegment[];
  /** this lane's own playhead, overriding the chart-level `until` */
  until?: number;
}

export interface LanesMarker {
  at: number;
  /** above the plot, centred on the line — keep neighbouring labels apart, they do not dodge */
  label?: string;
  /** token name or raw CSS (default `textSecondary`) */
  color?: string;
  /** default true */
  dashed?: boolean;
  /** 0..1 — scenes fade a marker in by driving this (keep the entry in the array from frame 0) */
  opacity?: number;
  /** lane indices the line spans (default: every lane) */
  lanes?: number[];
}

export interface LanesProps {
  lanes: Lane[];
  /** playhead: every segment is drawn only up to this x (scene sweeps it with useStepProgress); default: everything */
  until?: number;
  /** vertical lines at an x — an event every lane shares (a batch is collected, the model is updated) */
  markers?: LanesMarker[];
  /** fixed, so a sweep never rescales the axis */
  xDomain: [number, number];
  /** x-axis ticks + faint grid lines; auto when omitted, `[]` hides them */
  xTicks?: number[];
  xFormat?: (v: number) => string;
  /** axis title under the ticks */
  xLabel?: string;
  /** lane indices emphasised */
  highlight?: number[];
  /** lane indices drawn faded */
  muted?: number[];
  /** px size of ticks, lane labels, marker labels and segment labels (default 22) */
  textSize?: number;
  width: number;
  height: number;
}

/** a lane never grows taller than this, so two lanes do not drift to the top and bottom of a tall slot */
const MAX_PITCH = 168;
/** thin marks: a bar never exceeds this, whatever the lane height */
const MAX_BAR = 88;
/** share of the lane a bar may take */
const BAR_FILL = 0.6;
/** px shaved off each end, so back-to-back segments read as separate boxes */
const INSET = 1.5;
const TARGET_TICKS = 5;
const DASH = '10 7';
const HATCH_GAP = 11;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const round = (v: number) => Number(v.toFixed(10));

const niceStep = (raw: number): number => {
  const exp = Math.floor(Math.log10(raw));
  const f = raw / 10 ** exp;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return m * 10 ** exp;
};

const defaultFormat = (v: number): string => String(round(Number(v.toFixed(3))));

/** rough advance width — Hangul/CJK are full-width, latin ~0.56em */
const estWidth = (s: string, fontSize: number): number => {
  let w = 0;
  for (const ch of s) w += /[ᄀ-ᇿ　-ヿ㐀-鿿가-힯]/.test(ch) ? 1 : 0.56;
  return w * fontSize;
};

const autoTicks = ([d0, d1]: [number, number]): number[] => {
  if (!(d1 > d0)) return [];
  const s = niceStep((d1 - d0) / TARGET_TICKS);
  const out: number[] = [];
  for (let k = Math.ceil(d0 / s - 1e-6); k * s <= d1 + s * 1e-6; k += 1) out.push(round(k * s));
  return out;
};

/**
 * Horizontal lanes on a shared x axis (time, tokens processed) — the chart for
 * what several slots are doing at once: an attempt running, a slot waiting, an
 * attempt cut and resumed. Pure props: each lane is a row of segments, and a
 * playhead (`until`, or a lane's own) draws them only up to an x, so a scene
 * sweeps time forward with useStepProgress. Fade a kind of segment with its
 * `opacity`. Margins are sized from every label in the props regardless of
 * opacity, so keep markers in the array from frame 0. The axis and the lane
 * labels are always drawn: they are the frame-0 anchor.
 */
export const Lanes: React.FC<LanesProps> = ({
  lanes,
  until,
  markers = [],
  xDomain,
  xTicks,
  xFormat = defaultFormat,
  xLabel,
  highlight = [],
  muted = [],
  textSize,
  width,
  height,
}) => {
  const t = useTheme();
  const c = t.palette.colors;
  const marks = t.palette.marks;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const [d0, d1] = xDomain;
  const frac = (v: number) => (v - d0) / (d1 - d0 || 1);
  const ticks = (xTicks ?? autoTicks(xDomain)).filter((v) => frac(v) >= -1e-9 && frac(v) <= 1 + 1e-9);

  const font = textSize ?? Math.max(22, t.fontSize.xs);
  const laneLabels = lanes.map((l) => l.label).filter((s): s is string => !!s);
  const padLeft = laneLabels.length > 0 ? Math.max(...laneLabels.map((s) => estWidth(s, font))) + t.space(2) : t.space(1);
  // the last tick's text is centred on the plot edge
  const padRight = Math.max(t.space(1), ...ticks.slice(-1).map((v) => estWidth(xFormat(v), font) / 2));
  const padTop = markers.some((m) => m.label) ? font + t.space(1.5) : t.space(1);
  const padBottom = (ticks.length > 0 ? font + t.space(1.5) : t.space(1)) + (xLabel ? font + t.space(1.5) : 0);

  const n = Math.max(1, lanes.length);
  const availH = Math.max(1, height - padTop - padBottom);
  const pitch = Math.min(availH / n, MAX_PITCH);
  const plotH = pitch * n;
  const plotX = padLeft;
  // a short stack of lanes sits in the middle of its slot, axis and all
  const plotY = padTop + (availH - plotH) / 2;
  const plotW = Math.max(1, width - padLeft - padRight);
  const barH = Math.max(4, Math.min(MAX_BAR, pitch * BAR_FILL));

  const toX = (v: number) => plotX + plotW * clamp01(frac(v));
  const laneY = (i: number) => plotY + pitch * (i + 0.5);

  const mutedSet = new Set(muted);
  const highlightSet = new Set(highlight);
  const baseColor = t.palette.series[0] ?? c.text;

  // one hatch pattern per colour that needs it
  const hatchColors = [
    ...new Set(
      lanes.flatMap((l) => l.segments.filter((s) => s.variant === 'hatch').map((s) => resolveColor(t, s.color, baseColor))),
    ),
  ];
  const hatchId = (color: string) => `${uid}-hatch-${hatchColors.indexOf(color)}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        {hatchColors.map((color) => (
          <pattern
            key={color}
            id={hatchId(color)}
            width={HATCH_GAP}
            height={HATCH_GAP}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={HATCH_GAP} stroke={color} strokeWidth={t.stroke.thin} />
          </pattern>
        ))}
      </defs>

      {ticks.map((v) => (
        <line key={`grid-${v}`} x1={toX(v)} y1={plotY} x2={toX(v)} y2={plotY + plotH} stroke={c.grid} strokeWidth={1} />
      ))}

      <line x1={plotX} y1={plotY} x2={plotX} y2={plotY + plotH} stroke={c.baseline} strokeWidth={t.stroke.thin} />
      <line
        x1={plotX}
        y1={plotY + plotH}
        x2={plotX + plotW}
        y2={plotY + plotH}
        stroke={c.baseline}
        strokeWidth={t.stroke.thin}
      />

      {lanes.map((lane, i) => {
        const cy = laneY(i);
        const isMuted = mutedSet.has(i);
        const isHi = highlightSet.has(i);
        const playhead = lane.until ?? until ?? Number.POSITIVE_INFINITY;
        return (
          <g key={`lane-${i}`}>
            <g opacity={isMuted ? 0.28 : 1}>
              {lane.segments.map((seg, k) => {
                const op = clamp01(seg.opacity ?? 1);
                const end = Math.min(seg.to, playhead);
                if (op <= 0 || !(end > seg.from)) return null;
                const x0 = toX(seg.from) + INSET;
                const x1 = toX(end) - INSET;
                const w = x1 - x0;
                if (w < 0.5) return null;
                const color = resolveColor(t, seg.color, baseColor);
                const variant = seg.variant ?? 'solid';
                const showLabel = !!seg.label && w >= estWidth(seg.label, font) + t.space(1.5);
                return (
                  <g key={`seg-${k}`} opacity={op}>
                    <rect
                      x={x0}
                      y={cy - barH / 2}
                      width={w}
                      height={barH}
                      rx={marks?.radius ?? 4}
                      fill={variant === 'solid' ? color : variant === 'hatch' ? `url(#${hatchId(color)})` : 'none'}
                      fillOpacity={variant === 'solid' ? (marks?.fillOpacity ?? 1) : variant === 'hatch' ? 0.8 : 1}
                      stroke={variant === 'solid' && !(marks && marks.fillOpacity < 1) ? undefined : color}
                      strokeOpacity={variant === 'hatch' ? 0.8 : 1}
                      strokeWidth={t.stroke.thin}
                      strokeDasharray={variant === 'outline' ? '7 6' : undefined}
                      // color-mix, not a hex alpha suffix: `color` may be rgba() or a named CSS color
                      style={
                        isHi
                          ? { filter: `brightness(1.25) drop-shadow(0 0 10px color-mix(in srgb, ${color} 53%, transparent))` }
                          : undefined
                      }
                    />
                    {showLabel ? (
                      <text
                        x={(x0 + x1) / 2}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={variant === 'solid' ? c.bg : color}
                        fontFamily={/^[\d\s.,+\-−%×]+$/.test(seg.label!) ? t.fonts.num : t.fonts.text}
                        fontWeight={700}
                        fontSize={font}
                      >
                        {seg.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
            {lane.label ? (
              <text
                x={plotX - t.space(1.5)}
                y={cy}
                textAnchor="end"
                dominantBaseline="central"
                fill={isMuted ? c.muted : isHi ? c.text : c.textSecondary}
                fontWeight={isHi ? 700 : 400}
                fontFamily={t.fonts.text}
                fontSize={font}
              >
                {lane.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {markers.map((m, i) => {
        const op = clamp01(m.opacity ?? 1);
        if (op <= 0) return null;
        const color = resolveColor(t, m.color, c.textSecondary);
        const x = toX(m.at);
        const span = m.lanes && m.lanes.length > 0 ? m.lanes : null;
        const y0 = span ? plotY + pitch * Math.min(...span) : plotY;
        const y1 = span ? plotY + pitch * (Math.max(...span) + 1) : plotY + plotH;
        return (
          <g key={`marker-${i}`} opacity={op}>
            <line
              x1={x}
              y1={y0}
              x2={x}
              y2={y1}
              stroke={color}
              strokeWidth={t.stroke.thin}
              strokeDasharray={m.dashed === false ? undefined : DASH}
            />
            {m.label ? (
              <text x={x} y={plotY - t.space(1)} textAnchor="middle" fill={color} fontFamily={t.fonts.text} fontSize={font}>
                {m.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {ticks.map((v) => (
        <text
          key={`tick-${v}`}
          x={toX(v)}
          y={plotY + plotH + t.space(1)}
          textAnchor="middle"
          dominantBaseline="hanging"
          fill={c.textSecondary}
          fontFamily={t.fonts.num}
          fontSize={font}
        >
          {xFormat(v)}
        </text>
      ))}
      {xLabel ? (
        <text
          x={plotX + plotW / 2}
          y={plotY + plotH + (ticks.length > 0 ? font + t.space(2) : t.space(1))}
          textAnchor="middle"
          dominantBaseline="hanging"
          fill={c.muted}
          fontFamily={t.fonts.text}
          fontSize={font}
        >
          {xLabel}
        </text>
      ) : null}
    </svg>
  );
};
