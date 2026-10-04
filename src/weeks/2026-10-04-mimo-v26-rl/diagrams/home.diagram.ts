import { defineDiagram } from '@/lib/diagram';

/**
 * Home of the MiMo-V2.6 RL talk: the table of contents. The talk is one linear
 * story, so the home is not an architecture but ten chapter cards in a 5 × 2
 * grid — a card per chapter, its scenes listed top to bottom. Cards read left to
 * right, then the second row: the same order as the guided path (N/P, Space).
 *
 *   1 · RL 전 준비 (§3.2)            Mid-training → Muon → Muown
 *   2 · RL 한 스텝과 Eq. 1 (§4.1)     the loop, then Eq. 1 one term at a time
 *   3 · Eq. 1의 보정 (§5.1)           ratio r, mask M, prompt-mean
 *   4 · 환경과 harness (§4.2)
 *   5 · 채점: GRS와 GAR (§4.3)
 *   6 · 길이와 토큰 감점 (§4.3.3)
 *   7 · 끊어 쓰고 맞추기 (§4.1, §6.4)   partial rollout, re-prefill, the two engines, R3, top-p
 *   8 · 배치 채우기 (§6.2–6.3)          dynamic sampler, Sample Mixer, Payload Porter
 *   9 · 30 스텝의 교훈 (§5.3–5.5)
 *  10 · MOPD2와 결과 (§5.6)
 *
 * 7 and 8 are the last paragraph of §4.1 (from "we leave the in-flight sequences
 * interrupted" on) with the detail §6 gives it. They sit after the grading
 * chapters and before the lessons, because the failures of §5.5 are failures of
 * exactly this machinery. Their scenes are numbered 30–39: they were written
 * after 24–29, and a scene id is a name, not a position — the order of the talk
 * is the order of this list.
 *
 * The grid is sized to a 16:9 screen (about 1940 × 1010 units), and a card is
 * narrow and tall, so the detail view's side rail can show the current chapter
 * legibly. Chapters that share a paper section share a colour (2–3 are Eq. 1,
 * 5–6 are §4.3, 7–8 are the infrastructure).
 *
 * Node ids are the week's contract: every track keys its `details` and its
 * notes on them. A label has to fit one line of a node: about ten Korean
 * characters.
 */

const COLUMNS = 5;
const NODE = { w: 304, h: 60 };
/** node pitch inside a card */
const PITCH_Y = 84;
/** card padding; the top one leaves room for the label chip (fit rule 9) */
const PAD = { x: 28, top: 58, bottom: 28 };
const CARD_W = NODE.w + PAD.x * 2;
/** a card hugs its scenes, so a short chapter leaves no empty box */
const cardHeight = (scenes: number) => PAD.top + (scenes - 1) * PITCH_Y + NODE.h + PAD.bottom;
const GAP = { x: 36, y: 44 };

interface Chapter {
  id: string;
  label: string;
  variant: string;
  nodes: [id: string, label: string][];
}

const CHAPTERS: Chapter[] = [
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
    label: '2 · RL 한 스텝과 Eq. 1 (§4.1)',
    variant: 'attention',
    nodes: [
      ['step', 'RL 한 스텝'],
      ['logprob', 'log π'],
      ['advantage', '평균과의 차이'],
      ['zero', '차이의 합은 0'],
      ['loss', 'Eq. 1'],
    ],
  },
  {
    id: 'g-fix',
    label: '3 · Eq. 1의 보정 (§5.1)',
    variant: 'attention',
    nodes: [
      ['ratio', '비율 r'],
      ['mask', '마스크 M'],
      ['mean', 'prompt-mean'],
    ],
  },
  {
    id: 'g-env',
    label: '4 · 환경과 harness (§4.2)',
    variant: 'embed',
    nodes: [
      ['tasks', '과제 구성'],
      ['hack', 'hacking 막기'],
      ['harness', 'harness 섞기'],
    ],
  },
  {
    id: 'g-grade',
    label: '5 · 채점: GRS와 GAR (§4.3)',
    variant: 'ffn',
    nodes: [
      ['rubric', 'GRS: rubric'],
      ['grs', 'GRS: 점수'],
      ['grader', 'GAR: Grader'],
      ['gar', 'GAR: 나누기'],
      ['effect', 'GAR의 효과'],
    ],
  },
  {
    id: 'g-penalty',
    label: '6 · 길이와 토큰 감점 (§4.3.3)',
    variant: 'ffn',
    nodes: [
      ['length', '기준 길이'],
      ['penalty', '길이 감점'],
      ['segment', '토큰 감점: 성공'],
      ['punish', '토큰 감점: 실패'],
    ],
  },
  {
    id: 'g-rollout',
    label: '7 · 끊어 쓰고 맞추기 (§4.1)',
    variant: 'red',
    nodes: [
      ['partial', 'partial rollout'],
      ['prefill', 're-prefill'],
      ['engines', '두 엔진'],
      ['r3', 'R3'],
      ['topp', 'top-p 후보'],
    ],
  },
  {
    id: 'g-batch',
    label: '8 · 배치 채우기 (§6.2–6.3)',
    variant: 'red',
    nodes: [
      ['sampler', 'dynamic sampler'],
      ['mixer', 'Mixer: 몫'],
      ['schedule', 'Mixer: 순서'],
      ['dispatch', 'Mixer: 자리'],
      ['porter', 'Payload Porter'],
    ],
  },
  {
    id: 'g-lessons',
    label: '9 · 30 스텝의 교훈 (§5.3–5.5)',
    variant: 'route',
    nodes: [
      ['tokens', '점수와 토큰'],
      ['router', 'Router 얼리기'],
      ['failures', '멈춘 자리'],
    ],
  },
  {
    id: 'g-distill',
    label: '10 · MOPD2와 결과 (§5.6)',
    variant: 'teal',
    nodes: [
      ['opd', 'MOPD2'],
      ['prefix', '이력 고정'],
      ['results', '결과'],
    ],
  },
];

/** the second row starts under the tallest card of the first */
const ROW_PITCH = cardHeight(Math.max(...CHAPTERS.map((c) => c.nodes.length))) + GAP.y;

/** top-left corner of the i-th card */
const card = (i: number) => ({
  x: (i % COLUMNS) * (CARD_W + GAP.x),
  y: Math.floor(i / COLUMNS) * ROW_PITCH,
});

export const homeDiagram = defineDiagram({
  id: 'mimo-v26-rl-home',
  direction: 'TB',
  groups: CHAPTERS.map((chapter, i) => ({
    id: chapter.id,
    label: chapter.label,
    rect: { ...card(i), w: CARD_W, h: cardHeight(chapter.nodes.length) },
  })),
  nodes: CHAPTERS.flatMap((chapter, i) =>
    chapter.nodes.map(([id, label], row) => ({
      id,
      label,
      variant: chapter.variant,
      parent: chapter.id,
      size: NODE,
      position: { x: card(i).x + PAD.x, y: card(i).y + PAD.top + row * PITCH_Y },
    })),
  ),
  edges: CHAPTERS.flatMap((chapter) =>
    chapter.nodes
      .slice(1)
      .map(([id], i) => ({ id: `e-${chapter.nodes[i]![0]}-${id}`, from: chapter.nodes[i]![0], to: id })),
  ),
});

/** the guided path: every scene, chapter by chapter */
export const homePath = CHAPTERS.flatMap((chapter) => chapter.nodes.map(([id]) => id));
