import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import {
  BarChart,
  Callout,
  Fill,
  Grid,
  Label,
  SlideFrame,
  Stack,
  Tex,
} from '@/lib/kit';

/**
 * The scene that has to exist before any of the appendix material can be read.
 *
 * §2.3.3 and Appendix C both open in the middle of an argument: they assume the
 * reader already knows what the load of an expert is, that routing is nudged by
 * an additive bias, and that DeepSeek's fixed-step rule is the thing being
 * replaced. None of that is stated anywhere in the paper's own body, so it gets
 * stated here — one equation per beat, next to the skew it is talking about —
 * and the scene closes on the question the next five answer.
 */

/** one batch, eight experts drawn to scale; the mean is exactly q = 100 */
const LOADS = [206, 164, 128, 96, 78, 62, 42, 24];
const EXPERTS = ['E₁', 'E₂', 'E₃', 'E₄', 'E₅', 'E₆', 'E₇', 'E₈'];
const TARGET = LOADS.reduce((a, b) => a + b, 0) / LOADS.length;

/** caption + equation, so every symbol on screen is named in Korean right above it */
const Line: React.FC<{ caption: string; children: string }> = ({ caption, children }) => (
  <Stack gap={1}>
    <Label size="xs" color="textSecondary" weight={600}>
      {caption}
    </Label>
    <Tex size="sm">{children}</Tex>
  </Stack>
);

export const qbProblemScene = defineScene(
  {
    id: '01-qb-problem',
    title: '부하가 쏠린다는 문제',
    steps: [
      step('route', 2.4),
      step('load', 2.8),
      step('cost', 3.0),
      step('bias', 2.8),
      step('fixed', 2.8),
      step('goal', 2.4, { hold: 0.6 }),
    ],
  },
  () => {
    const loadP = useStepProgress('load');
    const data = LOADS.map((v, i) => ({
      label: EXPERTS[i]!,
      value: v,
      color: v > TARGET ? 'warn' : 'muted',
    }));
    return (
      <SlideFrame
        title="먼저 문제부터 — 전문가마다 받는 토큰 수가 다르다"
        footer="ML Weekly · Kimi K3 §2.3.3의 배경"
      >
        <Stack gap={4} style={{ height: '100%' }}>
          <Stack direction="row" gap={7} style={{ flex: 1, minHeight: 0 }}>
            <Stack gap={2} style={{ flex: 1.15, minWidth: 0, minHeight: 0 }}>
              <Label size="sm" color="textSecondary" weight={600}>
                배치 하나에서 전문가별로 받은 토큰 수 · 고르게 나뉘었다면 전부 q = 100
              </Label>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Fill>
                  {({ width, height }) => (
                    <BarChart
                      width={width}
                      height={height}
                      data={data}
                      progress={loadP}
                      maxValue={220}
                      valueFormat={(v) => v.toFixed(0)}
                    />
                  )}
                </Fill>
              </div>
            </Stack>

            <Stack gap={4} justify="center" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              {/* 첫 줄은 어떤 Appear에도 없다 — frame-0 앵커 (hard rule 6) */}
              <Line caption="라우터가 매기는 점수">{'s_i = \\sigma(W_r x_i) \\in (0,1)^n'}</Line>
              <Appear step="route" effect="rise">
                <Line caption="큰 것 k개만 켠다 · K3는 전문가 896개 중 16개">
                  {'T_i = \\mathrm{argtop}_k(s_i)'}
                </Line>
              </Appear>
              <Appear step="load" effect="rise">
                <Line caption="전문가 j의 부하, 그리고 고르게 나뉘었을 때의 값">
                  {'\\ell_j = \\#\\{\\, i : j \\in T_i \\,\\}, \\qquad q = mk/n'}
                </Line>
              </Appear>
              <Appear step="bias" effect="rise">
                <Line caption="전문가마다 상수를 더해 놓고 고른다">
                  {'T_i = \\mathrm{argtop}_k(s_i + b)'}
                </Line>
              </Appear>
              <Appear step="fixed" effect="rise">
                <Line caption="원조 규칙: 정해진 폭 γ만큼 민다 (DeepSeek V3)">
                  {'b_j \\leftarrow b_j + \\gamma\\,\\mathrm{sign}(q - \\ell_j)'}
                </Line>
              </Appear>
            </Stack>
          </Stack>

          <Grid columns={3} gap={4}>
            <Appear step="cost" effect="rise">
              <Callout tone="warn" title="쏠리면 무엇이 나빠지나">
전문가는 GPU 여러 대에 나뉘어 실린다. 한 대가 남들의 두 배를 받으면 한 스텝이 그 GPU의
                속도로 끝난다. 반대쪽 끝도 문제다. 거의 안 뽑히는 전문가는 기울기를 거의 못 받아서, 안
                배우고 계속 안 뽑힌다.
              </Callout>
            </Appear>
            <Appear step="bias" effect="rise">
              <Callout title="손잡이는 bias 하나뿐">
b를 올리면 그 전문가가 더 자주 뽑힌다. 다만 b는 <b>고를 때만</b> 쓰고, 고른 뒤 출력을 섞는
                가중치는 원래 점수다. 모델이 내놓는 값은 그대로 두고 누구를 부를지만 바꾸는 것이다.
              </Callout>
            </Appear>
            <Appear step="goal" effect="rise">
              <Callout tone="ok" title="그래서 이번 줄이 묻는 것">
고정 폭 규칙은 γ를 사람이 정해야 하고, 크면 부하가 출렁이고 작으면 평형까지 오래 걸린다.
                그렇다면 이번 배치의 부하를 q로 만드는 b를 그 자리에서 계산할 수는 없을까. 그 도구가
                분위수다.
              </Callout>
            </Appear>
          </Grid>
        </Stack>
      </SlideFrame>
    );
  },
);

export default qbProblemScene;
