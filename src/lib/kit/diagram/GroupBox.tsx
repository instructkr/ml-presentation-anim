import React from 'react';
import { diagramVariant, useTheme } from '../../theme';

export interface GroupBoxProps {
  label?: string;
  variant?: string;
  width: number;
  height: number;
  highlighted?: boolean;
  dimmed?: boolean;
  style?: React.CSSProperties;
}

export const GroupBox: React.FC<GroupBoxProps> = ({
  label,
  variant = 'group',
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
        border: `2px dashed ${v.stroke}`,
        borderRadius: t.radius.lg,
        opacity: dimmed ? 0.25 : 1,
        boxShadow: highlighted ? `0 0 0 3px ${t.palette.colors.accent}44` : 'none',
        ...style,
      }}
    >
      {label ? (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 18,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 1,
            color: v.text,
            fontFamily: t.fonts.sans,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
