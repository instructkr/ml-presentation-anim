/**
 * Worked example for 11-prompt-mean (§5.1): two prompts of one training batch,
 * each attempted G = 16 times (§4.1). The attempt lengths are examples (예시),
 * picked near the two ends of what the paper reports for a sequence.
 *
 * token-mean: one average over every response token of the batch, so a prompt's
 * share of the loss is its share of the tokens. prompt-mean (what MiMo uses):
 * each prompt is averaged over its own tokens first, 1/Σᵢ|oᵢ|, then prompts are
 * averaged — every prompt gets the same share.
 */
export const G = 16;

export interface PromptGroup {
  label: string;
  /** generated tokens per attempt, K (예시) */
  tokensPerAttemptK: number;
}

export const GROUPS: PromptGroup[] = [
  { label: '짧은 과제', tokensPerAttemptK: 10 },
  { label: '긴 과제', tokensPerAttemptK: 150 },
];

/** Σᵢ|oᵢ| of each prompt, K tokens */
export const groupTokensK = GROUPS.map((g) => G * g.tokensPerAttemptK);
const totalK = groupTokensK.reduce((a, b) => a + b, 0);

/** share of the loss under token-mean, % */
export const tokenShare = groupTokensK.map((k) => (k / totalK) * 100);
/** share of the loss under prompt-mean, % */
export const promptShare = GROUPS.map(() => 100 / GROUPS.length);

/** how many times more tokens the long prompt has */
export const lengthRatio = Math.max(...groupTokensK) / Math.min(...groupTokensK);

/** 160 → '16만', 2400 → '240만' (K tokens → 만 tokens) */
export const man = (k: number): string => `${Number((k / 10).toFixed(1))}만`;
/** 93.75 → '94%' — the chart and the phrase read the same whole number */
export const pct = (v: number): string => `${Math.round(v)}%`;
