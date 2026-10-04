import { FIG16_SOURCES } from './infra-fig16';

/**
 * Worked example for 30-partial-rollout (§4.1; Kimi k1.5 §2.6.2): six rollout
 * slots, one per data source of Fig. 16, each running attempts as long as that
 * source's mean rollout duration.
 *
 * The durations are the paper's (Fig. 16's legend). Everything else is an
 * example (예시): that there are six slots and each keeps to one source, how
 * many finished attempts fill a batch, and how long Training takes. Nothing
 * below is typed in as a result — the idle share, the moment the batch is full
 * and every segment of the chart follow from those four inputs.
 */

/** the slots, shortest attempts first, so the chart reads as a staircase */
export const SLOTS = [...FIG16_SOURCES].sort((a, b) => a.minutes - b.minutes);
/** minutes one attempt of each slot takes (paper) */
export const DURATIONS = SLOTS.map((s) => s.minutes);
export const SHORTEST = Math.min(...DURATIONS);
export const LONGEST = Math.max(...DURATIONS);
/** the slot whose attempt is the longest */
export const LONGEST_SLOT = DURATIONS.indexOf(LONGEST);

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** a step that waits for every attempt: the share of slot-time spent waiting for the longest one */
export const IDLE_SHARE = 1 - sum(DURATIONS) / (DURATIONS.length * LONGEST);

/** finished attempts that fill one training batch (예시) */
export const BATCH_ATTEMPTS = 8;
/** minutes Training takes before the next rollout phase (예시) */
export const TRAIN_GAP = 8;
/** right end of the chart, minutes */
export const HORIZON = 64;

const EPS = 1e-9;

export interface Span {
  slot: number;
  from: number;
  to: number;
}

/** attempts run back to back from `start` in every slot, listed until they pass `horizon` */
const backToBack = (starts: number[], horizon: number): Span[] =>
  DURATIONS.flatMap((d, slot) => {
    const out: Span[] = [];
    for (let from = starts[slot]!; from < horizon - EPS; from += d) out.push({ slot, from, to: from + d });
    return out;
  });

/** the first rollout phase with freed slots refilled at once */
const PHASE_1 = backToBack(
  DURATIONS.map(() => 0),
  LONGEST,
);

/** the first attempt of every slot — all a synchronous step runs */
export const FIRST = PHASE_1.filter((a) => a.from === 0);
/** the attempts that take over a freed slot */
export const REFILLS = PHASE_1.filter((a) => a.from > 0);
/** what a synchronous step leaves empty: each slot from its attempt's end to the longest one's */
export const IDLE: Span[] = FIRST.filter((a) => a.to < LONGEST - EPS).map((a) => ({ slot: a.slot, from: a.to, to: LONGEST }));

/** the batch is full when the N-th attempt finishes */
export const CUT = PHASE_1.map((a) => a.to).sort((a, b) => a - b)[BATCH_ATTEMPTS - 1]!;
/** attempts finished by then, per slot */
export const FINISHED_PER_SLOT = DURATIONS.map((_, slot) => PHASE_1.filter((a) => a.slot === slot && a.to <= CUT + EPS).length);
/** attempts still being written when the batch is collected */
export const IN_FLIGHT = PHASE_1.filter((a) => a.from < CUT - EPS && a.to > CUT + EPS);

/** the next rollout phase starts once Training has updated the model */
export const RESUME = CUT + TRAIN_GAP;

/** the rest of every interrupted attempt, written by the updated model */
export const CONTINUED: Span[] = IN_FLIGHT.map((a) => ({ slot: a.slot, from: RESUME, to: RESUME + (a.to - CUT) }));
/** new attempts of the next phase: after the continued one, or straight away in a slot that had nothing in flight */
export const NEXT: Span[] = backToBack(
  DURATIONS.map((_, slot) => CONTINUED.find((a) => a.slot === slot)?.to ?? RESUME),
  HORIZON,
);

/** how far the longest slot's attempt had got when it was stopped, as a share of its length */
export const LONGEST_DONE_SHARE = CUT / LONGEST;
