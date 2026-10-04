import { FIG16_SOURCES, source, sourceIndex, toShares, type MixerSource } from './infra-fig16';

/**
 * Adaptive Rollout Concurrency (§6.3, Eq. 6) on the six sources of Fig. 16.
 * Everything here is the paper's legend (target share B_i, acceptance rate r_i,
 * mean rollout duration t_i) or arithmetic on it:
 *
 *   m_i = B_i / r_i        groups that must be generated to keep B_i
 *   t_i · m_i              what the required concurrency scales with
 *
 * Each is drawn as a share of its total, so the three sit on one percent axis.
 * The last one reproduces the flat occupancy lines of Fig. 16's bottom row
 * (Code 2 ≈ 0.42, Code 1 ≈ Cyber ≈ 0.23, Chat ≈ 0.05), which is the check that
 * the legend's mean duration is the right t_i to use.
 */
export const LABELS = FIG16_SOURCES.map((s) => s.label);

/** B_i: share of the retained groups of one training step, percent */
export const targetShare = FIG16_SOURCES.map((s) => s.target);

/** m_i = B_i / r_i, in groups per 100 retained groups */
export const demand = FIG16_SOURCES.map((s) => s.target / s.accept);
export const demandShare = toShares(demand);
/** groups that have to be generated for every 100 the batch keeps */
export const DEMAND_PER_100 = demand.reduce((a, b) => a + b, 0);

/** t_i · m_i — proportional to the rollouts a source keeps running at once */
export const concurrency = FIG16_SOURCES.map((s, i) => s.minutes * demand[i]!);
export const concurrencyShare = toShares(concurrency);

const byMinutes = [...FIG16_SOURCES].sort((a, b) => b.minutes - a.minutes);
/** the two slowest sources — where the oversampling of Eq. 6 is largest */
export const SLOWEST = byMinutes.slice(0, 2).map((s) => sourceIndex(s.id));
export const slowest = byMinutes[0]!;
export const fastest = byMinutes[byMinutes.length - 1]!;
/** the lowest and highest acceptance rate of the six */
export const acceptRange = {
  lo: Math.min(...FIG16_SOURCES.map((s) => s.accept)),
  hi: Math.max(...FIG16_SOURCES.map((s) => s.accept)),
};

/** what the scene reads out for one source */
export const read = (id: MixerSource['id']) => {
  const i = sourceIndex(id);
  return { ...source(id), index: i, demandShare: demandShare[i]!, concurrencyShare: concurrencyShare[i]! };
};

/** 41.66 → '41.7' */
export const one = (v: number): string => v.toFixed(1);
/** 28.6 → '28.6%' */
export const pct = (v: number): string => `${one(v)}%`;
