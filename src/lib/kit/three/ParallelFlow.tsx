import React from 'react';
import { lerp3, type V3 } from '../../timeline/effects';

export interface ParallelFlowProps {
  from: V3;
  to: V3;
  /** 0..1 — cycling progress driving the pulse phase (derive from the frame) */
  progress: number;
  color?: string;
  count?: number;
  size?: number;
  /** mirror pulses traveling to→from as well (e.g. all-gather) */
  bidirectional?: boolean;
}

const pulses = (from: V3, to: V3, progress: number, count: number, size: number, color: string) => {
  const fadeIn = Math.min(1, progress * 3);
  return Array.from({ length: count }, (_, i) => {
    const tt = (progress + i / count) % 1;
    const pos = lerp3(from, to, tt);
    const opacity = Math.max(0, Math.sin(Math.PI * tt)) * fadeIn;
    return (
      <mesh key={i} position={pos}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
    );
  });
};

/**
 * Pure function of its props — no Remotion/R3F hooks — small pulses traveling
 * along a straight from→to line (all-reduce/all-gather data-movement visuals).
 * Color defaults to a raw hex (like TensorBox/GPUGrid): 3D kit components are
 * theme-agnostic pure props, so scenes pass `t.palette.series[i]` explicitly.
 */
export const ParallelFlow: React.FC<ParallelFlowProps> = ({
  from,
  to,
  progress,
  color = '#5e8dd3',
  count = 3,
  size = 0.09,
  bidirectional = false,
}) => (
  <group>
    {pulses(from, to, progress, count, size, color)}
    {bidirectional ? pulses(to, from, progress, count, size, color) : null}
  </group>
);
