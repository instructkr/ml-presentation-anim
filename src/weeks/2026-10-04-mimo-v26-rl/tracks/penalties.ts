import { lengthReferenceScene } from '../scenes/20-length-reference';
import { lengthPenaltyScene } from '../scenes/21-length-penalty';
import { segmentPositiveScene } from '../scenes/22-segment-positive';
import { segmentNegativeScene } from '../scenes/23-segment-negative';
import {
  lenAdvantage,
  lenAdvantagePlain,
  lenParams,
  lenResult,
  lenReward,
  lenTokensK,
} from '../data/length-example';
import {
  segKappa,
  segNeg,
  segNegAfter,
  segNegAmplified,
  segNegBefore,
  segPos,
  segPosAfter,
  segPosBefore,
  segPosMasked,
  segScales,
  segSum,
} from '../data/segment-example';
import type { WeekTrack } from './types';

/**
 * Behavioral regularization (§4.3.3): length penalty (Eq. 4), segment-level penalties (Eq. 5).
 * Notes are keyed by the root-diagram node id ('length') and '<nodeId>/<stepId>' — one per beat.
 *
 * Every number the notes read out is taken from the same data files the scenes
 * draw, so a note can never disagree with the screen. The paper publishes none
 * of X, δ, s, γ, A, B, κ, α_max, β_min: every value is an example, and the
 * notes say so where the value is used.
 */
const trim = (v: number) => String(Number(v.toFixed(3)));
const one = (v: number) => v.toFixed(1);
const signed = (v: number) => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${trim(Math.abs(v))}`);

// ── length penalty (scenes 20, 21) ──────────────────────────────────────────
const P = lenParams;
const RES = lenResult;
const G = lenReward.length;
const nth = (i: number) => `${i + 1}번`;
const passLengths = RES.passIdx.map((i) => lenTokensK[i]!).sort((a, b) => a - b);
const fails = lenReward.flatMap((r, i) => (r === 1 ? [] : [i]));
/** passing attempts that lose something: the shorter one sits on the ramp, the longer one on the plateau */
const cut = RES.passIdx.filter((i) => RES.deduction[i]! > 0);
const [cutMid, cutLong] = [cut[0]!, cut[cut.length - 1]!];
const shortPass = RES.passIdx.find((i) => RES.deduction[i] === 0)!;
const longFail = fails.reduce((a, b) => (lenTokensK[b]! > lenTokensK[a]! ? b : a));

// ── segment penalties (scenes 22, 23) ───────────────────────────────────────
const S = segScales;
const N = segPos.h.length;
const flaggedOf = (h: number[]) =>
  h
    .flatMap((v, i) => (v === 1 ? [i] : []))
    .map(nth)
    .join('과 ');
const keptPos = segPosAfter.find((v) => v > 0)!;
const keptNeg = Math.max(...segNegAfter);
const flaggedNeg = Math.min(...segNegAfter);
const addedNeg = (segKappa - 1) * S.hNeg;

const notes: Record<string, string> = {
  // ── 20 · 기준 길이 ────────────────────────────────────────────────────────
  length: `너무 긴 풀이를 가려낼 기준을 정하는 장면입니다. 논문은 이 장치를 group-relative length penalty라고 부르고, RL 도중 생성 토큰이 빠르게 늘어나는 것을 누르고 일반화를 돕는다고 적습니다 (§4.3.3). 길다는 판단은 과제마다 따로 합니다. 같은 과제를 통과한 풀이들의 길이로 기준을 재기 때문입니다. 화면의 풀이 ${G}개와 그 길이는 모두 예시이고, 논문은 과제마다 16개를 뽑습니다 (§4.1).`,
  'length/lengths': `막대 하나가 풀이 한 번이고, 높이는 그 풀이가 생성한 토큰 수입니다. 논문의 기호로는 ℓ입니다. 같은 과제를 풀었는데도 짧게는 ${Math.min(...lenTokensK)}K, 길게는 ${Math.max(...lenTokensK)}K까지 차이가 납니다. 이 길이들은 예시입니다.`,
  'length/passing': `기준을 잴 때는 테스트를 통과한 풀이만 봅니다. 여기서는 ${G}개 중 ${RES.passIdx.length}개가 통과했고, 흐려진 ${fails.length}개가 실패한 풀이입니다. 실패한 풀이는 길든 짧든 기준에 들어가지 않습니다. 맞게 풀려면 어느 정도 길이가 필요한지를 재려는 것이라서 그렇다고 저는 읽었습니다. 이 이유는 논문에 적힌 것이 아니라 제 해석입니다.`,
  'length/reference': `기준 길이 ℓ*는 통과한 풀이 길이의 B 백분위수입니다 (§4.3.3). 백분위수는 값을 작은 것부터 세웠을 때 B%가 그 아래에 오는 값이고, B가 50이면 가운데 값입니다. 통과한 길이 ${passLengths.join(', ')}K의 가운데 값이 ${trim(RES.reference)}K라서, 이 과제의 기준 길이는 ${trim(RES.reference)}K입니다. 식의 P_q는 과제 q에서 통과한 풀이들의 번호 모음입니다. B 값은 논문에 없습니다. 화면에서 쓴 B = ${P.B}도 예시입니다.`,
  'length/ratio': `이제 풀이마다 길이를 기준 길이로 나눕니다. ${nth(cutMid)} 풀이는 ${lenTokensK[cutMid]}K ÷ ${trim(RES.reference)}K = ${trim(RES.ratio[cutMid]!)}배이고, ${nth(cutLong)} 풀이는 ${trim(RES.ratio[cutLong]!)}배입니다. 다음 장면의 감점은 이 배수만 보고 정합니다. 그래서 원래 길게 풀어야 하는 과제는 기준도 같이 길어집니다. 이 문장은 논문의 "과제마다 맞춘 기준"을 풀어 쓴 제 해석입니다. ${nth(longFail)} 풀이도 ${lenTokensK[longFail]}K로 길지만 실패한 풀이라서 감점 대상이 아닙니다.`,

  // ── 21 · 길이 감점 ────────────────────────────────────────────────────────
  penalty: `앞 장면에서 구한 배수를 감점으로 바꾸는 식, Eq. 4를 한 겹씩 쌓는 장면입니다 (§4.3.3). 왼쪽 곡선이 이 식이 그리는 감점이고, 오른쪽 막대는 앞 장면과 같은 풀이 ${G}개의 점수입니다. 논문은 X, δ, s, γ와 문턱값을 하나도 공개하지 않았습니다. 그래서 곡선과 숫자는 모두 예시 값으로 계산했습니다. 이 감점을 끈 비교 실험도 논문에는 없습니다.`,
  'penalty/tolerate': `길이를 기준 길이로 나눈 값에서 1을 빼면 기준을 얼마나 넘었는지가 됩니다. 거기서 δ를 한 번 더 뺍니다. δ는 기준보다 이만큼 긴 것까지는 봐준다는 폭입니다. 예시의 값은 δ = ${trim(P.delta)}입니다. 그래서 기준의 ${trim(1 + P.delta)}배까지는 감점이 0이고, 왼쪽 곡선이 그 구간에서 바닥에 붙어 있습니다. 논문의 조건은 δ ≥ 0입니다. δ가 0이면 기준보다 조금이라도 긴 통과 풀이가 모두 깎입니다.`,
  'penalty/ramp': `넘은 정도를 s − δ로 나누고 0과 1 사이로 자릅니다. clip(x, 0, 1)은 x가 0보다 작으면 0으로, 1보다 크면 1로 바꾸는 함수입니다. s는 감점이 가득 차는 지점이라서, 이 값은 봐주는 폭의 끝에서 0이고 기준의 ${trim(1 + P.s)}배에서 1이 됩니다. 여기에 γ 제곱을 하면 처음에는 천천히, 뒤로 갈수록 가파르게 오릅니다. 예시의 값은 s = ${one(P.s)}, γ = ${P.gamma}입니다. 논문이 밝힌 조건은 s > δ, γ ≥ 1뿐입니다.`,
  'penalty/cap': `마지막으로 X를 곱합니다. X는 최대 감점입니다. 대괄호 안의 값이 1을 넘지 못하므로 감점은 X에서 멈춥니다. 예시의 값은 X = ${trim(P.X)}입니다. 그래서 기준의 ${trim(1 + P.s)}배부터는 얼마나 더 길든 ${trim(P.X)}점만 잃습니다. 곡선은 화면에서 가장 긴 통과 풀이가 있는 ${trim(RES.ratio[cutLong]!)}배까지만 그렸고, 그 뒤로도 같은 높이로 이어집니다.`,
  'penalty/apply': `이 감점을 원래 점수 R에서 뺀 것이 조정된 점수 R̃입니다. 식 앞의 1[i ∈ P_q]는 통과한 풀이일 때만 1이 되는 표시입니다. 그래서 ${nth(longFail)} 풀이처럼 실패한 풀이는 길어도 0점 그대로입니다. ${nth(cutMid)} 풀이는 기준의 ${trim(RES.ratio[cutMid]!)}배라서 ${trim(RES.deduction[cutMid]!)}만큼 잃고 ${trim(RES.adjusted[cutMid]!)}점이 됩니다. ${nth(cutLong)} 풀이는 ${trim(RES.ratio[cutLong]!)}배라서 최대치인 ${trim(RES.deduction[cutLong]!)}만큼 잃고 ${trim(RES.adjusted[cutLong]!)}점이 됩니다. 제한이 하나 더 있습니다. 그룹의 통과율이 문턱을 넘을 때만 이 계산을 하고, 나머지 그룹은 원래 점수를 그대로 씁니다. 논문은 이 문턱을 A로 적는데 평균과의 차이 A와는 다른 값이라서, 말로는 A_min이라고 부르겠습니다. 논문은 이 문턱이 어려운 과제에서 탐색할 여지를 남긴다고 설명합니다 (§4.3.3). 평균과의 차이는 이 R̃로 계산합니다. 예시에서 짧게 통과한 ${nth(shortPass)} 풀이의 차이는 감점 전에 ${signed(lenAdvantagePlain[shortPass]!)}였는데 감점 뒤에는 ${signed(lenAdvantage[shortPass]!)}입니다. 가장 긴 ${nth(cutLong)} 풀이는 ${signed(lenAdvantage[cutLong]!)}까지 내려가서 평균 바로 아래에 놓입니다. 구현에서는 길이 감점, 평균과의 차이 계산, 토큰별 조정 순서로 적용합니다 (§6.2).`,

  // ── 22 · 토큰 감점: 성공한 풀이 ───────────────────────────────────────────
  segment: `결과 점수는 풀이 하나에 숫자 하나라서, 그 풀이의 모든 토큰이 같은 평균과의 차이를 받습니다. 그래서 성공한 풀이에 섞인 잘못된 토큰도 같이 칭찬받습니다. 논문 표현으로는 결과 보상이 잘못된 중간 행동을 강화할 수 있다는 것이고, 이것을 막는 장치가 segment-level behavioral penalty입니다 (§4.3.3, Eq. 5). 이 장면은 성공한 풀이 쪽을 봅니다. 화면의 풀이는 토큰 ${N}개짜리 예시이고, 실제 풀이는 토큰이 십만 개 단위입니다 (§4.1).`,
  'segment/uniform': `막대 하나가 토큰 하나입니다. 이 풀이는 평균보다 ${trim(segPos.A)}만큼 잘해서 토큰 ${N}개가 모두 똑같이 ${signed(segPos.A)}씩 받습니다. 식의 Ã는 토큰마다 붙는 값이고, 지금은 풀이의 A와 같습니다. GRPO 같은 그룹 단위 방식은 결과 점수를 그 풀이가 생성한 모든 토큰에 고르게 퍼뜨립니다 (§6.1).`,
  'segment/flag': `규칙이 잘못된 토큰을 찾아 표시합니다. 논문이 드는 예는 깨진 마크업, 없는 도구 이름, 형식이 틀린 인자입니다 (§4.3.3). 표시된 토큰은 h = 1, 나머지는 h = 0입니다. 여기서는 ${flaggedOf(segPos.h)} 토큰이 깨진 도구 호출 하나라고 가정했습니다. §6.1의 Penalty Module은 찾는 일과 벌주는 일을 나눕니다. Rule이 손으로 짠 로직이나 모델 판정으로 찾아내고, Strategy가 그 토큰을 손실에서 빼거나 평균과의 차이를 조정합니다.`,
  'segment/mask': `표시된 토큰에서는 (1 − h)가 0이라서 값이 0이 됩니다. 성공한 풀이 안에 있었다는 이유만으로 깨진 도구 호출까지 더 자주 나오게 하지는 않겠다는 뜻입니다. 논문 표현으로는 양수 풀이의 표시된 토큰을 mask합니다 (§4.3.3). 합은 ${one(segSum(segPosBefore))}이었는데 이 순간에는 ${one(segSum(segPosMasked))}입니다. 화면은 지우기와 얹기를 두 동작으로 나눠 보여 주지만, Eq. 5는 한 번에 계산합니다.`,
  'segment/boost': `지운 몫은 버리지 않습니다. 표시되지 않은 토큰에 α를 곱해서 나눠 줍니다. 나머지 토큰 ${N - segPos.h.filter((h) => h === 1).length}개의 값이 ${signed(segPos.A)}에서 ${signed(keptPos)}까지 올라갑니다. 논문 표현으로는, 오류가 잡히지 않은 행동이 그만큼 더 강화됩니다 (§4.3.3).`,
  'segment/conserve': `α는 1에, 지운 몫을 남은 몫으로 나눈 값을 더한 것입니다. 분자의 H+는 양수 풀이에서 표시된 토큰이고 분모의 C+는 표시되지 않은 토큰이며, 각각 그 토큰들의 A를 모두 더합니다. 예시에서는 α = 1 + ${one(S.hPos)} ÷ ${one(S.cPos)} = ${trim(S.alpha)}입니다. 그래서 합은 ${one(segSum(segPosAfter))} 그대로입니다. 실제 식에는 상한이 있어서 α = min(α_max, …)입니다. 상한값은 논문에 없고, 예시는 상한에 걸리지 않는 것으로 두었습니다. Eq. 5의 합은 풀이 하나가 아니라 학습 배치 전체에서, 손실에 들어가는 토큰만 셉니다. 예시는 양수 풀이가 하나뿐인 배치로 계산했습니다.`,

  // ── 23 · 토큰 감점: 실패한 풀이 ───────────────────────────────────────────
  punish: `같은 장치의 실패한 풀이 쪽입니다 (§4.3.3, Eq. 5). 실패한 풀이에서는 멀쩡한 토큰도 깨진 도구 호출과 똑같은 벌을 받습니다. 그래서 잘못된 토큰은 더 세게 벌하고, 더한 만큼 나머지 토큰의 벌을 덜어 줍니다. 풀이 하나, 토큰 ${segNeg.h.length}개, 그리고 κ = ${segKappa}까지 모두 예시입니다.`,
  'punish/uniform': `이 풀이는 평균보다 ${trim(Math.abs(segNeg.A))}만큼 못해서 토큰 ${segNeg.h.length}개가 모두 똑같이 ${signed(segNeg.A)}씩 받습니다. 0보다 아래라는 것은 이 토큰들이 덜 나오도록 민다는 뜻입니다. 여기서도 처음에는 토큰마다 붙는 값 Ã가 풀이의 A와 같습니다.`,
  'punish/amplify': `${flaggedOf(segNeg.h)} 토큰이 깨진 도구 호출입니다. 이 토큰들에는 κ를 곱해서 벌을 키웁니다. κ = ${segKappa}일 때 ${signed(segNeg.A)}였던 값이 ${signed(flaggedNeg)}까지 내려갑니다. 식에서는 h = 1인 토큰에 κ가, h = 0인 토큰에 1이 곱해집니다. 논문이 밝힌 조건은 κ > 1뿐이고, 화면의 κ 값은 예시입니다 (§4.3.3). 벌의 합은 −${one(-segSum(segNegBefore))}이었는데 이 순간에는 −${one(-segSum(segNegAmplified))}입니다.`,
  'punish/relax': `벌만 키우면 음수 쪽 합이 커집니다. 그래서 표시되지 않은 토큰에는 β를 곱해 벌을 0 쪽으로 줄입니다. 예시의 값은 β = ${trim(S.beta)}입니다. 그래서 ${signed(segNeg.A)}였던 값이 ${signed(keptNeg)}까지 줄어듭니다. 논문 표현으로는, 오류가 잡히지 않은 행동은 풀이의 부호에 따라 더 강화되거나 덜 벌받습니다 (§4.3.3).`,
  'punish/conserve': `β는 더한 벌만큼만 나머지에서 덜도록 정합니다. 분자는 표시된 토큰에 더한 벌이고, (κ − 1) × ${one(S.hNeg)} = ${one(addedNeg)}입니다. 분모는 표시되지 않은 토큰의 벌 ${one(S.cNeg)}입니다. 그래서 β = 1 − ${one(addedNeg)} ÷ ${one(S.cNeg)} = ${trim(S.beta)}입니다. 이렇게 하면 벌의 합은 −${one(-segSum(segNegAfter))} 그대로입니다. 논문은 부호마다 합을 지키는 이유를 이렇게 적습니다. 여분의 음수 압력은 엔트로피, 곧 다음 토큰 분포가 퍼진 정도를 걷잡을 수 없이 키울 수 있어서 그것을 막는다는 것입니다 (§4.3.3). 음수 쪽이 세지면 뽑힌 토큰의 확률이 깎이고 그 몫이 다른 후보로 흩어진다는 설명은 논문이 아니라 제 해석입니다. 실제 식에는 하한 β_min이 있습니다. α나 β가 한계에 잘리거나 분모가 0이면 합은 보존되지 않고, 분모가 0일 때는 그 배율을 1로 둡니다. 차이의 합이 0이라는 장면, 그리고 GAR의 λ에서 본 것과 같은 균형입니다.`,
};

export const penaltiesTrack: WeekTrack = {
  scenes: [lengthReferenceScene, lengthPenaltyScene, segmentPositiveScene, segmentNegativeScene],
  details: {
    length: { kind: 'scene', scene: lengthReferenceScene },
    penalty: { kind: 'scene', scene: lengthPenaltyScene },
    segment: { kind: 'scene', scene: segmentPositiveScene },
    punish: { kind: 'scene', scene: segmentNegativeScene },
  },
  notes,
};
