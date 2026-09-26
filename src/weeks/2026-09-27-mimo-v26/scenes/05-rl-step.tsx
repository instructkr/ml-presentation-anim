import React from 'react';
import { Appear, defineScene, step } from '@/lib/timeline';
import { Callout, DiagramView, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { rlStepDetail, rlStepIds } from '../diagrams/obj-rl-step.diagram';

/**
 * §4.1 / §5.1: one RL step as a loop — take a prompt, let the policy write 16
 * trajectories, grade each into a reward, train θ on the loss, copy θ back.
 * The three callouts define the three words the rest of the week leans on
 * (policy, rollout/trajectory, reward); every number is a Spec chip that
 * arrives on its beat, and every chip value is quoted from §4.1/§5.1.
 */
export const rlStepScene = defineScene(
  {
    id: '05-rl-step',
    title: 'RL 한 스텝',
    steps: [
      step('prompt', 2.4),
      step('rollout', 2.6),
      step('grade', 2.6),
      step('train', 2.4),
      step('scale', 2.8, { hold: 0.6 }),
    ],
  },
  () => (
    <SlideFrame title="RL 한 스텝: 풀고, 채점하고, 배운다" footer="ML Weekly · MiMo-V2.6 §4.1, §5.1">
      <WalkthroughStage
        visual={
          <Stack gap={3} style={{ height: '100%' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <DiagramView
                diagram={rlStepDetail}
                stepEffects={{
                  // 'pool'과 'policy'는 어떤 reveal에도 없음 — frame-0 앵커
                  prompt: { highlight: ['pool', 'policy'], pulse: ['e-pool-policy'] },
                  rollout: {
                    reveal: rlStepIds.rollout,
                    highlight: ['policy', ...rlStepIds.taus],
                    pulse: rlStepIds.fanOut,
                  },
                  grade: {
                    reveal: rlStepIds.grade,
                    highlight: ['grader', ...rlStepIds.rewards],
                    pulse: rlStepIds.toGrader,
                  },
                  train: {
                    reveal: rlStepIds.train,
                    highlight: ['trainer'],
                    pulse: [...rlStepIds.fanIn, 'e-trainer-policy'],
                  },
                }}
              />
            </div>
            {/* 숫자는 모두 칩으로, 비트에 맞춰 등장 (§4.1, §5.1) */}
            <Stack gap={1.5}>
              <Stack direction="row" gap={2}>
                <Appear step="prompt" effect="fade" delay={0.6}>
                  <Spec label="과제 비율">코딩 68% · 도구 사용 12% · 디자인 13% · 문맥 따르기 3% · 보안 4%</Spec>
                </Appear>
                <Appear step="scale" effect="fade" delay={0.2}>
                  <Spec label="RL 전체">30 스텝</Spec>
                </Appear>
              </Stack>
              <Stack direction="row" gap={2}>
                <Appear step="rollout" effect="fade" delay={0.8}>
                  <Spec label="궤적 하나">약 110K–150K 토큰</Spec>
                </Appear>
                <Appear step="scale" effect="fade" delay={0.5}>
                  <Spec label="한 스텝">1,568 프롬프트 × 16 = 약 25K 궤적 · 2.7–3.7B 토큰</Spec>
                </Appear>
              </Stack>
              <Stack direction="row" gap={2}>
                <Appear step="scale" effect="fade" delay={0.8}>
                  <Spec label="비용 비중 (Pro)">롤아웃 43.8% · 학습 43.5% · 채점 12.7%</Spec>
                </Appear>
                <Appear step="scale" effect="fade" delay={1.1}>
                  <Spec label="RL 비용">Pro $2.6M · Flash $0.9M</Spec>
                </Appear>
              </Stack>
              <Appear step="scale" effect="fade" delay={1.4}>
                <Spec label="RL 동안 DeepSWE" tone="ok">
                  Pro 58.4 → 72.6 · Flash 48.7 → 65.7
                </Spec>
              </Appear>
            </Stack>
          </Stack>
        }
        explanation={
          <Stack gap={2}>
            <Appear step="prompt" effect="rise" delay={0.3}>
              <Callout title="정책(policy): 다음 토큰을 고르는 규칙">
                모델은 앞의 글을 보고 다음 토큰마다 확률을 매긴다. RL은 이 모델을 행동을 고르는 규칙으로 보고
                정책이라 부른다.
              </Callout>
            </Appear>
            <Appear step="rollout" effect="rise" delay={0.3}>
              <Callout title="롤아웃(궤적): 한 번의 풀이 시도 전체">
                정책이 샌드박스에서 도구를 써 가며 프롬프트 하나를 끝까지 푼 기록이다. 같은 프롬프트를 16번
                풀어 궤적 16개를 모은다.
              </Callout>
            </Appear>
            <Appear step="grade" effect="rise" delay={0.3}>
              <Callout tone="ok" title="보상: 궤적마다 붙는 점수">
                기본은 테스트로, 통과하면 1, 실패하면 0이다. 채점 에이전트는 테스트가 못 가리는 품질 차이도
                본다.{' '}
                {/* 학습 비트의 한 문장은 같은 문단에 이어 붙는다 */}
                <Appear step="train" effect="fade" delay={0.4} style={{ display: 'inline' }}>
                  학습은 점수가 높은 궤적의 토큰이 더 자주 나오게 정책을 고친다.
                </Appear>
              </Callout>
            </Appear>
          </Stack>
        }
      />
    </SlideFrame>
  ),
);

export default rlStepScene;
