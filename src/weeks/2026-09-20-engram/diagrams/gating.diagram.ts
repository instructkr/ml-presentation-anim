import { defineDiagram } from '@/lib/diagram';

/**
 * Engram §2.3 context-aware gating (eq. 3–4), left to right: the retrieved
 * memory eₜ becomes key and value, the current hidden state hₜ is the query,
 * both are RMS-normalised, their scaled dot product goes through a sigmoid,
 * and the scalar αₜ scales the value.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const Y = { h: 70, k: 240, e: 340, v: 450, dot: 155 };
const X = { e: 90, split: 190, proj: 330, norm: 580, dot: 830, sig: 1040, out: 1260 };

export const gatingDetail = defineDiagram({
  id: 'engram-gating',
  direction: 'LR',
  nodes: [
    // frame-0 anchor: the retrieved memory
    { id: 'e', kind: 'io', label: 'e_t', title: '조회한 메모리 eₜ', math: true, variant: 'route', ...at(X.e, Y.e, 110, 60) },
    { id: 'wk', label: 'W_K', title: 'Key 투영', math: true, variant: 'proj', ...at(X.proj, Y.k, 130, 60) },
    { id: 'wv', label: 'W_V', title: 'Value 투영', math: true, variant: 'proj', ...at(X.proj, Y.v, 130, 60) },
    { id: 'nk', label: 'RMSNorm', variant: 'norm', ...at(X.norm, Y.k, 200, 56) },
    { id: 'h', kind: 'io', label: 'h_t', title: '현재 은닉 상태 hₜ', math: true, variant: 'io', ...at(X.proj, Y.h, 110, 60) },
    { id: 'nh', label: 'RMSNorm', variant: 'norm', ...at(X.norm, Y.h, 200, 56) },
    { id: 'dot', kind: 'op', label: '\\hat h^{\\top}\\hat k \\,/\\, \\sqrt{d}', title: '스케일 내적', math: true, variant: 'attention', ...at(X.dot, Y.dot, 220, 64) },
    { id: 'sig', kind: 'op', label: '\\sigma', title: '시그모이드', math: true, variant: 'op', shape: 'circle', ...at(X.sig, Y.dot, 58, 58) },
    { id: 'mul', kind: 'op', label: '×', title: '게이트 곱', variant: 'op', shape: 'circle', ...at(X.sig, Y.v, 50, 50) },
    { id: 'out', kind: 'io', label: '\\tilde v_t', title: '게이트를 거친 값', math: true, variant: 'io', ...at(X.out, Y.v, 120, 60) },
  ],
  edges: [
    { id: 'e-e-wk', from: 'e', to: 'wk', waypoints: [{ x: X.split, y: Y.e }, { x: X.split, y: Y.k }] },
    { id: 'e-e-wv', from: 'e', to: 'wv', waypoints: [{ x: X.split, y: Y.e }, { x: X.split, y: Y.v }] },
    { id: 'e-wk-nk', from: 'wk', to: 'nk', label: 'kₜ' },
    { id: 'e-h-nh', from: 'h', to: 'nh' },
    { id: 'e-nh-dot', from: 'nh', to: 'dot', waypoints: [{ x: X.dot, y: Y.h }] },
    { id: 'e-nk-dot', from: 'nk', to: 'dot', waypoints: [{ x: X.dot, y: Y.k }] },
    { id: 'e-dot-sig', from: 'dot', to: 'sig' },
    { id: 'e-sig-mul', from: 'sig', to: 'mul', label: 'αₜ' },
    { id: 'e-wv-mul', from: 'wv', to: 'mul', label: 'vₜ', labelPos: 0.3 },
    { id: 'e-mul-out', from: 'mul', to: 'out' },
  ],
});

export const gatingIds = {
  kv: ['wk', 'wv', 'nk', 'e-e-wk', 'e-e-wv', 'e-wk-nk'],
  query: ['h', 'nh', 'dot', 'e-h-nh', 'e-nh-dot', 'e-nk-dot'],
  score: ['sig', 'e-dot-sig'],
  gate: ['mul', 'out', 'e-sig-mul', 'e-wv-mul', 'e-mul-out'],
};
