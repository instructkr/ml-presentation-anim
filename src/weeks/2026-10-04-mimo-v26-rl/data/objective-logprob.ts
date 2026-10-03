/**
 * Worked example for 05-logprob (예시): the model has written `return a` and is
 * about to pick the next token. Five candidates carry all of the probability
 * here; a real vocabulary has tens of thousands.
 *
 * Nothing below is typed in as a result. The starting probabilities are the
 * softmax of the logits, and the two "after" distributions come from one
 * policy-gradient step on those logits:
 *
 *   Δlogit_k = η · A · (1[k = chosen] − p_k)
 *
 * which is the gradient of A · log p_chosen with respect to the logits. A > 0
 * (a good attempt) raises the chosen token, A < 0 (a bad one) lowers it, and
 * because probabilities sum to 1 every other candidate moves the opposite way.
 * η and |A| are examples chosen so the move is visible.
 */

/** candidate next tokens after `return a` */
export const TOKENS = ['+', '−', '*', ')', ';'];
/** what the model was about to assign to each candidate (예시) */
const START = [0.55, 0.2, 0.12, 0.08, 0.05];
/** the token the model actually wrote */
export const CHOSEN = 0;

/** step size on the logits (예시) */
export const ETA = 0.5;
/** the attempt's weight: +1 for a good attempt, −1 for a bad one (예시; a real A is the gap from the group average) */
export const A_GOOD = 1;
export const A_BAD = -1;

export const softmax = (z: number[]): number[] => {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
};

const LOGITS = START.map((p) => Math.log(p));

/** π_θ(· | q, o_<t) before any update */
export const P = softmax(LOGITS);

/** one gradient step on A · log p_chosen, taken in logit space */
export const pushed = (logits: number[], chosen: number, advantage: number, eta: number): number[] => {
  const p = softmax(logits);
  return softmax(logits.map((z, k) => z + eta * advantage * ((k === chosen ? 1 : 0) - p[k]!)));
};

/** after a good attempt: the chosen token goes up, the rest give up share */
export const P_UP = pushed(LOGITS, CHOSEN, A_GOOD, ETA);
/** after a bad attempt: the chosen token goes down, the rest take the share */
export const P_DOWN = pushed(LOGITS, CHOSEN, A_BAD, ETA);

/** two decimals, as the bars are labelled */
export const prob = (v: number): string => v.toFixed(2);
