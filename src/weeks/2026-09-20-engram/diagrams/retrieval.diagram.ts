import { defineDiagram } from '@/lib/diagram';

/**
 * Engram §2.2 retrieval for the current token t = "Great", left to right:
 * raw tokens → tokenizer compression P → suffix 2-/3-grams → two hash heads
 * per order → one row from each head's table → concatenated memory eₜ.
 * The figure shows K = 2 heads per order; V4.1 uses 8.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const X = { raw: 110, canon: 390, gram: 750, hash: 1110, row: 1330, cat: 1560 };
const TOK_Y = [120, 230, 340];
const G2_Y = 150;
const G3_Y = 410;
const HASH_Y = { '2-1': 80, '2-2': 220, '3-1': 340, '3-2': 480 } as const;
const HEADS = ['2-1', '2-2', '3-1', '3-2'] as const;
const sub = (h: string) => h.replace('-', ',');

export const retrievalDetail = defineDiagram({
  id: 'engram-retrieval',
  direction: 'LR',
  groups: [{ id: 'compress', label: 'P: 정규화', rect: { x: X.canon - 105, y: 40, w: 210, h: 345 } }],
  nodes: [
    // frame-0 anchor: the raw tokenizer output
    ...['␣Alexander', '␣the', '␣Great'].map((w, i) => ({
      id: `raw-${i}`,
      kind: 'io' as const,
      label: w,
      variant: 'io',
      ...at(X.raw, TOK_Y[i]!, 190, 52),
    })),
    ...['alexander', 'the', 'great'].map((w, i) => ({
      id: `canon-${i}`,
      kind: 'io' as const,
      label: w,
      variant: 'embed',
      ...at(X.canon, TOK_Y[i]!, 170, 52),
    })),
    { id: 'g2', kind: 'io' as const, label: '(the, great)', title: '2-gram', variant: 'io', ...at(X.gram, G2_Y, 250, 56) },
    { id: 'g3', kind: 'io' as const, label: '(alexander, the, great)', title: '3-gram', variant: 'io', ...at(X.gram, G3_Y, 400, 56) },
    ...HEADS.map((h) => ({
      id: `h${h}`,
      kind: 'op' as const,
      label: `\\varphi_{${sub(h)}}`,
      title: `해시 헤드 (${sub(h)})`,
      math: true,
      variant: 'norm',
      shape: 'pill' as const,
      ...at(X.hash, HASH_Y[h], 110, 52),
    })),
    ...HEADS.map((h) => ({
      id: `r${h}`,
      label: `E_{${sub(h)}}[z]`,
      title: `테이블 (${sub(h)})의 한 행`,
      math: true,
      variant: 'embed',
      ...at(X.row, HASH_Y[h], 170, 52),
    })),
    { id: 'heads-note', kind: 'annotation' as const, label: '차수마다 헤드 K개 (V4.1: 8개)', variant: 'annotation', ...at(X.hash + 110, 560, 420, 44) },
    { id: 'et', label: 'e_t', title: '이어 붙인 메모리 eₜ', math: true, variant: 'route', ...at(X.cat, 280, 100, 460) },
  ],
  edges: [
    ...[0, 1, 2].map((i) => ({ id: `e-raw-${i}-canon-${i}`, from: `raw-${i}`, to: `canon-${i}` })),
    { id: 'e-compress-g2', from: 'compress', to: 'g2', waypoints: [{ x: X.canon + 160, y: G2_Y }] },
    { id: 'e-compress-g3', from: 'compress', to: 'g3', waypoints: [{ x: X.canon + 160, y: 360 }, { x: X.gram - 120, y: 360 }] },
    { id: 'e-g2-h2-1', from: 'g2', to: 'h2-1', waypoints: [{ x: 960, y: G2_Y }, { x: 960, y: HASH_Y['2-1'] }] },
    { id: 'e-g2-h2-2', from: 'g2', to: 'h2-2', waypoints: [{ x: 960, y: G2_Y }, { x: 960, y: HASH_Y['2-2'] }] },
    { id: 'e-g3-h3-1', from: 'g3', to: 'h3-1', waypoints: [{ x: 990, y: G3_Y }, { x: 990, y: HASH_Y['3-1'] }] },
    { id: 'e-g3-h3-2', from: 'g3', to: 'h3-2', waypoints: [{ x: 990, y: G3_Y }, { x: 990, y: HASH_Y['3-2'] }] },
    ...HEADS.map((h) => ({ id: `e-h${h}-r${h}`, from: `h${h}`, to: `r${h}`, label: 'z' })),
    ...HEADS.map((h) => ({ id: `e-r${h}-et`, from: `r${h}`, to: 'et' })),
  ],
});

export const retrievalIds = {
  compress: ['compress', 'canon-0', 'canon-1', 'canon-2', 'e-raw-0-canon-0', 'e-raw-1-canon-1', 'e-raw-2-canon-2'],
  suffix: ['g2', 'g3', 'e-compress-g2', 'e-compress-g3'],
  hash: [
    ...HEADS.flatMap((h) => [`h${h}`, `r${h}`, `e-h${h}-r${h}`]),
    'e-g2-h2-1', 'e-g2-h2-2', 'e-g3-h3-1', 'e-g3-h3-2', 'heads-note',
  ],
  concat: ['et', ...HEADS.map((h) => `e-r${h}-et`)],
};
