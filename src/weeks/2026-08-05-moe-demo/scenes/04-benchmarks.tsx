import React from 'react';
import { Appear, defineScene, step, useCurrentStepIndex, useStepProgress } from '@/lib/timeline';
import { BarChart, Callout, Center, SlideFrame, Stack } from '@/lib/kit';

const DATA = [
  { label: 'MoE-Demo 32B (A4B)', value: 82.4 },
  { label: 'Dense 32B', value: 78.1 },
  { label: 'Dense 13B', value: 71.6 },
  { label: 'Prev. SOTA 30B', value: 80.9 },
];

export const benchmarksScene = defineScene(
  {
    id: '04-benchmarks',
    title: '벤치마크',
    steps: [step('chart', 2.4), step('winner', 2.0, { hold: 0.5 })],
  },
  () => {
    const chartP = useStepProgress('chart');
    const stepIdx = useCurrentStepIndex();
    return (
      <SlideFrame title="MMLU (5-shot)" footer="ML Weekly · MoE 해부">
        <Center>
          <Stack gap={6} align="center">
            <BarChart
              data={DATA}
              progress={chartP}
              width={1400}
              height={520}
              maxValue={100}
              valueFormat={(v) => v.toFixed(1)}
              highlightIndex={stepIdx >= 1 ? 0 : undefined}
            />
            <Appear step="winner" effect="rise">
              <Callout tone="ok" title="활성 4B로 Dense 32B를 상회">
                토큰당 활성 파라미터 4B만으로 동급 Dense 모델 대비 +4.3pt.
              </Callout>
            </Appear>
          </Stack>
        </Center>
      </SlideFrame>
    );
  },
);

export default benchmarksScene;
