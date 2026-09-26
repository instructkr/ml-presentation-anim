import { defineDiagram } from '@/lib/diagram';

/**
 * Engram §2.5 / §6.4 and V4.1 §2.4.2, §3.1.3: row indices depend only on the
 * token ids, so the rows a layer will need are known before the GPU reaches
 * it. The table lives in host memory; its rows cross the bus while the
 * earlier block computes. Hot rows can sit in HBM, rare ones on SSD.
 */

const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

const GPU_Y = 150;
const HOST_Y = 430;
const X = { ids: 110, hash: 390, b0: 720, b1: 1070, hbm: 1420, table: 900, ssd: 1370 };

export const systemDetail = defineDiagram({
  id: 'engram-system',
  direction: 'LR',
  groups: [
    { id: 'gpu', label: 'GPU: 계산', rect: { x: 560, y: 50, w: 1010, h: 170 } },
    { id: 'host', label: '호스트: 메모리', rect: { x: 560, y: 330, w: 1010, h: 170 } },
  ],
  nodes: [
    // frame-0 anchor: the token ids
    { id: 'ids', kind: 'io', label: '토큰 ID', variant: 'io', ...at(X.ids, 290, 150, 56) },
    { id: 'hashc', kind: 'op', label: '해시 → 행 번호', variant: 'norm', ...at(X.hash, 290, 240, 56) },
    { id: 'b0', label: 'Block 0', variant: 'default', ...at(X.b0, GPU_Y, 220, 60) },
    { id: 'b1', label: 'Block 1 + Engram', variant: 'route', ...at(X.b1, GPU_Y, 320, 60) },
    { id: 'hbm', label: 'HBM 캐시', title: '자주 쓰는 행은 HBM에', variant: 'embed', ...at(X.hbm, GPU_Y, 220, 60) },
    { id: 'table', label: 'Engram 테이블 (DRAM)', variant: 'embed', ...at(X.table, HOST_Y, 400, 60) },
    { id: 'ssd', label: 'SSD', title: '드문 행은 SSD에', variant: 'embed', ...at(X.ssd, HOST_Y, 200, 60) },
    { id: 'moe-note', kind: 'annotation', label: 'MoE 라우팅은 그 층의 은닉 상태가 있어야 정해진다', variant: 'annotation', ...at(820, 570, 760, 44) },
  ],
  edges: [
    { id: 'e-ids-b0', from: 'ids', to: 'b0', waypoints: [{ x: X.ids, y: GPU_Y }] },
    { id: 'e-ids-hashc', from: 'ids', to: 'hashc' },
    { id: 'e-hashc-table', from: 'hashc', to: 'table', label: '행 번호', waypoints: [{ x: X.hash, y: HOST_Y }] },
    { id: 'e-b0-b1', from: 'b0', to: 'b1' },
    { id: 'e-table-b1', from: 'table', to: 'b1', style: 'dashed', label: '미리 전송', waypoints: [{ x: X.b1 - 60, y: HOST_Y - 40 }, { x: X.b1 - 60, y: GPU_Y + 50 }] },
    { id: 'e-hbm-b1', from: 'hbm', to: 'b1', style: 'dotted' },
    { id: 'e-ssd-table', from: 'ssd', to: 'table', style: 'dotted' },
  ],
});

export const systemIds = {
  address: ['hashc', 'e-ids-hashc', 'moe-note'],
  infer: ['table', 'e-hashc-table', 'e-table-b1'],
  zipf: ['hbm', 'ssd', 'e-hbm-b1', 'e-ssd-table'],
};
