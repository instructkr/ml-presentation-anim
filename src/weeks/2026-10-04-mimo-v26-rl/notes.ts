/**
 * Presenter notes — speaker-only (the `s` window), never on stream.
 *
 * This file holds the week-level notes. Each track module (tracks/*.ts) carries
 * the notes for its own scenes, keyed by the root-diagram node id ('loss') and
 * '<nodeId>/<stepId>' for every beat; manifest.ts merges them all.
 * Spoken register (합니다체), full sentences, real connectives.
 */
export const presenterNotes: Record<string, string> = {
  _home:
    '오늘은 MiMo-V2.6의 구조가 아니라 학습만 봅니다. 화면의 카드 열 장이 발표 순서입니다. 윗줄 왼쪽에서 시작해 오른쪽으로 가고, 그다음 아랫줄로 내려갑니다. 1번은 RL에 들어가기 전에 Mid-training에서 준비해 둔 것입니다. 2번은 RL 한 스텝과 그 목적함수인 Eq. 1이고, 3번은 Eq. 1에 붙는 보정 세 가지입니다. 4번은 어떤 환경에서 연습시켰는지입니다. 5번과 6번은 풀이를 어떻게 채점해서 학습 신호를 다듬었는지입니다. 5번에서 GRS와 GAR을 보고, 6번에서 길이와 토큰에 매기는 감점을 봅니다. 7번과 8번은 이 모든 것을 2만 5천 개짜리 배치로 돌리는 인프라입니다. §4.1의 마지막 문단이 한 줄씩만 적고 넘어간 내용이고, 자세한 것은 §6에 있습니다. 7번에서는 긴 풀이를 끊었다가 이어 쓰는 partial rollout과, Rollout과 Training 두 엔진의 확률을 맞추는 R3와 top-p 후보 집합을 봅니다. 8번에서는 dynamic sampler와 Sample Mixer로 배치를 채우는 방법을 봅니다. 논문이 인용만 하고 설명하지 않은 기법은 원 논문에서 가져와 설명합니다. 9번은 실제로 30 스텝을 돌리면서 얻은 교훈이고, 10번은 RL이 끝난 뒤의 MOPD2와 최종 결과입니다. 장면이 끝난 자리에서 Space를 누르면 다음 장면으로 바로 넘어갑니다.',
  '00-title':
    '인사하고 범위부터 말합니다. MiMo-V2.6은 Sliding Window Attention과 Global Attention을 번갈아 쌓은 MoE Transformer라서 구조에는 새로울 것이 거의 없습니다. 그래서 구조는 건너뛰고 학습만 봅니다. 모델은 두 가지입니다. Pro는 전체 1.02T 파라미터에 토큰마다 42B가 활성화되고, Flash는 310B에 15B가 활성화됩니다 (§1). 논문의 주장은 RL에 쓰는 계산을 세 방향으로 키웠다는 것입니다. 배치와 처리량, 환경과 harness의 다양성, 그리고 채점에 쓰는 계산입니다. 오늘 순서도 이 셋을 따라갑니다.',
};
