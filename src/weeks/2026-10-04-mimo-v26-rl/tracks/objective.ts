import { rlStepScene } from '../scenes/04-rl-step';
import { logprobScene } from '../scenes/05-logprob';
import { groupAdvantageScene } from '../scenes/06-group-advantage';
import { sumToZeroScene } from '../scenes/07-sum-to-zero';
import { objectiveScene } from '../scenes/08-objective';
import { B_PASS, G, R_A, R_B, failGap, mean, passCount, passGap, signed } from '../data/objective-groups';
import { CHOSEN, P, P_DOWN, P_UP, TOKENS, prob } from '../data/objective-logprob';
import { RL_SCALE, SEQUENCES_PER_STEP, eok, man, manCheon } from '../data/objective-rl-scale';
import type { WeekTrack } from './types';

// numbers the notes read out, taken from the same data files the scenes draw
const S = RL_SCALE;
const token = TOKENS[CHOSEN]!;
const p0 = prob(P[CHOSEN]!);
const pUp = prob(P_UP[CHOSEN]!);
const pDown = prob(P_DOWN[CHOSEN]!);
const prompts = S.prompts.toLocaleString('en-US');

/**
 * RL 한 스텝과 Eq. 1 (§4.1, §5.1): the loop, log π, the group-relative gap, Eq. 1 assembled.
 * Notes are keyed by the root-diagram node id ('step') and '<nodeId>/<stepId>' — one per beat.
 *
 * Vocabulary set here and kept for the rest of the week: 풀이 한 번 (the paper's
 * rollout / trajectory), 점수 (reward), 평균과의 차이 (advantage). Each paper word
 * is named once, in the note that introduces it. Rollout, Grader and Training
 * are the three stages and keep their English names.
 */
export const objectiveTrack: WeekTrack = {
  scenes: [rlStepScene, logprobScene, groupAdvantageScene, sumToZeroScene, objectiveScene],
  details: {
    step: { kind: 'scene', scene: rlStepScene },
    logprob: { kind: 'scene', scene: logprobScene },
    advantage: { kind: 'scene', scene: groupAdvantageScene },
    zero: { kind: 'scene', scene: sumToZeroScene },
    loss: { kind: 'scene', scene: objectiveScene },
  },
  notes: {
    // ── 04 · RL 한 스텝 ─────────────────────────────────────────────────────
    step: `RL 한 스텝을 고리 하나로 따라가는 장면입니다. 같은 과제를 여러 번 풀게 하고, 채점하고, 모델을 고친 다음, 고친 모델로 다시 풉니다. 여기서 풀이와 점수라는 말, 그리고 Rollout, Grader, Training이라는 세 단계의 이름을 정해 두고 뒤의 장면들은 이 말을 그대로 씁니다. 논문도 RL의 계산을 rollout, grading, training 세 부분으로 나눕니다 (§4.1). 화면에 나오는 숫자는 모두 논문 값입니다.`,
    'step/rollout': `과제 하나를 꺼내서 모델에게 ${S.G}번 풀게 합니다. 논문은 이 풀이 한 번을 rollout 또는 trajectory라고 부르고, ${S.G}을 그룹 크기 G라고 부릅니다 (§4.1). 풀이 한 번에는 모델이 쓴 글뿐 아니라 도구 호출과 그 결과가 모두 들어가서, 길이가 ${man(S.tokensPerSequence[0])}에서 ${man(S.tokensPerSequence[1])} 토큰쯤 됩니다. 그리고 풀이를 쓰는 쪽은 Training이 고치고 있는 모델 그 자체가 아니라 Rollout 쪽에 올려 둔 사본입니다. 이 사본이 조금 옛것일 수 있다는 점은 비율 r 장면에서 다시 봅니다.`,
    'step/grade':
      'Grader가 풀이마다 점수를 하나씩 매깁니다. 논문의 말로는 reward입니다. 기본은 테스트라서 통과하면 1점, 실패하면 0점입니다. 그런데 MiMo는 이 채점에 계산을 많이 씁니다 (§4.3). 통과한 풀이끼리도 품질을 가려내는 GRS와 GAR가 그것이고, 넷째 줄에서 따로 봅니다.',
    'step/train':
      'Training은 점수가 높은 풀이에 들어 있던 토큰은 더 자주 나오고, 점수가 낮은 풀이의 토큰은 덜 나오도록 모델의 가중치를 고칩니다. RL 논문에서는 이 모델을 policy라고 부릅니다. 앞의 글을 보고 다음 토큰을 고르는 규칙이라는 뜻입니다. 더 자주 나오게 한다는 말을 식으로 쓴 것이 Eq. 1이고, 이 줄의 나머지 장면에서 한 항씩 만들어 갑니다.',
    'step/loop': `고친 가중치를 Rollout 쪽으로 보내고 같은 일을 되풀이합니다. 논문은 이 고리를 ${S.steps}번 돌렸습니다 (그림 1, 그림 12). 실제로는 한 바퀴가 끝나기를 기다렸다가 다음 바퀴를 시작하지 않습니다. Rollout과 Training이 동시에 돌고, 길어서 아직 끝나지 않은 풀이는 멈춰 두었다가 다음 바퀴에서 이어서 씁니다. 논문은 이 방식을 asynchronous partial rollout이라고 부르고, Rollout 쪽 사본이 최대 4 버전까지 뒤처지는 것을 허용합니다 (§4.1, §5.1).`,
    'step/scale': `규모를 숫자로 봅니다. 한 바퀴에 과제 ${prompts}개를 ${S.G}번씩 풀어서 풀이가 약 ${manCheon(SEQUENCES_PER_STEP)} 개이고, 학습에 들어가는 토큰은 ${eok(S.tokens[0])}에서 ${eok(S.tokens[1])} 개입니다 (§4.1). ${S.steps}바퀴에 Pro는 260만 달러, Flash는 90만 달러를 썼습니다. 그 사이 DeepSWE v1.1 점수는 Pro가 58.4에서 72.6으로, Flash가 48.7에서 65.7로 올랐습니다. 비용은 Pro 기준으로 Rollout 43.8%, Training 43.5%, Grader 12.7%로 나뉘고, Flash는 44.9%, 40.9%, 14.2%입니다 (그림 3). 채점에만 전체의 8분의 1쯤을 쓴다는 점을 짚어 둡니다.`,

    // ── 05 · log π ──────────────────────────────────────────────────────────
    logprob:
      '학습이 실제로 움직일 수 있는 것이 무엇인지 보는 장면입니다. 모델은 자리마다 다음 토큰 후보 전체에 확률을 매기고, RL은 그중 실제로 쓴 토큰 하나의 확률을 올리거나 내립니다. Eq. 1의 맨 끝에 있는 log π가 이 값입니다 (§4.1). 화면의 후보 다섯 개와 확률은 모두 예시이고, 막대의 값은 코드로 계산했습니다.',
    'logprob/dist':
      '모델이 코드를 쓰다가 return a까지 썼다고 합시다. 다음 자리에 올 수 있는 토큰마다 모델은 확률을 하나씩 매깁니다. 화면에는 후보를 다섯 개만 그렸지만, 실제로는 수만 개인 어휘 전체에 확률이 나뉩니다. 막대를 모두 더하면 1입니다. 이 확률은 예시입니다.',
    'logprob/chosen': `모델이 이 자리에서 실제로 쓴 토큰은 ${token}였고, 그때 ${token}에 매긴 확률이 ${p0}였습니다. 식을 읽어 보면 π_θ는 가중치가 θ인 모델이 매기는 확률이고, o_t는 실제로 쓴 토큰입니다. 세로선 뒤는 조건입니다. q는 과제의 지시문이고, o_<t는 그 자리 전까지 쓴 모든 토큰입니다. 그러니 이 식은 지시문과 지금까지 쓴 글을 보았을 때 이 토큰을 쓸 확률입니다. 가중치 θ를 고치면 이 확률이 바뀝니다.`,
    'logprob/up': `이 풀이가 좋은 풀이였다면 학습은 ${token}의 확률을 올립니다. 예시에서는 ${p0}가 ${pUp}가 됩니다. 확률의 합은 1이어야 하므로 나머지 후보는 그만큼 줄어듭니다. 식에서 확률에 log를 씌운 까닭은, 학습이 따라가는 기울기가 이 log 확률의 기울기이기 때문입니다. log 확률에 무게를 곱해서 키우는 이 형태는 policy gradient의 표준 형태이고, MiMo가 새로 만든 것이 아닙니다. ${pUp}는 logit을 한 번 움직였다고 가정하고 계산한 예시 값입니다.`,
    'logprob/down': `반대로 나쁜 풀이였다면 같은 토큰의 확률을 내립니다. 예시에서는 처음의 ${p0}에서 ${pDown}로 내려가고, 그 몫은 나머지 후보가 나눠 갖습니다. 그러면 질문이 두 가지 남습니다. 어떤 풀이가 좋은 풀이인지, 그리고 얼마나 세게 올리고 내릴지입니다. 그 답이 다음 장면의 평균과의 차이입니다.`,

    // ── 06 · 평균과의 차이 ───────────────────────────────────────────────────
    advantage: `같은 과제를 ${G}번 풀게 한 다음, 풀이 하나하나를 그 그룹의 평균과 비교하는 장면입니다. 논문의 말로는 group-relative advantage이고, 정의는 A_i = R_i − R̄ 하나뿐입니다 (§4.3.2). 세 그룹은 모두 예시이고, 화면의 숫자는 0과 1인 점수에서 코드로 계산했습니다. 그룹 크기 ${G}과 한 바퀴의 과제 ${prompts}개는 논문의 실제 설정입니다 (§4.1).`,
    'advantage/group': `막대 하나가 풀이 한 번입니다. 테스트를 통과하면 1점, 실패하면 0점을 받습니다. 이 과제는 ${G}번 중 ${passCount(R_A)}번을 통과했습니다. 어느 풀이가 통과했는지는 예시입니다.`,
    'advantage/mean': `${G}개의 점수를 평균 내면 ${mean(R_A)}입니다. 이 값은 모델이 이 과제에서 평소에 받는 점수라고 볼 수 있습니다. 그래서 이 점선이 다음 비교의 기준선이 됩니다. 논문이 쓰는 GRPO는 풀이가 얼마나 좋을지 예측하는 모델을 따로 학습하지 않고, 이렇게 그룹의 평균을 기준선으로 삼습니다 (§5.1).`,
    'advantage/gap': `모든 막대에서 평균을 뺍니다. 그러면 기준선이 0으로 내려가고, 통과한 풀이는 ${signed(passGap(R_A))}, 실패한 풀이는 ${signed(failGap(R_A))}가 됩니다. 이 값이 평균과의 차이입니다. 논문은 advantage라고 부르고 A로 적습니다. 0보다 위에 있는 풀이의 토큰은 더 자주 나오게, 아래에 있는 풀이의 토큰은 덜 나오게 학습합니다. GRPO를 처음 제안한 논문은 이 값을 그룹의 표준편차로 한 번 더 나누는데, MiMo의 식에는 그 나눗셈이 없습니다 (§4.3.2).`,
    'advantage/rare': `더 어려운 과제로 바꿨습니다. 이것도 예시입니다. ${G}번 중 ${B_PASS.length}번만 통과해서 평균이 ${mean(R_B)}로 낮습니다. 그래서 성공한 풀이는 ${signed(passGap(R_B))}로 크게 올라가고, 흔한 실패는 ${signed(failGap(R_B))}로 조금만 내려갑니다. 같은 성공이라도 드물수록 더 세게 밀어 준다는 뜻입니다.`,
    'advantage/flat': `이번에는 ${G}번 모두 통과한 쉬운 과제입니다. 평균이 1이라서 차이가 전부 0이고, 이 그룹은 모델을 조금도 움직이지 못합니다. 모두 실패한 그룹도 마찬가지입니다. 그래서 논문은 dynamic sampler로 이런 그룹을 학습 배치에서 미리 걸러 냅니다 (§4.1). 그런데 과제가 쉬워질수록 이렇게 버려지는 그룹이 늘어납니다. 통과한 풀이끼리도 품질을 점수로 가려서 이런 그룹을 되살리는 방법이 넷째 줄의 GRS입니다.`,

    // ── 07 · 차이의 합은 0 ───────────────────────────────────────────────────
    zero: '한 그룹 안에서 평균과의 차이를 모두 더하면 항상 0이 된다는 것을 한 줄씩 보이는 장면입니다. 논문에 따로 적혀 있는 식은 아니고, A_i = R_i − R̄이라는 정의에서 바로 나오는 성질입니다. 뒤에서 볼 GAR와 토큰 감점이 왜 합을 지키려고 하는지 이해하려면 이 성질이 필요합니다.',
    'zero/sum': `차이의 정의는 점수에서 평균을 뺀 값입니다. 이 차이를 한 그룹의 ${G}개에 대해 모두 더해 봅니다.`,
    'zero/split': `합을 둘로 나눕니다. 앞쪽은 점수의 합입니다. 뒤쪽은 같은 평균을 ${G}번 뺀 것이므로 평균의 ${G}배입니다.`,
    'zero/swap': `평균은 점수의 합을 ${G}으로 나눈 값입니다. 그래서 점수의 합은 평균의 ${G}배와 같습니다. 앞쪽을 그렇게 바꿔 씁니다.`,
    'zero/zero':
      '같은 것끼리 빼니 0이 남습니다. 한 그룹 안에서는 올라가는 풀이가 있으면 반드시 그만큼 내려가는 풀이가 있다는 뜻입니다. 위로 미는 양을 모두 더한 값과 아래로 미는 양을 모두 더한 값이 늘 같습니다. 뒤에서 볼 GAR의 배율 λ와 토큰 감점의 α, β는 차이를 손본 뒤에도 이 균형이 깨지지 않게 하려는 장치입니다 (§4.3.2, §4.3.3).',

    // ── 08 · Eq. 1 ──────────────────────────────────────────────────────────
    loss: 'Eq. 1(§4.1)을 토큰 하나의 log 확률에서 시작해 한 항씩 붙여 가며 만드는 장면입니다. 화면의 식은 폭 때문에 세 가지를 줄였습니다. 첫째는 합의 범위입니다. i는 1부터 G까지이고, t는 1부터 그 풀이의 길이까지입니다. 둘째는 π의 조건인 지시문 q와 앞에 쓴 토큰들이고, 셋째는 𝔼의 아래첨자입니다. 그 밖에는 논문의 식 그대로입니다.',
    'loss/weight':
      '처음부터 화면에 있던 것은 앞 장면에서 본 log 확률입니다. i번째 풀이의 t번째 토큰을 모델이 쓸 확률에 log를 씌운 값입니다. 여기에 그 풀이의 평균과의 차이 A를 곱합니다. A가 양수이면 이 토큰의 확률을 올리는 쪽으로, 음수이면 내리는 쪽으로 밀고, A가 클수록 세게 밉니다. 짚어 둘 점은 A가 풀이 하나에 숫자 하나라는 것입니다. 그래서 한 풀이 안의 모든 토큰이 똑같은 무게를 받습니다.',
    'loss/sum': `이 곱을 한 과제의 풀이 ${S.G}개, 그리고 풀이마다 들어 있는 모든 토큰에 대해 더합니다. i가 풀이의 번호이고 t가 토큰의 자리입니다. 토큰 하나하나가 자기 확률을 올릴지 내릴지 한 표씩 던지고, 그 표를 모두 모은다고 생각하면 됩니다. 그런데 한 풀이의 토큰이 모두 같은 무게를 받으므로, 실패한 풀이 안에서는 멀쩡한 토큰도 문제가 된 토큰과 똑같이 벌을 받습니다. 이 빈틈을 메우는 것이 넷째 줄 끝의 토큰 감점입니다 (§4.3.3).`,
    'loss/correct':
      '토큰마다 두 가지를 더 곱합니다. r은 풀이를 쓴 모델과 지금 고치는 모델이 조금 다르다는 점을 바로잡는 비율이고, 논문의 말로는 importance sampling ratio입니다. M은 그 보정을 믿기 어려운 토큰을 계산에서 빼는 0 또는 1의 값이고, 논문은 token-level mask라고 부릅니다 (§4.1, §5.1). 둘 다 바로 다음 두 장면에서 따로 봅니다. 지금은 A와 달리 토큰마다 값이 다르다는 것만 봐 두면 됩니다.',
    'loss/mean': `앞에 붙은 분수는 그 과제의 풀이 ${S.G}개에 들어 있는 토큰 수를 모두 더한 값으로 나눈다는 뜻입니다. 그러면 과제 하나가 내는 값은 풀이가 길든 짧든 토큰 하나당 평균이 됩니다. 논문은 이것을 prompt-mean aggregation이라고 부릅니다 (§5.1). 왜 이렇게 나누는지는 세 장면 뒤에서 숫자로 봅니다.`,
    'loss/loss': `마지막으로 바깥에 𝔼와 마이너스 부호가 붙습니다. 𝔼는 평균입니다. 논문의 식에서 𝔼의 아래첨자는 무엇에 걸친 평균인지를 적은 것입니다. 모든 과제 데이터셋을 합친 곳에서 과제 q를 하나 뽑고, 그 과제를 Rollout 쪽 사본 μ가 ${S.G}번 풉니다 (§4.1). 마이너스 부호는 방향만 바꿉니다. 원하는 것은 대괄호 안의 값을 키우는 것인데, 학습은 손실을 줄이는 쪽으로 움직이므로 부호를 뒤집어서 줄일 대상 L로 씁니다. 논문은 이 목적함수를 GRPO라고 부릅니다 (§5.1).`,
  },
};
