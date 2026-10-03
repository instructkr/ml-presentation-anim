import { grsRubricScene } from '../scenes/15-grs-rubric';
import { grsRewardScene } from '../scenes/16-grs-reward';
import { garGraderScene } from '../scenes/17-gar-grader';
import { garRedistributeScene } from '../scenes/18-gar-redistribute';
import { garEffectScene } from '../scenes/19-gar-effect';
import { fig8 } from '../data/fig8';
import {
  GAR_G,
  GAR_HACK,
  garA,
  garDownweightedSum,
  garMean,
  garPassIdx,
  garPositiveSum,
  garQuality,
  garRedist,
  garRedistributedSum,
  garTest,
} from '../data/gar-example';
import {
  GRS_G,
  GRS_WORKED,
  grsAdvantage,
  grsBeh,
  grsFailed,
  grsMean,
  grsReward,
  grsSol,
} from '../data/grs-example';
import type { WeekTrack } from './types';

/**
 * Groupwise agentic grading (§4.3.1–4.3.2): GRS, GAR, Fig. 8.
 * Notes are keyed by the root-diagram node id ('rubric') and '<nodeId>/<stepId>' — one per beat.
 * The numbers the notes read out come from the same data files the scenes draw.
 */

// ── formatting ──────────────────────────────────────────────────────────────
const trim = (v: number) => String(Number(v.toFixed(3)));
/** at least one decimal: 2 → 2.0, 1 → 1.0 */
const dec = (v: number) => (trim(v).includes('.') ? trim(v) : `${trim(v)}.0`);
const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${trim(Math.abs(v))}`;
const signedDec = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${dec(Math.abs(v))}`;
const list = (xs: string[]) => xs.join(', ');

// ── GRS example ─────────────────────────────────────────────────────────────
const W = GRS_WORKED;
const BEST = grsReward.indexOf(Math.max(...grsReward));

// ── GAR example ─────────────────────────────────────────────────────────────
const passesBefore = garTest.filter((r) => r === 1).length;
const passGap = garA[garPassIdx[0]!]!;
const failGap = garA.find((v) => v < 0)!;
const negativeSum = garA.filter((v) => v < 0).reduce((a, b) => a + b, 0);
const factors = garPassIdx.map((i) => garQuality[i]!);
const downweighted = garPassIdx.map((i) => garRedist.downweighted[i]!);
const redistributed = garPassIdx.map((i) => garRedist.redistributed[i]!);
const first = garPassIdx[0]!;
const last = garPassIdx[garPassIdx.length - 1]!;

// ── Fig. 8 read-offs ────────────────────────────────────────────────────────
type Curve = { x: number; y: number }[];
const head = (c: Curve) => Math.round(c[0]!.y);
/** a read-off ending in .5 rounds down, so 211.5K is said as 211K */
const tail = (c: Curve) => Math.round(c[c.length - 1]!.y - 1e-6);
/** the level a flat curve stays near, to the nearest ten */
const level = (c: Curve) => Math.round(c.reduce((a, b) => a + b.y, 0) / c.length / 10) * 10;
const tailStep = (c: Curve) => c[c.length - 1]!.x;
const peak = (c: Curve) => c.reduce((a, b) => (b.y > a.y ? b : a));
const withoutPeak = peak(fig8.passrate.without);

const notes: Record<string, string> = {
  // ── 15 · GRS: rubric ──────────────────────────────────────────────────────
  rubric:
    '테스트는 통과와 실패만 알려 줍니다. 그래서 통과한 풀이끼리는 구현의 품질이나 문제를 푼 방식이 달라도 똑같이 1점을 받습니다 (§4.3). 논문은 이 빈틈을 두 가지 방법으로 메웁니다. 통과율이 높은 과제 일부에는 GRS, 곧 Groupwise Reward Synthesis를 쓰고, 나머지 코드 과제에는 주로 GAR을 씁니다. 이 장면은 GRS가 쓰는 채점 기준이 어디서 오는지를 그림 7 (a)를 따라 봅니다.',
  'rubric/compare':
    '학습을 시작하기 전에 하는 일입니다. 과제마다 미리 풀어 본 풀이 여러 개를 모으고, agent 하나가 과제 설명과 저장소를 함께 놓고 이 풀이들을 비교합니다 (§4.3.1). 여러 시도를 나란히 놓으면 풀이 방식의 차이, 되풀이되는 실수, 풀이마다 흩어져 있던 좋은 습관이 보입니다. 그림의 Build Rubrics가 이 단계입니다.',
  'rubric/rubric':
    'rubric은 과제마다 따로 만드는 채점 기준표입니다. Solution rubric은 결과물을 봅니다. 요구 사항을 다 채웠는지, 예외 상황을 제대로 다루는지, 주변 코드와 어울리게 고쳤는지입니다. Behavior rubric은 일하는 방식을 봅니다. 필요한 근거를 모았는지, 고친 뒤에 그 효과를 확인했는지입니다 (§4.3.1). 기준은 미리 본 풀이가 아니라 과제 자체에서 나옵니다. 그래서 풀이 하나에서만 보인 좋은 행동이나 어느 풀이에도 없던 요구 사항도 기준이 될 수 있고, 반대로 성공한 풀이 하나가 고른 방식이 모든 풀이의 요구 사항이 되지는 않습니다.',
  'rubric/reuse':
    '학습 중에는 만들어 둔 rubric을 다시 씁니다. Rubric Grader라는 채점 agent가 새 풀이마다 그 풀이의 실행 환경에 들어가서, 결과 코드와 실행 결과, 풀이 과정을 근거로 채점합니다 (§4.3.1). rubric은 과제마다 한 번 만들고, 채점은 풀이마다 한다는 점을 짚습니다.',
  'rubric/scores':
    '풀이 하나에 점수가 두 개 나옵니다. Solution rubric으로 매긴 결과물 점수 S^sol과 Behavior rubric으로 매긴 일하는 방식 점수 S^beh입니다 (§4.3.1). 논문은 이 점수의 범위나 눈금을 밝히지 않았습니다. 이 두 점수가 테스트 점수와 어떻게 합쳐지는지는 다음 장면에서 봅니다.',

  // ── 16 · GRS: 점수 ────────────────────────────────────────────────────────
  grs: `GRS의 Eq. 2를 예시 그룹으로 계산해 보는 장면입니다. 같은 과제를 ${GRS_G}번 풀었고 ${GRS_G}번 모두 테스트를 통과한 그룹입니다. 논문은 과제마다 16번을 풀게 하지만 (§4.1), 막대를 읽기 쉽게 ${GRS_G}개로 줄였습니다. rubric 점수는 논문이 눈금을 밝히지 않아서 0과 1 사이의 예시로 잡았고, 화면의 숫자는 모두 이 예시 점수에서 계산한 값입니다.`,
  'grs/flat':
    '모두 통과했으니 테스트 점수는 전부 1이고 평균도 1입니다. 그러면 평균과의 차이가 전부 0이라서, 이 그룹은 모델을 조금도 움직이지 못합니다. 통과율이 높은 과제일수록 이런 그룹이 많아집니다. 그래서 논문은 통과율이 높은 과제 일부에 GRS를 씁니다 (§4.3).',
  'grs/multiply': `Eq. 2입니다. 최종 점수는 테스트 점수에 결과물 점수 S^sol과 일하는 방식 점수 S^beh를 곱한 값입니다 (§4.3.1). 곱하고 나면 ${GRS_G}개의 점수가 ${trim(Math.min(...grsReward))}에서 ${trim(Math.max(...grsReward))} 사이로 갈라지고, 평균은 ${trim(grsMean)}로 내려갑니다. 점선이 그 평균입니다.`,
  'grs/worked': `막대 하나를 직접 계산해 봅니다. ${W + 1}번 풀이는 테스트를 통과해서 1이고, 결과물 점수가 ${dec(grsSol[W]!)}, 일하는 방식 점수가 ${dec(grsBeh[W]!)}입니다. 셋을 곱하면 ${trim(grsReward[W]!)}점입니다. 테스트는 통과했지만 결과물의 품질이 낮아서 그룹에서 가장 낮은 점수를 받았습니다.`,
  'grs/gate': `곱셈이라서 테스트에 실패한 풀이는 rubric 점수가 아무리 높아도 0점으로 남습니다. 화면의 ${dec(grsFailed.sol)}와 ${dec(grsFailed.beh)}은 이 점을 보여 주려고 넣은 예시이고, 이 그룹에는 실패한 풀이가 없습니다. rubric은 실패한 풀이를 구해 주지 못하고, 통과한 풀이끼리만 차이를 만듭니다. 논문의 말로는 이 곱셈 꼴이 rubric 채점을 테스트 결과에 묶어 둡니다 (§4.3.1).`,
  'grs/gap': `새 평균 ${trim(grsMean)}를 빼면 평균과의 차이가 양수와 음수로 나뉩니다. 가장 잘한 ${BEST + 1}번 풀이는 ${signed(grsAdvantage[BEST]!)}, 가장 못한 ${W + 1}번 풀이는 ${signed(grsAdvantage[W]!)}입니다. 모두 통과한 그룹인데도 이제 학습 신호가 생겼습니다. 논문은 이것을 두고, 미리 해 둔 과제 분석이 학습 내내 다시 쓸 수 있는 감독 신호가 된다고 말합니다 (§4.3.1).`,

  // ── 17 · GAR: Grader ──────────────────────────────────────────────────────
  grader:
    'GAR은 Groupwise Advantage Redistribution의 줄임말이고, 통과와 실패가 섞인 그룹에 씁니다 (§4.3.2). GRS처럼 미리 만든 rubric을 쓰지 않고, 채점 agent가 학습 중에 그룹 전체를 비교합니다. 이 장면은 그 채점 agent인 Groupwise Grader가 하는 일을 그림 7 (b)를 따라 봅니다. 숫자가 어떻게 바뀌는지는 다음 장면에서 계산합니다. 화면의 풀이 세 개는 16개짜리 그룹을 줄여서 그린 것입니다.',
  'grader/together':
    'Groupwise Grader는 SFT로 학습한 채점 agent입니다. 한 그룹의 풀이를 모두 하나의 작업 공간에 모아 놓고 보는데, 그 안에는 과제 설명, 저장소, 제출된 패치, 테스트 출력이 들어 있습니다 (§4.3.2). 저장소 코드를 읽고 필요한 테스트를 직접 돌려 볼 수도 있습니다. 풀이를 하나씩 따로 채점하지 않고 성공한 풀이와 실패한 풀이를 견주어 본다는 점이 GRS와 다릅니다.',
  'grader/hack':
    '먼저 꼼수를 걸러 냅니다. 밖에서 가져온 답이나 유출된 답에 기대어 통과했다는 증거가 확인되면, 그 풀이의 점수를 0으로 바꾸고 실패로 취급합니다. 그룹의 평균은 그다음에 다시 계산합니다 (§4.3.2). 논문은 이 보정을 켠 상태에서 확인된 꼼수의 비율이 학습 내내 2% 아래였다고 적습니다 (§4.2.6, 그림 6).',
  'grader/rank':
    '남은 통과 풀이는 다섯 가지 기준으로 비교해서 순위를 매깁니다. 접근 방식이 알맞은가, 빠뜨린 것이나 불필요한 우회 없이 정확하게 구현했는가, 필요한 만큼만 고쳤는가, 과제 밖에 의도하지 않은 영향을 주지 않았는가, 코드베이스의 관례에 맞게 다듬었는가입니다 (§4.3.2). 차이가 분명하지 않으면 같은 순위를 줍니다.',
  'grader/redistribute':
    '이 순위에 따라 통과한 풀이들의 평균과의 차이, 곧 advantage를 다시 나눕니다. 품질이 낮은 통과에서 덜어 낸 몫을 품질이 높은 통과에 얹어 주는 방식입니다. 채점은 학습과 따로 비동기로 돌고, 채점 결과를 쓸 수 없으면 원래 값을 그대로 씁니다 (§4.3.2). 숫자로는 다음 장면에서 봅니다.',

  // ── 18 · GAR: 나누기 ──────────────────────────────────────────────────────
  gar: `Eq. 3을 예시 그룹으로 계산하는 장면입니다. 풀이 ${GAR_G}개 가운데 ${passesBefore}개가 테스트를 통과했는데, ${GAR_HACK + 1}번 풀이가 답을 베낀 것으로 확인되어 앞 장면처럼 실패로 돌렸습니다. 그래서 통과가 ${garPassIdx.length}개이고 평균이 ${trim(garMean)}입니다. 통과한 풀이는 ${signed(passGap)}, 실패한 풀이는 ${signed(failGap)}에서 시작합니다. 그룹 크기, 품질 계수, 베낀 풀이는 모두 예시이고 논문의 그룹은 16개입니다. 화면의 숫자는 모두 이 예시에서 계산했습니다.`,
  'gar/same': `통과한 풀이 ${garPassIdx.length}개가 품질과 상관없이 똑같이 ${signed(passGap)}를 받고 있습니다. 깔끔하게 고친 패치도, 겨우 통과한 패치도 같은 크기로 밀어 올려집니다. 양수 쪽을 모두 더하면 ${dec(garPositiveSum)}이고 음수 쪽은 ${signedDec(negativeSum)}입니다. 한 그룹의 차이를 모두 더하면 0이 된다는 것은 앞에서 봤습니다.`,
  'gar/quality': `Grader가 매긴 순위를 0보다 크고 1 이하인 품질 계수 f로 바꿔서 곱합니다 (§4.3.2). 1등은 ${dec(factors[0]!)}이라 그대로이고, 순위가 낮을수록 작은 수가 곱해져서 ${list(downweighted.map(signed))}이 됩니다. 순위를 f로 바꾸는 규칙은 논문에 없습니다. 화면의 ${list(factors.map(dec))}는 예시입니다.`,
  'gar/imbalance': `깎기만 하면 문제가 생깁니다. 양수 쪽 합이 ${dec(garPositiveSum)}에서 ${dec(garDownweightedSum)}로 줄었는데 음수 쪽은 ${signedDec(negativeSum)} 그대로라서, 위아래의 균형이 깨졌습니다. 논문은 균형을 되돌리는 것이 엔트로피가 지나치게 커지는 것을 막는 안전장치라고 설명합니다 (§4.3.2). 엔트로피는 다음 토큰의 확률이 여러 후보에 얼마나 퍼져 있는지를 재는 값입니다. 음수 쪽이 이기면 모델이 쓴 토큰의 확률이 깎이고 그 몫이 다른 후보로 흩어진다는 설명은 논문이 아니라 제 해석입니다.`,
  'gar/rescale': `그래서 공통 배율 λ를 곱합니다. λ는 원래의 양수 합을 깎은 뒤의 양수 합으로 나눈 값이고, 예시에서는 ${dec(garPositiveSum)} ÷ ${dec(garDownweightedSum)} = ${dec(garRedist.lambda)}입니다 (Eq. 3). 통과한 풀이에 모두 같은 ${dec(garRedist.lambda)}을 곱하면 ${list(redistributed.map(signed))}이 되고, 합은 다시 ${dec(garRedistributedSum)}입니다. 실패한 풀이는 건드리지 않습니다.`,
  'gar/result': `새 값은 λ·f·A입니다. 양수 쪽 합은 그대로인데 1등은 ${signed(passGap)}에서 ${signed(garRedist.redistributed[first]!)}로 올랐고, ${garPassIdx.length}등은 ${signed(garRedist.redistributed[last]!)}으로 내려갔습니다. 품질이 낮은 통과의 몫이 품질이 높은 통과로 옮겨 간 것입니다. 실제 구현에는 두 단계가 더 있습니다. λ에 상한을 둬서 양수 쪽이 지나치게 커지지 않게 하고, 마지막에 그룹 평균을 모든 풀이에서 빼서 평균을 0으로 맞춥니다 (§4.3.2). 상한값은 논문에 없어서 예시에는 적용하지 않았고, 그러면 평균이 이미 0이라 막대는 더 움직이지 않습니다. 이렇게 정한 값은 그 풀이의 모든 응답 토큰에 똑같이 붙습니다.`,

  // ── 19 · GAR의 효과 ───────────────────────────────────────────────────────
  effect:
    'GAR을 켠 학습과 끈 학습을 비교한 그림 8입니다 (§4.3.2). Flash를 코드 과제만으로 RL 학습했고, 배치 크기는 128, 손실은 토큰 평균으로 집계했습니다. 본 학습은 과제마다 평균을 내는 prompt-mean을 쓰므로, 이 실험은 설정이 다르다는 점을 먼저 말합니다. 평가는 DeepSWE v1.1이고, 화면의 점은 모두 그래프에서 읽은 근사값입니다.',
  'effect/pass': `통과율은 문제마다 세 번 풀어서 낸 평균, avg@3입니다. GAR이 없으면 스텝 ${withoutPeak.x} 무렵 ${Math.round(withoutPeak.y)}% 근처까지 올랐다가 스텝 ${tailStep(fig8.passrate.without)}에는 ${tail(fig8.passrate.without)}%로 떨어집니다. GAR을 켜면 스텝 ${tailStep(fig8.passrate.with)}까지 오름세가 이어져 60%대 초반에 이릅니다 (§4.3.2). GAR 없는 쪽의 곡선은 그림에서 스텝 ${tailStep(fig8.passrate.without)}까지만 있습니다.`,
  'effect/turns': `턴은 모델이 한 번 응답하고 도구의 결과를 받는 왕복 한 번입니다. GAR이 없으면 평균 턴 수가 ${head(fig8.turns.without)}에서 ${tail(fig8.turns.without)}로 늘어납니다. GAR을 켜면 ${level(fig8.turns.with)} 안팎에서 거의 그대로입니다.`,
  'effect/tokens': `풀이 하나의 평균 토큰 수입니다. GAR이 없으면 스텝 ${tailStep(fig8.tokens.without)}까지 ${head(fig8.tokens.without)}K에서 ${tail(fig8.tokens.without)}K로 빠르게 늘고, GAR을 켜면 ${tailStep(fig8.tokens.with)} 스텝에 걸쳐 ${head(fig8.tokens.with)}K에서 ${tail(fig8.tokens.with)}K로 천천히 늡니다. 논문의 설명은 이렇습니다. 턴과 토큰이 빠르게 늘면 길이 한도에 걸리는 풀이가 많아지고, 그래서 통과율을 계속 올리기가 어려워집니다 (§4.3.2). GAR을 켠 쪽도 길어지기는 하지만 훨씬 천천히 길어집니다.`,
  'effect/code':
    '유지보수 관점에서 코드를 따로 감사한 결과입니다. GAR 없이 학습한 모델은 테스트 통과율을 올리라는 압력 아래에서 추측으로 넣은 호환성 분기, 필요 이상으로 넓은 export, 예외 삼키기, 느슨한 검증, 평가에만 맞춘 설정 변경을 점점 더 많이 썼습니다. 이런 우회는 테스트를 통과할 가능성은 높이지만 과제의 범위를 넘고, 실패를 가리고, 코드를 유지보수하기 어렵게 만듭니다. GAR로 학습한 모델은 요청받은 범위 안에서 더 작고 정확한 패치를 냈습니다 (§4.3.2).',
};

export const gradingTrack: WeekTrack = {
  scenes: [grsRubricScene, grsRewardScene, garGraderScene, garRedistributeScene, garEffectScene],
  details: {
    rubric: { kind: 'scene', scene: grsRubricScene },
    grs: { kind: 'scene', scene: grsRewardScene },
    grader: { kind: 'scene', scene: garGraderScene },
    gar: { kind: 'scene', scene: garRedistributeScene },
    effect: { kind: 'scene', scene: garEffectScene },
  },
  notes,
};
