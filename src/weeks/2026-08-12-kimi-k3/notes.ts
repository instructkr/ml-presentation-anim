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
  router:
    'Router 블록 클릭 → Quantile Balancing 씬으로 바로. smoe 블록의 QB 탭과 같은 씬이다. 시간이 없으면 05의 balance 콜아웃으로 갈음하고 이건 건너뛴다.',
  'q-proj':
    'q/k/v projection 블록 어느 것을 눌러도 Per-Head Muon. "이 행렬들을 뭘로 학습시키나"로 전환하는 자리 — 아키텍처에서 옵티마이저로 화제가 바뀐다는 걸 명시적으로 말해줄 것.',

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

  '06-kda-chunk':
    'KDA 탭 2. "커널이 왜 chunk만 학습을 지원하나"에 대한 답. projection 한 방 + 세 개의 scan — q·k·v 미리 계산(병렬), 요약(병렬), 전파(순차 G번), 재계산(병렬). 수식이 무거워 보이면 "청크 하나 = 상태에 대한 일차함수 A·S+B"만 반복.',
  '06-kda-chunk/project':
    '재귀에 안 걸리는 건 전부 미리 뽑는다는 프레임. attention의 QKᵀ처럼 큰 matmul이 GPU를 채우고, 순차로 남는 건 작은 상태 갱신뿐. 이후 비트에서 k·v행(요약)과 q행(재계산)이 따로 켜지는 걸 예고해도 좋다.',
  '06-kda-chunk/propagate':
    '이 scan이 돌려주는 게 S_next가 아니라 S_before(청크 시작 상태)라는 게 코드 읽을 때 제일 헷갈리는 지점. 다음 단계 초기값이 필요해서다.',
  '06-kda-chunk/replay':
    'step 함수가 recurrent_kda와 완전히 동일하다는 것을 강조 — 앞의 두 scan은 청크 사이 통신일 뿐. 질문 없으면 cost 비트로 바로.',

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
    '분위수 얘기는 깊이 들어가면 5분이 날아간다. 여기서는 "고정 스텝 대신 목표 부하에 맞는 분위수를 한 번에 계산한다"까지만 — 자세한 건 QB 탭(또는 Router 클릭)에 전용 씬이 있다.',

  '07-quantile-balancing':
    'QB 전용 씬. 다이어그램은 한 스텝을 시간으로 펼친 그림 — 위쪽 라인이 현재 배치의 라우팅(b(t) 사용), 아래 두 갈래가 b(t+1)을 만드는 두 규칙(DeepSeek 고정 스텝 vs 분위수). "자기 자신으로 라우팅한 배치의 bias는 다음 스텝에야 쓰인다"는 인과성 한 줄을 잊지 말 것.',
  '07-quantile-balancing/bias':
    'aux-loss-free의 공통 뼈대: bias는 선택에만, gate에는 없음. 여기까지는 DeepSeek V3와 완전히 같다는 걸 강조 — 차이는 bias를 "어떻게 갱신하느냐"뿐.',
  '07-quantile-balancing/fixedstep':
    'γ 줄타기: 크면 진동, 작으면 느림. 384개에서는 버텼지만 896개에서는 안 된다는 게 K3의 주장.',
  '07-quantile-balancing/cutoff':
    '행렬이 논문 Fig.5 재현 (m=8, n=4, k=1). 지금 하이라이트는 행별 Top-1 = 불균형 부하 (4,3,1,0). Top-(k+1)을 쓰는 이유는 토큰 쪽 분위수를 따로 계산하지 않기 위해서라는 것만 짚는다.',
  '07-quantile-balancing/quantile':
    '하이라이트가 열별 상위 2개로 바뀌며 (2,2,2,2)가 되는 순간이 이 씬의 아하 포인트. "정렬해서 q+1번째에 선을 긋는다"로 풀어 말하면 분위수라는 말이 무섭지 않다. 부록 C의 최적 균형 배정 쌍대성 얘기는 질문 나올 때만.',
  '07-quantile-balancing/deploy':
    '실전 두 가지: 전 배치 분위수는 히스토그램 all-reduce로 추정(수백 bin), inference는 bias 동결이라 분위수 계산이 아예 없다. train–inference 일관성 질문은 여기서 받는다.',

  '08-per-head-muon':
    '옵티마이저 씬. Muon을 모르는 청중 기준으로: "momentum의 방향만 남기고 크기를 버리는 직교화"가 한 줄 요약. 그 다음 "Q/K/V는 96개 head의 연결인데 왜 한 덩어리로 직교화하나"라는 질문을 던지면 per-head가 자연스럽게 나온다.',
  '08-per-head-muon/coupled':
    '핵심 직관: NS의 정규화 기준이 행렬 전체라서 momentum 큰 head가 공유 방향을 지배한다. "head별 learning rate가 제멋대로가 되는 것"이라는 비유가 잘 통한다.',
  '08-per-head-muon/equalise':
    '효과 두 가지: 스케일 균등(안정성)과 tall block NS가 더 싸다는 것. 시간 남으면 P2P 직교화(인프라 §)로 연결 가능.',
};
