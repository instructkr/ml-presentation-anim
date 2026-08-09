import React, { useLayoutEffect, useRef, useState } from 'react';

export interface FillSize {
  width: number;
  height: number;
}

/**
 * Measures the space its flex/grid cell provides and hands exact pixels to the
 * render-prop child. This is how scenes place DiagramView/charts without
 * hand-computing the slide's pixel budget — give the cell `flex: 1` (or a grid
 * track) and let Fill report what landed.
 *
 * Deterministic under rendering: a composition's layout is static, so the box
 * is measured once in a layout effect (committed before the frame is
 * captured). Uses offsetWidth/offsetHeight, which ignore the Player's CSS
 * scale transform — getBoundingClientRect would report the on-screen size and
 * shrink everything inside a scaled deck player. The ResizeObserver only
 * matters deck-side, when the window resizes around a live player.
 */
export const Fill: React.FC<{
  style?: React.CSSProperties;
  children: (size: FillSize) => React.ReactNode;
}> = ({ style, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<FillSize | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width > 0 && height > 0) {
        setSize((s) => (s && s.width === width && s.height === height ? s : { width, height }));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        position: 'relative',
        ...style,
      }}
    >
      {size ? children(size) : null}
    </div>
  );
};
