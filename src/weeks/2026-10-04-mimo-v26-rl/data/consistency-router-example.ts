/**
 * Worked example for 33-routing-replay: one token, one MoE layer, the Router's
 * score for six Experts as the Rollout engine computed it and as the Training
 * engine computes it again, and which two each engine would use.
 *
 * The scores, the six Experts and "two" are examples (예시): MiMo-V2.6-Pro picks
 * 8 of 384 Experts per token (Table 1). The two engines hold the same weights;
 * their scores differ only in the last digits, and that is enough to swap the
 * second and third place. Which Experts are picked is never typed — `topK`
 * works it out from the scores.
 *
 * The third panel's numbers are not examples: they are the KL divergence
 * between the two engines' token probabilities that the R3 paper measured
 * (Ma et al. 2025, Fig. 2 and §3.1, §4.3).
 */
export const EXPERTS = [1, 2, 3, 4, 5, 6].map((n) => `E${n}`);

/** how many Experts the Router keeps (예시) */
export const TOP_K = 2;

/** the Router's scores when the Rollout engine wrote the token (예시) */
export const S_ROLLOUT = [1.9, 0.4, 1.21, 1.19, 0.2, 0.8];
/** the same token, same weights, scored again by the Training engine (예시): Experts 3 and 4 trade places */
export const S_TRAIN = [1.9, 0.4, 1.19, 1.21, 0.2, 0.8];

/** indices of the `k` highest scores, in index order (ties keep the lower index) */
export const topK = (scores: number[], k: number): number[] =>
  scores
    .map((s, i) => [s, i] as const)
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .slice(0, k)
    .map(([, i]) => i)
    .sort((a, b) => a - b);

/** every index that is not in `picked` */
export const others = (n: number, picked: number[]): number[] =>
  Array.from({ length: n }, (_, i) => i).filter((i) => !picked.includes(i));

/** what Rollout used — the numbers R3 writes down */
export const PICK_ROLLOUT = topK(S_ROLLOUT, TOP_K);
/** what Training would pick on its own */
export const PICK_TRAIN = topK(S_TRAIN, TOP_K);

/** the Expert Rollout used and Training would not, and the one Training would take instead */
export const LOST = PICK_ROLLOUT.find((i) => !PICK_TRAIN.includes(i))!;
export const GAINED = PICK_TRAIN.find((i) => !PICK_ROLLOUT.includes(i))!;

/** the two scores the flip hangs on, as Training sees them, and the gap between them */
export const FLIP_MARGIN = Math.abs(S_TRAIN[GAINED]! - S_TRAIN[LOST]!);

/** 1.21 → '1.21', 1.9 → '1.9' */
export const fmtScore = (v: number): string => String(Number(v.toFixed(2)));
/** 0-based index → the Expert's number as the phrase says it */
export const expertNo = (i: number): number => i + 1;

// ── the R3 paper's measurement (not an example) ─────────────────────────────
/**
 * KL divergence between the probabilities the training engine (Megatron) and
 * the inference engine (SGLang) give the same generated tokens, in units of
 * 10⁻³: 2,048 math problems, about 20M response tokens. MoE = Qwen3-30B-A3B,
 * dense = Qwen3-8B. Rounded as the paper's text states them (§4.3: "from
 * 1.5 × 10⁻³ to 7.5 × 10⁻⁴, which is near the 6.4 × 10⁻⁴ observed for the
 * dense model"); its Fig. 2 prints 0.001535, 0.000754 and 0.000640.
 */
export const R3_KL = [
  { label: 'MoE', value: 1.5 },
  { label: 'MoE + R3', value: 0.75 },
  { label: 'dense', value: 0.64 },
];
export const KL_MOE = R3_KL[0]!.value;
export const KL_R3 = R3_KL[1]!.value;
export const KL_DENSE = R3_KL[2]!.value;
/** index of the dense baseline in `R3_KL` — a reference, not the model under test */
export const KL_DENSE_INDEX = 2;

/** the same study's other counts (R3 paper §3.1–3.3, §4.1) */
export const R3_STUDY = {
  problems: 2048,
  /** response tokens, millions */
  tokensM: 20,
  /** % of routers (per token, per layer) that pick different Experts in the two engines */
  routerDiffPct: 10,
  /** % of tokens that pick a different Expert in at least one layer */
  tokenDiffPct: 94,
  /** routers that differ per token, averaged over a sequence */
  routersPerToken: 6,
  /** rollout latency overhead of recording the masks, percent (upper bound) */
  overheadPct: 3,
};

/** 1.5 → '1.5', 0.75 → '0.75' */
export const fmtKl = (v: number): string => String(Number(v.toFixed(2)));
