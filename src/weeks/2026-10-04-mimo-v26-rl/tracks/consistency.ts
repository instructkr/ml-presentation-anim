import { twoEnginesScene } from '../scenes/32-two-engines';
import { routingReplayScene } from '../scenes/33-routing-replay';
import { topPReplayScene } from '../scenes/34-top-p-replay';
import {
  EXPERTS,
  FLIP_MARGIN,
  GAINED,
  KL_DENSE,
  KL_MOE,
  KL_R3,
  LOST,
  PICK_ROLLOUT,
  R3_STUDY,
  S_ROLLOUT,
  S_TRAIN,
  TOP_K,
  expertNo,
  fmtKl,
  fmtScore,
} from '../data/consistency-router-example';
import {
  CANDIDATES,
  CHOSEN,
  KEPT_MASS,
  MU,
  P_FULL,
  PI_FULL,
  R_MISMATCH,
  SET,
  TOP_P,
  fmtProb,
} from '../data/consistency-top-p-example';
import { FIG11_TEXT } from '../data/router-load';
import type { WeekTrack } from './types';

/**
 * 두 엔진 맞추기 (§4.1의 "train–inference consistency", §6.4): QDQ, R3, top-p 후보 집합.
 * Notes are keyed by the root-diagram node id ('engines') and '<nodeId>/<stepId>' — one per beat.
 *
 * The report gives R3 one sentence and the candidate-set replay two, and cites
 * the papers they come from. So the notes of 33 and 34 lean on those papers and
 * say which sentence is whose: "R3 논문" is Ma et al. 2025 (arXiv 2510.11370),
 * "DeepSeek-V3.2" is arXiv 2512.02556, "MAI-Thinking-1" is the Microsoft AI
 * technical report, "MiMo-V2-Flash" is arXiv 2601.02780. A bare § is MiMo-V2.6.
 *
 * The numbers the notes read out come from the same data files the scenes
 * draw. The Korean particles after them are written for the current values.
 */

// ── 33: the Router example ──────────────────────────────────────────────────
const [first, second] = PICK_ROLLOUT.map(expertNo) as [number, number];
const lost = expertNo(LOST);
const gained = expertNo(GAINED);
const margin = fmtScore(FLIP_MARGIN);
const R = R3_STUDY;

// ── 34: the top-p example ───────────────────────────────────────────────────
const chosen = CANDIDATES[CHOSEN]!;
const pFull = fmtProb(PI_FULL);
const mass = fmtProb(KEPT_MASS);
const mu = fmtProb(MU);
const tail = fmtProb(1 - KEPT_MASS);
/** the mismatch as a percentage of 1 */
const offPct = Math.round((1 - R_MISMATCH) * 100);

export const consistencyTrack: WeekTrack = {
  scenes: [twoEnginesScene, routingReplayScene, topPReplayScene],
  details: {
    engines: { kind: 'scene', scene: twoEnginesScene },
    r3: { kind: 'scene', scene: routingReplayScene },
    topp: { kind: 'scene', scene: topPReplayScene },
  },
  notes: {
    // ── 32 · 두 엔진 ────────────────────────────────────────────────────────
    engines:
      '비율 r 장면에서 남겨 둔 질문을 다루는 장면입니다. r은 Training이 계산한 확률을, Rollout이 풀이를 쓸 때 적어 둔 확률로 나눈 값입니다. 그런데 이 두 확률은 서로 다른 프로그램이 계산합니다. 그래서 가중치가 같아도 두 값이 어긋날 수 있고, 그러면 r은 모델이 바뀐 정도가 아니라 프로그램의 차이를 재게 됩니다. 논문은 이 차이를 세 군데에서 맞춥니다 (§4.1, §6.4). 그림의 윗줄이 Rollout, 아랫줄이 Training이고, 두 줄 사이에 차례로 놓이는 세 칸이 그 세 가지입니다.',
    'engines/two':
      '추론 엔진은 모델을 올려 두고 토큰을 하나씩 빠르게 써 내는 프로그램입니다. 학습 엔진은 같은 모델에서 기울기를 구해 가중치를 고치는 프로그램입니다. 하는 일이 달라서 따로 만들어져 있습니다. MiMo는 Rollout에 SGLang을, Training에 Megatron-LM을 씁니다 (§6.4). 그림에서는 같은 토큰이 두 엔진에 모두 들어갑니다. 토큰은 Router를 거쳐 Expert로 가고, 끝에서 다음 토큰의 확률이 나옵니다. 다른 점은 확률을 매기는 범위입니다. Rollout은 top-p로 추린 후보 안에서 확률을 매기고, Training은 어휘 전체를 놓고 매깁니다.',
    'engines/differ':
      'Rollout이 적어 둔 확률을 μ, Training이 계산한 확률을 π라고 적습니다. 가중치가 같으면 두 값도 같을 것 같지만, 실제로는 세 군데에서 갈립니다. 첫째는 Expert의 가중치를 적는 형식이고, 둘째는 Router가 고르는 Expert이고, 셋째는 확률을 매기는 후보의 범위입니다. 비율 r 장면에서는 두 확률이 달라지는 첫째 이유로 사본이 몇 버전 뒤처지는 것을 들었고, 둘째 이유로 엔진을 들었습니다. 이 장면부터 세 장면이 그 둘째 이유입니다.',
    'engines/weights':
      'Rollout은 Expert의 가중치를 MXFP4라는 형식으로 돌립니다 (§6.4). MXFP4는 값 하나를 4비트 부동소수점으로 적고, 이웃한 값 여러 개가 한 블록을 이뤄 배율 하나를 함께 쓰는 형식입니다. 이 정의는 논문에 없고, 형식 자체의 일반적인 설명입니다. 반면 Training은 FP32로 적은 원본 가중치를 들고 있습니다. 논문은 RL을 시작할 때 SFT 체크포인트의 FP32 master weights를 그대로 이어받는다고 적습니다 (§5.1). 이대로 두면 두 엔진의 Expert가 서로 다른 숫자가 됩니다. 그래서 가중치를 고칠 때마다 Training 쪽 Expert에 quantize–dequantize를 적용합니다. 줄여서 QDQ라고 부르고, 4비트 형식으로 내렸다가 다시 올려서 4비트로 적을 수 있는 값만 남기는 일입니다. 이 양자화는 Rollout이 쓰는 MXFP4 Humming GEMM kernel의 수치 제약을 그대로 따릅니다. 그래서 두 엔진이 똑같은 Expert 가중치를 봅니다 (§6.4).',
    'engines/route':
      '가중치가 같아도 엔진이 다르면 계산 결과의 끝자리가 조금씩 달라집니다. 대부분의 계산에서는 무시할 만한 차이입니다. 그런데 Router는 점수가 높은 Expert 몇 개를 골라내는 자리라서, 점수가 아주 조금만 달라져도 다른 Expert가 뽑힐 수 있습니다. 논문은 이것을, 가중치가 같아도 수치 차이가 Expert 선택을 뒤집을 수 있다고 적습니다 (§6.4). 그래서 Rollout이 고른 Expert 번호를 적어 두었다가 Training에서 그대로 다시 씁니다. 이 방법의 이름이 Rollout Routing Replay, 줄여서 R3이고, 바로 다음 장면에서 따로 봅니다.',
    'engines/nucleus':
      '셋째는 토큰을 뽑는 방식입니다. Rollout은 뽑기 전에 top-p로 확률이 낮은 후보를 버리고, 남은 후보 안에서 확률을 다시 맞춥니다. Training이 어휘 전체를 놓고 확률을 계산하면, 같은 토큰의 확률이 Rollout이 적어 둔 값과 달라집니다. 그래서 Rollout이 토큰마다 남긴 후보 집합을 적어 두고, Training도 그 집합 안에서 확률을 맞춥니다 (§6.4). 두 장면 뒤에서 숫자로 봅니다. 논문은 R3과 후보 집합을 다시 쓰는 일 모두 부담이 무시할 만하다고 적습니다. 기록이 작고, 주된 계산 경로를 막지 않고 옮겨지기 때문입니다 (§6.4).',

    // ── 33 · R3 ─────────────────────────────────────────────────────────────
    r3: `Rollout Routing Replay, 줄여서 R3을 보는 장면입니다. MiMo-V2.6 논문은 이 방법을 한 문장으로 적고 Ma 외 2025를 인용합니다 (§6.4). 그래서 그 원 논문의 내용으로 설명하고, 이 노트에서는 R3 논문이라고 부릅니다. 왼쪽과 가운데 그래프는 토큰 하나를 놓고 Router가 Expert ${EXPERTS.length}개에 매긴 점수입니다. 점수와 Expert 수, 그리고 ${TOP_K}개를 고른다는 것은 모두 예시입니다. 실제 Pro는 토큰마다 Expert ${FIG11_TEXT.experts}개 가운데 ${FIG11_TEXT.active}개를 고릅니다 (표 1). 오른쪽 그래프의 세 값은 R3 논문이 잰 값입니다.`,
    'r3/pick': `MoE 층에서는 Router가 토큰마다 Expert 전체에 점수를 매기고, 점수가 높은 몇 개만 계산에 씁니다. 예시에서는 ${EXPERTS.length}개 가운데 ${TOP_K}개입니다. 왼쪽은 Rollout 엔진이 풀이를 쓸 때 매긴 점수이고, ${first}번과 ${second}번이 뽑혔습니다. 뽑힌 Expert들의 출력은 그 점수에 softmax를 씌운 비율로 섞입니다 (R3 논문 §4.1). 짚어 둘 점은 이 선택에 중간이 없다는 것입니다. 순위가 바뀌는 순간 전혀 다른 Expert가 계산을 맡고, 그 층의 출력이 크게 달라집니다. Expert를 고르는 단계가 없는 dense 모델에는 이런 일이 없습니다 (R3 논문 §3.2).`,
    'r3/flip': `같은 토큰을 Training 엔진에 넣어 점수를 다시 매깁니다. 가중치는 같지만 엔진이 달라서 점수가 끝자리에서 조금 다릅니다. 예시에서는 ${lost}번이 ${fmtScore(S_ROLLOUT[LOST]!)}에서 ${fmtScore(S_TRAIN[LOST]!)}로, ${gained}번이 ${fmtScore(S_ROLLOUT[GAINED]!)}에서 ${fmtScore(S_TRAIN[GAINED]!)}로 바뀌었습니다. 둘의 차이는 ${margin}뿐인데 순서가 뒤집혀서, Training은 ${lost}번 대신 ${gained}번을 고릅니다. 그러면 Training이 계산한 이 토큰의 확률은 Rollout이 적어 둔 확률과 다른 Expert에서 나온 값이 됩니다. R3 논문은 Qwen3-30B-A3B로 이 차이를 쟀습니다. 수학 문제 ${R.problems.toLocaleString('en-US')}개의 풀이를 SGLang으로 쓰고 같은 토큰을 Megatron에 넣었습니다. 그랬더니 Router의 약 ${R.routerDiffPct}%가 다른 Expert를 골랐고, 토큰의 ${R.tokenDiffPct}%가 적어도 한 층에서 다른 Expert를 골랐습니다. 풀이 하나 안에서 평균을 내면 토큰마다 약 ${R.routersPerToken}개의 Router에서 선택이 달랐습니다 (R3 논문 §3.2). 같은 Megatron에서 두 번 계산해도 확률이 조금 달랐다는 점도 함께 적혀 있습니다 (R3 논문 §3.3).`,
    'r3/replay': `R3은 Rollout이 토큰마다, 층마다 고른 Expert 번호를 적어 두었다가 Training에서 그대로 다시 씁니다. 가운데 그래프에서 Training이 쓰는 Expert가 Rollout과 같은 ${first}번과 ${second}번으로 돌아옵니다. 짚어 둘 점은 다시 쓰는 것이 번호뿐이라는 것입니다. 뽑힌 Expert들을 섞는 비율은 Training이 직접 매긴 점수로 계산합니다. 그래서 막대의 높이는 그대로이고, 기울기도 Router의 점수까지 흐릅니다 (R3 논문 §4.1, 식 8). 다만 MiMo-V2.6은 RL 동안 Router를 얼려 두므로 Router가 실제로 바뀌지는 않습니다 (§5.1, §5.4). DeepSeek-V3.2 논문은 같은 방법을 Keep Routing이라고 부르고, DeepSeek-V3-0324부터 써 왔다고 적습니다 (DeepSeek-V3.2 §3.1). MiMo도 앞 세대인 MiMo-V2-Flash부터 R3을 썼습니다 (MiMo-V2-Flash §4.6.1).`,
    'r3/effect': `오른쪽은 R3 논문이 잰 두 엔진의 차이입니다. 값은 KL divergence입니다. 두 엔진이 같은 토큰에 준 확률이 얼마나 다른지를 재는 값이고, 0이면 완전히 같습니다. 그래프에는 천분의 일 단위로 적었습니다. MoE 모델은 ${fmtKl(KL_MOE)}였는데 R3을 켜면 ${fmtKl(KL_R3)}로 줄었습니다. dense 모델인 Qwen3-8B가 ${fmtKl(KL_DENSE)}이므로, MoE라서 더 벌어졌던 차이가 거의 사라진 것입니다 (R3 논문 §3.1, §4.3). 두 엔진의 확률이 크게 다른 토큰의 수도 약 10분의 1로 줄었습니다. 비용도 작습니다. R3 논문은 번호를 기록하느라 Rollout이 느려지는 정도가 ${R.overheadPct}% 아래라고 적습니다. 기록한 번호는 KV cache와 함께 보관하므로, 여러 턴짜리 풀이에서 번호를 얻으려고 앞부분을 다시 계산하지 않습니다 (R3 논문 §4.1, §4.2). MiMo-V2.6도 번호 기록을 Context Cache에 함께 싣고, 중간 턴마다 돌려주지 않고 풀이를 거둘 때 한 번에 돌려줍니다 (§6.4).`,

    // ── 34 · top-p 후보 ─────────────────────────────────────────────────────
    topp: `Rollout이 토큰을 뽑을 때 쓴 후보 집합을 Training에서 다시 쓰는 이유를 숫자로 보는 장면입니다. MiMo-V2.6 논문은 이것을 짧게 적고 DeepSeek-V3.2와 MAI-Thinking-1을 인용합니다 (§4.1, §6.4). 그래서 두 논문의 설명을 가져옵니다. 막대는 log π 장면과 같은 자리, 곧 return a 다음에 올 토큰의 후보이고, 확률은 모두 예시입니다. 다섯째 막대는 나머지 어휘 전체를 하나로 묶은 것입니다. top-p 값 ${TOP_P}은 논문이 흔히 쓰는 값으로 든 숫자입니다 (§6.4).`,
    'topp/dist': `모델은 자리마다 어휘 전체에 확률을 매깁니다. 예시에서는 ${chosen}가 ${pFull}로 가장 높고, 나머지 어휘를 모두 합친 것이 ${tail}입니다. 이 꼬리에는 이 자리에 어울리지 않는 토큰이 수만 개 들어 있습니다. 하나하나의 확률은 아주 낮지만, 이대로 뽑으면 가끔은 이런 토큰이 걸립니다.`,
    'topp/cut': `top-p는 뽑기 전에 후보를 추리는 방법입니다. 확률이 높은 후보부터 차례로 더해 가다가, 합이 p에 닿으면 거기까지만 남기고 나머지는 버립니다. 예시에서 p는 ${TOP_P}입니다. 셋째 후보까지 더하면 ${fmtProb(P_FULL.slice(0, SET.length - 1).reduce((a, b) => a + b, 0))}이라 모자라고, 넷째까지 더하면 ${mass}이 되어 거기서 끊깁니다. 이렇게 남은 후보의 묶음을 후보 집합이라고 부르겠습니다. 논문의 말로는 candidate set이고, nucleus라고도 합니다. DeepSeek-V3.2 논문은 RL에서도 이렇게 자르는 것이 이롭다고 적습니다. 확률이 극히 낮은 토큰이 뽑혀서 학습의 대상이 되는 일을 피할 수 있기 때문입니다 (DeepSeek-V3.2 §3.1).`,
    'topp/renorm': `꼬리를 버리면 남은 확률의 합이 1이 되지 않습니다. 그래서 남은 후보의 확률을 그 합으로 나눠서 다시 1이 되게 맞춘 다음에 뽑습니다. ${chosen}는 ${pFull}을 ${mass}로 나눈 ${mu}가 됩니다. Rollout이 이 토큰을 실제로 뽑은 확률이 바로 이 ${mu}이고, 식에서는 μ입니다. 논문도 top-k와 top-p가 어휘 전체가 아니라 좁힌 후보 집합 위에서 확률을 다시 정규화한다고 적습니다 (§6.4).`,
    'topp/mismatch': `이제 Training이 같은 토큰의 확률을 계산합니다. 가중치가 완전히 같다고 하겠습니다. Training이 어휘 전체를 놓고 계산하면 ${chosen}의 확률은 ${pFull}입니다. 그러면 비율 r은 ${pFull}을 ${mu}로 나눈 ${fmtProb(R_MISMATCH)}이 됩니다. 남은 후보의 합과 같은 값입니다. 모델이 하나도 바뀌지 않았는데 r이 1이 아닙니다. DeepSeek-V3.2 논문은 이것을, 자르기가 풀이를 쓴 모델과 지금 모델의 행동 공간을 어긋나게 해서 importance sampling의 전제를 깨고 학습을 불안정하게 만든다고 적습니다 (DeepSeek-V3.2 §3.1). MAI-Thinking-1 보고서는 더 구체적입니다. 후보 집합 밖 토큰의 logit으로 기울기를 계속 흘렸더니 몇 스텝 만에 학습이 발산했다고 적습니다 (MAI-Thinking-1 §3.1.3). 여기서부터는 해석입니다. 토큰 하나에서는 ${offPct}%이지만, 이 오차는 모든 토큰에서 r을 1보다 작게 만드는 한 방향으로만 생깁니다. 그리고 꼬리를 넣은 채로 학습하면 Rollout에서는 절대 뽑히지 않는 꼬리 토큰의 확률까지 기울기가 올리고 내립니다. 그 토큰들은 뽑히지 않으므로 점수로 바로잡힐 기회도 없습니다.`,
    'topp/replay': `그래서 Rollout이 토큰마다 후보 집합을 적어 두고, Training은 그 집합 안에서만 확률을 맞춥니다 (§6.4). MAI-Thinking-1의 구현으로는, 집합 밖 토큰의 logit을 softmax 전에 음의 무한대로 바꿉니다 (MAI-Thinking-1 §3.1.3). DeepSeek-V3.2는 이것을 Keep Sampling Mask라고 부르고, top-p와 함께 쓰면 RL 동안 응답 언어의 일관성이 유지된다고 적습니다 (DeepSeek-V3.2 §3.1). 예시에서는 Training의 확률도 ${mu}가 되어 r이 1로 돌아옵니다. 이제 r이 1에서 벗어난다면 그것은 모델이 바뀌었기 때문입니다. 구현에서 걸리는 것은 기록의 크기입니다. MiMo는 GPU에서 CPU로 넘길 때만 어휘 전체 폭의 비트맵을 고정된 크기로 보내고, 그 뒤로는 집합에 든 토큰만 다룹니다. p가 ${TOP_P}일 때 후보 집합에는 평균 다섯 개가 안 되는 토큰이 들어 있기 때문입니다 (§6.4). MAI-Thinking-1도 같은 ${TOP_P}을 쓰고, p를 키우면 탐색은 넓어지지만 마스크를 옮기는 부담이 커진다고 적습니다 (MAI-Thinking-1 §3.1.5).`,
  },
};
