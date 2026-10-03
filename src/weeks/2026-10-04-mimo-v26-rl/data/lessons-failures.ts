/**
 * §5.5 and Fig. 12 — the numbers the failure scene and its notes quote. All of
 * them are the paper's own (the hours are printed at the end of each timeline
 * bar in Fig. 12; the 30× is from the training-failure paragraph of §5.5).
 */
export const RL_STEPS = 30;

/** elapsed hours for the 30 steps, failure and recovery intervals included */
export const ELAPSED_HOURS = { pro: 123.1, flash: 81.8 };

/** one expert-parallel rank received "over 30×" the mean token load inside one micro-batch */
export const EP_PEAK_OVER_MEAN = 30;

/** restarts named in the text */
export const RESTARTS = {
  /** Kubernetes failure crashed pods in the Cyber-task cluster between these steps (Flash) */
  flashKubernetes: [15, 16] as const,
  /** the grader became unreachable over the network after this step (Pro) */
  proGraderAfter: 14,
};

/** mean hours per step, failures included — plain arithmetic on the two totals */
export const hoursPerStep = (hours: number): number => hours / RL_STEPS;
