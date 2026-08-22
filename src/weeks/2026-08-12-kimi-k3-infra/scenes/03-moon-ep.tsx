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
 * §5.2.1 + Appendix E. The claim that carries the section is not "we balance
 * better" but "we balance *exactly*, always" — and the E/R bound is what makes
 * "always" safe to build on: reserve E/R redundant slots per rank and the
 * planner can never come back infeasible, so training never stops.
 */
const RANKS = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'];
/** router output for one micro-batch: what conventional EP would dispatch */
const RAW = [152, 96, 71, 133, 52, 118, 88, 122];
/** S × K — the count every rank ends up with under MoonEP */
const TARGET = RAW.reduce((a, b) => a + b, 0) / RAW.length;

export const moonEpScene = defineScene(
  {
    id: '03-moon-ep',
    title: 'MoonEP',
    steps: [
      step('skew', 2.2),
      step('plan', 2.8),
      step('bound', 2.8),
      step('balance', 2.8),
      step('static', 2.6),
      step('backward', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const balanceP = useStepProgress('balance');
    const loads = RAW.map((v, i) => ({
      label: RANKS[i]!,
      value: lerp(v, TARGET, balanceP),
    }));
    return (
      <SlideFrame title="MoonEP — 중복 전문가로 EP를 완벽히 균형 맞추기" footer="ML Weekly · Kimi K3 §5.2.1 · § E">
        <WalkthroughStage
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <DiagramView
                  diagram={moonEpDetail}
                  stepEffects={{
                    // 'router'는 어떤 reveal에도 없음 — frame-0 앵커 (hard rule 6)
                    skew: {
                      reveal: ['skew', 'e-router-skew'],
                      highlight: ['skew'],
                      camera: { focus: ['router', 'skew'], padding: 100 },
                    },
                    plan: {
                      reveal: ['plan', 'ilp', 'e-skew-plan', 'e-ilp-plan'],
                      highlight: ['plan'],
                      camera: { focus: ['plan', 'ilp'], padding: 80 },
                    },
                    bound: {
                      reveal: ['bound', 'tight', 'redundant', 'e-plan-bound', 'e-bound-tight', 'e-plan-redundant'],
                      highlight: ['bound', 'tight'],
                      camera: { focus: ['bound', 'tight', 'redundant'], padding: 60 },
                    },
                    balance: {
                      reveal: [
                        'permute',
                        'balanced',
                        'buffer',
                        'e-redundant-permute',
                        'e-plan-permute',
                        'e-permute-balanced',
                        'e-balanced-buffer',
                      ],
                      highlight: ['permute', 'balanced'],
                      pulse: ['e-permute-balanced'],
                      camera: { focus: ['permute', 'balanced'], padding: 70 },
                    },
                    static: {
                      reveal: [
                        'static',
                        'gemm',
                        'shared',
                        'combine',
                        'e-balanced-static',
                        'e-balanced-gemm',
                        'e-shared-gemm',
                        'e-gemm-combine',
                      ],
                      highlight: ['static', 'gemm'],
                      camera: { focus: ['static', 'gemm', 'shared'], padding: 60 },
                    },
                    backward: {
                      reveal: ['stage', 'home', 'e-combine-stage', 'e-stage-home'],
                      highlight: ['stage', 'home'],
                      pulse: ['e-combine-stage'],
                      camera: { focus: ['stage', 'home'], padding: 70 },
                    },
                  }}
                />
              </div>
              <Stack gap={2} style={{ height: 268, flexShrink: 0 }}>
                <Label size="sm" color="textSecondary" weight={600}>
                  EP 랭크별 토큰 수 · 같은 micro-batch
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
              <Appear step="skew" effect="rise">
                <Callout tone="warn" title="불균형의 대가는 두 가지">
                  느린 랭크가 스텝을 잡아먹고, 활성값 <b>shape이 매 레이어 달라진다</b> — 메모리 파편화,
                  그리고 발사 전마다의 host↔device 동기화.
                </Callout>
              </Appear>
              <Appear step="bound" effect="rise">
                <Callout tone="ok" title="랭크당 E/R 슬롯이면 계획은 항상 성공">
                  과부하 랭크에서 딱 S×K까지 채우면 R−1번에 끝나고 각 랭크는 <b>한 번만</b> 채워진다 →
                  원격 토큰의 출처가 단일 랭크, 그 랭크의 로컬 전문가는 E/R개뿐.
                </Callout>
              </Appear>
              <Appear step="balance" effect="fade">
                <Callout title="완벽 균형이 되갚는 것들">
                  목적지를 미리 계산해 통신 버퍼 뷰를 그대로 쓰니 중간 복사 0, 버퍼도 <b>S×K 고정</b>
                  (DeepEP는 최악 S×K×R). shape이 정적이라 레이어별 host 동기화도 사라진다.
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
