import { BEST, GAP_TO_BEST, PREV, PRO, RL_RUN, TABLE3, bestFrontier } from '../data/distill-table3';
import { opdScene } from '../scenes/27-opd';
import { prefixOpdScene } from '../scenes/28-prefix-opd';
import { resultsScene } from '../scenes/29-results';
import type { WeekTrack } from './types';

// numbers the notes read out, taken from the same table data the chart draws
const one = (v: number) => v.toFixed(1);
const cell = (bench: keyof typeof TABLE3, model: keyof (typeof TABLE3)['DeepSWE v1.1']) => one(TABLE3[bench][model]!);
const SWE = 'DeepSWE v1.1';
const PRO_MODEL = 'MiMo-V2.6 Pro';
const exploit = bestFrontier('ExploitBench');

/**
 * MOPD2 (§5.6) and the final results (Table 3).
 * Notes are keyed by the root-diagram node id ('opd') and '<nodeId>/<stepId>' — one per beat.
 * §5.6 does not give the distillation loss, so no note names one.
 */
export const distillTrack: WeekTrack = {
  scenes: [opdScene, prefixOpdScene, resultsScene],
  details: {
    opd: { kind: 'scene', scene: opdScene },
    prefix: { kind: 'scene', scene: prefixOpdScene },
    results: { kind: 'scene', scene: resultsScene },
  },
  notes: {
    // ── 27 · MOPD2: Teacher와 on-policy distillation ────────────────────────
    opd:
      'RL이 끝난 다음 단계인 MOPD2의 앞 절반입니다. MOPD2는 Multi-Prefix Multi-Teacher On-Policy Distillation의 줄임말이고, MiMo-V2-Flash에서 쓴 MOPD를 넓힌 방식입니다 (§5.6). 여러 과제를 섞은 RL을 마친 모델을 Student로 두고, 분야마다 따로 키운 Teacher들의 능력을 이 Student 하나에 모읍니다. 이 장면에서는 Teacher를 어떻게 만드는지, 그리고 화면의 OPD, 곧 on-policy distillation이 무엇인지를 봅니다. 화면에 예시 숫자는 없습니다.',
    'opd/teachers':
      'Teacher는 분야마다 따로 학습한 모델입니다. 만드는 길은 두 가지입니다. 코딩처럼 결과를 채점할 수 있는 과제에서는 mixRL, 곧 지금까지 본 방식의 RL로 Teacher를 키웁니다. 채점하기 어려운 열린 과제에서는 SFT로 Teacher를 만듭니다 (§5.6, 그림 13 (a)).',
    'opd/kinds':
      '오른쪽 갈래를 봅니다. 열린 과제는 믿을 만한 RL 보상을 설계하기 어렵습니다. 그래서 이런 분야의 Teacher는 품질이 높은 합성 시범 데이터로 SFT해서 만듭니다 (§5.6). 시범 데이터는 과제 하나를 처음부터 끝까지 푼 기록입니다. 이렇게 만든 Teacher에게는 약점이 하나 있는데, 그 이야기는 다음 장면에서 합니다.',
    'opd/write':
      '여기서부터가 on-policy distillation입니다. Student가 과제를 받아 직접 풉니다. Teacher가 쓴 글을 Student에게 보여 주고 따라 쓰게 하는 SFT와는 출발점이 다릅니다. 알맞은 mixRL Teacher가 있는 분야에서는 Student가 스스로 끝까지 푼 풀이를 그대로 쓰고, 논문은 이것을 Standard MOPD라고 부릅니다 (§5.6, 그림 13 (b)).',
    'opd/grade':
      'Teacher는 Student가 쓴 풀이를 토큰 단위로 지도합니다. 논문의 표현은 token-level supervision입니다 (§5.6). Student가 쓴 토큰마다, Teacher 자신이라면 그 자리에서 무엇을 썼을지가 신호가 됩니다. Teacher의 확률을 어떤 손실로 쓰는지는 이 절에 적혀 있지 않으므로 말하지 않습니다.',
    'opd/update':
      '이 신호로 Student를 갱신합니다. SFT에서는 Student가 Teacher의 글을 그대로 따라 쓰기 때문에, 자기가 실제로 틀리는 자리를 지나갈 일이 없습니다. on-policy distillation에서는 Student가 직접 쓴 풀이 위에서 지도를 받으므로, 자기가 실제로 가는 길에서 고쳐집니다. 이 비교는 on-policy distillation을 일반적으로 설명하는 말이고, 논문이 직접 쓴 문장은 아니라는 점을 밝혀 둡니다.',

    // ── 28 · Prefix-Conditioned OPD ─────────────────────────────────────────
    prefix:
      'MOPD2의 뒤 절반인 Prefix-Conditioned OPD입니다 (§5.6, 그림 13 (c)). Student가 처음부터 끝까지 푸는 대신, 이미 있는 풀이를 턴마다 잘라 이력을 고정하고 그다음 턴 하나만 쓰게 합니다. 이력을 Teacher가 푼 풀이에서 가져오면 Teacher-Prefix OPD, SFT 데이터에서 가져오면 SFT-Prefix OPD입니다. 화면의 시범 풀이는 이 둘을 함께 가리킵니다. 세 줄은 k개를 대표해서 그린 것이고, 화면에 예시 숫자는 없습니다.',
    'prefix/drift':
      '먼저 무엇이 문제인지 봅니다. SFT Teacher는 합성 시범 데이터로 학습했습니다. 그런데 Student가 긴 과제를 스스로 풀면, 조금씩 벗어난 것이 쌓여서 시범 데이터에는 없던 이력에 이릅니다. 논문은 SFT Teacher의 학습이 이런 이력을 충분히 다루지 못할 수 있다고 적습니다 (§5.6, Xu et al. 2025 인용). 논문도 그럴 수 있다고만 말하므로 단정하지 않습니다.',
    'prefix/split':
      '그래서 이력을 고정합니다. 턴은 모델이 한 번 응답하는 단위입니다. 풀이 하나에 assistant 턴이 k개 있으면, 각 턴 바로 앞에서 잘라 완전한 이력 k개를 만듭니다 (§5.6). 이력 1은 첫 턴 직전까지의 기록이고, 이력 k는 마지막 턴 직전까지의 기록입니다. 풀이 하나에서 출발점 k개가 나옵니다.',
    'prefix/turn':
      'Student는 이력마다 새 턴 하나만 씁니다. 앞의 대화는 다시 만들지 않습니다 (§5.6). 시범 풀이는 맥락만 주고, 이어지는 턴은 Student가 스스로 씁니다. 정해진 답을 따라 쓰는 것이 아니라는 점이 SFT와 다릅니다. 이력에 조건을 건 한 턴짜리 풀이는 Liao et al. 2026을 따른 방식입니다.',
    'prefix/teach':
      '미리 정해 둔 Teacher가 같은 이력과 Student가 앞서 쓴 토큰을 보고, 그 한 턴을 토큰 단위로 지도합니다 (§5.6). 매번 고정된 이력에서 출발하므로, Student가 쓰는 턴에 이르기 전에 벗어날 여지가 줄어듭니다. 그러면 Teacher는 학습 때 본 것과 가까운 이력 위에서 지도하게 됩니다. 이 마지막 문장은 논문의 논리를 풀어 쓴 해석입니다.',
    'prefix/reach':
      '이렇게 얻은 신호도 앞 장면의 Standard MOPD와 함께 Student 하나를 갱신합니다 (그림 13). 논문은 MOPD2로, RL을 거친 모델의 능력을 학습 중에 검증하기 어려운 분야까지 넓혔다고 적습니다. 예로 드는 분야는 장기 게임 개발, 과학 연구, embodied intelligence입니다 (§5.6). 이 분야들의 성능 수치는 이 절에 없고, 최종 모델의 평가 결과는 다음 장면의 표 3입니다.',

    // ── 29 · 결과 (표 3) ────────────────────────────────────────────────────
    results: `표 3에서 ${SWE} 한 줄만 그렸습니다. 표 3은 MOPD2까지 마친 최종 모델의 결과이고, 막대의 숫자는 모두 표 그대로입니다 (§5.6). 비교한 다른 모델은 추론 강도를 조절할 수 있으면 가장 높은 설정으로 평가했습니다 (§5.2). 마지막 비트의 ${Math.round(RL_RUN.start)}점만 표 3이 아니라 §4.1에서 가져온 값입니다.`,
    'results/jump': `${SWE}은 긴 호흡의 소프트웨어 개발 과제를 푸는 벤치마크입니다 (§5.2). 이전 세대인 MiMo-V2.5 Pro가 ${one(PREV)}점이었고, MiMo-V2.6 Pro는 ${one(PRO)}점, Flash는 ${cell(SWE, 'MiMo-V2.6 Flash')}점입니다 (표 3). 한 세대 만에 ${one(PRO - PREV)}점이 올랐습니다.`,
    'results/frontier': `같은 줄에서 Claude Opus 5는 ${cell(SWE, 'Claude Opus 5')}, GPT-5.6 Sol은 ${cell(SWE, 'GPT-5.6 Sol')}, Claude Fable 5는 ${cell(SWE, 'Claude Fable 5')}점입니다. 가장 높은 ${BEST.model}와의 차이는 ${one(GAP_TO_BEST)}점이고, 논문도 앞섰다고 하지 않고 최상위 모델과 견줄 만한 수준이라고 적습니다 (§5.6). 다른 줄도 그대로 읽습니다. AutomationBench는 ${cell('AutomationBench v1.0.6', PRO_MODEL)}점으로 표에서 가장 높습니다. 반대로 ExploitBench는 ${cell('ExploitBench', PRO_MODEL)}점으로 ${exploit.model}의 ${one(exploit.score)}점에 한참 못 미칩니다.`,
    'results/takeaway': `이 차이가 모두 RL에서 나온 것은 아닙니다. §4.1에 따르면 MiMo-V2.6 Pro는 RL을 시작할 때 이미 ${SWE}에서 ${one(RL_RUN.start)}점이었고, RL 30 스텝 동안 ${one(RL_RUN.end)}점까지 올랐습니다. 그러니 ${Math.round(PREV)}점에서 ${Math.round(RL_RUN.start)}점까지는 RL에 들어가기 전에 벌어진 차이이고, ${Math.round(RL_RUN.start)}점부터가 RL의 몫입니다. §4.1의 숫자는 학습 중에 잰 average@3이라서 표 3의 ${one(PRO)}점과 그대로 맞대어 비교하지는 않습니다. 논문의 주장은 RL에 쓰는 계산을 배치와 처리량, 환경과 harness, 채점의 세 방향으로 키운 것이 이 결과를 만들었다는 것입니다.`,
  },
};
