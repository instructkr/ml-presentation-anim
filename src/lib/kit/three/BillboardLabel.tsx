import React, { useMemo } from 'react';
import type { V3 } from '../../timeline/effects';
import { makeLabelTexture } from './labelTexture';

export const BillboardLabel: React.FC<{
  text: string;
  position: V3;
  /** world-space height of the text */
  height?: number;
  color?: string;
  opacity?: number;
}> = ({ text, position, height = 0.42, color = '#ffffff', opacity = 1 }) => {
  const { texture, aspect } = useMemo(() => makeLabelTexture(text, color), [text, color]);
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent opacity={opacity} depthWrite={false} depthTest={false} />
    </sprite>
  );
};
