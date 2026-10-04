import { FIG16_SOURCES, sourceIndex, toShares, type MixerSource } from './infra-fig16';

/**
 * Adaptive Rollout Scheduling (§6.3, Eq. 7) on the six sources of Fig. 16:
 *
 *   w_i = α · B_i / r_i + (1 − α) · (B_i − A_i)⁺ / r_i
 *
 * B_i and r_i are the paper's (the legend of Fig. 16). The snapshot — how much
 * of its target each source has already collected in the middle of a step — is
 * an example: the fast sources are full or nearly full, the slow ones far
 * behind. The weights drive a weighted round-robin, so only their proportions
 * matter; they are drawn as shares of their total.
 */
export const LABELS = FIG16_SOURCES.map((s) => s.label);

/** share of its target each source has collected so far, 0..1 (예시) */
const COLLECTED: Record<MixerSource['id'], number> = {
  chat: 0.9,
  visual: 1.0,
  general: 0.85,
  cyber: 0.2,
  code1: 0.6,
  code2: 0.35,
};

/** A_i / B_i in percent, in the legend's order */
export const collectedPct = FIG16_SOURCES.map((s) => COLLECTED[s.id] * 100);
/** A_i: groups already accepted for the current batch, in the units of B_i */
const accepted = FIG16_SOURCES.map((s) => COLLECTED[s.id] * s.target);

const positive = (x: number): number => Math.max(x, 0);

/** Eq. 7 for every source */
export const weights = (alpha: number): number[] =>
  FIG16_SOURCES.map((s, i) => (alpha * s.target) / s.accept + ((1 - alpha) * positive(s.target - accepted[i]!)) / s.accept);

/** α = 1: the target term alone */
export const targetOnly = toShares(weights(1));
/** α = 0: the deficit term alone */
export const deficitOnly = toShares(weights(0));
/** the mix the paper's simulation calls deficit-corrected */
export const ALPHA = 0.5;
export const blended = toShares(weights(ALPHA));

/** sources that have already met their target in the snapshot */
export const FULL = FIG16_SOURCES.flatMap((s, i) => (COLLECTED[s.id] >= 1 ? [i] : []));
export const fullSource = FIG16_SOURCES[FULL[0]!]!;
/** the two sources furthest behind — they take most of the deficit-only weight */
export const BEHIND = [...FIG16_SOURCES]
  .sort((a, b) => COLLECTED[a.id] - COLLECTED[b.id])
  .slice(0, 2)
  .map((s) => sourceIndex(s.id));
export const behindShare = (shares: number[]): number => BEHIND.reduce((sum, i) => sum + shares[i]!, 0);

export const at = (shares: number[], id: MixerSource['id']): number => shares[sourceIndex(id)]!;

/** 47.13 → '47.1%' */
export const pct = (v: number): string => `${v.toFixed(1)}%`;
/** 90 → '90%' */
export const whole = (v: number): string => `${Math.round(v)}%`;
