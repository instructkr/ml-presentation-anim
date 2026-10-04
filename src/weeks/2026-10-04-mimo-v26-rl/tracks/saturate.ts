import { partialRolloutScene } from '../scenes/30-partial-rollout';
import { rePrefillScene } from '../scenes/31-re-prefill';
import { FIG15_SPREAD } from '../data/infra-fig16';
import {
  BATCH_ATTEMPTS,
  CUT,
  IDLE_SHARE,
  IN_FLIGHT,
  LONGEST,
  LONGEST_DONE_SHARE,
  LONGEST_SLOT,
  SLOTS,
  TRAIN_GAP,
} from '../data/saturate-partial-rollout';
import { ATTEMPT, INTERVAL_OFTEN, INTERVAL_RARE, OFTEN, PAPER_SEQUENCE, RARE } from '../data/saturate-re-prefill';
import type { WeekTrack } from './types';

/**
 * 끊어 쓰기와 그 값 (§4.1, §6.4): partial rollout, re-prefill.
 * Notes are keyed by the root-diagram node id ('partial') and '<nodeId>/<stepId>' — one per beat.
 *
 * The report gives partial rollout one sentence and a citation, so the notes of
 * 30 carry the original (Kimi k1.5 §2.6.2) next to what MiMo says of its own
 * version (§4.1, §5.1, and MiMo-V2-Flash §4.6.2). The numbers the notes read
 * out come from the same data files the scenes draw; the Korean particles after
 * them are written for the current example values.
 */

// ── 30: what the notes point at ─────────────────────────────────────────────
const short = SLOTS[0]!;
const long = SLOTS[LONGEST_SLOT]!;
const percent = (v: number) => `${Math.round(v * 100)}%`;
const one = (v: number) => v.toFixed(1);

// ── 31 ──────────────────────────────────────────────────────────────────────
const man = (v: number) => `${v}만`;
/** tokens read again at each update of the frequent case: 3만, 6만, 9만 */
const rereads = OFTEN.stretches.filter((s) => s.kind === 'reread').map((s) => s.to - s.from);

export const saturateTrack: WeekTrack = {
  scenes: [partialRolloutScene, rePrefillScene],
  details: {
    partial: { kind: 'scene', scene: partialRolloutScene },
    prefill: { kind: 'scene', scene: rePrefillScene },
  },
  notes: {
    // ── 30 · partial rollout ────────────────────────────────────────────────
    partial: `긴 풀이 하나 때문에 스텝 전체가 기다리지 않게 하는 방법인 partial rollout을 보는 장면입니다. 가로줄 여섯 개는 Rollout 쪽의 자리 여섯 개이고, 가로축은 시간입니다. 자리마다 과제 종류를 하나씩 맡겼고, 풀이 하나의 길이는 그림 16의 범례에 적힌 평균 풀이 시간입니다 (§6.3). 그래서 길이는 논문 값입니다. 자리가 여섯 개라는 것, 풀이 ${BATCH_ATTEMPTS}개로 배치가 찬다는 것, Training에 ${TRAIN_GAP}분이 걸린다는 것은 예시입니다. MiMo 논문은 이 방식을 한 문장으로만 적고 Kimi k1.5를 인용합니다 (§4.1). 그래서 방식 자체의 설명은 Kimi k1.5 보고서의 §2.6.2에서 가져왔습니다.`,
    'partial/wait': `자리 여섯 개가 동시에 풀이를 하나씩 시작합니다. 가장 짧은 ${short.label} 과제는 평균 ${short.minutes}분에 끝나고, 가장 긴 ${long.label} 과제는 ${long.minutes}분이 걸립니다 (그림 16). 풀이 시간이 이렇게 한쪽으로 길게 늘어진 모양을 논문은 long tail이라고 부릅니다 (§4.1). 실제 차이는 이보다 큽니다. 과제 종류 ${FIG15_SPREAD.sources}개를 재 보면 풀이 시간이 ${FIG15_SPREAD.duration}배까지 벌어집니다 (§6.3, 그림 15).`,
    'partial/idle': `가장 단순한 방식은 풀이가 모두 끝나기를 기다렸다가 한꺼번에 학습하는 것입니다. Rollout 단계와 Training 단계를 번갈아 도는 이 방식을 동기식, 영어로 synchronous라고 합니다. Kimi k1.5도 기본 틀은 이 방식입니다 (Kimi k1.5 §2.6.1). 그러면 먼저 끝난 자리는 가장 긴 풀이가 끝날 때까지 비어 있습니다. 화면의 빗금이 그 시간입니다. 여섯 자리가 ${Math.round(LONGEST)}분 동안 쓸 수 있는 시간 가운데 ${percent(IDLE_SHARE)}가 빗금입니다. 이 값은 논문의 풀이 시간 여섯 개에서 제가 계산한 값입니다. DAPO 논문도 동기식에서는 생성에 걸리는 시간을 긴 풀이 몇 개가 좌우한다고 적습니다 (DAPO §3.2).`,
    'partial/refill':
      '그래서 끝난 자리를 비워 두지 않고 곧바로 다음 풀이를 시작합니다. Kimi k1.5는 rollout worker들이 비동기로 돈다고 설명합니다. 어떤 worker가 긴 풀이를 붙들고 있는 동안 다른 worker는 새로 들어온 짧은 과제를 처리합니다 (Kimi k1.5 §2.6.2). MiMo 논문은 같은 목적을 running batch를 가득 채워 둔다고 적습니다 (§4.1). running batch는 지금 GPU에 올라가서 동시에 쓰이고 있는 풀이들입니다. 이것이 가득해야 한 번의 계산으로 많은 풀이를 함께 밀 수 있습니다. 화면에서는 예시를 단순하게 하려고 한 자리가 같은 종류의 과제를 이어서 풉니다.',
    'partial/cut': `이제 언제 학습할지를 정해야 합니다. MiMo는 학습 배치가 모이면 그때 수집하고, 아직 쓰고 있는 풀이는 그 자리에서 멈춰 둡니다 (§4.1). 화면에서는 풀이 ${BATCH_ATTEMPTS}개가 끝나면 배치가 찬다고 두었고, 그 시각이 ${one(CUT)}분입니다. ${BATCH_ATTEMPTS}개라는 수는 예시이고, 시각은 풀이 시간에서 계산한 값입니다. 이때 쓰다 만 풀이가 ${IN_FLIGHT.length}개 남고, 그중 ${long.label} 풀이는 ${percent(LONGEST_DONE_SHARE)}쯤 쓴 상태입니다. Kimi k1.5의 원래 방식은 끊는 기준이 조금 다릅니다. iteration 한 번에 쓸 수 있는 출력 토큰 수에 상한을 두고, 풀이가 그 상한을 넘으면 남은 부분을 replay buffer에 저장했다가 다음 iteration에서 이어 씁니다 (Kimi k1.5 §2.6.2). replay buffer는 만들어 둔 풀이를 학습에 쓸 때까지 담아 두는 저장소입니다.`,
    'partial/resume': `Training이 모인 배치로 모델을 고치고, 고친 가중치를 Rollout 쪽 사본에 올립니다. 그다음 Rollout 단계에서 멈춰 둔 풀이를 멈춘 자리부터 이어 씁니다 (§4.1). 화면에서 색이 바뀐 구간이 새 사본이 쓴 부분입니다. Training에 ${TRAIN_GAP}분이 걸린다는 것은 예시입니다. 여기서 중요한 점은 앞부분을 다시 쓰지 않는다는 것입니다. Kimi k1.5는 이것을, 지금 iteration의 구간만 현재 모델로 계산하면 되고 이전 구간은 buffer에서 꺼내 그대로 다시 쓴다고 설명합니다. 긴 풀이를 여러 iteration에 나눠 쓰기 때문에, iteration 하나는 짧게 유지하면서도 훨씬 긴 풀이를 만들 수 있습니다 (Kimi k1.5 §2.6.2).`,
    'partial/stale': `그 결과 풀이 하나 안에 서로 다른 버전의 모델이 쓴 토큰이 섞입니다. 화면의 ${long.label} 풀이는 앞의 ${percent(LONGEST_DONE_SHARE)}를 옛 사본이 썼고 나머지를 새 사본이 썼습니다. MiMo는 앞부분 토큰의 확률을 새 모델로 다시 계산하지 않고, 쓸 때 기록해 둔 확률을 그대로 씁니다 (§5.1). 그래서 풀이를 쓴 모델과 지금 고치는 모델이 어긋나고, 이 차이를 메우는 것이 앞에서 본 비율 r입니다. 사본이 뒤처진 정도를 staleness라고 하는데, MiMo는 4까지 허용합니다 (§5.1). 앞선 보고서인 MiMo-V2-Flash는 staleness와 함께 한 배치에 들어가는 partial 풀이의 비율도 제한하고, 뒤처진 정도에 맞춰 importance sampling 비율을 잘라 쓴다고 적었습니다 (MiMo-V2-Flash §4.6.2). Kimi k1.5는 이 구조에 두 가지를 더 얹었습니다. 학습할 때 일부 구간을 손실 계산에서 뺄 수 있고, 같은 내용을 되풀이하는 풀이를 찾아 일찍 끊는 repeat detection이 있습니다 (Kimi k1.5 §2.6.2).`,

    // ── 31 · re-prefill ─────────────────────────────────────────────────────
    prefill: `partial rollout에 드는 값을 보는 장면입니다. 가로축은 시간이 아니라 처리한 토큰 수입니다. 파란 구간은 풀이를 쓴 토큰이고, 빨간 구간은 이미 쓴 앞부분을 다시 읽은 토큰입니다. 이 다시 읽기를 논문은 re-prefill이라고 부릅니다 (§4.1). 풀이 하나의 길이 ${man(ATTEMPT)} 토큰과 갱신 간격은 예시입니다. 논문이 밝힌 풀이 하나의 길이는 대략 ${PAPER_SEQUENCE[0]}만에서 ${PAPER_SEQUENCE[1]}만 토큰입니다 (§4.1).`,
    'prefill/cache':
      'Transformer는 다음 토큰을 쓸 때 앞의 모든 토큰을 Attention으로 봅니다. 그때마다 앞 토큰들의 Key와 Value를 다시 계산하면 낭비입니다. 그래서 한 번 계산한 값을 저장해 두고 다시 쓰는데, 이 저장소가 KV cache입니다. 주어진 글을 한꺼번에 읽어 cache를 채우는 일을 prefill이라 하고, 그 뒤로 토큰을 하나씩 쓰는 일을 decode라고 합니다. agent 과제에서는 모델이 쓰고 도구가 답하는 일이 여러 번 이어집니다. MiMo는 대화 문맥마다 cache를 계속 들고 있다가, 모델 버전이 같은 동안에는 새로 붙은 뒷부분만 prefill합니다. 도구를 기다리는 동안에는 이 cache를 GPU 메모리에서 호스트 메모리로 내려 두었다가 다시 올립니다 (§6.4). 뒤 장면에서 볼 Expert 번호와 top-p 후보 집합의 기록도 이 cache와 함께 실려 다니다가, 풀이를 수집할 때 한 번에 돌려줍니다 (§6.4).',
    'prefill/update': `${man(INTERVAL_OFTEN)} 토큰을 썼을 때 모델이 갱신되었다고 하겠습니다. 간격 ${man(INTERVAL_OFTEN)}은 예시입니다. KV cache에 들어 있는 것은 옛 가중치로 계산한 Key와 Value입니다. 가중치가 바뀌면 같은 토큰에서도 이 값이 달라지므로, 옛 cache를 새 모델과 섞어 쓸 수 없습니다. 화면에서 앞부분이 흐려진 것이 이 뜻입니다. 토큰이 버려지는 것은 아닙니다. 쓴 글은 그대로 남고, 그 글에 대한 계산 결과만 못 쓰게 됩니다.`,
    'prefill/reread': `그래서 이어 쓰기 전에 지금까지의 앞부분 전체를 새 가중치로 다시 읽어서 cache를 새로 만듭니다. 논문은 partial rollout의 비용이 이 re-prefill이라고 적습니다. 이어 쓰는 풀이는 모델이 갱신될 때마다 KV cache를 다시 지어야 한다는 것입니다 (§4.1). 화면의 빨간 구간이 다시 읽은 ${man(rereads[0]!)} 토큰이고, 그 뒤에 다음 ${man(INTERVAL_OFTEN)} 토큰을 이어서 씁니다. 다시 읽기는 쓰기보다 토큰당 빠릅니다. 쓸 때는 토큰을 하나씩 차례로 만들어야 하지만, 읽을 때는 앞부분을 한꺼번에 병렬로 처리하기 때문입니다. 그래서 이 그림의 길이는 토큰 수이지 시간이 아닙니다. 이미지가 들어간 과제에서는 보내는 양도 늘어납니다. 평소에는 새로 생긴 이미지만 보내다가, 모델이 갱신되거나 cache를 놓쳤을 때에는 이미지 전체를 다시 보냅니다 (§6.4).`,
    'prefill/again': `갱신은 한 번으로 끝나지 않습니다. 둘째 갱신에서는 ${man(rereads[1]!)} 토큰을, 셋째 갱신에서는 ${man(rereads[2]!)} 토큰을 다시 읽습니다. 풀이가 길어질수록 다시 읽어야 할 앞부분도 길어지기 때문입니다. 이 예시에서 ${man(ATTEMPT)} 토큰짜리 풀이 하나가 다시 읽은 양은 ${rereads.map(man).join(', ')}을 더한 ${man(OFTEN.reread)} 토큰입니다. 쓴 양보다 다시 읽은 양이 더 많습니다. 이 숫자는 모두 예시에서 계산한 값입니다.`,
    'prefill/batch': `아랫줄은 같은 풀이인데 갱신이 절반만큼 드물게 오는 경우입니다. ${man(INTERVAL_RARE)} 토큰마다 갱신되면 다시 읽는 것은 ${man(RARE.reread)} 토큰 한 번뿐입니다. 갱신은 ${OFTEN.updates.length}번에서 ${RARE.updates.length}번으로, 다시 읽은 양은 ${man(OFTEN.reread)}에서 ${man(RARE.reread)}으로 줄었습니다. 논문의 문장은 이렇습니다. 이어 쓰는 풀이는 갱신마다 KV cache를 다시 지어야 하므로 배치 크기와 partial rollout을 함께 정하고, 큰 배치가 re-prefill의 비용을 나눠서 감당하게 한다는 것입니다 (§4.1). 여기서부터는 해석입니다. 배치가 크면 한 스텝에 모아야 하는 풀이가 많아서 Rollout 단계가 길어지고, 풀이 하나가 끝날 때까지 만나는 갱신의 수가 줄어듭니다. 그리고 한 번 다시 읽은 대가로 더 많은 토큰을 학습에 넘기게 됩니다. 논문은 이 이유를 풀어서 적지 않았습니다.`,
  },
};
