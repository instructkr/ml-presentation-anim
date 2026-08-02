import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { resolveColor, useTheme } from '../../theme';

export interface TexProps {
  /** raw LaTeX, e.g. {'y = \\sum_i g_i E_i(x)'} — remember to escape backslashes */
  children: string;
  display?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  style?: React.CSSProperties;
}

const SIZES = { sm: 28, md: 38, lg: 50, xl: 66 } as const;

/** KaTeX-rendered math. Fast, deterministic, no external LaTeX toolchain. */
export const Tex: React.FC<TexProps> = ({ children, display = false, size = 'md', color, style }) => {
  const t = useTheme();
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: 'ignore',
      }),
    [children, display],
  );
  return (
    <span
      style={{
        fontSize: SIZES[size],
        color: resolveColor(t, color, t.palette.colors.text),
        display: display ? 'block' : 'inline-block',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
