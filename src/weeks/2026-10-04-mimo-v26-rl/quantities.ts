/**
 * The week's ink per quantity. A scene builds its own `Quantities` map from
 * these, so a quantity that appears in several scenes is the same colour in
 * all of them: the score is blue, the group average gold and the gap from the
 * average green in every chart and every equation of the talk.
 *
 * Seven inks cannot cover every symbol of the paper, so the later entries are
 * reused across scenes that never share a screen (length ℓ and ratio r are both
 * purple). Inside one scene every quantity still has its own ink. Yellow is
 * never here: it is the pointer colour.
 */
export const INK = {
  // ── the core, shared by almost every RL scene ─────────────────────────────
  /** 점수 R (reward) */
  R: 'blue',
  /** 그룹 평균 R̄, and anything that takes an average */
  Rbar: 'gold',
  /** 평균과의 차이 A (advantage). Bars below zero are drawn red. */
  A: 'green',
  /** bars and values below zero */
  neg: 'red',
  /** 지금 고치는 모델이 준 확률 π_θ */
  pi: 'teal',

  // ── Eq. 1 ─────────────────────────────────────────────────────────────────
  /** 풀이를 쓴 옛 사본이 준 확률 μ_θold */
  mu: 'grey',
  /** 두 확률의 비 r */
  r: 'purple',
  /** 토큰을 넣을지 빼는 마스크 M */
  M: 'maroon',
  /** 과제마다 평균을 내는 항 1/Σ|oᵢ| */
  norm: 'gold',

  // ── grading ───────────────────────────────────────────────────────────────
  /** Solution rubric 점수 S^sol */
  sol: 'teal',
  /** Behavior rubric 점수 S^beh */
  beh: 'purple',
  /** GAR의 품질 계수 f */
  f: 'teal',
  /** GAR의 공통 배율 λ */
  lam: 'gold',

  // ── penalties ─────────────────────────────────────────────────────────────
  /** 풀이 길이 ℓ */
  len: 'purple',
  /** 과제의 기준 길이 ℓ* */
  ref: 'gold',
  /** 감점 (최대 감점 X) */
  cut: 'red',
  /** 규칙에 걸린 토큰 h */
  flag: 'red',
  /** 성공한 풀이의 나머지 토큰에 곱하는 α */
  alpha: 'teal',
  /** 실패한 풀이의 나머지 토큰에 곱하는 β */
  beta: 'purple',
  /** 걸린 토큰의 벌에 곱하는 κ */
  kappa: 'maroon',

  // ── optimizer ─────────────────────────────────────────────────────────────
  /** 방향별 세기 (singular values) σ */
  sigma: 'purple',
  /** Muown의 행 길이 g */
  g: 'teal',
  /** Muown의 행 방향 R (the Muown paper's letter; not the reward) */
  dir: 'maroon',

  // ── distillation ──────────────────────────────────────────────────────────
  student: 'blue',
  teacher: 'gold',
  /** 고정한 이력 h₁ … h_k */
  prefix: 'maroon',
} as const;

export type InkKey = keyof typeof INK;

/** pick a scene's quantities: `pick('R', 'Rbar', 'A')` → `{ R: 'blue', Rbar: 'gold', A: 'green' }` */
export const pick = <K extends InkKey>(...keys: K[]): { [P in K]: (typeof INK)[P] } =>
  Object.fromEntries(keys.map((k) => [k, INK[k]])) as { [P in K]: (typeof INK)[P] };
