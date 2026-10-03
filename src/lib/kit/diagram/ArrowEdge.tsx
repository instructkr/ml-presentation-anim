import React from 'react';
import { resolveColor, useTheme } from '../../theme';

export interface ArrowEdgeProps {
  points: { x: number; y: number }[];
  color?: string;
  dashed?: boolean;
  dotted?: boolean;
  /** figure rails that merely carry a value draw no arrowhead */
  arrow?: boolean;
  label?: string;
  /** 0..1 — fraction along the path where the label sits (default 0.5) */
  labelPos?: number;
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

/** Polyline with rounded elbows — shared with the explorer so both renderers trace the same route. */
export const roundedPath = (points: { x: number; y: number }[], r = 12): string => {
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

/** Point + local direction at fraction `f` of the polyline's arc length. */
const pointAlong = (
  points: { x: number; y: number }[],
  f: number,
): { x: number; y: number; dx: number; dy: number } => {
  const segs: { len: number; a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ len, a, b });
    total += len;
  }
  let target = total * Math.min(1, Math.max(0, f));
  for (const s of segs) {
    if (target <= s.len || s === segs[segs.length - 1]) {
      const u = s.len === 0 ? 0 : target / s.len;
      return {
        x: s.a.x + (s.b.x - s.a.x) * u,
        y: s.a.y + (s.b.y - s.a.y) * u,
        dx: s.len === 0 ? 1 : (s.b.x - s.a.x) / s.len,
        dy: s.len === 0 ? 0 : (s.b.y - s.a.y) / s.len,
      };
    }
    target -= s.len;
  }
  const last = points[points.length - 1]!;
  return { x: last.x, y: last.y, dx: 1, dy: 0 };
};

/** SVG edge with arrowhead; render inside the parent diagram <svg>. */
export const ArrowEdge: React.FC<ArrowEdgeProps> = ({
  points,
  color,
  dashed = false,
  dotted = false,
  arrow = true,
  label,
  labelPos = 0.5,
  draw = 1,
  pulse = false,
  pulsePhase = 0,
  highlighted = false,
  dimmed = false,
  strokeWidth,
}) => {
  const t = useTheme();
  if (points.length < 2) return null;

  const stroke = highlighted
    ? t.palette.colors.accent
    : resolveColor(t, color, t.palette.colors.line);
  const broken = dashed || dotted;
  const w = strokeWidth ?? (highlighted ? t.stroke.med : t.stroke.thin);
  const d = roundedPath(points);

  const last = points[points.length - 1]!;
  // Imported and GUI-authored routes can contain a duplicate final point. Use
  // the final non-zero segment as the arrow's actual direction.
  let prev = points[points.length - 2]!;
  for (let i = points.length - 2; i >= 0; i--) {
    const candidate = points[i]!;
    if (Math.hypot(last.x - candidate.x, last.y - candidate.y) > 0.01) {
      prev = candidate;
      break;
    }
  }
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
  const ah = 11;
  const tip = last;
  const left = {
    x: tip.x - ah * Math.cos(angle - 0.42),
    y: tip.y - ah * Math.sin(angle - 0.42),
  };
  const right = {
    x: tip.x - ah * Math.cos(angle + 0.42),
    y: tip.y - ah * Math.sin(angle + 0.42),
  };
  // label sits beside the path: anchor at `labelPos` of the arc length, pushed
  // out along the local normal so it never sits on the line itself
  const at = pointAlong(points, labelPos);
  const nx = -at.dy;
  const ny = at.dx;
  const flip = ny > 0 ? -1 : 1; // prefer the upper side
  const labelX = at.x + nx * flip * 24;
  const labelY = at.y + ny * flip * 24;
  const numericLabel = Boolean(label && /\d/.test(label));
  const labelWidth = label ? Math.max(50, label.length * (numericLabel ? 11.5 : 12.5) + 20) : 0;
  const opacity = dimmed ? 0.18 : 1;

  return (
    <g style={{ opacity }}>
      {/* dashed/dotted lines own their dash array, so they fade in instead of drawing on */}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={w}
        strokeLinecap="round"
        pathLength={broken ? undefined : 1}
        strokeDasharray={dotted ? `1 ${w * 3.5}` : dashed ? '10 7' : '1'}
        strokeDashoffset={broken ? undefined : 1 - draw}
        style={broken && draw < 1 ? { opacity: draw } : undefined}
      />
      {/* the pulse rides the edge, so it fades in with it — never on an edge not yet revealed */}
      {pulse && draw > 0 ? (
        <path
          d={d}
          fill="none"
          stroke={t.palette.colors.accent}
          strokeWidth={w + 1.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.05 0.11"
          strokeDashoffset={-pulsePhase * 0.16}
          style={draw < 1 ? { opacity: draw } : undefined}
        />
      ) : null}
      {arrow && draw > 0.97 ? (
        <path d={`M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`} fill={stroke} />
      ) : null}
      {label ? (
        <g style={{ opacity: draw }}>
          <rect
            x={labelX - labelWidth / 2}
            y={labelY - 16}
            width={labelWidth}
            height={32}
            rx={8}
            fill={t.palette.colors.bg}
            stroke={t.palette.colors.border}
            strokeWidth={1}
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: 19,
              fontFamily: numericLabel ? t.fonts.num : t.fonts.text,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: numericLabel ? '0.01em' : undefined,
              fill: t.palette.colors.textSecondary,
            }}
          >
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};
