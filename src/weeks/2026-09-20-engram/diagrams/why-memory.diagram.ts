import { defineDiagram } from '@/lib/diagram';

/**
 * The problem Engram solves, on the entity example the paper reproduces from
 * Ghandeharioun et al. (2024) (Engram §6.1, Table 3): the hidden state of the
 * last token "Wales" only becomes "Diana, Princess of Wales" after six layers.
 * Left column = those layers; right column = the same answer by one lookup.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const WORDS = ['Diana', ',', 'Princess', 'of', 'Wales'];
const TOK_Y = 540;
const tokW = (s: string) => Math.max(52, Math.round(s.length * 15.1 + 36));
const tokX: number[] = [];
WORDS.reduce((x, w) => {
  tokX.push(x + tokW(w) / 2);
  return x + tokW(w) + 14;
}, 260);

const STACK_X = tokX[4]!; // above "Wales"
const LOOK_X = 1300;
const LAYERS = [
  { id: 'l12', label: 'L1–2 · 영국의 나라', y: 450 },
  { id: 'l3', label: 'L3 · 유럽의 나라', y: 370 },
  { id: 'l4', label: 'L4 · 여왕의 칭호', y: 290 },
  { id: 'l5', label: 'L5 · 왕세자비라는 칭호', y: 210 },
  { id: 'l6', label: 'L6 · 다이애나 왕세자비', y: 130 },
];

export const whyMemoryDetail = defineDiagram({
  id: 'engram-why-memory',
  direction: 'TB',
  groups: [
    {
      id: 'last3',
      title: '3-gram (Princess, of, Wales)',
      rect: {
        x: tokX[2]! - tokW('Princess') / 2 - 9,
        y: TOK_Y - 34,
        w: tokX[4]! + tokW('Wales') / 2 - (tokX[2]! - tokW('Princess') / 2) + 18,
        h: 68,
      },
    },
  ],
  nodes: [
    // frame-0 anchor: the sentence
    ...WORDS.map((w, i) => ({
      id: `tok-${i}`,
      kind: 'io' as const,
      label: w,
      variant: 'io',
      ...at(tokX[i]!, TOK_Y, tokW(w), 50),
    })),

    // left: what the backbone does without memory
    ...LAYERS.map((l) => ({ id: l.id, label: l.label, variant: 'attention', ...at(STACK_X, l.y, 400, 56) })),
    { id: 'cost-l', kind: 'annotation' as const, label: '층 여섯 개를 들여 조립', variant: 'annotation', ...at(STACK_X - 400, 290, 300, 46) },

    // right: the same answer by lookup
    { id: 'hash', kind: 'op' as const, label: '해시 → 행 번호', variant: 'norm', ...at(LOOK_X, 400, 260, 56) },
    { id: 'table', label: 'N-gram 테이블', variant: 'embed', ...at(LOOK_X, 270, 300, 64) },
    { id: 'vec', label: '완성된 벡터 한 줄', variant: 'route', ...at(LOOK_X, 130, 300, 56) },
    { id: 'cost-r', kind: 'annotation' as const, label: '조회 한 번', variant: 'annotation', ...at(LOOK_X + 280, 270, 180, 46) },
  ],
  edges: [
    { id: 'e-tok-4-l12', from: 'tok-4', to: 'l12' },
    { id: 'e-l12-l3', from: 'l12', to: 'l3' },
    { id: 'e-l3-l4', from: 'l3', to: 'l4' },
    { id: 'e-l4-l5', from: 'l4', to: 'l5' },
    { id: 'e-l5-l6', from: 'l5', to: 'l6' },
    { id: 'e-last3-hash', from: 'last3', to: 'hash', waypoints: [{ x: LOOK_X, y: TOK_Y }] },
    { id: 'e-hash-table', from: 'hash', to: 'table' },
    { id: 'e-table-vec', from: 'table', to: 'vec' },
    { id: 'e-l6-vec', from: 'l6', to: 'vec', style: 'dashed', arrow: false, label: '같은 답' },
  ],
});

export const whyMemoryIds = {
  layers: ['l12', 'l3', 'l4', 'l5', 'l6', 'e-tok-4-l12', 'e-l12-l3', 'e-l3-l4', 'e-l4-l5', 'e-l5-l6', 'cost-l'],
  lookup: ['hash', 'table', 'vec', 'e-last3-hash', 'e-hash-table', 'e-table-vec', 'cost-r'],
  same: ['e-l6-vec'],
};
