/**
 * MiMo-V2.6 Fig. 11 (§5.4): expert-load statistics of MiMo-V2.6-Pro at
 * decoder layer 9 (384 experts) during RL, with and without the router frozen.
 * Values were read off the figure at 4× zoom — approximate (그래프에서 읽은
 * 근사값). x = training step, starting at 1.
 */

export interface LoadPoint {
  x: number;
  y: number;
}

const steps = (ys: number[]): LoadPoint[] => ys.map((y, i) => ({ x: i + 1, y }));

/** (a) coefficient of variation, std / mean */
export const CV = {
  trainable: steps([
    0.78, 0.71, 0.79, 0.95, 1.07, 1.11, 1.2, 1.28, 1.45, 1.42, 1.58, 1.56, 1.6, 1.64, 1.75, 1.78, 1.82, 1.89, 1.95,
    2.03, 2.02, 1.99,
  ]),
  frozen: steps([
    0.72, 0.73, 0.72, 0.72, 0.69, 0.7, 0.71, 0.73, 0.7, 0.72, 0.71, 0.68, 0.7, 0.68, 0.67, 0.67, 0.65, 0.69, 0.66,
    0.69, 0.67, 0.68, 0.66, 0.67, 0.67, 0.67, 0.67, 0.65,
  ]),
};

/** (b) peak load factor, max / mean */
export const PEAK = {
  trainable: steps([
    6.1, 5.8, 5.7, 7.2, 9.0, 10.3, 11.5, 12.4, 14.0, 13.2, 14.5, 13.2, 13.0, 13.0, 12.9, 13.4, 13.9, 13.7, 14.4, 15.4,
    15.8, 16.0,
  ]),
  frozen: steps([
    5.8, 5.7, 5.8, 6.0, 5.7, 5.8, 5.7, 5.8, 5.5, 5.8, 5.9, 5.4, 5.5, 5.4, 5.3, 5.2, 5.2, 5.4, 5.3, 5.3, 5.4, 5.6, 5.1,
    5.1, 5.3, 5.6, 5.3, 5.4,
  ]),
};

/** (c) cold experts (load < 0.1 × mean), % */
export const COLD = {
  trainable: steps([
    0.5, 0.5, 1.2, 3.4, 4.6, 6.0, 8.3, 10.0, 12.8, 12.8, 15.6, 16.1, 16.6, 17.2, 19.0, 19.6, 20.1, 20.7, 21.6, 23.4,
    22.9, 22.4,
  ]),
  frozen: steps([
    0.5, 0.8, 0.6, 0.8, 0.6, 0.6, 0.6, 0.8, 0.8, 0.6, 0.6, 0.6, 0.6, 0.8, 0.8, 0.6, 0.6, 1.0, 0.6, 1.1, 1.1, 1.3, 1.1,
    0.8, 1.0, 0.8, 1.0, 0.6,
  ]),
};

/**
 * The numbers §5.4 states in its text (not read off the figure): over the
 * first `steps` RL steps of the trainable-Router run each statistic goes
 * `[from, to]`; the frozen-Router run stays near `frozen`.
 */
export const FIG11_TEXT = {
  steps: 20,
  cv: [0.78, 2.0] as const,
  /** max ÷ mean */
  peak: [6, 16] as const,
  /** % of Experts below 0.1 × the mean load */
  cold: [0.5, 22] as const,
  frozen: { cv: 0.7, peak: 5.5, cold: 1 },
  /** Pro: Experts per MoE layer / active per token (Table 1) */
  experts: 384,
  active: 8,
  /** the decoder layer the statistics are taken at */
  layer: 9,
};
