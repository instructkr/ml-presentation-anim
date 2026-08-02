import React from 'react';
import { diagramVariant, useTheme } from '../../theme';
import { Tex } from '../math/Tex';

export interface BlockProps {
  label: string;
  tex?: string;
  kind?: 'block' | 'op' | 'io' | 'annotation';
  variant?: string;
  width: number;
  height: number;
  highlighted?: boolean;
  dimmed?: boolean;
  style?: React.CSSProperties;
}

/**
 * The single node visual — rendered identically inside Remotion scenes
 * (via DiagramView) and inside the React Flow explorer (custom node).
 */
export const Block: React.FC<BlockProps> = ({
  label,
  tex,
  kind = 'block',
  variant = 'default',
  width,
  height,
  highlighted = false,
  dimmed = false,
  style,
}) => {
  const t = useTheme();
  const v = diagramVariant(t, variant);

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
          fontFamily: t.fonts.sans,
          opacity: dimmed ? 0.25 : 1,
          wordBreak: 'keep-all',
          textAlign: 'center',
          ...style,
        }}
      >
        <div>{label}</div>
        {tex ? <Tex size="sm">{tex}</Tex> : null}
      </div>
    );
  }

  const fontSize = kind === 'block' ? 30 : 26;
  return (
    <div
      style={{
        width,
        height,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        background: v.fill,
        border: `${t.stroke.med}px solid ${v.stroke}`,
        borderRadius: kind === 'io' ? 999 : t.radius.md,
        color: v.text,
        fontSize,
        fontWeight: 600,
        fontFamily: t.fonts.sans,
        wordBreak: 'keep-all',
        textAlign: 'center',
        padding: '0 14px',
        opacity: dimmed ? 0.22 : 1,
        filter: dimmed ? 'saturate(0.4)' : 'none',
        boxShadow: highlighted ? `0 0 0 4px ${v.stroke}55, 0 0 28px ${v.stroke}66` : 'none',
        ...style,
      }}
    >
      <div>{label}</div>
      {tex ? <Tex size="sm" color={t.palette.colors.textSecondary}>{tex}</Tex> : null}
    </div>
  );
};
