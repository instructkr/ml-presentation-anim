import { NS_COEFFS, NS_MIMO_STEPS, SIGMA0, SIGMA_FLAT, spread } from '../data/newton-schulz';
import { midtrainScene } from '../scenes/01-midtrain';
import { adamwVsMuonScene } from '../scenes/02-adamw-vs-muon';
import { muownScene } from '../scenes/03-muown';
import type { WeekTrack } from './types';

// numbers the notes read out, taken from the same data file the bars are drawn from
const two = (v: number) => v.toFixed(2);
const minus = (v: number, digits: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const sigma0 = SIGMA0.map(two).join(', ');
const flatLo = two(Math.min(...SIGMA_FLAT));
const flatHi = two(Math.max(...SIGMA_FLAT));
const spread0 = Math.round(spread(SIGMA0));
const spreadFlat = spread(SIGMA_FLAT).toFixed(1);
const coeffs = `${minus(NS_COEFFS.a, 4)}, ${minus(NS_COEFFS.b, 4)}, ${minus(NS_COEFFS.c, 4)}`;

/**
 * RL 전 준비 (§3.2): Mid-training, AdamW → Muon, Muown.
 * Notes are keyed by the root-diagram node id ('midtrain') and '<nodeId>/<stepId>' — one per beat.
 * What comes from the Muon / Muown papers rather than the MiMo report is said so in the note.
 */
export const prepTrack: WeekTrack = {
  scenes: [midtrainScene, adamwVsMuonScene, muownScene],
  details: {
    midtrain: { kind: 'scene', scene: midtrainScene },
    muon: { kind: 'scene', scene: adamwVsMuonScene },
    muown: { kind: 'scene', scene: muownScene },
  },
  notes: {
    // ── 01 · Mid-training ───────────────────────────────────────────────────
    midtrain:
      'RL에 들어가기 전에 Mid-training이 무엇을 준비해 두는지 네 가지로 정리하는 장면입니다. 근거는 §3.2 전체이고, 화면의 256K, 1M, MXFP4는 논문에 나온 그대로입니다. 예시로 만든 숫자는 없습니다. 네 가지 가운데 옵티마이저를 바꾼 이야기는 바로 다음 두 장면에서 자세히 봅니다.',
    'midtrain/bridge':
      '학습 순서는 pre-training, Mid-training, 짧은 SFT, RL입니다. Pre-training은 텍스트와 이미지, 오디오로 넓은 지식을 쌓는 단계이고 AdamW로 학습했습니다 (§3.1). Mid-training은 그 바탕과 대규모 RL 사이를 잇는 단계입니다. 논문은 여기서 하는 일을 agent로 일하는 능력을 더 키우고, 긴 문맥을 다루게 하고, 큰 배치 학습에 맞게 최적화 설정을 바꾸는 것이라고 적습니다 (§3.2).',
    'midtrain/data':
      '첫째는 데이터입니다. 코딩, 일반 업무, 시각 과제, 연구 과제에서 agent가 실제로 일한 기록에, 고품질 텍스트와 저장소 단위의 코드, 이미지와 영상, 오디오를 섞었습니다 (§3.2). 논문은 이 단계가 agent 과제의 탐색 공간을 넓혀서, 뒤의 RL에서 모델이 더 좋은 풀이를 찾아내게 한다고 설명합니다 (§1). 하나가 더 들어갑니다. 초기 실험에서 점수만 따는 꼼수, 곧 reward hacking이 보였고, 그래서 잘못된 추론을 스스로 돌아보고 고치는 예제를 만들어 이 데이터에 넣었습니다 (§4.2.6).',
    'midtrain/context':
      '둘째는 문맥 길이입니다. Mid-training은 두 단계로 진행합니다. 먼저 256K 문맥으로 학습하면서 계산의 대부분을 여기에 쓰고, 마지막 단계에서 문맥을 1M까지 늘립니다 (§3.2). RL은 문맥 길이 1M까지 쓰는 풀이를 다루므로 (초록) 그 준비라고 볼 수 있습니다.',
    'midtrain/optimizer':
      '셋째는 옵티마이저, 곧 기울기를 받아 가중치를 얼마나 움직일지 정하는 규칙입니다. 예비 실험에서 여러 과제를 섞은 RL의 배치를 키울수록 AdamW의 최적화 효율이 떨어졌고, 그래서 은닉 가중치 행렬의 옵티마이저를 Muon의 변형인 Muown으로 바꿉니다. 임베딩과 LM head, MoE Router는 AdamW에 그대로 둡니다 (§3.2). Adam으로 학습한 모델을 Muon으로 이어 학습하면 성능이 떨어질 수 있다는 선행 연구(Qu 외, 2026)가 있지만, MiMo는 Mid-training 내내 loss가 튀지 않았다고만 적고 그 이유는 분석하지 않습니다. Muon과 Muown이 무엇인지는 다음 두 장면에서 봅니다.',
    'midtrain/qat':
      '넷째는 MXFP4 QAT입니다. MXFP4는 숫자 하나를 4비트로 적는 저정밀 형식이고, QAT는 양자화를 염두에 둔 학습입니다. 순전파에서 4비트 계산을 흉내 내면서 학습해서, 저정밀로 계산해도 품질이 유지되도록 모델을 미리 적응시킵니다 (§3.2). RL에서 풀이를 쓸 때 Expert를 MXFP4로 계산하므로 (§6.4), 그 전에 익숙해지게 하는 것으로 읽을 수 있습니다.',

    // ── 02 · AdamW → Muon ───────────────────────────────────────────────────
    muon: `MiMo가 RL 전에 AdamW를 떠난 이유를, 옵티마이저가 만드는 업데이트의 모양으로 설명하는 장면입니다. MiMo 논문의 근거는 §3.2의 한 문단입니다. 막대는 예시로 만든 5×5 행렬의 특이값이고, 화면의 값은 모두 코드로 계산했습니다. 업데이트가 몇 방향에 쏠린다는 설명과 Newton–Schulz 계수는 MiMo가 아니라 Muon 논문(Jordan 외, 2024)에서 가져왔습니다.`,
    'muon/lopsided': `M은 지난 기울기들을 이동평균으로 섞어 둔 행렬이고, 옵티마이저는 이것을 가중치의 업데이트로 바꿉니다. 어떤 행렬이든 입력을 회전하고, 방향마다 늘리고, 다시 회전하는 세 단계로 쓸 수 있습니다. 이것이 M = UΣVᵀ이고, 가운데 Σ에 든 방향별 배율을 특이값이라고 합니다. 막대 다섯 개가 그 값입니다. 예시 행렬은 특이값이 ${sigma0}가 되도록 코드로 만들었습니다.`,
    'muon/dominate': `가장 센 방향이 가장 약한 방향의 ${spread0}배입니다. Muon 논문은 Transformer에서 SGD 모멘텀이나 Adam이 만드는 업데이트가 실제로 이렇게 몇 방향이 지배하는, 거의 저랭크인 행렬이라고 설명합니다. 그러면 드물게 나타나는 방향은 거의 배우지 못합니다. AdamW는 칸마다 기울기의 평균을 기울기 제곱 평균의 제곱근으로 나눠 보폭을 맞추는데, 이 계산은 칸마다 따로 일어나서 행렬 전체의 이런 모양은 보지 못합니다. 이 설명은 MiMo 논문이 아니라 Muon 쪽 자료에서 온 것입니다.`,
    'muon/flatten': `Muon은 Σ를 버리고 UVᵀ만 업데이트로 씁니다. 방향은 그대로 두고 세기만 모두 1로 맞추는 것이고, 이것을 직교화라고 부릅니다. 실제로는 Newton–Schulz 반복으로 근사합니다. 행렬 X에 aX + b(XXᵀ)X + c(XXᵀ)²X를 반복해서 적용하는 방식이고, 계수 ${coeffs}는 Muon의 기본값입니다. MiMo의 RL은 이 반복을 ${NS_MIMO_STEPS}번 돌립니다 (§5.1). 막대는 예시 값에 ${NS_MIMO_STEPS}번 적용한 결과입니다. 정확히 1이 되지는 않고 ${flatLo}에서 ${flatHi} 사이에 놓이지만, 가장 센 방향과 가장 약한 방향의 차이는 ${spread0}배에서 ${spreadFlat}배로 줄었습니다.`,
    'muon/batch':
      '임계 배치 크기부터 정의합니다. 배치를 두 배로 키우면 보통 필요한 스텝 수가 거의 절반으로 줄어드는데, 어느 크기를 넘으면 그 이득이 사라집니다. 그 경계가 임계 배치 크기입니다. 논문은 행렬 단위의 업데이트가 이 경계를 넘어서도 데이터 효율을 더 잘 지킨다는 선행 연구(Liu 외 2025b, Shah 외 2025)를 인용하고, 그래서 Muon이 큰 배치 학습에 잘 맞는다고 적습니다 (§3.2). MiMo의 RL 한 스텝은 과제 1,568개를 16번씩 풀어 약 2만 5천 개의 풀이, 27억에서 37억 토큰을 씁니다 (§4.1). 스텝은 30개뿐이지만 스텝 하나가 아주 큰 배치라서, RL에 앞서 옵티마이저를 바꿔 둔 것입니다.',

    // ── 03 · Muown ──────────────────────────────────────────────────────────
    muown:
      'Muown이 Muon에 무엇을 더하는지 보는 장면입니다. MiMo 논문은 Muown을 한 문장으로만 소개합니다. 행 노름을 명시적으로 제어해서 spectral norm이 서서히 커지는 것을 줄이고, weight decay에 덜 민감하며, 추가 비용은 무시할 만하다는 내용입니다 (§3.2). 그래서 이 장면의 메커니즘 설명은 Muown 논문(Lion 외, 2026, arXiv 2605.10797)을 따릅니다. 화면에 예시 숫자는 없습니다.',
    'muown/split':
      'Muown은 가중치 W를 그대로 들고 있지 않고, 행마다 길이 g와 방향 R을 옵티마이저 안의 두 변수로 따로 저장합니다. 식을 읽으면, R의 각 행을 그 행의 길이로 나눠 길이를 1로 맞춘 다음 g를 곱해서 W를 다시 만든다는 뜻입니다. 모델이 순전파에서 보는 W는 똑같고, 바뀌는 것은 옵티마이저가 무엇을 변수로 삼느냐뿐입니다. 여기서 R은 Muown 논문의 기호이고, 뒤에 나올 점수 R과는 다른 것입니다.',
    'muown/direction':
      '방향 R은 앞 장면의 Muon이 고칩니다. R의 행은 길이가 1로 고정돼 있지 않습니다. Muon의 업데이트와 weight decay가 R을 계속 움직이기 때문이고, 그래서 Muown은 R의 행 길이를 따로 기억해 두었다가 순전파에서 그 값으로 나눕니다. weight decay는 R에만 겁니다. R은 어차피 길이 1로 맞춰서 쓰므로 R을 줄여도 W의 행 길이는 그대로이고, weight decay에 덜 민감하다는 성질이 여기서 나옵니다. 이 연결은 Muown 논문의 설명을 요약한 것입니다.',
    'muown/length':
      '행 길이 g는 행마다 숫자 하나뿐이라 행렬 연산이 필요 없고, Adam이 맡습니다. Adam은 값 하나를 한 스텝에 대략 학습률만큼만 움직입니다. 그래서 행 길이가 한 번에 크게 튈 수 없습니다. Muown이 Muon보다 더 저장하는 것은 행 개수만큼 긴 벡터 네 개, 곧 g와 R의 행 길이, 그리고 g에 대한 Adam의 이동평균 두 개뿐이라서 비용은 무시할 만합니다.',
    'muown/stable':
      'spectral norm은 행렬이 입력을 늘릴 수 있는 최대 배율, 곧 가장 큰 특이값입니다. Muown 논문은 Muon으로 오래 학습하면 이 값이 서서히 커지고, 학습 중에 크게 흔들리는 쪽이 행 길이라고 분석합니다. 그래서 행 길이를 Adam으로 따로 잡으면 가중치의 크기가 안정됩니다. MiMo의 RL도 Muown을 그대로 씁니다 (§5.1). 학습률은 3×10⁻⁶이고, weight decay와 warmup은 쓰지 않으며, gradient clipping 임계값은 1.0입니다. Muon 부분은 모멘텀 0.95에 Nesterov를 켜고, Newton–Schulz를 10번 돌린 뒤 업데이트에 0.5를 한 번 더 곱합니다. Adam 부분은 β₁ = β₂ = 0.95, ε = 10⁻⁸인데, 이것이 행 길이 g를 맡는 Adam인지 임베딩과 LM head 쪽 옵티마이저인지는 논문이 가르지 않습니다. RL은 SFT 체크포인트의 FP32 마스터 가중치와 Muown의 행 상태를 이어받아 시작하고, RL 동안 Router는 고정합니다.',
  },
};
