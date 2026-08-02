import React, { useMemo } from 'react';
import * as THREE from 'three';
import { lerp, type V3 } from '../../timeline/effects';
import { BillboardLabel } from './BillboardLabel';

export interface TensorBoxProps {
  /** logical shape, e.g. [batch, seq, hidden] → mapped to [x, y, z] extents */
  dims: [number, number, number];
  dimLabels?: [string, string, string];
  position?: V3;
  /** world size of the longest axis */
  maxExtent?: number;
  color?: string;
  opacity?: number;
  /** shard the tensor along an axis */
  split?: { axis: 0 | 1 | 2; parts: number; gap?: number; colors?: string[] };
  /** 0..1 — drives the shards separating (from useStepProgress) */
  splitProgress?: number;
  /** extra world-space offset per shard, applied × moveProgress (e.g. toward GPUs) */
  partOffsets?: V3[];
  moveProgress?: number;
  showLabels?: boolean;
  labelColor?: string;
  /** dim-label opacity, independent of the box (default: follows `opacity`) — fade labels out once they go stale, e.g. after shards land on GPUs */
  labelOpacity?: number;
}

/** Compress huge dims (e.g. 4096) into readable proportions. */
const extents = (dims: [number, number, number], maxExtent: number): V3 => {
  const raw = dims.map((d) => Math.pow(Math.max(1, d), 0.28));
  const scale = maxExtent / Math.max(...raw);
  return raw.map((r) => Math.max(0.45, r * scale)) as V3;
};

/**
 * Pure function of its props — no Remotion/R3F hooks — so it renders both in
 * deterministic scenes (ThreeScene) and live interactive canvases.
 */
export const TensorBox: React.FC<TensorBoxProps> = ({
  dims,
  dimLabels,
  position = [0, 0, 0],
  maxExtent = 3.4,
  color = '#3987e5',
  opacity = 1,
  split,
  splitProgress = 0,
  partOffsets,
  moveProgress = 0,
  showLabels = true,
  labelColor = '#c3c2b7',
  labelOpacity,
}) => {
  const [sx, sy, sz] = extents(dims, maxExtent);

  const parts = split?.parts ?? 1;
  const axis = split?.axis ?? 0;
  const gap = split?.gap ?? 0.28;

  const partSize: V3 = [sx, sy, sz];
  partSize[axis] = partSize[axis]! / parts;

  const edgesGeom = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(partSize[0], partSize[1], partSize[2])),
    [partSize[0], partSize[1], partSize[2]],
  );

  const boxes = Array.from({ length: parts }, (_, i) => {
    const centered = (i - (parts - 1) / 2) * (partSize[axis]! + gap * splitProgress);
    const offset: V3 = [0, 0, 0];
    offset[axis] = centered;
    const extra = partOffsets?.[i];
    const pos: V3 = [
      position[0] + offset[0] + (extra ? lerp(0, extra[0], moveProgress) : 0),
      position[1] + offset[1] + (extra ? lerp(0, extra[1], moveProgress) : 0),
      position[2] + offset[2] + (extra ? lerp(0, extra[2], moveProgress) : 0),
    ];
    const partColor = split?.colors?.[i % (split.colors.length || 1)] ?? color;
    return { pos, partColor, key: i };
  });

  // labels sit outside the (possibly spread) silhouette
  const totalSpread = (parts - 1) * gap * splitProgress;
  const eff: V3 = [sx, sy, sz];
  eff[axis] = eff[axis]! + totalSpread;
  const [ex, ey, ez] = eff;

  const labels = dimLabels ?? ['', '', ''];
  const labelDefs: { text: string; pos: V3 }[] = showLabels
    ? [
        { text: labels[0] ? `${labels[0]}=${dims[0]}` : '', pos: [0, -ey / 2 - 0.45, ez / 2 + 0.2] as V3 },
        { text: labels[1] ? `${labels[1]}=${dims[1]}` : '', pos: [-ex / 2 - 0.7, 0, ez / 2 + 0.2] as V3 },
        { text: labels[2] ? `${labels[2]}=${dims[2]}` : '', pos: [ex / 2 + 0.8, -ey / 2 - 0.45, 0] as V3 },
      ].filter((l) => l.text !== '')
    : [];

  return (
    <group>
      {boxes.map(({ pos, partColor, key }) => (
        <group key={key} position={pos}>
          <mesh>
            <boxGeometry args={[partSize[0], partSize[1], partSize[2]]} />
            <meshStandardMaterial color={partColor} transparent opacity={opacity * 0.82} />
          </mesh>
          <lineSegments geometry={edgesGeom}>
            <lineBasicMaterial color="#ffffff" transparent opacity={Math.min(1, opacity * 0.55)} />
          </lineSegments>
        </group>
      ))}
      {labelDefs.map((l) => (
        <BillboardLabel
          key={l.text}
          text={l.text}
          position={[position[0] + l.pos[0], position[1] + l.pos[1], position[2] + l.pos[2]]}
          color={labelColor}
          opacity={labelOpacity ?? opacity}
        />
      ))}
    </group>
  );
};
