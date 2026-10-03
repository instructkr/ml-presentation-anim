import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Appear, defineScene, step, useSceneMeta, useStepProgress } from '@/lib/timeline';
import { GPUGrid, Label, Tex, TensorBox, ThreeScene } from '@/lib/kit';
import { useTheme } from '@/lib/theme';

const DIMS: [number, number, number] = [8, 512, 4096];
const PARTS = 4;
const MAX_EXTENT = 3.4;
/** must mirror TensorBox's extent math so GPU pitch matches shard spread */
const H_EXTENT = MAX_EXTENT; // H(4096) is the largest dim → maps to maxExtent
const PART_SIZE = H_EXTENT / PARTS;
const GAP = 0.28;

const Scene: React.FC = () => {
  const t = useTheme();
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  const splitP = useStepProgress('shard');
  const moveP = useStepProgress('place');
  const appearP = useStepProgress('tensor');

  const spin = 0.75 + (frame / meta.durationInFrames) * 0.3;
  const camera = {
    position: [11 * Math.sin(spin), 4.6, 11 * Math.cos(spin)] as [number, number, number],
    target: [0, -0.8, 0] as [number, number, number],
    fov: 38,
  };

  return (
    <AbsoluteFill style={{ background: t.palette.colors.bg }}>
      <ThreeScene camera={camera}>
        <TensorBox
          dims={DIMS}
          dimLabels={['B', 'S', 'H']}
          maxExtent={MAX_EXTENT}
          opacity={appearP}
          labelOpacity={appearP * (1 - moveP)}
          color={t.palette.series[0]}
          split={{ axis: 2, parts: PARTS, gap: GAP, colors: t.palette.series.slice(0, PARTS) }}
          splitProgress={splitP}
          partOffsets={Array.from({ length: PARTS }, () => [0, -2.1, 0] as [number, number, number])}
          moveProgress={moveP}
        />
        <GPUGrid
          count={PARTS}
          columns={1}
          cell={PART_SIZE}
          gap={GAP}
          position={[0, -2.75, 0]}
          activeIndices={moveP > 0.5 ? [0, 1, 2, 3] : []}
          activeColor={t.palette.colors.ok}
          opacity={Math.min(1, moveP * 2)}
        />
      </ThreeScene>
      <AbsoluteFill style={{ pointerEvents: 'none', padding: 64, fontFamily: t.fonts.text }}>
        <Label size="lg" weight={700}>
          Tensor Parallelism: hidden 차원 분할
        </Label>
        <div style={{ position: 'absolute', left: 64, bottom: 64, maxWidth: 900 }}>
          <Appear step="shard" effect="rise">
            <Tex display size="md" color="textSecondary">
              {'W = [\\,W_1 \\;|\\; W_2 \\;|\\; W_3 \\;|\\; W_4\\,]'}
            </Tex>
          </Appear>
          <Appear step="place" effect="rise">
            <Label size="sm" color="textSecondary">
              각 GPU가 H/4 조각을 담당 → matmul 후 all-reduce로 합산
            </Label>
          </Appear>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const tensorParallelScene = defineScene(
  {
    id: '03-tensor-parallel',
    title: 'Tensor Parallelism',
    steps: [step('tensor', 2.0), step('shard', 2.6), step('place', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default tensorParallelScene;
