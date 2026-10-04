/**
 * Worked example for 31-re-prefill (§4.1, §6.4): one attempt of 12만 tokens that
 * is interrupted by model updates, drawn on an axis of tokens *processed* —
 * written once, plus read again after every update.
 *
 * Only the order of magnitude is the paper's: a sequence is roughly 11–15만
 * tokens (§4.1). The attempt's exact length and how many tokens it writes
 * between two updates are examples (예시). The lane counts tokens, not time: a
 * token is read again faster than it was written, because reading runs in
 * parallel over the prefix.
 */

/** tokens the attempt writes in all, in 만 (예시) */
export const ATTEMPT = 12;
/** tokens written between two updates when the batch is small (예시) */
export const INTERVAL_OFTEN = 3;
/** … and when the batch is twice as large, so updates come half as often (예시) */
export const INTERVAL_RARE = INTERVAL_OFTEN * 2;

/** the paper's range for one sequence, in 만 tokens (§4.1) */
export const PAPER_SEQUENCE = [11, 15] as const;

export interface Stretch {
  kind: 'write' | 'reread';
  /** position on the processed-token axis, 만 */
  from: number;
  to: number;
}

export interface Timeline {
  stretches: Stretch[];
  /** where each update lands on the processed-token axis */
  updates: number[];
  /** tokens read again, summed over every update, 만 */
  reread: number;
  /** tokens processed in all: written once + read again, 만 */
  total: number;
}

/**
 * Write `interval` tokens, meet an update, read the whole prefix again with the
 * new weights, go on — until the attempt is `attempt` tokens long.
 */
export const timeline = (attempt: number, interval: number): Timeline => {
  const stretches: Stretch[] = [];
  const updates: number[] = [];
  let written = 0;
  let x = 0;
  let reread = 0;
  while (written < attempt) {
    const chunk = Math.min(interval, attempt - written);
    stretches.push({ kind: 'write', from: x, to: x + chunk });
    x += chunk;
    written += chunk;
    if (written < attempt) {
      updates.push(x);
      // the KV cache of everything written so far has to be rebuilt
      stretches.push({ kind: 'reread', from: x, to: x + written });
      x += written;
      reread += written;
    }
  }
  return { stretches, updates, reread, total: x };
};

export const OFTEN = timeline(ATTEMPT, INTERVAL_OFTEN);
export const RARE = timeline(ATTEMPT, INTERVAL_RARE);

/** the first update of the frequent case: everything left of it is the prefix whose cache goes stale */
export const FIRST_UPDATE = OFTEN.updates[0]!;
/** where the frequent case stands once the first prefix has been read again and writing has resumed up to the second update */
export const SECOND_UPDATE = OFTEN.updates[1]!;
