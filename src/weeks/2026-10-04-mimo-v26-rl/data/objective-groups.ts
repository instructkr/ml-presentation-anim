import { RL_SCALE } from './objective-rl-scale';

/**
 * Three groups for 06-group-advantage (예시): the same task attempted G = 16
 * times (the paper's group size, §4.1), scored 1 for a pass and 0 for a fail.
 * The gap from the group's average is the paper's advantage, A_i = R_i − R̄
 * (§4.3.2; no division by the group's standard deviation).
 *
 * Which attempts pass is made up. Every number the scene and its notes show —
 * the averages, the gaps, the pass counts — is computed here from those 0/1
 * scores.
 */
export const G = RL_SCALE.G;

const passing = (idx: number[]) => Array.from({ length: G }, (_, i) => (idx.includes(i) ? 1 : 0));

export const mean = (r: number[]): number => r.reduce((a, b) => a + b, 0) / r.length;
/** A_i = R_i − R̄ */
export const gap = (r: number[]): number[] => r.map((v) => v - mean(r));
/** how many of the group passed */
export const passCount = (r: number[]): number => r.filter((v) => v === 1).length;

/** task A: 10 of 16 pass → average 0.625 */
export const R_A = [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0];
/** task B, harder: 2 of 16 pass → average 0.125, so a pass lands +0.875 above it */
export const B_PASS = [5, 11];
export const R_B = passing(B_PASS);
/** task C, easy: all pass → average 1, every gap is 0 */
export const R_C = passing(Array.from({ length: G }, (_, i) => i));

export const A_A = gap(R_A);
export const A_B = gap(R_B);
export const A_C = gap(R_C);

/** the two values a gap takes in a 0/1 group: what a pass gets and what a fail gets */
export const passGap = (r: number[]): number => 1 - mean(r);
export const failGap = (r: number[]): number => 0 - mean(r);

/** '+0.375' / '−0.625' / '0', with a true minus sign (for running text and bar labels) */
export const signed = (v: number): string => (Math.abs(v) < 5e-4 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v)}`);
