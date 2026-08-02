/**
 * Presenter notes — speaker-only, rendered in the notes window (never on stream).
 * Keys: node id ('kda'), scene id ('02-kda'), per-step override ('02-kda/bound'),
 * '_home' for the root canvas. Most-specific key wins.
 */
export const presenterNotes: Record<string, string> = {
  _home:
    'Figure 2를 그대로 옮긴 화면. 먼저 "세 방향" 프레임만 심어두고 시작한다 — 길이(KDA), 깊이(AttnRes), 너비(LatentMoE). 오른쪽 블록 다이어그램부터 짚고, 왼쪽 두 패널은 각각 확대도라는 것만 알려준 뒤 클릭으로 들어간다.',

  // ── 모듈 (root diagram 노드) ────────────────────────────────────────────────
  kda: '블록당 3개. 선형 어텐션이라 시퀀스 길이에 대해 선형이고, 상태가 고정 크기라 1M 컨텍스트를 버틴다. delta rule을 모르는 청중이 있으면 "쓰기 전에 기존 기억을 지우는 연관 메모리"로 한 줄 요약.',
  'kda-core': 'KDA 확대도. 다섯 갈래로 갈라지는 그림이 핵심 — q/k는 겹쳐 그린 한 줄이라는 걸 먼저 짚어야 청중이 세지 않는다.',
  gmla: '블록당 1개. "그럼 전역 정보는 누가 보나"라는 당연한 질문의 답. KV 캐시를 잠재 벡터로 압축한 MLA + NoPE + 출력 게이트.',
  'smoe-hi':
    'Stable LatentMoE. 어텐션 레이어마다 하나씩 붙는다. 위/아래 두 개가 같은 모듈이라는 점만 확인시켜 준다.',
  'smoe-lo': 'Stable LatentMoE. 어텐션 레이어마다 하나씩 붙는다.',
  'a-kda': 'α 원 하나를 클릭하면 Attention Residuals 설명으로 들어간다. 오른쪽에서 들어오는 분홍 선 다발이 "이 블록 이전의 모든 출력"이라는 것부터 짚을 것.',
  'a-out': '맨 위 α는 최종 출력 집계. 블록 대표값 N개를 한 번 더 어텐션으로 합친다.',
  'smoe-panel': 'LatentMoE 확대도. Shared 2개(초록)와 Routed N개(남색)의 색 구분이 범례에 있다.',
  'kda-panel': 'KDA 확대도.',

  // ── 씬 (scene id) + 스텝 오버라이드 ─────────────────────────────────────────
  '00-title': '인사 + 오늘 다룰 논문 한 줄. 40초 안에 아키텍처 화면으로 넘어간다.',
  '01-architecture':
    '네 박자로 그림이 쌓인다. 스페이스를 천천히 — 각 박자마다 오른쪽 콜아웃 한 줄씩만 읽고 넘긴다.',
  '01-architecture/attnres':
    '분홍색 배선이 오늘의 가장 낯선 부분. 여기서 시간을 제일 많이 써야 한다. "잔차를 더하는 대신 골라 읽는다"가 한 문장 요약.',

  '02-kda': 'KDA. 수식 두 줄이 전부다. 첫 줄은 상태 갱신, 둘째 줄은 출력.',
  '02-kda/decay':
    'Diag(α_t)가 delta 업데이트 *앞*에 온다는 순서가 포인트. GDN/Mamba-2와 비교 질문이 나오면 여기서 받는다.',
  '02-kda/bound':
    'K3가 Kimi Linear에서 바꾼 두 가지 중 첫 번째. 수치 안정성 얘기지만 결과는 성능 — 대각 타일까지 Tensor Core로 돌아서 커널이 빨라졌다. 시간 없으면 "BF16 오버플로를 막으려고 감쇠에 하한을 뒀다"까지만.',

  '03-gated-mla': 'Gated MLA. K2에서 쓰던 MLA에 NoPE와 출력 게이트가 붙었다.',
  '03-gated-mla/nope':
    '가장 반직관적인 부분이라 질문이 나올 확률이 높다. 답: 위치 정보는 사이의 KDA 3개가 이미 충분히 준다. 덕분에 컨텍스트 확장 시 RoPE base 재튜닝이 사라진다.',

  '04-attn-residuals':
    '오늘의 핵심 컷. "Transformer가 시퀀스에 했던 걸 깊이에 한다"는 한 문장으로 열고 닫는다.',
  '04-attn-residuals/blockwise':
    'full 버전은 O(Ld) 메모리라 못 쓴다는 현실적 제약 → 블록 단위로 자른 이유. K3는 12레이어 × 8블록. 여기서 인프라 얘기로 새지 말 것.',

  '05-latent-moe': 'Stable LatentMoE. 숫자 하나만 기억시킨다: 896개 중 16개, 희소도 56.',
  '05-latent-moe/stabilise':
    '"Stable"이 그냥 붙은 접두사가 아니라는 것. 라우팅 경로에 행렬곱이 네 번 연달아 붙으면 2.8T에서 터진다 → RMSNorm + SiTU-GLU. SiTU-GLU 수식은 읽지 말고 "SwiGLU에 상한을 씌운 것"으로 넘긴다.',
  '05-latent-moe/balance':
    '분위수 얘기는 깊이 들어가면 5분이 날아간다. "고정 스텝 대신 목표 부하에 맞는 분위수를 한 번에 계산한다"까지만 하고 Q&A로.',
};
