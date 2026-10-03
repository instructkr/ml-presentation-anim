import React from 'react';
import { resolveColor, useTheme } from '../../theme';

export interface BarChartDatum {
  label: string;
  value: number;
  /** overrides the default single-hue fill — e.g. a series slot for per-bar identity */
  color?: string;
}

export interface BarChartProps {
  data: BarChartDatum[];
  /** 0..1 — linear sweep (caller/useStepProgress already applies easing) */
  progress?: number;
  width: number;
  height: number;
  maxValue?: number;
  valueFormat?: (v: number) => string;
  /** brightens one bar; every other bar is left at full opacity (no dimming) */
  highlightIndex?: number;
}

const GRID_LINES = 3;
const BAR_GAP = 2;
const CORNER_R = 4;
/** thin marks: bars never exceed this, whatever the row slot height */
const MAX_BAR_THICKNESS = 56;

/** Bar rect as a path — square at the baseline end, rounded only at the data end. */
const barPath = (x0: number, y0: number, len: number, h: number, r: number): string => {
  if (len <= 0) return '';
  const rr = Math.max(0, Math.min(r, len, h / 2));
  if (rr < 0.5) return `M ${x0} ${y0} h ${len} v ${h} h ${-len} Z`;
  const xEnd = x0 + len;
  return [
    `M ${x0} ${y0}`,
    `L ${xEnd - rr} ${y0}`,
    `Q ${xEnd} ${y0} ${xEnd} ${y0 + rr}`,
    `L ${xEnd} ${y0 + h - rr}`,
    `Q ${xEnd} ${y0 + h} ${xEnd - rr} ${y0 + h}`,
    `L ${x0} ${y0 + h}`,
    'Z',
  ].join(' ');
};

/** Horizontal SVG bar chart for benchmark tables; drive `progress` with useStepProgress. */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  progress = 1,
  width,
  height,
  maxValue,
  valueFormat = (v) => String(v),
  highlightIndex,
}) => {
  const t = useTheme();
  const c = t.palette.colors;
  const defaultColor = t.palette.series[0] ?? c.accent;
  const p = Math.max(0, Math.min(1, progress));

  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));
  const labelWidth = Math.min(320, Math.max(140, width * 0.22));
  const rightPad = 100;
  const plotX = labelWidth;
  const plotWidth = Math.max(0, width - labelWidth - rightPad);

  const barSlot = data.length > 0 ? height / data.length : 0;
  const barThickness = Math.max(1, Math.min(barSlot - BAR_GAP, MAX_BAR_THICKNESS));
  const fontSize = Math.max(20, t.fontSize.sm);
  const valueOpacity = Math.max(0, Math.min(1, (progress - 0.95) / 0.05));

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {Array.from({ length: GRID_LINES }, (_, i) => {
        const x = plotX + plotWidth * ((i + 1) / (GRID_LINES + 1));
        return <line key={`grid-${i}`} x1={x} y1={0} x2={x} y2={height} stroke={c.grid} strokeWidth={1} />;
      })}
      <line x1={plotX} y1={0} x2={plotX} y2={height} stroke={c.baseline} strokeWidth={t.stroke.thin} />

      {data.map((d, i) => {
        const barColor = resolveColor(t, d.color, defaultColor);
        const len = plotWidth * Math.max(0, Math.min(1, d.value / max)) * p;
        const y0 = i * barSlot + (barSlot - barThickness) / 2;
        const labelY = y0 + barThickness / 2;
        const path = barPath(plotX, y0, len, barThickness, CORNER_R);
        return (
          <g key={`${d.label}-${i}`}>
            <text
              x={plotX - t.space(2)}
              y={labelY}
              textAnchor="end"
              dominantBaseline="central"
              fill={c.text}
              fontFamily={t.fonts.text}
              fontSize={fontSize}
            >
              {d.label}
            </text>
            {path ? (
              <path
                d={path}
                fill={barColor}
                style={
                  highlightIndex === i
                    ? { filter: `brightness(1.35) drop-shadow(0 0 10px ${barColor}88)` }
                    : undefined
                }
              />
            ) : null}
            {valueOpacity > 0 ? (
              <text
                x={plotX + len + t.space(1)}
                y={labelY}
                dominantBaseline="central"
                fill={c.textSecondary}
                fontFamily={t.fonts.num}
                fontSize={fontSize}
                opacity={valueOpacity}
              >
                {valueFormat(d.value)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
