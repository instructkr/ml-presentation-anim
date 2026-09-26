import { defineDiagram } from '@/lib/diagram';

/**
 * Engram architecture — a reconstruction of Figure 1 of "Conditional Memory
 * via Scalable Lookup" (arXiv 2601.07372).
 *
 * Two panels, all hand-positioned:
 *   · left  — the backbone block that carries Engram: Engram → ⊕ → Attention
 *             → ⊕ → MoE → ⊕, with residual bypasses, above Vocab Embedding and
 *             the example sentence (current token t = "Great").
 *   · right — the magnified Engram module: suffix 2-/3-grams → Hash → N-gram
 *             embedding tables (stacked = h heads) → Concat → two Linear →
 *             Scaled Dot Product with the input hidden state → ⊗ → Conv.
 * Two chips in the left margin are not in the figure; they open the system
 * (host offload) and V4.1 training (Sinkhorn update) scenes.
 */

type Pt = { x: number; y: number };

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

/** invisible endpoint so a rail can leave the figure */
const anchor = (id: string, cx: number, cy: number) => ({
  id,
  kind: 'annotation' as const,
  variant: 'annotation',
  label: '',
  ...at(cx, cy, 2, 2),
});

interface EdgeOpts {
  id?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  arrow?: boolean;
  waypoints?: Pt[];
}
const e = (from: string, to: string, opts: EdgeOpts = {}) => ({
  id: opts.id ?? `e-${from}-${to}`,
  from,
  to,
  ...opts,
});

// ── example sentence (Figure 1 bottom row) ────────────────────────────────────
const WORDS = ['Only', 'Alexander', 'the', 'Great', 'could', 'tame', 'the', 'horse', 'Bucephalus', '.'];
const TOK_Y = 1030;
const TOK_H = 50;
const tokW = (s: string) => Math.max(52, Math.round(s.length * 15.1 + 36));
const tokX: number[] = [];
WORDS.reduce((x, w) => {
  tokX.push(x + tokW(w) / 2);
  return x + tokW(w) + 14;
}, 40);

// ── left panel: the spine sits over the current token "Great" ────────────────
const SPINE = tokX[3]!;
const BYPASS = SPINE - 115;
const Y = { out: 110, add3: 200, moe: 280, add2: 360, attn: 440, add1: 520, engram: 600, split: 690, tb: 780, vocab: 880 };
const PLUS = 34;

// ── right panel (magnified Engram) ───────────────────────────────────────────
const A = 1130; // 2-gram column
const B = 1560; // 3-gram column
const XC = 1340; // ⊗ / Conv column (centre of Concat)
const XIH = 860; // input-hidden rail
const R = { out: 105, conv: 200, mul: 300, lin: 400, split: 455, concat: 500, emb: 620, hash: 745, gram: 840 };
const PANEL = { x: 780, y: 150, w: 1070, h: 740 };

/** a row of token chips centred on cx */
const gramRow = (prefix: string, words: string[], cx: number) => {
  const widths = words.map(tokW);
  const total = widths.reduce((a, b) => a + b, 0) + 10 * (words.length - 1);
  let x = cx - total / 2;
  return words.map((w, i) => {
    const node = {
      id: `${prefix}-${i}`,
      kind: 'io' as const,
      label: w,
      variant: 'io',
      ...at(x + widths[i]! / 2, R.gram, widths[i]!, 46),
    };
    x += widths[i]! + 10;
    return node;
  });
};
const gram2 = gramRow('p2', ['the', 'Great'], A);
const gram3 = gramRow('p3', ['Alexander', 'the', 'Great'], B);
const boxAround = (nodes: { position: Pt; size: { w: number; h: number } }[], pad = 9) => {
  const x0 = Math.min(...nodes.map((n) => n.position.x)) - pad;
  const y0 = Math.min(...nodes.map((n) => n.position.y)) - pad;
  const x1 = Math.max(...nodes.map((n) => n.position.x + n.size.w)) + pad;
  const y1 = Math.max(...nodes.map((n) => n.position.y + n.size.h)) + pad;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

const tokens = WORDS.map((w, i) => ({
  id: `tok-${i}`,
  kind: 'io' as const,
  label: w,
  variant: 'io',
  ...at(tokX[i]!, TOK_Y, tokW(w), TOK_H),
}));

/** a stacked-table look: two faded copies behind the real node, up-right */
const stackShadows = (id: string, cx: number, cy: number, w: number, h: number, step: number, n: number, variant: string) =>
  Array.from({ length: n }, (_, k) => ({
    id: `${id}-s${n - k}`,
    label: '',
    title: `${id} (다른 헤드)`,
    variant,
    muted: true,
    ...at(cx + step * (n - k), cy - step * (n - k), w, h),
  }));

export const engramArch = defineDiagram({
  id: 'engram-arch',
  direction: 'TB',
  groups: [
    { id: 'ctx', title: '현재 토큰에서 끝나는 3-gram', rect: boxAround(tokens.slice(1, 4)) },
    { id: 'block-panel', title: 'Engram이 들어간 블록', rect: { x: BYPASS - 30, y: 160, w: 2 * (SPINE - BYPASS + 30) + 40, h: 560 } },
    { id: 'engram-panel', title: 'Engram 확대도', rect: PANEL },
    { id: 'ng-2', title: '2-gram (the, Great)', rect: boxAround(gram2) },
    { id: 'ng-3', title: '3-gram (Alexander, the, Great)', rect: boxAround(gram3) },
  ],
  nodes: [
    // ── left: sentence → Vocab Embedding → Transformer Block → Engram block ──
    ...tokens,
    { id: 'vocab', label: 'Vocab Embedding', variant: 'embed', ...at(SPINE, Y.vocab, 300, 56) },
    { id: 'tb-s1', label: '', title: 'Transformer Block', variant: 'default', muted: true, ...at(SPINE + 12, Y.tb - 12, 330, 56) },
    { id: 'tb', label: 'Transformer Block', variant: 'default', ...at(SPINE, Y.tb, 330, 56) },
    { id: 'engram', label: 'Engram', variant: 'route', ...at(SPINE, Y.engram, 170, 52) },
    { id: 'add1', kind: 'op', label: '+', variant: 'op', shape: 'circle', ...at(SPINE, Y.add1, PLUS, PLUS) },
    { id: 'attn', label: 'Attention', variant: 'attention', ...at(SPINE, Y.attn, 200, 52) },
    { id: 'add2', kind: 'op', label: '+', variant: 'op', shape: 'circle', ...at(SPINE, Y.add2, PLUS, PLUS) },
    { id: 'moe', label: 'MoE', variant: 'ffn', ...at(SPINE, Y.moe, 150, 52) },
    { id: 'add3', kind: 'op', label: '+', variant: 'op', shape: 'circle', ...at(SPINE, Y.add3, PLUS, PLUS) },
    anchor('out-l', SPINE, Y.out),

    // ── right: the magnified module, bottom to top ───────────────────────────
    ...gram2,
    ...gram3,
    ...stackShadows('hash-2', A, R.hash, 130, 52, 10, 1, 'norm'),
    { id: 'hash-2', label: 'Hash', title: '해시 (2-gram)', variant: 'norm', ...at(A, R.hash, 130, 52) },
    ...stackShadows('hash-3', B, R.hash, 130, 52, 10, 1, 'norm'),
    { id: 'hash-3', label: 'Hash', title: '해시 조회', variant: 'norm', ...at(B, R.hash, 130, 52) },
    ...stackShadows('emb-2', A, R.emb, 340, 70, 14, 2, 'embed'),
    { id: 'emb-2', label: '2-Gram Embedding', variant: 'embed', ...at(A, R.emb, 340, 70) },
    ...stackShadows('emb-3', B, R.emb, 340, 70, 14, 2, 'embed'),
    { id: 'emb-3', label: '3-Gram Embedding', variant: 'embed', ...at(B, R.emb, 340, 70) },
    { id: 'heads', kind: 'annotation', label: 'h개 헤드', variant: 'annotation', ...at(1775, 682, 130, 44) },
    { id: 'concat', label: 'Concat', variant: 'embed', ...at(XC, R.concat, 520, 50) },
    { id: 'lin-k', label: 'Linear', title: 'Linear (Key)', variant: 'proj', shape: 'trapDown', ...at(1120, R.lin, 190, 60) },
    { id: 'lin-v', label: 'Linear', title: 'Linear (Value)', variant: 'proj', shape: 'trapDown', ...at(B, R.lin, 190, 60) },
    { id: 'sdp', label: 'Scaled Dot Product', title: 'Context-aware Gating', variant: 'attention', ...at(990, R.mul, 330, 56) },
    { id: 'mul', kind: 'op', label: '×', title: '게이트 곱', variant: 'op', shape: 'circle', ...at(XC, R.mul, 40, 40) },
    { id: 'conv', label: 'Conv', title: 'Conv · Residual', variant: 'norm', ...at(XC, R.conv, 170, 56) },
    { id: 'conv-note', kind: 'annotation', label: 'V4.1에서는 생략', variant: 'annotation', ...at(1575, R.conv, 230, 44) },
    anchor('out-r', XC, R.out),
    { id: 'input-hidden', kind: 'io', label: 'Input Hidden', title: '현재 은닉 상태 hₜ', variant: 'io', ...at(XIH, 950, 220, 50) },

    // ── off-figure chips (empty left margin): where the tables live, how V4.1 trains them
    { id: 'host-mem', kind: 'op', label: '호스트 오프로드', title: '테이블은 호스트 메모리에', variant: 'io', ...at(185, 330, 250, 56) },
    { id: 'table-train', kind: 'op', label: 'Sinkhorn 갱신', title: 'V4.1 테이블 학습 (Sinkhorn)', variant: 'proj', ...at(185, 430, 250, 56) },
  ],
  edges: [
    // left spine
    e('tok-3', 'vocab'),
    e('vocab', 'tb'),
    e('tb', 'engram'),
    e('tb', 'add1', { waypoints: [{ x: SPINE, y: Y.split }, { x: BYPASS, y: Y.split }, { x: BYPASS, y: Y.add1 }] }),
    e('engram', 'add1'),
    e('add1', 'attn'),
    e('add1', 'add2', { waypoints: [{ x: SPINE, y: Y.add1 - 30 }, { x: BYPASS, y: Y.add1 - 30 }, { x: BYPASS, y: Y.add2 }] }),
    e('attn', 'add2'),
    e('add2', 'moe'),
    e('add2', 'add3', { waypoints: [{ x: SPINE, y: Y.add2 - 35 }, { x: BYPASS, y: Y.add2 - 35 }, { x: BYPASS, y: Y.add3 }] }),
    e('moe', 'add3'),
    e('add3', 'out-l'),

    // magnifier lines: the Engram block ↔ its panel
    e('engram', 'engram-panel', { id: 'zoom-top', style: 'dotted', arrow: false, waypoints: [{ x: PANEL.x - 4, y: PANEL.y + 2 }] }),
    e('engram', 'engram-panel', { id: 'zoom-bot', style: 'dotted', arrow: false, waypoints: [{ x: PANEL.x - 4, y: PANEL.y + PANEL.h - 2 }] }),

    // right: retrieval
    e('ng-2', 'hash-2'),
    e('ng-3', 'hash-3'),
    e('hash-2', 'emb-2'),
    e('hash-3', 'emb-3'),
    e('emb-2', 'concat', { waypoints: [{ x: A, y: R.concat + 40 }] }),
    e('emb-3', 'concat', { waypoints: [{ x: B, y: R.concat + 40 }] }),
    // the other heads' rows also land in Concat (grey, like the figure)
    ...(['emb-2', 'emb-3'] as const).flatMap((id) =>
      [1, 2].map((k) => {
        const x = (id === 'emb-2' ? A : B) + 14 * k;
        return e(`${id}-s${k}`, 'concat', { color: 'muted', waypoints: [{ x, y: R.concat + 40 }] });
      }),
    ),

    // right: gating
    e('concat', 'lin-k', { waypoints: [{ x: XC, y: R.split }, { x: 1120, y: R.split }] }),
    e('concat', 'lin-v', { waypoints: [{ x: XC, y: R.split }, { x: B, y: R.split }] }),
    e('lin-k', 'sdp', { waypoints: [{ x: 1120, y: R.mul + 45 }] }),
    e('input-hidden', 'sdp', { waypoints: [{ x: XIH, y: R.mul + 50 }] }),
    e('sdp', 'mul'),
    e('lin-v', 'mul', { waypoints: [{ x: B, y: R.mul }] }),
    e('mul', 'conv'),
    e('conv', 'out-r'),
  ],
});

/** id bundles for scenes and aliases */
export const engramIds = {
  retrieval: ['ng-2', 'ng-3', 'hash-2', 'hash-3', 'hash-2-s1', 'hash-3-s1', 'emb-2', 'emb-3', 'emb-2-s1', 'emb-2-s2', 'emb-3-s1', 'emb-3-s2', 'concat', 'heads', 'ctx', 'p2-0', 'p2-1', 'p3-0', 'p3-1', 'p3-2'],
  gating: ['input-hidden', 'sdp', 'lin-k', 'lin-v', 'mul'],
  output: ['conv', 'conv-note', 'add1'],
  backbone: ['engram', 'engram-panel', 'block-panel'],
};
