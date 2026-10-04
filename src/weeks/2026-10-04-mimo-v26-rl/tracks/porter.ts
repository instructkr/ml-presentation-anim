import { mixerDispatchScene } from '../scenes/38-mixer-dispatch';
import { payloadPorterScene } from '../scenes/39-payload-porter';
import { RL_SCALE, SEQUENCES_PER_STEP, man as manTokens } from '../data/objective-rl-scale';
import {
  CHOSEN,
  ESTIMATE,
  MARGIN,
  NEED,
  RANK_FREE,
  RANK_FREE_AFTER,
  RANK_LABELS,
  REFUSED,
  STARTUP_OVER_STEADY,
  man,
} from '../data/porter-dispatch';
import type { WeekTrack } from './types';

/**
 * 배치 채우기의 뒤쪽 절반 (§6.2, §6.3): where a new attempt is placed and how
 * the first batch after a start is filled (Predictive Rollout Dispatch, Sample
 * Replay), and where the 25K attempts of a step wait until they are packed
 * (Payload Porter). Notes are keyed by the root-diagram node id ('dispatch')
 * and '<nodeId>/<stepId>' — one per beat.
 *
 * These are the last scenes before the lessons chapter, whose failure scene
 * (§5.5) is about exactly this machinery: a length estimate that drifted, and
 * a packing node that ran out of host memory. The notes here set those up and
 * leave the telling to that scene.
 *
 * The numbers the notes read out come from the same data files the scenes
 * draw. The Korean particles after them are written for the current example
 * values.
 */

// ── 38: the dispatch example ────────────────────────────────────────────────
const S = RL_SCALE;
const refusedNames = REFUSED.map((i) => RANK_LABELS[i]!).join(', ');
const chosenName = RANK_LABELS[CHOSEN]!;
const sequences = SEQUENCES_PER_STEP.toLocaleString('en-US');
const lengthRange = `${manTokens(S.tokensPerSequence[0])}에서 ${manTokens(S.tokensPerSequence[1])} 토큰`;

export const porterTrack: WeekTrack = {
  scenes: [mixerDispatchScene, payloadPorterScene],
  details: {
    dispatch: { kind: 'scene', scene: mixerDispatchScene },
    porter: { kind: 'scene', scene: payloadPorterScene },
  },
  notes: {
    // ── 38 · Mixer: 자리 ────────────────────────────────────────────────────
    dispatch: `Sample Mixer의 네 장치 가운데 남은 둘을 보는 장면입니다. 왼쪽은 Predictive Rollout Dispatch입니다. 새로 시작할 풀이를 Rollout 쪽의 어느 GPU에 놓을지 정합니다. 오른쪽은 Sample Replay입니다. 학습을 시작한 직후의 첫 배치를 채웁니다 (§6.3). 왼쪽 그림의 남은 자리와 짐작한 길이 ${man(ESTIMATE)}, 여유 배율 ${MARGIN}는 모두 예시입니다. 논문은 규칙만 적었고 이 값들은 밝히지 않았습니다. 오른쪽의 ${STARTUP_OVER_STEADY}배는 논문 값입니다.`,
    'dispatch/guess': `막대 하나는 Rollout 쪽에서 모델 사본 하나를 올려 둔 GPU 묶음입니다. 논문은 이것을 rank라고 부르고, 화면에는 GPU라고 적었습니다. 막대의 높이는 그 묶음의 GPU 메모리에 남아 있는 KV cache 자리입니다. KV cache는 이미 읽은 토큰의 Attention 계산 결과를 저장해 두는 메모리라서, 풀이가 길수록 많이 차지합니다. 그런데 새 풀이가 얼마나 길어질지는 끝나 봐야 압니다. 그래서 과제 종류마다 지금까지 끝난 풀이의 길이로 어림값을 만들어 두고, 풀이가 끝날 때마다 그 값을 고칩니다 (§6.3). 여기서 길이는 입력 토큰과 생성한 토큰을 합친 값이고, 한 풀이 안에 대화 갈래가 여럿이면 모두 더합니다. 점선의 ${man(ESTIMATE)} 토큰은 예시입니다. 논문이 밝힌 풀이 하나의 길이인 ${lengthRange} 사이에서 골랐습니다 (§4.1).`,
    'dispatch/fit': `짐작은 틀릴 수 있습니다. 그래서 짐작한 길이에 여유 배율을 곱하고, 그만큼의 자리가 남아 있는 GPU만 새 풀이를 받습니다 (§6.3). 예시에서는 ${man(ESTIMATE)}에 ${MARGIN}를 곱한 ${man(NEED)}이 기준선입니다. 이 선에 못 미치는 ${refusedNames}은 후보에서 빠집니다. 논문은 이 배율을 safety margin이라고만 부르고 값은 적지 않았습니다. 자리가 GPU 메모리에만 있는 것도 아닙니다. 풀이가 도구의 결과를 기다리는 동안에는 그 풀이의 cache를 호스트 메모리로 내려 둡니다. 그래서 받아들인 풀이의 상태는 GPU 메모리와 호스트 메모리 두 곳이 함께 들고 있습니다 (§6.4).`,
    'dispatch/place': `받을 수 있는 GPU 가운데 남은 자리가 가장 넉넉한 곳에 놓습니다. 예시에서는 ${chosenName}에 놓고, 그 GPU의 남은 자리가 ${man(RANK_FREE[CHOSEN]!)}에서 ${man(RANK_FREE_AFTER[CHOSEN]!)}으로 줄어듭니다. 논문은 자리를 두 가지로 셉니다. 하나는 남은 KV cache 용량이고, 다른 하나는 동시에 받을 수 있는 요청 수입니다. 둘을 풀이 개수 단위로 바꿔서 더 작은 쪽을 그 GPU의 남은 자리로 보고, 풀이를 하나 놓을 때마다 두 값을 고칩니다 (§6.3). 요청 수에 상한을 두는 까닭도 적혀 있습니다. 추론 엔진이 미리 잡아 둔 최대 동시 요청 수를 넘기면 요청이 줄을 서고, 줄을 서면 풀이가 오래 걸려서 그만큼 사본이 뒤처집니다. 풀이는 시간의 일부를 환경에서 보내므로, 그 비율을 어림해서 동시에 도는 풀이 수를 동시에 들어올 요청 수로 바꿉니다. 화면에는 KV cache 자리만 그렸습니다. 놓은 뒤에 줄어드는 양을 짐작한 길이 ${man(ESTIMATE)}으로 그린 것도 예시입니다. 이 장치는 길이 어림이 맞을 때만 제대로 돕니다. 어림이 틀어지면 어떻게 되는지는 다음 장의 멈춘 자리 장면에서 봅니다.`,
    'dispatch/slow': `여기서부터는 넷째 장치인 Sample Replay입니다. 평소에는 앞 스텝에서 쓰던 풀이가 이어지고 있어서 배치가 금방 찹니다. 그런데 학습을 처음 시작하거나 체크포인트에서 되살린 직후에는 돌고 있는 풀이가 하나도 없습니다. 그래서 느린 과제의 풀이가 끝날 때까지 기다려야 합니다. 논문이 재 보니 시작 직후에 배치를 모으는 시간은 평소의 약 ${STARTUP_OVER_STEADY}배였습니다 (§6.3). 시간만 문제인 것도 아닙니다. 느린 과제 안에서도 짧은 풀이가 먼저 끝납니다. 그래서 과제마다 정해 둔 몫을 다 채워도 첫 배치는 짧은 풀이 쪽으로 치우칩니다.`,
    'dispatch/replay':
      '그래서 시작한 뒤의 첫 배치에 한해서, 골라 둔 느린 과제는 저장해 둔 풀이 그룹을 다시 써서 모자란 몫을 채웁니다. 이미 끝난 풀이를 그룹째로 쓰고, 지금의 거르는 규칙은 그대로 적용합니다 (§6.3). 처음 시작할 때는 저장해 둔 풀이를 학습을 시작하는 모델이 쓴 것으로 봅니다. 되살릴 때는 멈추기 전에 끝난 풀이 가운데 그 과제의 staleness 한도 안에 있는 것만 씁니다. staleness는 풀이를 쓴 사본이 지금 모델보다 몇 버전 뒤처졌는지를 세는 값입니다. 다시 쓰는 것을 첫 배치로만 묶어 두었기 때문에 기다리는 시간은 줄고, 과제마다 정해 둔 몫은 그대로 지켜집니다. 화면의 띠는 평소와 시작 직후의 차이를 가리킬 뿐입니다. 다시 쓴 뒤에 몇 배가 되는지는 논문에 없습니다.',

    // ── 39 · Payload Porter ─────────────────────────────────────────────────
    porter: `RL 한 스텝에 나오는 풀이 ${sequences}개를 학습 배치로 묶기 전까지 어디에 두는지 보는 장면입니다. 논문은 이 부분을 Payload Porter라고 부릅니다. 계획을 짜는 쪽인 control plane과 내용을 나르는 쪽인 data plane을 떼어 놓은 구조입니다 (§4.1, §6.2). 그림은 논문의 그림 14에서 데이터가 지나는 길만 남기고 다시 그린 것입니다. 처음 화면은 떼어 놓기 전의 단순한 길입니다.`,
    'porter/heavy': `한 스텝에 풀이가 ${sequences}개 나오고, 하나의 길이가 ${lengthRange}입니다 (§4.1). 풀이 하나에는 토큰만 들어 있지 않습니다. 토큰마다 Rollout이 그 토큰에 매긴 확률이 있습니다. 여기에 앞 장에서 본 두 가지 기록이 따라옵니다. Router가 고른 Expert 번호와 top-p가 남긴 후보 집합입니다. 화면을 보는 과제라면 이미지도 붙습니다 (§6.2). 그래서 다뤄야 할 양은 풀이의 수와 풀이의 길이 양쪽에 비례해서 늘어납니다.`,
    'porter/driver':
      'driver는 Rollout과 Training 전체를 지휘하는 프로세스입니다. 어느 과제를 시작할지, 어느 그룹을 받을지, 배치를 어떻게 묶을지를 여기서 정합니다. 가장 단순한 방법은 끝난 풀이를 통째로 driver가 있는 노드에 모으는 것입니다. 그러면 배치 크기가 그 노드 한 대의 메모리에 묶입니다 (§6.2). 배치를 키우는 것이 이 논문의 방향이므로 이 길은 쓸 수 없습니다.',
    'porter/split':
      "그래서 풀이가 끝나는 순간에 둘로 나눕니다. 무거운 내용은 분산 key-value 저장소에 한 번만 씁니다. 여러 노드에 나눠 저장하고 열쇠로 꺼내 쓰는 저장소입니다. 논문은 Ray object store와 TransferQueue를 예로 듭니다 (§6.2). TransferQueue는 AsyncFlow 논문이 내놓은 모듈입니다. 그 논문은 data plane과 control plane을 떼어 놓고, 양쪽에 controller와 저장 단위를 여러 개씩 두어서 입출력이 한곳에 몰리지 않게 했다고 설명합니다. 데이터의 상태도 배치가 아니라 샘플 하나하나 단위로 관리합니다 (AsyncFlow §4.1). MiMo 논문이 §4.1에서 한 줄로 적은 'data plane과 control plane을 분리했다'가 이 구조입니다.",
    'porter/meta':
      'driver에게는 요약만 갑니다. 풀이의 점수, 대화 갈래마다의 길이, 그리고 저장소에서 내용을 꺼낼 열쇠입니다 (§6.2). 이 요약만으로 할 수 있는 일이 많습니다. 그룹이 끝나면 dynamic sampler가 통과율만 보고 그 그룹을 받을지 버릴지 정합니다. 받은 그룹에는 길이 감점을 주고, 평균과의 차이를 계산하고, 토큰 감점을 적용합니다. 이때 저장소에서는 필요한 열 몇 개만 읽고, 계산한 토큰별 값은 저장소에 다시 써넣습니다. 값이 전부 0인 그룹은 기본적으로 버립니다. Groupwise Grader는 풀이를 쓰는 쪽과 나란히 따로 돕니다. 채점이 늦게 돌아와도 Rollout은 기다리지 않고, 결과가 오면 그 그룹의 점수를 고쳐 씁니다.',
    'porter/pack':
      '과제 종류마다 몫이 다 차면 driver가 받은 풀이들을 micro-batch로 나누고 학습 쪽 GPU에 배정합니다. 이때 driver는 텐서를 하나도 만지지 않습니다 (§6.2). 실제로 묶는 일은 Packer가 합니다. 모델의 가중치를 여러 GPU에 쪼개 올리는 방식을 tensor parallel이라 하고, Packer는 그 GPU 묶음마다 하나씩 있습니다. 긴 풀이 하나를 구간으로 잘라 여러 GPU가 나눠 맡는 방식은 context parallel입니다. Packer는 저장소에서 자기 묶음이 맡은 구간에 걸리는 줄만 가져와서 그 구간만 잘라 냅니다. 잘라 낸 결과는 묶음 안의 GPU들이 읽기 전용 사본 하나로 함께 씁니다. 이렇게 하면 배치 전체를 driver에 모을 일이 없고, 길이를 맞추려고 빈칸을 채운 큰 중간 텐서도 생기지 않습니다. 이미지도 같은 방식으로 요약과 내용을 나누고, Rollout 중에는 요청 사이에 새로 생긴 이미지만 보냅니다 (§6.2, §6.4). 다만 이렇게 나누어도 노드 하나가 다루는 양은 풀이가 길어지면 함께 커집니다. 그 한계가 어디서 드러났는지는 다음 장에서 봅니다.',
  },
};
