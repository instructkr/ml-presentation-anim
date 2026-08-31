import React from 'react';
import { Appear, defineScene, lerp, step, useStepProgress } from '@/lib/timeline';
import {
  BarChart,
  Callout,
  DiagramView,
  Fill,
  Label,
  SlideFrame,
  Stack,
  WalkthroughStage,
} from '@/lib/kit';
import { moonEpDetail } from '../diagrams/moon-ep.diagram';

/**
 * §5.2.1 + Appendix E, told as a story about weights rather than about routing.
 *
 * The router is left exactly as it is; what MoonEP changes is *where the expert
 * lives*. A rank cannot hand its surplus tokens to a neighbour (the neighbour
 * does not hold that expert) and cannot re-route them (that would change the
 * model's output), so the only lever left is to copy the expert's weights to
 * the tokens. Every rank therefore reserves an empty region of expert slots —
 * the weight buffer — and a GPU kernel refills it every micro-batch and every
 * layer. Appendix E is the sizing question for that region, and E/R happens to
 * be exactly the number of experts a rank already owns: the guarantee is paid
 * for with a standing 2× reservation of expert-weight memory.
 */
const RANKS = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5'];
/** router output for one micro-batch: what conventional EP would dispatch */
const RAW = [152, 96, 71, 133, 52, 118];
/** S × K — the count every rank ends up with once the replicas have landed */
const TARGET = RAW.reduce((a, b) => a + b, 0) / RAW.length;

export const moonEpScene = defineScene(
  {
    id: '08-moon-ep',
    title: 'MoonEP — 비워 둔 자리',
    steps: [
      step('skew', 2.6),
      step('copy', 2.8),
      step('buffer', 3.0),
      step('plan', 2.4),
      step('prefetch', 2.8),
      step('backward', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    // 복사가 끝나는 순간 부하가 평평해진다. 라우터는 손대지 않았다
    const settle = useStepProgress('prefetch');
    const loads = RAW.map((v, i) => ({
      label: RANKS[i]!,
      value: lerp(v, TARGET, settle),
    }));
    return (
      <SlideFrame
        title="MoonEP — 토큰을 옮기는 대신 전문가를 옮긴다"
        footer="ML Weekly · Kimi K3 §5.2.1 · 부록 E"
      >
        <WalkthroughStage
          visual={
            <Stack gap={2} style={{ height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <DiagramView
                  diagram={moonEpDetail}
                  stepEffects={{
                    // 'router'는 어떤 reveal에도 없다 — frame-0 앵커 (hard rule 6)
                    skew: {
                      reveal: ['rank', 'local', 'e-router-rank', 'skew', 'e-router-skew'],
                      highlight: ['skew', 'local'],
                      camera: { focus: ['router', 'skew', 'local'], padding: 60, maxScale: 1 },
                    },
                    copy: {
                      reveal: ['noreroute', 'copy', 'e-skew-noreroute', 'e-noreroute-copy'],
                      highlight: ['copy'],
                      camera: { focus: ['skew', 'noreroute', 'copy'], padding: 70 },
                    },
                    buffer: {
                      reveal: ['buffer', 'bound', 'e-buffer-bound'],
                      highlight: ['buffer'],
                      camera: { focus: ['local', 'buffer', 'bound'], padding: 60, maxScale: 1.2 },
                    },
                    plan: {
                      reveal: ['plan', 'e-copy-plan'],
                      highlight: ['plan'],
                      camera: { focus: ['copy', 'plan'], padding: 70 },
                    },
                    prefetch: {
                      reveal: [
                        'prefetch',
                        'balanced',
                        'e-plan-prefetch',
                        'e-prefetch-buffer',
                        'e-prefetch-balanced',
                      ],
                      highlight: ['prefetch', 'buffer', 'balanced'],
                      pulse: ['e-prefetch-buffer'],
                      camera: { focus: ['buffer', 'prefetch', 'balanced'], padding: 50, maxScale: 1 },
                    },
                    backward: {
                      reveal: ['backward', 'e-balanced-backward'],
                      highlight: ['backward'],
                      pulse: ['e-balanced-backward'],
                      // 마지막 비트는 그림 전체로 물러난다 (썸네일 프레임)
                      camera: { focus: [] },
                    },
                  }}
                />
              </div>
              <Stack gap={1} style={{ height: 216, flexShrink: 0 }}>
                <Label size="sm" color="textSecondary" weight={600}>
                  EP 랭크별로 받은 토큰 수 · 같은 micro-batch · 라우터 출력은 손대지 않았다
                </Label>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Fill>
                    {({ width, height }) => (
                      <BarChart
                        width={width}
                        height={height}
                        data={loads}
                        maxValue={170}
                        valueFormat={(v) => v.toFixed(0)}
                      />
                    )}
                  </Fill>
                </div>
              </Stack>
            </Stack>
          }
          explanation={
            <Stack gap={4}>
              <Appear step="copy" effect="rise">
                <Callout tone="warn" title="움직일 수 있는 것은 토큰이 아니라 전문가다">
전문가 E개를 GPU R대가 나눠 들고 한 대가 E/R개씩 맡는데, 이 한 대가 EP 랭크다. 남는
                  토큰을 한가한 랭크로 넘겨도 거기엔 그 전문가가 없고, 라우팅을 고치면 모델이 내놓는 값
                  자체가 달라진다. 남는 수는 복사뿐이다.
                </Callout>
              </Appear>
              <Appear step="buffer" effect="rise">
                <Callout tone="ok" title="빈 자리는 몇 칸이면 되나">
                  랭크당 E/R칸을 비워 두면 어떤 라우터 출력에서도 완벽 균형 계획이 반드시 존재한다.
                  그런데 로컬 전문가도 E/R개다. 결국 전문가 가중치를 얹을 자리를 <b>두 배로 잡아
                  두는</b> 것이 이 보장의 가격표다.
                </Callout>
              </Appear>
              <Appear step="prefetch" effect="fade">
                <Callout title="완벽 균형이 되갚는 것">
모든 랭크가 정확히 S × K개를 계산하므로 텐서 모양이 고정된다. 레이어마다 host가 device에
                  모양을 물어보던 동기화가 사라진다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default moonEpScene;
