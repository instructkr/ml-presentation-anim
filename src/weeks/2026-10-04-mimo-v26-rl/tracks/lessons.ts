import { tokensGrowScene } from '../scenes/24-tokens-grow';
import { routerFreezeScene } from '../scenes/25-router-freeze';
import { failuresScene } from '../scenes/26-failures';
import { fig9Tokens } from '../data/fig9-tokens';
import { fig9Score, firstY, lastY } from '../data/lessons-fig9-score';
import { ELAPSED_HOURS, EP_PEAK_OVER_MEAN, RESTARTS, RL_STEPS, hoursPerStep } from '../data/lessons-failures';
import { FIG11_TEXT } from '../data/router-load';
import type { WeekTrack } from './types';

/**
 * 30 스텝의 교훈 (§5.3–5.5): tokens grow with score, Router freezing, failure analysis.
 * Notes are keyed by the root-diagram node id ('tokens') and '<nodeId>/<stepId>' — one per beat.
 */

// numbers the notes read out, taken from the same data files the scenes draw
const one = (v: number) => v.toFixed(1);
const S = fig9Score;
const T = fig9Tokens;
const F = FIG11_TEXT;

const notes: Record<string, string> = {
  // ── 24 · 점수와 토큰 ────────────────────────────────────────────────────────
  tokens:
    'RL을 30 스텝 돌리는 동안 점수와 함께 무엇이 변했는지 보는 장면입니다. 왼쪽은 체크포인트마다 잰 DeepSWE v1.1 점수이고, 오른쪽은 같은 평가에서 풀이 하나가 쓴 전체 토큰 수입니다 (§5.3, 그림 9). 두 그래프 모두 그림을 확대해서 선의 위치를 읽은 근사값입니다. 점수의 첫 값과 마지막 값은 §4.1 본문에 적힌 숫자와 일치합니다.',
  'tokens/score':
    `DeepSWE v1.1은 호흡이 긴 개발 과제를 푸는 벤치마크입니다 (§5.2). 30 스텝 동안 Pro는 ${one(firstY(S.pro))}에서 ${one(lastY(S.pro))}으로, Flash는 ${one(firstY(S.flash))}에서 ${one(lastY(S.flash))}로 올랐고, 이 값은 문제마다 세 번 풀어 낸 평균입니다 (§4.1). 체크포인트 사이에는 오르내림이 있지만 전체로는 꾸준히 오릅니다. 논문은 AutomationBench v1.0.6과 MiMo Visual Coding에서도 같은 흐름을 보고합니다 (§5.3).`,
  'tokens/tokens':
    `오른쪽은 그림 9의 아랫줄이고, 축 이름은 Total tokens (K)입니다. 풀이 하나가 쓴 전체 토큰 수를 천 개 단위로 적은 값으로 읽었습니다. 같은 30 스텝 동안 Pro는 약 ${firstY(T.pro)}K에서 ${lastY(T.pro)}K로, Flash는 약 ${firstY(T.flash)}K에서 ${lastY(T.flash)}K로 늘었습니다. 그래프에서 읽은 근사값이라 1K 안팎의 오차가 있습니다.`,
  'tokens/together':
    '두 그래프를 나란히 놓으면 점수와 토큰이 같은 동안 함께 오릅니다. 논문은 이것을 더 강한 과제 수행 능력이 더 많은 토큰 사용과 함께 자란다고 정리합니다 (§5.3). 여기서부터는 제 해석입니다. 풀이가 길어지는 것 자체는 나쁜 일이 아니고, 걷잡을 수 없이 길어지는 것이 문제입니다. 그래서 앞에서 본 prompt-mean(§5.1)과 길이 감점(§4.3.3)이 길이가 늘어나는 속도를 누르는 장치로 들어가 있습니다.',

  // ── 25 · Router 얼리기 ─────────────────────────────────────────────────────
  router:
    `RL 동안 Router를 얼린 이유를 그림 11로 보는 장면입니다. 먼저 일감을 정의합니다. Pro의 MoE 층에는 Expert가 ${F.experts}개 있고, Router가 토큰마다 그중 ${F.active}개를 고릅니다 (표 1). 한 스텝 동안 Expert 하나가 받은 토큰 수가 그 Expert의 일감이고, 논문은 이것을 load라고 부릅니다. 세 그래프는 디코더 ${F.layer}번째 층에서 잰 통계이며 일감은 스텝마다 정규화했습니다 (§5.4). 두 실행은 Router를 학습시키는지 얼리는지만 다릅니다. 곡선은 그림을 확대해서 읽은 근사값이고, 화면 문장의 숫자는 본문에 적힌 값입니다.`,
  'router/collapse':
    `Router도 같이 학습한 실행입니다. 왼쪽은 일감의 표준편차를 평균으로 나눈 값이고, 논문은 이것을 CV라고 부릅니다. 값이 클수록 일감이 고르지 않습니다. 가운데는 가장 바쁜 Expert가 평균의 몇 배를 받는지입니다. 처음 ${F.steps} 스텝 동안 CV는 ${F.cv[0]}에서 ${F.cv[1].toFixed(1)}으로, 가장 바쁜 Expert의 일감은 평균의 ${F.peak[0]}배에서 ${F.peak[1]}배로 올랐습니다 (§5.4).`,
  'router/cold':
    `오른쪽 그래프는 평균의 0.1배도 받지 못한 Expert의 비율입니다. 논문은 이런 Expert를 cold expert라고 부릅니다. 이 비율이 처음 ${F.steps} 스텝 동안 ${F.cold[0]}%에서 ${F.cold[1]}%로 늘었습니다 (§5.4). Expert ${F.experts}개 가운데 다섯 중 하나꼴로 일을 거의 받지 못하게 된 것입니다.`,
  'router/freeze':
    `원인을 가른 실험부터 말합니다. ${F.steps} 스텝 체크포인트에서 Router 파라미터만 RL 이전 값으로 되돌리고 나머지는 그대로 두었더니, 일감의 균형은 거의 처음 수준으로 돌아왔고 벤치마크 성능은 변하지 않았습니다. 그래서 논문은 쏠림의 원인이 Expert 가중치가 망가진 것이 아니라, RL 도중 Router가 조금씩 달라진 것이라고 결론 내립니다 (§5.4). 그래서 RL 내내 Router를 얼립니다. 얼린 실행은 CV 약 ${F.frozen.cv}, 가장 바쁜 Expert 약 ${F.frozen.peak}배, 쉬는 Expert ${F.frozen.cold}% 근처로 끝까지 평평하고, 벤치마크 성능은 정상적으로 올랐습니다. 얼리는 것은 균형을 새로 만드는 일이 아니라 RL을 시작할 때의 균형을 지키는 일입니다.`,

  // ── 26 · 멈춘 자리 ─────────────────────────────────────────────────────────
  failures:
    `실제로 ${RL_STEPS} 스텝을 돌리는 동안 학습이 어디서 멈췄는지 보는 장면입니다. 그림은 RL 한 스텝의 고리입니다. Rollout이 풀이를 쓰고, Grader가 점수를 매기고, Packing이 풀이를 배치로 묶고, Training이 모델을 고친 뒤 새 가중치를 Rollout으로 돌려보냅니다. 아래의 긴 칸은 이 모두가 올라가 있는 GPU와 클러스터입니다. 논문은 그림 12에서 멈춘 구간을 원인에 따라 네 가지로 나눕니다 (§5.5).`,
  'failures/infra':
    `첫째는 장비 고장입니다. 대부분 GPU 메모리의 double-bit error, 줄여서 DBE였습니다. DBE는 메모리 한 자리에서 비트 두 개가 한꺼번에 뒤집힌 오류입니다. 비트 하나짜리 오류는 오류 정정 회로가 고치지만 두 개짜리는 고치지 못해서 작업이 멈춥니다. 이 밖에 Flash는 ${RESTARTS.flashKubernetes[0]} 스텝과 ${RESTARTS.flashKubernetes[1]} 스텝 사이에 Kubernetes 장애로 Cyber 과제 클러스터의 pod가 죽어서 다시 시작했고, Pro는 ${RESTARTS.proGraderAfter} 스텝 뒤에 Grader에 네트워크로 닿지 못하게 되어 다시 시작했습니다 (§5.5).`,
  'failures/rollout':
    '둘째는 Rollout 쪽입니다. MiMo는 partial rollout을 씁니다. 학습 배치가 모이면 아직 풀고 있는 풀이는 멈춰 두었다가 다음 Rollout 단계에서 이어서 푸는 방식입니다 (§4.1). 이 방식에서는 시작 직후에 짧은 풀이가 먼저 끝납니다. 그래서 새 풀이를 어느 GPU에 넣을지 정하는 Predictive Rollout Dispatch의 길이 어림이 먼저 끝난 풀이 쪽으로 치우쳤고, GPU와 호스트 메모리에 잡아 둔 KV cache 공간이 바닥났습니다. KV cache는 이미 읽은 토큰의 Attention 계산 결과를 저장해 두는 메모리입니다. 나중에는 한 harness의 풀이가 같은 데이터셋의 다른 harness보다 절반도 안 되게 짧아서, 다시 시작한 뒤 둘째와 셋째 스텝의 어림이 또 틀어졌습니다 (§5.5).',
  'failures/training':
    `셋째는 Training 쪽의 GPU 메모리 부족입니다. 원인은 micro-batch 하나 안에서 생긴 MoE 쏠림입니다. micro-batch는 한 스텝의 큰 배치를 GPU에 한 번에 올릴 수 있게 나눈 조각입니다. Expert들은 여러 GPU에 나눠 올리는데, 이 방식을 expert parallel이라 하고 그 GPU 하나하나를 EP rank라고 부릅니다. 한 층에서 EP rank 하나가 평균의 ${EP_PEAK_OVER_MEAN}배가 넘는 토큰을 받았고, 배치 전체로는 비교적 고르게 나뉘었는데도 그랬습니다. 논문은 병렬화 설정을 바꿔 activation 메모리를 줄여서 이런 순간 최대치를 감당하게 했습니다 (§5.5). 이 ${EP_PEAK_OVER_MEAN}배는 Router를 얼린 실제 학습에서 micro-batch 하나 안의 값입니다. 그래서 앞 장면의 스텝 단위 그래프와 나란히 놓고 비교하면 안 됩니다.`,
  'failures/driver':
    '넷째는 배치를 묶는 쪽입니다. Packing은 받아들인 풀이들을 micro-batch로 묶어 학습 GPU에 나눠 주는 일이고, 논문은 이 일을 지휘하는 프로세스를 driver라고 부릅니다. Flash 학습 후반에 풀이가 길어지면서 노드 하나가 다뤄야 하는 데이터가 호스트 메모리 용량을 넘었습니다. Packing은 여러 노드에 나눠서 하는데도(§6.2) 노드마다 필요한 메모리가 커져서 CPU 쪽 메모리 부족으로 학습이 멈췄습니다 (§5.5). 앞 장면에서 본 토큰 증가가 인프라 쪽에서도 비용으로 돌아온 사례입니다.',
  'failures/time':
    `마지막으로 그림 12의 시간표를 숫자로 정리합니다. ${RL_STEPS} 스텝을 마치는 데 Pro는 ${ELAPSED_HOURS.pro}시간, Flash는 ${ELAPSED_HOURS.flash}시간이 걸렸고, 여기에는 멈췄다가 복구한 구간이 모두 들어 있습니다. 나누어 보면 스텝 하나에 Pro는 약 ${one(hoursPerStep(ELAPSED_HOURS.pro))}시간, Flash는 약 ${one(hoursPerStep(ELAPSED_HOURS.flash))}시간입니다. 이 나눗셈은 논문에 없고 제가 계산한 값입니다. 네 가지 원인은 모두 알고리즘이 아니라 규모에서 나왔다는 점도 짚습니다. 이 정리도 제 해석입니다.`,
};

export const lessonsTrack: WeekTrack = {
  scenes: [tokensGrowScene, routerFreezeScene, failuresScene],
  details: {
    tokens: { kind: 'scene', scene: tokensGrowScene },
    router: { kind: 'scene', scene: routerFreezeScene },
    failures: { kind: 'scene', scene: failuresScene },
  },
  notes,
};
