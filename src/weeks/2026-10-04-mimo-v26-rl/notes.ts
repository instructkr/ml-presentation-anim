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
    '오늘은 MiMo-V2.6의 구조가 아니라 학습만 봅니다. 화면은 위에서 아래로 발표 순서입니다. 첫 줄은 RL에 들어가기 전에 Mid-training에서 준비해 둔 것, 둘째 줄은 RL 한 스텝과 그 목적함수인 Eq. 1입니다. 셋째 줄은 어떤 환경에서 연습시켰는지, 넷째 줄은 풀이를 어떻게 채점해서 학습 신호를 다듬었는지입니다. 다섯째 줄은 실제로 30 스텝을 돌리면서 얻은 교훈이고, 마지막 줄은 RL이 끝난 뒤의 MOPD2와 최종 결과입니다. N 키로 왼쪽에서 오른쪽으로, 위에서 아래로 넘어갑니다.',
  '00-title':
    '인사하고 범위부터 말합니다. MiMo-V2.6은 Sliding Window Attention과 Global Attention을 번갈아 쌓은 MoE Transformer라서 구조에는 새로울 것이 거의 없습니다. 그래서 구조는 건너뛰고 학습만 봅니다. 모델은 두 가지입니다. Pro는 전체 1.02T 파라미터에 토큰마다 42B가 활성화되고, Flash는 310B에 15B가 활성화됩니다 (§1). 논문의 주장은 RL에 쓰는 계산을 세 방향으로 키웠다는 것입니다. 배치와 처리량, 환경과 harness의 다양성, 그리고 채점에 쓰는 계산입니다. 오늘 순서도 이 셋을 따라갑니다.',
};
