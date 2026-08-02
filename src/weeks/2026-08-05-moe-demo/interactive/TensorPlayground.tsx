import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TensorBox } from '@/lib/kit';
import { useTheme } from '@/lib/theme';

const AXES = ['B', 'S', 'H'] as const;

/**
 * Live playground — OrbitControls and React state are allowed here because
 * this component is never rendered to video.
 */
export const TensorPlayground: React.FC = () => {
  const t = useTheme();
  const [split, setSplit] = useState(0.6);
  const [axis, setAxis] = useState<0 | 1 | 2>(2);
  const [parts, setParts] = useState(4);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas flat camera={{ position: [8, 5, 11], fov: 38 }}>
        <color attach="background" args={[t.palette.colors.bg]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 10, 7]} intensity={1.35} />
        <directionalLight position={[-6, -4, -8]} intensity={0.3} />
        <TensorBox
          dims={[8, 512, 4096]}
          dimLabels={['B', 'S', 'H']}
          split={{ axis, parts, colors: t.palette.series.slice(0, parts) }}
          splitProgress={split}
        />
        <OrbitControls enableDamping makeDefault target={[0, 0, 0]} />
      </Canvas>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 22,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          background: 'rgba(13,13,13,0.85)',
          border: `1px solid ${t.palette.colors.border}`,
          borderRadius: 12,
          padding: '14px 22px',
          fontFamily: t.fonts.sans,
          fontSize: 17,
          color: t.palette.colors.textSecondary,
        }}
      >
        <span>분할</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          style={{ width: 220, accentColor: t.palette.colors.accent }}
        />
        <span>축</span>
        {AXES.map((a, i) => (
          <button
            key={a}
            onClick={() => setAxis(i as 0 | 1 | 2)}
            style={{
              background: axis === i ? t.palette.colors.accentSoft : 'transparent',
              color: axis === i ? t.palette.colors.text : t.palette.colors.muted,
              border: `1px solid ${axis === i ? t.palette.colors.accent : t.palette.colors.border}`,
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            {a}
          </button>
        ))}
        <span>조각</span>
        {[2, 4, 8].map((p) => (
          <button
            key={p}
            onClick={() => setParts(p)}
            style={{
              background: parts === p ? t.palette.colors.accentSoft : 'transparent',
              color: parts === p ? t.palette.colors.text : t.palette.colors.muted,
              border: `1px solid ${parts === p ? t.palette.colors.accent : t.palette.colors.border}`,
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
