import React from 'react';
import type { NodeShape } from '../../diagram/schema';
import { diagramVariant, useTheme } from '../../theme';
import { Tex } from '../math/Tex';

export interface BlockProps {
  label: string;
  tex?: string;
  kind?: 'block' | 'op' | 'io' | 'annotation';
  variant?: string;
  shape?: NodeShape;
  /** render the label through KaTeX (α, w, σ, N …) */
  math?: boolean;
  /** permanently faded (an inactive element of the figure) */
  muted?: boolean;
  width: number;
  height: number;
  highlighted?: boolean;
  dimmed?: boolean;
  style?: React.CSSProperties;
}

/** how far each slanted side of a trapezoid pulls in, as a fraction of width */
const SLANT = 0.16;

/**
 * SVG outline for the non-rectangular silhouettes. Returns one or more paths so
 * an hourglass (a low-rank pair) can draw as two separate trapezoids, exactly
 * as papers draw a down-projection stacked on an up-projection.
 */
const shapePaths = (shape: NodeShape, w: number, h: number): string[] => {
  const s = w * SLANT;
  switch (shape) {
    case 'trapUp':
      // narrow bottom → wide top
      return [`M 0 0 L ${w} 0 L ${w - s} ${h} L ${s} ${h} Z`];
    case 'trapDown':
      // wide bottom → narrow top
      return [`M ${s} 0 L ${w - s} 0 L ${w} ${h} L 0 ${h} Z`];
    case 'hourglass': {
      const half = h / 2 - 3;
      const top = h / 2 + 3;
      return [
        // upper half: up-projection (narrow bottom → wide top)
        `M 0 0 L ${w} 0 L ${w - s} ${half} L ${s} ${half} Z`,
        // lower half: down-projection (wide bottom → narrow top)
        `M ${s} ${top} L ${w - s} ${top} L ${w} ${h} L 0 ${h} Z`,
      ];
    }
    default:
      return [];
  }
};

/**
 * The single node visual — rendered identically inside Remotion scenes
 * (via DiagramView) and inside the React Flow explorer (custom node).
 */
export const Block: React.FC<BlockProps> = ({
  label,
  tex,
  kind = 'block',
  variant = 'default',
  shape = 'rect',
  math = false,
  muted = false,
  width,
  height,
  highlighted = false,
  dimmed = false,
  style,
}) => {
  const t = useTheme();
  const v = diagramVariant(t, variant);
  const opacity = dimmed ? 0.25 : muted ? 0.35 : 1;

  if (kind === 'annotation') {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: v.text,
          fontSize: 24,
          fontFamily: t.fonts.text,
          opacity,
          wordBreak: 'keep-all',
          textAlign: 'center',
          ...style,
        }}
      >
        {math ? <Tex color={v.text}>{label}</Tex> : <div>{label}</div>}
        {tex ? <Tex size="sm">{tex}</Tex> : null}
      </div>
    );
  }

  const fontSize = kind === 'block' ? 30 : 26;
  const glow = highlighted ? `0 0 0 2.5px ${v.stroke}66, 0 0 22px ${v.stroke}44` : 'none';
  const body = (
    <>
      {math ? (
        // math glyphs fill their box, so scale them off the node height rather
        // than the sans size — an α in a 46px circle must not overflow it
        <Tex color={v.text} style={{ fontSize: Math.min(34, Math.max(18, height * 0.58)) }}>
          {label}
        </Tex>
      ) : label ? (
        <div>{label}</div>
      ) : null}
      {tex ? (
        <Tex size="sm" color={t.palette.colors.textSecondary}>
          {tex}
        </Tex>
      ) : null}
    </>
  );

  const text: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    color: v.text,
    fontSize,
    fontWeight: 600,
    fontFamily: t.fonts.text,
    wordBreak: 'keep-all',
    textAlign: 'center',
    lineHeight: 1.1,
  };

  // the router's score histogram: a glyph, not a box
  if (shape === 'bars') {
    const heights = [0.42, 0.72, 0.34, 1];
    const bw = width / (heights.length * 2 - 1);
    return (
      <div style={{ width, height, opacity, ...style }}>
        <svg width={width} height={height} style={{ display: 'block', filter: highlighted ? 'brightness(1.3)' : undefined }}>
          {heights.map((f, i) => (
            <rect
              key={i}
              x={i * bw * 2}
              y={height * (1 - f)}
              width={bw}
              height={height * f}
              rx={1.5}
              fill={t.palette.colors.warn}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (shape === 'circle' || shape === 'pill') {
    const r = shape === 'circle' ? Math.min(width, height) / 2 : height / 2;
    return (
      <div
        style={{
          width,
          height,
          boxSizing: 'border-box',
          background: v.fill,
          border: `${t.stroke.thin}px solid ${v.stroke}`,
          borderRadius: r,
          opacity,
          filter: dimmed ? 'saturate(0.4)' : highlighted ? 'brightness(1.12)' : 'none',
          boxShadow: glow,
          padding: shape === 'pill' ? '0 12px' : 0,
          ...text,
          ...style,
        }}
      >
        {body}
      </div>
    );
  }

  const paths = shapePaths(shape, width, height);
  if (paths.length > 0) {
    return (
      <div
        style={{
          position: 'relative',
          width,
          height,
          opacity,
          filter: dimmed ? 'saturate(0.4)' : highlighted ? 'brightness(1.12)' : 'none',
          ...style,
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
        >
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={v.fill}
              stroke={v.stroke}
              strokeWidth={t.stroke.thin}
              strokeLinejoin="round"
              style={highlighted ? { filter: `drop-shadow(0 0 10px ${v.stroke})` } : undefined}
            />
          ))}
        </svg>
        {/* an hourglass is a labelled pair of projections — its glyphs are the shapes themselves */}
        {shape === 'hourglass' ? null : (
          <div style={{ position: 'absolute', inset: 0, ...text }}>{body}</div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width,
        height,
        boxSizing: 'border-box',
        background: v.fill,
        border: `${t.stroke.thin}px solid ${v.stroke}`,
        borderRadius: t.radius.sm,
        padding: '0 14px',
        opacity,
        filter: dimmed ? 'saturate(0.4)' : highlighted ? 'brightness(1.12)' : 'none',
        boxShadow: glow,
        ...text,
        ...style,
      }}
    >
      {body}
    </div>
  );
};
