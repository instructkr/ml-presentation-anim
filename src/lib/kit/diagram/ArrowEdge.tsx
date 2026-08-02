import React from 'react';
import { useTheme } from '../../theme';

export interface ArrowEdgeProps {
  points: { x: number; y: number }[];
  color?: string;
  dashed?: boolean;
  label?: string;
  /** 0..1 — how much of the path is drawn */
  draw?: number;
  /** marching-dash overlay along the edge */
  pulse?: boolean;
  /** deterministic 0..1 phase for the pulse (derive from the frame) */
  pulsePhase?: number;
  highlighted?: boolean;
  dimmed?: boolean;
  strokeWidth?: number;
}

const roundedPath = (points: { x: number; y: number }[], r = 12): string => {
  if (points.length < 2) return '';
  const p0 = points[0]!;
  let d = `M ${p0.x} ${p0.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    const next = points[i + 1]!;
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y);
    const ri = Math.min(r, inLen / 2, outLen / 2);
    const a = {
      x: cur.x - ((cur.x - prev.x) / (inLen || 1)) * ri,
      y: cur.y - ((cur.y - prev.y) / (inLen || 1)) * ri,
    };
    const b = {
      x: cur.x + ((next.x - cur.x) / (outLen || 1)) * ri,
      y: cur.y + ((next.y - cur.y) / (outLen || 1)) * ri,
    };
    d += ` L ${a.x} ${a.y} Q ${cur.x} ${cur.y} ${b.x} ${b.y}`;
  }
  const last = points[points.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
};

/** SVG edge with arrowhead; render inside the parent diagram <svg>. */
export const ArrowEdge: React.FC<ArrowEdgeProps> = ({
  points,
  color,
  dashed = false,
  label,
  draw = 1,
  pulse = false,
  pulsePhase = 0,
  highlighted = false,
  dimmed = false,
  strokeWidth,
}) => {
  const t = useTheme();
  if (points.length < 2) return null;

  const stroke = highlighted ? t.palette.colors.accent : (color ?? '#8a8a84');
  const w = strokeWidth ?? (highlighted ? t.stroke.thick : t.stroke.med);
  const d = roundedPath(points);

  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
  const ah = 13;
  const tip = last;
  const left = {
    x: tip.x - ah * Math.cos(angle - 0.45),
    y: tip.y - ah * Math.sin(angle - 0.45),
  };
  const right = {
    x: tip.x - ah * Math.cos(angle + 0.45),
    y: tip.y - ah * Math.sin(angle + 0.45),
  };
  const mid = points[Math.floor(points.length / 2)]!;
  const opacity = dimmed ? 0.18 : 1;

  return (
    <g style={{ opacity }}>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={w}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={dashed ? '0.045 0.03' : '1'}
        strokeDashoffset={dashed ? 0 : 1 - draw}
        style={dashed && draw < 1 ? { opacity: draw } : undefined}
      />
      {pulse ? (
        <path
          d={d}
          fill="none"
          stroke={t.palette.colors.accent}
          strokeWidth={w + 1.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.05 0.11"
          strokeDashoffset={-pulsePhase * 0.16}
        />
      ) : null}
      {draw > 0.97 ? (
        <path d={`M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`} fill={stroke} />
      ) : null}
      {label ? (
        <text
          x={mid.x}
          y={mid.y - 10}
          textAnchor="middle"
          style={{
            fontSize: 22,
            fontFamily: t.fonts.sans,
            fill: t.palette.colors.textSecondary,
            stroke: t.palette.colors.bg,
            strokeWidth: 6,
            paintOrder: 'stroke',
            opacity: draw,
          }}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};
