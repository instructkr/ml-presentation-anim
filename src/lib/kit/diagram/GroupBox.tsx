import React from 'react';
import { diagramVariant, useTheme } from '../../theme';

export interface GroupBoxProps {
  label?: string;
  /** left inset of the label chip — pass `groupLabelLeft(...)` to dodge edge-entry lines */
  labelLeft?: number;
  variant?: string;
  dash?: 'dashed' | 'dotted';
  width: number;
  height: number;
  highlighted?: boolean;
  dimmed?: boolean;
  style?: React.CSSProperties;
}

export const GroupBox: React.FC<GroupBoxProps> = ({
  label,
  labelLeft = 14,
  variant = 'group',
  dash = 'dashed',
  width,
  height,
  highlighted = false,
  dimmed = false,
  style,
}) => {
  const t = useTheme();
  const v = diagramVariant(t, variant);
  return (
    <div
      style={{
        width,
        height,
        boxSizing: 'border-box',
        background: v.fill,
        border: `${t.stroke.thin}px ${dash} ${v.stroke}`,
        borderRadius: t.radius.md,
        opacity: dimmed ? 0.25 : 1,
        boxShadow: highlighted ? `0 0 0 3px ${t.palette.colors.accent}44` : 'none',
        ...style,
      }}
    >
      {label ? (
        // solid-bg chip so edges passing underneath never collide with the text
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: labelLeft,
            fontSize: 21,
            fontWeight: 500,
            letterSpacing: 1,
            color: v.text,
            fontFamily: t.fonts.text,
            background: t.palette.colors.bg,
            padding: '2px 10px',
            borderRadius: 6,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
