import type { WeekTrack } from './types';
import { lengthPenaltyScene } from '../scenes/12-length-penalty';
import { segmentPenaltyScene } from '../scenes/13-segment-penalty';
import { fig9Tokens } from '../data/pen-fig9';
import {
  lenAdvantage,
  lenAdvantagePlain,
  lenParams,
  lenResult,
  lenReward,
  lenTokensK,
  mean,
} from '../data/pen-length-example';
import {
  segKappa,
  segNegAfter,
  segNegAmplified,
  segPosAfter,
  segPosMasked,
  segScales,
  segSum,
} from '../data/pen-segment-example';

/** Behavior-penalty track (WO-005): 12-length-penalty, 13-segment-penalty. */

// numbers the notes read out, taken from the same data files the scenes draw
const trim = (v: number) => String(Number(v.toFixed(3)));
const one = (v: number) => v.toFixed(1);
const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(3)}`;
const firstY = (pts: { y: number }[]) => pts[0]!.y;
const lastY = (pts: { y: number }[]) => pts[pts.length - 1]!.y;

const P = lenParams;
const RES = lenResult;
const passLengths = RES.passIdx.map((i) => lenTokensK[i]!).sort((a, b) => a - b);
const cut = RES.passIdx.filter((i) => RES.deduction[i]! > 0);
const [cutMid, cutLong] = [cut[0]!, cut[cut.length - 1]!];
const shortPass = RES.passIdx.find((i) => RES.deduction[i] === 0)!;
const fails = lenReward.flatMap((r, i) => (r === 1 ? [] : [i]));
const longFail = fails.reduce((a, b) => (lenTokensK[b]! > lenTokensK[a]! ? b : a));
const tau = (i: number) => `τ${'₀₁₂₃₄₅₆₇₈₉'[i + 1]}`;

const S = segScales;
const keptPos = segPosAfter.find((v) => v > 0)!;
const keptNeg = Math.max(...segNegAfter);
const flaggedNeg = Math.min(...segNegAfter);

/**
 * Explorer notes are keyed by node id ('length', 'segment') with per-step
 * overrides; the first beat of each scene has none, so the node note covers it.
 * Scene-id keys are the one-paragraph summaries used outside the explorer.
 */
const notes: Record<string, string> = {
  '12-length-penalty':
    `길이 페널티 편입니다. RL이 진행되면 궤적이 길어집니다. 논문은 프롬프트마다 통과한 롤아웃의 길이로 기준 ℓ*를 잡고, 그보다 많이 긴 정답의 보상만 깎습니다. 이 계산은 통과율이 문턱을 넘는 그룹에만 적용합니다 (§4.3.3, Eq. 4). 논문은 X, δ, s, γ, A, B의 값을 하나도 공개하지 않았습니다. 그래서 화면의 곡선과 롤아웃 ${lenReward.length}개는 모두 예시이고, 그림 9의 토큰 수는 그래프에서 읽은 근사값입니다.`,
  length:
    `길이 페널티입니다. 먼저 그림 9의 아랫줄을 봅니다. 본 학습 30 스텝 동안 체크포인트마다 DeepSWE로 평가한 궤적의 토큰 수가 Flash는 약 ${firstY(fig9Tokens.flash)}K에서 ${lastY(fig9Tokens.flash)}K로, Pro는 약 ${firstY(fig9Tokens.pro)}K에서 ${lastY(fig9Tokens.pro)}K로 늘었습니다. 그래프를 확대해 선 색으로 읽은 근사값입니다. 논문은 이 증가가 성능 향상과 함께 왔다고 봅니다 (§5.3). 그래서 길어지는 것 자체를 나쁘다고 하지 않고, 어려운 문제에는 원래 긴 풀이가 필요하다는 점을 먼저 짚습니다. 논문이 밝힌 이 페널티의 효과는 일반화가 좋아지고 토큰이 빠르게 늘어나는 것을 누른다는 것입니다 (§4.3.3). 페널티를 끈 비교 그래프는 논문에 없습니다.`,
  'length/reference':
    `기준 길이 ℓ*는 프롬프트마다 따로 잽니다. 그 프롬프트의 롤아웃 가운데 통과한 것만 모아 길이의 B 백분위수를 구합니다. 백분위수는 값을 작은 순으로 세웠을 때 B%가 그 아래에 오는 값이고, B = 50이면 중앙값입니다. 예시 그룹은 ${lenReward.length}개 중 ${RES.passIdx.length}개가 통과했고, 통과한 길이 ${passLengths.join(', ')}K의 가운데 값 ${trim(RES.reference)}K가 ℓ*입니다. 실패한 롤아웃은 길이와 상관없이 기준에 들어가지 않습니다. B 값은 논문에 없고 ${P.B}은 예시입니다. 논문의 그룹 크기는 16인데 막대를 읽기 쉽게 ${lenReward.length}개로 줄였습니다.`,
  'length/curve':
    `Eq. 4의 감점 항입니다. 길이를 ℓ*로 나눈 비율이 1+δ 이하이면 감점이 0입니다. 그 뒤로는 γ 제곱으로 커지다가 비율이 1+s에 닿으면 최대 감점 X에서 멈춥니다. 논문의 정의로 X ≥ 0은 최대 감점, δ ≥ 0은 기준보다 봐주는 초과 비율, s > δ는 감점이 포화되는 초과 비율, γ ≥ 1은 곡선의 지수입니다. δ = 0이면 기준보다 조금이라도 긴 정답은 모두 깎입니다. 화면의 X = ${P.X}, δ = ${P.delta}, s = ${P.s.toFixed(1)}, γ = ${P.gamma}는 예시이고, 논문은 값을 밝히지 않았습니다. 예시에서 ${tau(cutMid)}는 기준의 ${trim(RES.ratio[cutMid]!)}배라 약 ${trim(RES.deduction[cutMid]!)}, ${tau(cutLong)}는 ${trim(RES.ratio[cutLong]!)}배라 최대치 ${trim(RES.deduction[cutLong]!)}를 잃습니다. 오른쪽 막대의 두 띠가 곡선의 오르막과 평평한 구간에 해당합니다.`,
  'length/gate':
    `제한이 두 가지 있습니다. 첫째, 지시 함수 1[i ∈ P_q] 때문에 감점은 통과한 롤아웃에만 붙습니다. 예시의 ${tau(longFail)}은 ${lenTokensK[longFail]}K로 길지만 실패라서 보상 0 그대로입니다. 둘째, 통과율 |P_q|/G가 문턱 A_min을 넘는 그룹에서만 이 계산을 하고, 나머지 그룹은 원래 보상을 씁니다. 논문은 이 문턱을 A로 적지만, 같은 화면의 어드밴티지 A와 헷갈리지 않게 화면에서는 A_min으로 적었습니다. 논문은 이 문턱이 어려운 프롬프트에서 탐색할 여지를 남긴다고 설명합니다 (§4.3.3). 여기서 A는 논문이 문턱에 붙인 기호이고, 어드밴티지 A_i와는 다른 값입니다. 문턱값은 논문에 없고 ${P.A}는 예시입니다.`,
  'length/effect':
    `어드밴티지는 깎인 보상 R̃로 계산합니다 (§4.3.3). 예시에서 R̄은 약 ${trim(mean(RES.adjusted))}입니다. 짧은 정답의 A는 페널티가 없을 때의 ${signed(lenAdvantagePlain[shortPass]!)}에서 ${signed(lenAdvantage[shortPass]!)}로 오르고, ${tau(cutMid)}는 ${signed(lenAdvantage[cutMid]!)}, 가장 긴 정답 ${tau(cutLong)}는 ${signed(lenAdvantage[cutLong]!)}이 되어 평균을 살짝 밑돕니다. 정답인데도 조금 밀려 내려가는 것은 예시에서 X를 ${P.X}로 크게 잡았기 때문이고, X를 더 작게 잡으면 양수로 남습니다. 기준 ℓ*는 프롬프트마다 그 문제의 정답으로 다시 재므로, 원래 길게 풀어야 하는 문제는 기준도 깁니다. 이 문장은 논문의 "프롬프트마다 맞춘 기준"을 풀어 쓴 제 해석입니다. 구현에서는 그룹을 받아들인 뒤 길이 페널티를 먼저 적용하고, 그다음 그룹 상대 어드밴티지를 계산하고, 마지막으로 어드밴티지 조정을 합니다 (§6.2).`,

  '13-segment-penalty':
    `구간 페널티 편입니다. 결과 보상은 궤적의 모든 토큰에 같은 어드밴티지로 퍼지므로, 규칙이 잡아낸 잘못된 토큰만 따로 다룹니다. 성공한 궤적에서는 그 토큰의 어드밴티지를 지우고, 실패한 궤적에서는 더 세게 벌합니다. 그러면서도 부호별 어드밴티지 합은 그대로 지킵니다 (§4.3.3, Eq. 5; §6.1). 두 궤적, 토큰 10개, κ = ${segKappa}은 예시입니다. Eq. 5의 합은 학습 배치 전체의 토큰을 대상으로 하는데, 예시는 부호마다 궤적이 하나뿐인 배치로 계산했습니다.`,
  segment:
    '구간 페널티입니다. GRPO 같은 그룹 단위 알고리즘은 결과 보상을 궤적의 모든 모델 생성 토큰에 고르게 퍼뜨립니다 (§6.1). 그래서 성공한 궤적 속의 깨진 도구 호출도 같이 강화되고, 실패한 궤적에서는 멀쩡한 토큰도 깨진 호출과 똑같이 벌을 받습니다. 논문 표현으로는 결과 보상이 잘못된 중간 행동을 강화할 수 있다는 것입니다 (§4.3.3). 화면의 두 궤적은 토큰 10개짜리 예시이고, 실제 궤적은 토큰이 십만 개 단위입니다.',
  'segment/flag':
    '표시는 규칙이 합니다. §4.3.3이 드는 예는 깨진 마크업, 존재하지 않는 도구 이름, 형식이 틀린 인자입니다. 표시된 토큰은 h = 1, 나머지는 0입니다. §6.1의 Penalty Module은 탐지와 효과를 나눕니다. 규칙(Rule)은 손으로 짠 로직이나 모델 기반 판정으로 세그먼트, 컨텍스트, 시퀀스를 판정합니다. 전략(Strategy)은 그 결과에 행동을 붙입니다. 손실에서 빼는 mask, 어드밴티지를 정하거나 조정하는 advantage shaping, 지표만 기록하는 monitor가 있습니다. 규칙은 모델 탓이 아닌 인프라 실패, 깨진 토큰 패턴, 쓸 수 없는 도구 호출, 반복도 잡습니다. 깨진 도구 호출이 두 토큰짜리라는 것은 설명을 위한 설정입니다.',
  'segment/positive':
    `A > 0인 궤적입니다. 표시된 토큰의 어드밴티지는 0이 되고, 표시되지 않은 토큰에는 α를 곱합니다. α = min(α_max, 1 + Σ_{H+}A / Σ_{C+}A)이고, H+는 양수 궤적의 표시된 토큰, C+는 표시되지 않은 토큰입니다. 예시에서는 표시된 두 토큰의 몫이 ${one(S.hPos)}, 나머지 여덟 토큰의 합이 ${one(S.cPos)}이라 α = ${trim(S.alpha)}이고, 나머지 토큰은 ${trim(keptPos)}씩 받습니다. 합은 ${one(segSum(segPosAfter))} 그대로입니다. 어드밴티지 질량은 한 부호 토큰들의 A를 모두 더한 값을 가리키는 말로 썼습니다. Eq. 5의 합은 학습 배치 전체에서, 손실 마스크 M = 1인 토큰만 셉니다. 예시는 부호마다 궤적 하나뿐인 배치입니다. 화면은 지우기와 키우기를 두 동작으로 나눠 보여 주지만 Eq. 5는 한 번에 계산하고, 중간의 합 ${one(segSum(segPosMasked))}은 설명용입니다.`,
  'segment/negative':
    `A < 0인 궤적입니다. 표시된 토큰에는 κ > 1을 곱해 더 세게 벌하고, 표시되지 않은 토큰에는 β를 곱해 벌을 줄입니다. β = max(β_min, 1 − (κ−1)·Σ_{H−}|A| / Σ_{C−}|A|)입니다. 예시에서 κ = ${segKappa}이면 표시된 토큰은 ${trim(flaggedNeg).replace('-', '−')}가 되고, β = 1 − ${segKappa - 1} × ${one(S.hNeg)} ÷ ${one(S.cNeg)} = ${trim(S.beta)}라서 나머지는 ${trim(keptNeg).replace('-', '−')}가 됩니다. 크기의 합은 ${one(-segSum(segNegAfter))} 그대로입니다. 중간의 합 ${one(segSum(segNegAmplified)).replace('-', '−')}은 κ만 곱했을 때의 값으로, 설명용입니다. κ = ${segKappa}은 예시이고, 논문은 κ > 1이라는 조건만 밝혔습니다.`,
  'segment/conserve':
    '부호별 합이 보존되려면 α와 β가 상한 α_max나 하한 β_min에 잘리지 않아야 합니다. 분모가 0이면 그 배율을 1로 두는데, 이때도 보존은 보장되지 않습니다 (§4.3.3). 두 한계값은 논문에 없고, 예시는 어느 쪽에도 걸리지 않게 잡았습니다. 논문은 보존하는 이유를 이렇게 적습니다. 부호마다 합을 지키면, 걷잡을 수 없는 엔트로피 증가를 부를 수 있는 여분의 음수 압력을 막는다는 것입니다. 음수 어드밴티지가 뽑힌 토큰의 확률을 깎고, 그 몫이 다른 후보로 흩어져 분포가 퍼진다는 설명은 논문이 아니라 제 해석입니다. GAR의 λ 재정규화(10편)와 같은 논리이고, 엔트로피 정의는 비율·마스크 칸(08편)에서 봤습니다.',
};

export const penaltiesTrack: WeekTrack = {
  scenes: [lengthPenaltyScene, segmentPenaltyScene],
  details: {
    length: { kind: 'scene', scene: lengthPenaltyScene },
    segment: { kind: 'scene', scene: segmentPenaltyScene },
  },
  notes,
};
