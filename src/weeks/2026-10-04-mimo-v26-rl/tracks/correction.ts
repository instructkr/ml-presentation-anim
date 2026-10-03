import { ratioScene } from '../scenes/09-ratio';
import { maskScene } from '../scenes/10-mask';
import { promptMeanScene } from '../scenes/11-prompt-mean';
import { G, GROUPS, groupTokensK, lengthRatio, man, promptShare, tokenShare } from '../data/correction-prompt-mean';
import {
  fmtRatio,
  INITIAL,
  LOW_ENTROPY_NEG,
  LOW_ENTROPY_POS,
  NEG_OUT_INITIAL,
  NEG_OUT_MOVED,
  POS_HIGH,
  POS_LOW,
  POS_OUT_INITIAL,
  R_NEG,
  R_POS,
} from '../data/correction-ratio-example';
import type { WeekTrack } from './types';

/**
 * Eq. 1의 보정 항 (§5.1): ratio r, mask M, prompt-mean.
 * Notes are keyed by the root-diagram node id ('ratio') and '<nodeId>/<stepId>' — one per beat.
 *
 * The numbers the notes read out come from the same data files the scenes
 * draw, so the two cannot drift apart. The Korean particles after them are
 * written for the current example values.
 */

// ── 09 · 10: the ratios the notes point at ──────────────────────────────────
const token = (i: number) => `토큰 ${i + 1}`;
const high = { name: token(POS_HIGH), r: fmtRatio(R_POS[POS_HIGH]!) };
const low = { name: token(POS_LOW), r: fmtRatio(R_POS[POS_LOW]!) };
const posOut = POS_OUT_INITIAL[0]!;
const negOut = NEG_OUT_INITIAL[0]!;
/** the token of the second attempt that drops out only after its range narrows */
const negLate = NEG_OUT_MOVED.find((i) => !NEG_OUT_INITIAL.includes(i))!;
const range = ([lo, hi]: readonly [number, number]) => `${fmtRatio(lo)}에서 ${Number(hi)}`;

// ── 11: the two prompts ─────────────────────────────────────────────────────
const [short, long] = GROUPS as [(typeof GROUPS)[number], (typeof GROUPS)[number]];
const [shortK, longK] = groupTokensK as [number, number];
const share = (v: number) => `${Number(v.toFixed(2))}%`;

export const correctionTrack: WeekTrack = {
  scenes: [ratioScene, maskScene, promptMeanScene],
  details: {
    ratio: { kind: 'scene', scene: ratioScene },
    mask: { kind: 'scene', scene: maskScene },
    mean: { kind: 'scene', scene: promptMeanScene },
  },
  notes: {
    // ── 09 · 비율 r ─────────────────────────────────────────────────────────
    ratio:
      'Eq. 1에서 뒤로 미뤄 둔 보정 두 가지 가운데 첫째인 r을 보는 장면입니다. 풀이를 쓴 모델과 지금 고치는 모델이 같지 않기 때문에, 토큰마다 두 모델이 준 확률의 비를 곱해서 그 차이를 메웁니다 (§5.1). 화면의 토큰 여섯 개와 그 비율은 모두 예시입니다. 세로축은 로그 눈금이고, 두 모델이 같은 확률을 준 1이 기준선입니다.',
    'ratio/stale':
      '풀이를 쓴 것은 지금 고치는 모델이 아니라 rollout 쪽에 올려 둔 사본입니다. 식에서는 이 사본을 μ, 지금 고치는 모델을 π로 적습니다. 둘이 달라지는 첫째 이유는 rollout과 학습이 동시에 돌기 때문입니다. 그래서 사본은 지금 모델보다 몇 버전 뒤처질 수 있고, 논문은 이 뒤처짐을 staleness라고 부르며 4까지 허용합니다 (§5.1). 긴 풀이는 여러 번의 갱신에 걸쳐 이어 쓰는데, 이때 앞부분의 확률을 다시 계산하지 않습니다 (§4.1, §5.1). 둘째 이유는 엔진입니다. rollout은 SGLang에서 Expert를 MXFP4로 돌리고, 학습은 Megatron-LM에서 합니다 (§6.4). 갱신할 때마다 Expert에 quantize–dequantize를 적용하고, rollout에서 고른 Expert 번호와 top-p 후보 집합을 기록해 학습에서 그대로 다시 쓰기 때문에 엔진 차이는 줄어듭니다. 그래도 뒤처져서 생기는 차이는 남습니다.',
    'ratio/ratio':
      'r은 토큰 하나를 두고, 지금 고치는 모델이 준 확률을 사본이 준 확률로 나눈 값입니다 (§5.1). 바깥의 sg는 stop-gradient입니다. r은 곱하는 무게로만 쓰고, r을 거쳐서는 기울기가 흐르지 않는다는 뜻입니다. 막대 여섯 개는 풀이 하나에 든 토큰 여섯 개이고, 값은 예시입니다.',
    'ratio/read': `막대를 읽어 봅니다. ${high.name}는 r이 ${high.r}입니다. 지금 모델이 이 토큰에 사본보다 ${high.r}배 높은 확률을 준다는 뜻입니다. 반대로 ${low.name}는 ${low.r}이라, 지금 모델은 이 토큰을 사본보다 조금 덜 좋아합니다. 예시에서는 나머지 토큰을 1 근처에 두었습니다. 사본과 지금 모델이 몇 버전밖에 떨어져 있지 않은 상황을 그린 것입니다.`,
    'ratio/weight':
      '이 r을 토큰마다 곱합니다. 풀이는 사본이 썼지만, r을 곱하면 지금 모델이 직접 썼을 때의 무게로 맞춰집니다. 다른 분포에서 뽑은 표본으로 원하는 분포의 평균을 맞추는 이 방법을 importance sampling이라고 합니다 (§5.1). 식의 나머지는 앞에서 본 그대로입니다. A는 그 풀이의 평균과의 차이이고, log π는 올리거나 내릴 대상입니다.',

    // ── 10 · 마스크 M ───────────────────────────────────────────────────────
    mask: `Eq. 1의 둘째 보정인 M을 보는 장면입니다. M은 토큰마다 0 아니면 1이고, r이 정해진 범위 안에 있을 때만 그 토큰을 계산에 넣습니다 (§5.1). 범위의 시작값 [${INITIAL[0]}, ${INITIAL[1].toFixed(1)}]은 논문 값입니다. 토큰 열두 개의 비율과, 마지막 비트에서 범위가 움직인 양은 예시입니다. 왼쪽은 앞 장면에서 본 풀이이고, 오른쪽은 평균보다 못한 다른 풀이입니다.`,
    'mask/band': `식의 1[·]은 괄호 안의 조건이 참이면 1, 거짓이면 0이 되는 표시입니다. 그래서 M은 r이 ${fmtRatio(INITIAL[0])} 이상 ${Number(INITIAL[1])} 이하인 토큰에서만 1입니다. 왼쪽 그림에서는 r이 ${fmtRatio(R_POS[posOut]!)}인 ${token(posOut)}가, 오른쪽에서는 ${fmtRatio(R_NEG[negOut]!)}인 ${token(negOut)}가 띠 밖에 있습니다.`,
    'mask/drop':
      '띠 밖의 토큰은 M이 0이라 Eq. 1의 합에서 통째로 빠집니다. 비율을 경계값으로 잘라서 쓰는 것이 아니라, 그 토큰을 아예 쓰지 않는다는 점을 짚습니다. 여기서부터는 해석입니다. 논문은 왜 빼는지 적지 않았습니다. PPO 계열은 비율을 경계값으로 잘라서 목적함수에 넣는데, 이 식은 그 토큰의 항을 지웁니다. r이 1에서 크게 벗어났다는 것은 두 모델이 그 토큰을 아주 다르게 본다는 뜻이고, 그런 r을 곱하면 토큰 몇 개가 기울기를 좌우하게 됩니다. 그래서 믿기 어려운 보정은 쓰지 않는다고 읽을 수 있습니다.',
    'mask/split': `논문의 범위는 하나가 아니라 둘입니다. 평균과의 차이 A가 0 이상인 풀이의 토큰에는 ε₊의 하한과 상한을 쓰고, A가 음수인 풀이의 토큰에는 ε₋의 하한과 상한을 씁니다. 경계값이 모두 넷이고, 두 쌍 모두 [${INITIAL[0]}, ${INITIAL[1].toFixed(1)}]에서 시작합니다 (§5.1). 논문은 이 조건을 "그리고"와 "또는"으로 이은 한 줄로 적습니다. 화면에는 같은 내용을 두 줄로 나눠 적었고, 뜻은 바꾸지 않았습니다.`,
    'mask/entropy': `엔트로피는 다음 토큰의 확률이 얼마나 퍼져 있는지를 재는 값입니다. 한 후보에 확률이 몰리면 낮고, 여러 후보에 고르게 퍼지면 높습니다. 논문은 학습 중에 이 값을 보면서 두 범위를 따로 조절합니다. 엔트로피가 너무 낮으면 잘한 쪽 범위를 넓히고 못한 쪽 범위를 좁혀서 정상 범위로 되돌리고, 너무 높으면 반대로 합니다 (§5.1). 방향마다 범위 밖으로 빠지는 토큰의 비율, 곧 token clipping rate도 학습 내내 지켜봅니다. 화면에서는 왼쪽 범위가 ${range(LOW_ENTROPY_POS)}까지 넓어져 ${token(posOut)}가 다시 들어오고, 오른쪽 범위가 ${range(LOW_ENTROPY_NEG)}로 좁아져 ${token(negLate)}가 빠집니다. 움직인 양은 예시이고, 논문은 방향만 밝혔습니다. 여기서부터는 해석입니다. 잘한 쪽의 상한을 넓히면 사본이 드물다고 본 좋은 토큰이 빠지지 않고 계속 올라가므로, 답이 한쪽으로 쏠리는 것을 늦춘다고 읽을 수 있습니다. DAPO의 clip-higher와 같은 발상입니다. 못한 쪽을 좁히는 이유는 논문에 없으므로 추측하지 않습니다.`,

    // ── 11 · prompt-mean ────────────────────────────────────────────────────
    mean: 'Eq. 1의 맨 앞에 있는 1/Σ|oᵢ|를 보는 장면입니다. 논문은 이것을 prompt-mean 집계라고 부릅니다. 모든 응답 토큰에 대해 한꺼번에 평균 내지 않고, 과제마다 먼저 평균을 낸다는 뜻입니다 (§5.1). 화면의 두 과제와 풀이 길이는 예시이고, 비율은 그 길이에서 계산한 값입니다.',
    'mean/tokens': `한 배치에 과제가 둘 있다고 하겠습니다. 둘 다 ${G}번씩 풉니다 (§4.1). ${short.label}는 풀이 하나가 ${man(short.tokensPerAttemptK)} 토큰이라 모두 ${man(shortK)} 토큰이고, ${long.label}는 풀이 하나가 ${man(long.tokensPerAttemptK)} 토큰이라 모두 ${man(longK)} 토큰입니다. 긴 쪽의 토큰이 ${lengthRatio}배 많습니다. 길이는 예시입니다. 논문이 밝힌 풀이 하나의 길이는 대략 11만에서 15만 토큰입니다 (§4.1).`,
    'mean/share': `이 토큰들을 한데 모아 평균 내면, 분모는 배치 전체의 토큰 수인 ${man(shortK + longK)}입니다. 그러면 학습에서 차지하는 몫이 토큰 수를 그대로 따라갑니다. ${short.label}가 ${man(shortK)} ÷ ${man(shortK + longK)} = ${share(tokenShare[0]!)}, ${long.label}가 ${share(tokenShare[1]!)}입니다. 이렇게 토큰 전체로 평균 내는 집계를 token-mean이라고 합니다.`,
    'mean/prompt': `MiMo는 과제마다 그 과제의 토큰 수로 먼저 나눕니다. 식의 1/Σ|oᵢ|가 그 일을 합니다. 한 과제의 풀이 ${G}개에 든 토큰 수를 모두 더한 값으로 나누는 것입니다. 그다음 Eq. 1 바깥의 𝔼가 과제들에 걸쳐 평균을 내므로, 두 과제는 길이와 상관없이 ${share(promptShare[0]!)}씩을 가집니다 (§5.1).`,
    'mean/why':
      '논문이 밝힌 이유는 RL 도중에 응답 길이가 너무 빨리 늘어나는 것을 막기 위해서입니다 (§5.1). 여기서부터는 해석입니다. token-mean에서는 풀이가 길수록 그 과제가 기울기에서 차지하는 몫이 커지는데, prompt-mean은 그 몫을 과제마다 고정합니다. 이 연결은 논문이 직접 쓴 말이 아닙니다. 참고로 뒤에서 볼 그림 8의 GAR 비교 실험은 배치 128에 token-mean을 썼고, 본 학습은 prompt-mean을 씁니다.',
  },
};
