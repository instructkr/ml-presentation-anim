/**
 * The six data sources of the trace-driven scheduling simulation (§6.3, the
 * legend of Fig. 16): each source's share of a training batch, its mean rollout
 * duration and its group acceptance rate. These are the paper's numbers, not
 * examples; the infrastructure scenes (30–39) read them from here.
 *
 * The durations are "calibrated to each source's mean rollout time at End in
 * Figure 15" (§6.3), so they stand for the last steps of the run. The paper's
 * t_i is the *active* rollout duration (generation and environment time, pauses
 * between training steps excluded); the legend prints a mean duration, and the
 * scenes use it as t_i.
 */
export interface MixerSource {
  id: 'chat' | 'visual' | 'general' | 'cyber' | 'code1' | 'code2';
  /** the legend's name */
  label: string;
  /** target share of the retained groups of one training step, percent (B_i) */
  target: number;
  /** mean rollout duration, minutes (t_i) */
  minutes: number;
  /** group acceptance rate, 0..1 (r_i) */
  accept: number;
}

/** in the legend's order */
export const FIG16_SOURCES: MixerSource[] = [
  { id: 'chat', label: 'Chat', target: 7.0, minutes: 16.4, accept: 0.641 },
  { id: 'visual', label: 'Visual', target: 9.0, minutes: 12.1, accept: 1.0 },
  { id: 'general', label: 'General', target: 7.0, minutes: 14.2, accept: 0.615 },
  { id: 'cyber', label: 'Cyber', target: 14.3, minutes: 50.7, accept: 0.89 },
  { id: 'code1', label: 'Code 1', target: 34.1, minutes: 24.1, accept: 0.995 },
  { id: 'code2', label: 'Code 2', target: 28.6, minutes: 37.2, accept: 0.71 },
];

export const sourceIndex = (id: MixerSource['id']): number => FIG16_SOURCES.findIndex((s) => s.id === id);
export const source = (id: MixerSource['id']): MixerSource => FIG16_SOURCES[sourceIndex(id)]!;

/** §6.3, Fig. 15: across 25 profiled sources the mean generated tokens vary 90×, the active rollout duration 66× */
export const FIG15_SPREAD = { sources: 25, tokens: 90, duration: 66 } as const;

/** each value as a percentage of the total, so shares of different things can be drawn on one axis */
export const toShares = (values: number[]): number[] => {
  const total = values.reduce((a, b) => a + b, 0);
  return values.map((v) => (v / total) * 100);
};
