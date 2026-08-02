import React from 'react';
import { useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { resolveColor, useTheme } from '../../theme';
import type { V3 } from '../../timeline/effects';

const CameraRig: React.FC<{ position: V3; target: V3 }> = ({ position, target }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(position[0], position[1], position[2]);
  camera.lookAt(target[0], target[1], target[2]);
  return null;
};

export interface ThreeSceneProps {
  camera?: { position?: V3; target?: V3; fov?: number };
  background?: string;
  children: React.ReactNode;
}

/**
 * Remotion-safe 3D stage: ThreeCanvas + lights + deterministic camera.
 * Drive all animation from useCurrentFrame()/useStepProgress — NEVER useFrame.
 * For camera moves, pass a frame-derived `camera.position`.
 */
export const ThreeScene: React.FC<ThreeSceneProps> = ({ camera, background, children }) => {
  const { width, height } = useVideoConfig();
  const t = useTheme();
  const bg = resolveColor(t, background, t.palette.colors.bg);
  const position = camera?.position ?? ([6.5, 4.5, 9.5] as V3);
  const target = camera?.target ?? ([0, 0, 0] as V3);
  return (
    <ThreeCanvas
      width={width}
      height={height}
      flat
      camera={{ fov: camera?.fov ?? 38, position, near: 0.1, far: 200 }}
    >
      <color attach="background" args={[bg]} />
      <CameraRig position={position} target={target} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 10, 7]} intensity={1.35} />
      <directionalLight position={[-6, -4, -8]} intensity={0.3} />
      {children}
    </ThreeCanvas>
  );
};
