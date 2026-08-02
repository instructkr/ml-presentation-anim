import React from 'react';
import type { V3 } from '../../timeline/effects';
import { BillboardLabel } from './BillboardLabel';

export interface GPUGridProps {
  count: number;
  columns?: number;
  position?: V3;
  cell?: number;
  gap?: number;
  activeIndices?: number[];
  color?: string;
  activeColor?: string;
  labelPrefix?: string;
  showLabels?: boolean;
  opacity?: number;
}

/** A row/grid of device slabs (GPUs/TPUs) laid on the ground plane. */
export const GPUGrid: React.FC<GPUGridProps> = ({
  count,
  columns,
  position = [0, 0, 0],
  cell = 1.15,
  gap = 0.45,
  activeIndices = [],
  color = '#2c2c2a',
  activeColor = '#199e70',
  labelPrefix = 'GPU',
  showLabels = true,
  opacity = 1,
}) => {
  const cols = columns ?? Math.min(count, 4);
  const rows = Math.ceil(count / cols);
  const pitch = cell + gap;
  const active = new Set(activeIndices);

  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - (cols - 1) / 2) * pitch;
        const z = (row - (rows - 1) / 2) * pitch;
        const isActive = active.has(i);
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, isActive ? 0.06 : 0, 0]}>
              <boxGeometry args={[cell, isActive ? 0.3 : 0.2, cell]} />
              <meshStandardMaterial
                color={isActive ? activeColor : color}
                transparent
                opacity={opacity}
              />
            </mesh>
            {showLabels ? (
              <BillboardLabel
                text={`${labelPrefix}${i}`}
                position={[0, 0.55, 0]}
                height={0.3}
                color={isActive ? '#ffffff' : '#898781'}
                opacity={opacity}
              />
            ) : null}
          </group>
        );
      })}
    </group>
  );
};
