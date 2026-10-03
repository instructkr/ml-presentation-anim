import { defineDiagram } from '@/lib/diagram';

/**
 * Home of the MiMo-V2.6 RL talk: the training recipe in the order the talk
 * goes through it. One row per stage of the story, one node per scene, read
 * left to right and top to bottom — the same order as the guided path (N/P).
 *
 *   1 · RL 전 준비 (§3.2)          Mid-training → AdamW → Muon → Muown
 *   2 · RL 한 스텝과 Eq. 1 (§4.1)   the loop, then Eq. 1 one term at a time
 *   3 · 환경과 harness (§4.2)
 *   4 · 채점 (§4.3)                GRS → GAR → length penalty → token penalties
 *   5 · 30 스텝의 교훈 (§5.3–5.5)
 *   6 · MOPD2와 결과 (§5.6)
 *
 * Node ids are the week's contract: every track keys its `details` and its
 * notes on them. Hand-positioned so the rows share one left edge and one pitch.
 * A label has to fit one line of a node: about seven Korean characters.
 */

const NODE = { w: 236, h: 64 };
const PITCH_X = 268;
const PITCH_Y = 196;
const LEFT = 56;
const TOP = 84;
/** group box padding; the top one leaves room for the label chip (fit rule 9) */
const PAD = { x: 28, top: 56, bottom: 26 };

interface Row {
  id: string;
  label: string;
  variant: string;
  nodes: [id: string, label: string][];
}

const ROWS: Row[] = [
  {
    id: 'g-prep',
    label: '1 · RL 전 준비 (§3.2)',
    variant: 'proj',
    nodes: [
      ['midtrain', 'Mid-training'],
      ['muon', 'Muon'],
      ['muown', 'Muown'],
    ],
  },
  {
    id: 'g-step',
    label: '2 · RL 한 스텝과 Eq. 1 (§4.1, §5.1)',
    variant: 'attention',
    nodes: [
      ['step', 'RL 한 스텝'],
      ['logprob', 'log π'],
      ['advantage', '평균과의 차이'],
      ['zero', '차이의 합은 0'],
      ['loss', 'Eq. 1'],
      ['ratio', '비율 r'],
      ['mask', '마스크 M'],
      ['mean', 'prompt-mean'],
    ],
  },
  {
    id: 'g-env',
    label: '3 · 환경과 harness (§4.2)',
    variant: 'embed',
    nodes: [
      ['tasks', '과제 구성'],
      ['hack', 'hacking 막기'],
      ['harness', 'harness 섞기'],
    ],
  },
  {
    id: 'g-grade',
    label: '4 · 채점 (§4.3)',
    variant: 'ffn',
    nodes: [
      ['rubric', 'GRS: rubric'],
      ['grs', 'GRS: 점수'],
      ['grader', 'GAR: Grader'],
      ['gar', 'GAR: 나누기'],
      ['effect', 'GAR의 효과'],
      ['length', '기준 길이'],
      ['penalty', '길이 감점'],
      ['segment', '토큰 감점: 성공'],
      ['punish', '토큰 감점: 실패'],
    ],
  },
  {
    id: 'g-lessons',
    label: '5 · 30 스텝의 교훈 (§5.3–5.5)',
    variant: 'route',
    nodes: [
      ['tokens', '점수와 토큰'],
      ['router', 'Router 얼리기'],
      ['failures', '멈춘 자리'],
    ],
  },
  {
    id: 'g-distill',
    label: '6 · MOPD2와 결과 (§5.6)',
    variant: 'expertShared',
    nodes: [
      ['opd', 'MOPD2'],
      ['prefix', '이력 고정'],
      ['results', '결과'],
    ],
  },
];

const x = (col: number) => LEFT + col * PITCH_X;
const y = (row: number) => TOP + row * PITCH_Y;

export const homeDiagram = defineDiagram({
  id: 'mimo-v26-rl-home',
  direction: 'LR',
  groups: ROWS.map((row, r) => ({
    id: row.id,
    label: row.label,
    rect: {
      x: x(0) - PAD.x,
      y: y(r) - PAD.top,
      w: (row.nodes.length - 1) * PITCH_X + NODE.w + PAD.x * 2,
      h: NODE.h + PAD.top + PAD.bottom,
    },
  })),
  nodes: ROWS.flatMap((row, r) =>
    row.nodes.map(([id, label], c) => ({
      id,
      label,
      variant: row.variant,
      parent: row.id,
      size: NODE,
      position: { x: x(c), y: y(r) },
    })),
  ),
  edges: ROWS.flatMap((row) =>
    row.nodes.slice(1).map(([id], i) => ({ id: `e-${row.nodes[i]![0]}-${id}`, from: row.nodes[i]![0], to: id })),
  ),
});

/** the guided path: every node, row by row */
export const homePath = ROWS.flatMap((row) => row.nodes.map(([id]) => id));
