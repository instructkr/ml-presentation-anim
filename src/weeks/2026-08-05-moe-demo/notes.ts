/**
 * Presenter notes — speaker-only, rendered in the notes window (never on stream).
 * Keys: node id ('attn'), scene id ('00-title'), per-step override ('attn/score'),
 * '_home' for the root canvas. Most-specific key wins.
 */
export const presenterNotes: Record<string, string> = {
  _home: '전체 아키텍처부터: 입력이 어떤 블록을 거치는지 큰 그림을 먼저 잡는다. 오늘은 Attention → Router → MoE 순서로 파고든다고 예고할 것.',

  // ── 모듈 (root diagram 노드) ────────────────────────────────────────────────
  attn: 'MoE 얘기 전에 Attention을 복습하는 이유: 라우팅도 결국 "어디에 계산을 쓸까"를 고르는 문제라서. QKV → 스코어 → softmax → 가중합, 네 단계로만 짚고 넘어간다.',
  'attn/softmax': 'softmax가 여기서 하는 일이 뒤에 나올 라우터의 softmax와 정확히 같은 모양이라는 점을 강조. 이게 오늘의 연결 고리다.',

  router: '핵심 모듈. 라우터는 파라미터가 거의 없는 작은 선형 레이어 하나뿐이라는 점을 먼저 못박고 시작한다. 청중이 제일 많이 오해하는 부분.',
  'router/scoring': '토큰마다 전문가 4개에 대한 점수가 나온다. 배치 전체가 아니라 "토큰 단위"로 독립적으로 정해진다는 걸 짚을 것.',
  'router/topk': '여기가 오늘의 핵심 한 컷: Top-2만 켜지니까 파라미터는 4배인데 토큰당 연산량은 그대로. 로드 밸런싱 손실 얘기는 질문 나오면 그때.',

  moe: '탭이 두 개다. 먼저 Tensor Parallel로 전문가가 GPU에 어떻게 흩어지는지 보여주고, 시간이 남으면 Live 3D로 직접 돌려본다. 시간 없으면 3D는 건너뛴다.',

  // ── 슬라이드 (scene id) ────────────────────────────────────────────────────
  '00-title': '인사 + 오늘 다룰 논문 한 줄 요약. 길게 끌지 말고 40초 안에 아키텍처 화면으로 넘어간다.',
  '04-benchmarks': '숫자 하나하나 읽지 말 것. Dense 대비 같은 추론 비용에서 얼마나 올랐는지, 그 갭 하나만 짚는다.',
  '05-scaling-laws': '전문가 수를 늘릴 때 손실이 어떻게 꺾이는지가 포인트. 축이 로그 스케일이라는 것만 미리 말해주면 질문이 줄어든다.',
  '06-diagram-morph': 'Dense FFN이 MoE 블록으로 바뀌는 순간을 보여주는 마무리 컷. 여기서 오늘 내용을 한 문장으로 정리하고 Q&A로 넘어간다.',
};
