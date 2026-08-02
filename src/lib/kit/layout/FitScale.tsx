import React, { useEffect, useRef, useState } from 'react';

/**
 * Deck-side helper: renders children designed at a fixed 1920×1080 space,
 * scaled to fit the available viewport. Never used inside Remotion scenes.
 */
export const FitScale: React.FC<{
  width?: number;
  height?: number;
  children: React.ReactNode;
}> = ({ width = 1920, height = 1080, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setScale(Math.min(r.width / width, r.height / height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
