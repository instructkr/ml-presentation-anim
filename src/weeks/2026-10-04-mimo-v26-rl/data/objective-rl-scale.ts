/**
 * The scale of one RL step, as the report states it (§4.1, §5.1). These are the
 * paper's numbers, not examples; the scenes and notes of the objective track
 * read them from here so a phrase never carries a hand-typed figure.
 */
export const RL_SCALE = {
  /** attempts per prompt (group size G) */
  G: 16,
  /** prompts per training step */
  prompts: 1568,
  /** RL training steps of the main run */
  steps: 30,
  /** training tokens per step, low and high end */
  tokens: [2.7e9, 3.7e9] as const,
  /** tokens per sequence, low and high end */
  tokensPerSequence: [110_000, 150_000] as const,
} as const;

/** sequences rolled out per step: 1,568 × 16 = 25,088 */
export const SEQUENCES_PER_STEP = RL_SCALE.prompts * RL_SCALE.G;

/** 25,088 → '2만 5천' (rounded down to whole thousands) */
export const manCheon = (n: number): string => {
  const man = Math.floor(n / 10_000);
  const cheon = Math.floor((n % 10_000) / 1000);
  return [man > 0 ? `${man}만` : '', cheon > 0 ? `${cheon}천` : ''].filter(Boolean).join(' ');
};

/** 2.7e9 → '27억' */
export const eok = (n: number): string => `${Math.round(n / 1e8)}억`;

/** 110,000 → '11만' */
export const man = (n: number): string => `${Math.round(n / 10_000)}만`;
