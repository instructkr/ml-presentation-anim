import React from 'react';
import { useCurrentFrame } from 'remotion';
import { defineScene, step, useSceneMeta, useStepProgress } from '@/lib/timeline';
import { Board, Captions, GPUGrid, TensorBox, ThreeScene } from '@/lib/kit';
import { useTheme } from '@/lib/theme';

/**
 * Recipe 5 · 3D — a `ThreeScene` as the Board's full-frame `backdrop`, with the
 * title and the phrase line in their usual places on top. All motion comes
 * from `useStepProgress` / `useCurrentFrame` (never `useFrame`). The tensor is
 * on screen from frame 0; beat 1 only names its sides.
 */
const DIMS: [number, number, number] = [8, 512, 4096];
const PARTS = 4;
const MAX_EXTENT = 3.4;
/** H (4096) is the largest side, so it spans maxExtent — GPU pitch must match the shard width */
const PART_SIZE = MAX_EXTENT / PARTS;
const GAP = 0.28;

const Scene: React.FC = () => {
  const t = useTheme();
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  const namesP = useStepProgress('whole', { portion: [0.1, 0.6] });
  const splitP = useStepProgress('shard', { portion: [0.1, 0.8], easing: 'inOut' });
  const moveP = useStepProgress('place', { portion: [0.1, 0.8], easing: 'inOut' });
  // a slow turn that stops before the last pause, so the final frame is still
  const last = meta.steps[meta.steps.length - 1]!;
  const spin = 0.75 + (Math.min(frame, last.animEndFrame) / last.animEndFrame) * 0.3;
  const inks = [t.palette.ink.blue, t.palette.ink.teal, t.palette.ink.green, t.palette.ink.gold];

  return (
    <Board
      title="큰 행렬을 여러 GPU에 나누기"
      source="Tensor parallelism"
      backdrop={
        <ThreeScene camera={{ position: [11 * Math.sin(spin), 4.6, 11 * Math.cos(spin)], target: [0, -0.9, 0], fov: 38 }}>
          <TensorBox
            dims={DIMS}
            dimLabels={['B', 'S', 'H']}
            maxExtent={MAX_EXTENT}
            labelOpacity={namesP * (1 - moveP)}
            color={inks[0]}
            split={{ axis: 2, parts: PARTS, gap: GAP, colors: inks }}
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
      }
      caption={
        <Captions
          items={[
            { step: 'whole', text: <>가중치 한 덩어리가 GPU 한 대에는 너무 큽니다</> },
            { step: 'shard', text: <>H 방향으로 네 조각을 냅니다</> },
            { step: 'place', text: <>조각마다 GPU 한 대씩 맡습니다</> },
          ]}
        />
      }
    />
  );
};

export const tensorShardsScene = defineScene(
  {
    id: '05-tensor-shards',
    title: '큰 행렬을 여러 GPU에 나누기',
    steps: [step('whole', 2.0), step('shard', 2.6), step('place', 2.8, { hold: 0.6 })],
  },
  Scene,
);

export default tensorShardsScene;
