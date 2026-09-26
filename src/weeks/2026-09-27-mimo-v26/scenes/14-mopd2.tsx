import React from 'react';
import { Appear, defineScene, step, useStepProgress } from '@/lib/timeline';
import { Callout, DiagramView, Label, SlideFrame, Spec, Stack, WalkthroughStage } from '@/lib/kit';
import { mopd2Detail, mopd2Ids } from '../diagrams/obj-mopd2.diagram';

/**
 * §5.6 / Fig. 13: after mixed RL, MOPD2 distils several domain teachers into
 * the one student. Beats follow the figure: the teachers (a), on-policy
 * distillation itself, the standard full-rollout form (b), the
 * prefix-conditioned form (c), and why fixed prefixes help the SFT teachers.
 * The figure is the frame-0 anchor as an empty frame: the two panel boxes and
 * the student update box, which every later beat feeds.
 */
export const mopd2Scene = defineScene(
  {
    id: '14-mopd2',
    title: 'MOPD2: 여러 교사를 한 학생에게',
    steps: [
      step('teachers', 2.6),
      step('opd', 2.8),
      step('standard', 2.2),
      // the 28-id reveal fills the whole 3.0 s, so a short hold lets the pause land on a still frame
      step('prefix', 3.0, { hold: 0.4 }),
      step('why', 2.6, { hold: 0.6 }),
    ],
  },
  () => {
    const cap = (id: string) => useStepProgress(id, { portion: [0, 0.15] });
    const capIn = [1, cap('opd'), cap('standard'), cap('prefix'), cap('why')];
    const capOpacity = (i: number) => capIn[i]! * (i + 1 < capIn.length ? 1 - capIn[i + 1]! : 1);

    const captions: React.ReactNode[] = [
      <>RL을 마친 모델이 학생이다. 분야마다 따로 키운 교사들의 능력을 이 학생 하나에 모은다.</>,
      <>(b) 학생은 과제 프롬프트를 받아 첫 턴부터 마지막 턴까지 스스로 쓴다.</>,
      <>Standard MOPD: 학생이 끝까지 쓴 롤아웃 전체를 mixRL 교사가 토큰마다 지도한다.</>,
      <>
        Prefix OPD: k턴짜리 궤적을 잘라 이력 k개를 만든다. 학생은 이력마다 다음 한 턴만 쓰고, 교사는 같은
        이력을 보고 그 턴을 지도한다.
      </>,
      <Stack gap={1} align="flex-start">
        <>MOPD2는 이렇게 검증하기 어려운 분야까지 RL로 얻은 능력을 넓힌다.</>
        <Spec label="넓어진 분야" tone="ok">
          장기 게임 개발 · 과학 연구 · 체화 지능
        </Spec>
      </Stack>,
    ];

    return (
      <SlideFrame title="RL 이후: 여러 교사를 한 학생에게 (MOPD2)" footer="ML Weekly · MiMo-V2.6 §5.6, 그림 13">
        <WalkthroughStage
          visual={
            <Stack gap={3} style={{ height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <DiagramView
                  diagram={mopd2Detail}
                  stepEffects={{
                    // 'update'와 두 패널 상자는 어떤 reveal에도 없음 — frame-0 앵커
                    teachers: { reveal: mopd2Ids.teachers, highlight: ['mixrl', 'sftteach'] },
                    opd: { reveal: mopd2Ids.opd, highlight: ['y1', 'y2', 'yT', 'opd-b'] },
                    standard: {
                      reveal: mopd2Ids.standard,
                      highlight: ['mixrl', 'opd-b', 'update'],
                      pulse: mopd2Ids.standard,
                    },
                    prefix: {
                      reveal: mopd2Ids.prefix,
                      highlight: [...mopd2Ids.prefixes, ...mopd2Ids.turns],
                      pulse: mopd2Ids.fanOut,
                    },
                    why: {
                      highlight: ['sftteach', 'sp-traj', ...mopd2Ids.prefixes, 'opd-c'],
                      pulse: ['e-sftteach-opd-c', 'e-sp-traj-split'],
                    },
                  }}
                />
              </div>
              <div style={{ display: 'grid' }}>
                {captions.map((node, i) => (
                  <div key={i} style={{ gridArea: '1 / 1', opacity: capOpacity(i) }}>
                    <Label size="sm" color="textSecondary" weight={600}>
                      {node}
                    </Label>
                  </div>
                ))}
              </div>
            </Stack>
          }
          explanation={
            <Stack gap={2}>
              <Appear step="teachers" effect="rise" delay={0.3}>
                <Callout title="교사: 분야마다 따로 키운 모델">
                  검증할 수 있는 과제는 RL로 키운 mixRL 교사가 맡는다. 보상을 설계하기 어려운 열린 과제는 합성 시연
                  데이터로 SFT한 교사가 맡는다.
                </Callout>
              </Appear>
              <Appear step="opd" effect="rise" delay={0.3}>
                <Callout title="온폴리시 증류: 학생이 쓰고 교사가 지도한다">
                  학생이 직접 답을 쓰고, 교사는 그 토큰 하나하나를 자기라면 얼마나 그렇게 썼을지로 평가한다. 교사의
                  글을 베끼는 SFT와 달리, 학생이 실제로 가는 길에서 배운다.
                </Callout>
              </Appear>
              <Appear step="why" effect="rise" delay={0.3}>
                <Callout tone="ok" title="왜 이력을 고정해 두는가">
                  SFT 교사는 학생이 멀리 벗어난 이력을 충분히 배우지 못했을 수 있다. 그래서 시연 이력에서 출발해
                  한 턴만 쓰게 하여 벗어날 틈을 줄인다.
                </Callout>
              </Appear>
            </Stack>
          }
        />
      </SlideFrame>
    );
  },
);

export default mopd2Scene;
