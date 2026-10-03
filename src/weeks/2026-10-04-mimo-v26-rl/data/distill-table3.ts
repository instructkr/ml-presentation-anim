/**
 * Table 3 (p26): MiMo-V2.6 against the previous generation and three frontier
 * models on agentic benchmarks, as printed. `null` is a "-" in the table.
 * These are the final models, after MOPD2 (§5.6).
 *
 * 29-results draws only the DeepSWE v1.1 row; the other rows are here so the
 * notes can read a few of them out without retyping numbers.
 */
export const MODELS = ['MiMo-V2.6 Pro', 'MiMo-V2.6 Flash', 'MiMo-V2.5 Pro', 'Claude Opus 5', 'GPT-5.6 Sol', 'Claude Fable 5'] as const;
export type Model = (typeof MODELS)[number];

type Row = Record<Model, number | null>;

const row = (...v: (number | null)[]): Row =>
  Object.fromEntries(MODELS.map((m, i) => [m, v[i] ?? null])) as Row;

/** columns in the order of `MODELS` */
export const TABLE3 = {
  // Code Agent
  'DeepSWE v1.1': row(71.9, 67.9, 19.0, 74.0, 73.0, 70.0),
  ProgramBench: row(26.5, 26.0, 12.5, 37.0, 25.0, 33.0),
  'MiMo Code Bench': row(63.2, 61.2, 40.4, 68.6, 59.3, null),
  // General Agent
  'AutomationBench v1.0.6': row(53.1, 52.3, 16.0, 50.3, 45.8, 46.2),
  'Toolathlon-Verified': row(76.9, 73.6, 49.1, 80.6, 74.9, 77.9),
  'GDPval-AA 2.1': row(1673, null, 1107, 1708, 1588, 1595),
  "Agents' Last Exam": row(31.6, 27.6, 13.2, 31.6, 30.8, 25.7),
  'Terminal Bench 4.0': row(34.9, 28.8, 1.5, 49.0, 39.9, 42.4),
  'Terminal Bench 2.1': row(89.9, 87.6, 65.2, 89.1, 88.8, 84.3),
  'OSWorld-Verified': row(82.0, 80.8, null, 83.4, 83.0, 86.0),
  JobBench: row(62.0, 61.2, 25.0, 65.7, 45.4, 57.4),
  // Cybersecurity
  CyberGym: row(94.0, 95.1, 40.0, null, null, null),
  'MiMo Cyber Bench': row(80.2, 77.2, 0.0, null, null, null),
  ExploitGym: row(17.8, 6.0, 0.2, 22.1, 30.3, 28.4),
  ExploitBench: row(47.9, 25.3, 16.6, 70.0, 78.5, 78.0),
  'SEC Bench Pro': row(66.3, 47.5, 17.7, null, 79.1, null),
  // Visual Agent
  'MiMo Visual Coding': row(72.3, 71.5, null, 70.0, 73.4, 69.1),
} satisfies Record<string, Row>;

export type Benchmark = keyof typeof TABLE3;

export const MIMO: Model[] = ['MiMo-V2.5 Pro', 'MiMo-V2.6 Flash', 'MiMo-V2.6 Pro'];
export const FRONTIER: Model[] = ['Claude Fable 5', 'GPT-5.6 Sol', 'Claude Opus 5'];

/** the bars of 29-results, top to bottom: the MiMo line first, then the frontier models by score */
export const DEEPSWE_ORDER: Model[] = [...MIMO, ...FRONTIER];
export const deepswe = DEEPSWE_ORDER.map((model) => ({ model, score: TABLE3['DeepSWE v1.1'][model]! }));

const scoreOf = (bench: Benchmark, model: Model): number => TABLE3[bench][model]!;

/** the highest frontier score on a benchmark, with who holds it */
export const bestFrontier = (bench: Benchmark): { model: Model; score: number } =>
  FRONTIER.filter((m) => TABLE3[bench][m] !== null)
    .map((model) => ({ model, score: scoreOf(bench, model) }))
    .reduce((a, b) => (b.score > a.score ? b : a));

// ── what 29-results says out loud ───────────────────────────────────────────
export const PREV = scoreOf('DeepSWE v1.1', 'MiMo-V2.5 Pro');
export const PRO = scoreOf('DeepSWE v1.1', 'MiMo-V2.6 Pro');
export const BEST = bestFrontier('DeepSWE v1.1');
/** how far MiMo-V2.6 Pro is behind the best frontier model on DeepSWE v1.1 */
export const GAP_TO_BEST = BEST.score - PRO;

/**
 * §4.1 (not Table 3): DeepSWE v1.1 average@3 of MiMo-V2.6-Pro at the start and
 * at the end of the 30 RL steps. The pre-RL checkpoint already scored 58.4, so
 * of the jump from the previous generation, this stretch is what RL itself added.
 */
export const RL_RUN = { start: 58.4, end: 72.6 };
