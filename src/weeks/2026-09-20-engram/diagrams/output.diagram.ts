import { defineDiagram } from '@/lib/diagram';

/**
 * Engram §2.3 eq. 5 and the residual hook-up: Ṽ → RMSNorm → Conv1D → SiLU
 * → ⊕ Ṽ = Y, then H ← H + Y before the block's Attention and MoE.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const Y1 = 130;
const Y2 = 360;
const X = { vt: 100, norm: 330, conv: 590, silu: 840, plus: 1030, y: 1210, rest: 1450, h: 180 };

export const outputDetail = defineDiagram({
  id: 'engram-output',
  direction: 'LR',
  nodes: [
    // frame-0 anchor: the gated values
    { id: 'vt', kind: 'io', label: '\\tilde V', title: '게이트를 거친 값 Ṽ', math: true, variant: 'io', ...at(X.vt, Y1, 110, 60) },
    { id: 'norm', label: 'RMSNorm', variant: 'norm', ...at(X.norm, Y1, 200, 56) },
    { id: 'conv', label: 'Conv1D', title: '짧은 합성곱', variant: 'norm', ...at(X.conv, Y1, 200, 56) },
    { id: 'silu', kind: 'op', label: 'SiLU', variant: 'op', ...at(X.silu, Y1, 140, 56) },
    { id: 'plus', kind: 'op', label: '+', variant: 'op', shape: 'circle', ...at(X.plus, Y1, 44, 44) },
    { id: 'y', kind: 'io', label: 'Y', title: 'Engram 출력 Y', math: true, variant: 'route', ...at(X.y, Y1, 100, 60) },
    { id: 'h', kind: 'io', label: 'H^{(\\ell)}', title: '잔차 스트림 H', math: true, variant: 'io', ...at(X.h, Y2, 130, 60) },
    { id: 'res', kind: 'op', label: '+', variant: 'op', shape: 'circle', ...at(X.y, Y2, 44, 44) },
    { id: 'rest', label: 'Attention → MoE', title: '블록의 나머지', variant: 'attention', ...at(X.rest, Y2, 290, 56) },
  ],
  edges: [
    { id: 'e-vt-norm', from: 'vt', to: 'norm' },
    { id: 'e-norm-conv', from: 'norm', to: 'conv' },
    { id: 'e-conv-silu', from: 'conv', to: 'silu' },
    { id: 'e-silu-plus', from: 'silu', to: 'plus' },
    { id: 'e-vt-plus', from: 'vt', to: 'plus', label: '건너뛰기', waypoints: [{ x: X.vt, y: 40 }, { x: X.plus, y: 40 }] },
    { id: 'e-plus-y', from: 'plus', to: 'y' },
    { id: 'e-y-res', from: 'y', to: 'res' },
    { id: 'e-h-res', from: 'h', to: 'res' },
    { id: 'e-res-rest', from: 'res', to: 'rest' },
  ],
});

export const outputIds = {
  conv: ['norm', 'conv', 'silu', 'e-vt-norm', 'e-norm-conv', 'e-conv-silu'],
  skip: ['plus', 'y', 'e-silu-plus', 'e-vt-plus', 'e-plus-y'],
  residual: ['h', 'res', 'rest', 'e-y-res', 'e-h-res', 'e-res-rest'],
};
