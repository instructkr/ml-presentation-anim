import { defineDiagram } from '@/lib/diagram';

/**
 * §5.2.1 전편 — 왜 "전문가를 복사한다"가 부하 균형이 되는가.
 *
 * MoonEP 편에서 제일 자주 막히는 자리는 정리 1도 계획 커널도 아니고 그 앞의
 * 한 문장이다. "토큰은 자기 랭크 안에 있는데 전문가를 복사한다고 균형이 맞나."
 * 막히는 이유는 EP에서 토큰이 어디서 계산되는지가 생략되어 있기 때문이다.
 * 토큰은 자기 랭크에서 계산되지 않는다. 라우터가 고른 전문가를 들고 있는 랭크로
 * all-to-all로 건너가서 거기서 계산되고 돌아온다. 그래서 부하가 쏠리는 주체는
 * 랭크가 아니라 전문가이고, 한 전문가로 몰린 줄은 그 전문가의 가중치가 한 랭크에만
 * 있는 동안에는 절대 갈라지지 않는다. 가중치를 복사하면 그 줄이 갈 수 있는 랭크가
 * 여러 개가 되고, 그제서야 나눠 보낼 수 있다. 이 그림이 보여 주는 것은 그것뿐이다.
 *
 * 숫자는 화면에서 세어 확인할 수 있게 잡았다. 토큰 150개, 랭크 3대.
 * E1 30개 · E7 90개 · E3 30개 → 복사 전 부하 (30, 90, 30).
 * E7을 랭크 0과 랭크 2의 빈 자리에 복사하고 90개를 50·20·20으로 가르면 (50, 50, 50).
 *
 * 손으로 좌표를 잡았다(모든 노드에 `position`). 위에서 아래로 네 줄이다.
 * 랭크가 들고 있는 배치 조각 → all-to-all → 전문가별 토큰 더미 → 랭크의 전문가 자리.
 * 캔버스 ≈ 1360 × 850.
 */

/** place a node by its centre */
const at = (cx: number, cy: number, w: number, h: number) => ({
  size: { w, h },
  position: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) },
});

/** 복제본이 원본 자리에서 빈 자리까지 미끄러지는 거리 (move 오프셋) */
export const epDispatchMoves = {
  toRank0: { dx: -236, dy: 0 },
  toRank2: { dx: 604, dy: 0 },
};

export const epDispatchDetail = defineDiagram({
  id: 'ep-dispatch',
  direction: 'TB',
  groups: [
    { id: 'rank0', label: '랭크 0', rect: { x: 90, y: 470, w: 380, h: 250 } },
    { id: 'rank1', label: '랭크 1', rect: { x: 510, y: 470, w: 380, h: 250 } },
    { id: 'rank2', label: '랭크 2', rect: { x: 930, y: 470, w: 380, h: 250 } },
  ],
  nodes: [
    // ── 각 랭크가 들고 있는 배치 조각 (frame-0 앵커) ───────────────────────────
    { id: 'b0', kind: 'io', label: '랭크 0의 토큰', variant: 'io', ...at(280, 62, 340, 76) },
    { id: 'b1', kind: 'io', label: '랭크 1의 토큰', variant: 'io', ...at(700, 62, 340, 76) },
    { id: 'b2', kind: 'io', label: '랭크 2의 토큰', variant: 'io', ...at(1120, 62, 340, 76) },

    // ── 토큰이 랭크를 떠나는 자리 ─────────────────────────────────────────────
    {
      id: 'alltoall',
      kind: 'op',
      label: 'all-to-all 디스패치',
      title: 'all-to-all 디스패치',
      variant: 'op',
      tex: '\\text{token} \\rightarrow \\text{expert의 랭크}',
      ...at(700, 200, 1020, 96),
    },

    // ── 라우터가 고른 전문가별로 모인 토큰 더미 ───────────────────────────────
    { id: 'p1', label: 'E1을 고른 토큰', variant: 'route', tex: '30', ...at(280, 350, 320, 96) },
    { id: 'p7', label: 'E7을 고른 토큰', variant: 'route', tex: '90', ...at(700, 350, 320, 96) },
    { id: 'p3', label: 'E3을 고른 토큰', variant: 'route', tex: '30', ...at(1120, 350, 320, 96) },

    // ── 랭크가 들고 있는 전문가 자리 ──────────────────────────────────────────
    { id: 'e1', label: 'E1 가중치', variant: 'expertRouted', parent: 'rank0', ...at(188, 610, 170, 96) },
    { id: 's0', label: '빈 자리', variant: 'attention', muted: true, parent: 'rank0', ...at(372, 610, 170, 96) },
    { id: 'e7', label: 'E7 가중치', variant: 'expertRouted', parent: 'rank1', ...at(608, 610, 170, 96) },
    { id: 's1', label: '빈 자리', variant: 'attention', muted: true, parent: 'rank1', ...at(792, 610, 170, 96) },
    { id: 'e3', label: 'E3 가중치', variant: 'expertRouted', parent: 'rank2', ...at(1028, 610, 170, 96) },
    { id: 's2', label: '빈 자리', variant: 'attention', muted: true, parent: 'rank2', ...at(1212, 610, 170, 96) },

    // 복제본. 원본 위에서 출발해 `move`로 빈 자리까지 미끄러진다.
    // 어느 그룹에도 속하지 않아야 랭크 상자가 복제본을 따라 늘어나지 않는다.
    { id: 'e7a', label: 'E7 복제본', variant: 'proj', ...at(608, 610, 170, 96) },
    { id: 'e7b', label: 'E7 복제본', variant: 'proj', ...at(608, 610, 170, 96) },

    {
      id: 'rule',
      kind: 'annotation',
      label: '토큰이 갈 수 있는 랭크는 그 전문가의 가중치를 들고 있는 랭크뿐이다',
      variant: 'annotation',
      ...at(700, 800, 940, 66),
    },
  ],
  edges: [
    { id: 'e-b0-alltoall', from: 'b0', to: 'alltoall' },
    { id: 'e-b1-alltoall', from: 'b1', to: 'alltoall' },
    { id: 'e-b2-alltoall', from: 'b2', to: 'alltoall' },

    { id: 'e-alltoall-p1', from: 'alltoall', to: 'p1' },
    { id: 'e-alltoall-p7', from: 'alltoall', to: 'p7' },
    { id: 'e-alltoall-p3', from: 'alltoall', to: 'p3' },

    { id: 'e-p1-e1', from: 'p1', to: 'e1' },
    { id: 'e-p7-e7', from: 'p7', to: 'e7' },
    { id: 'e-p3-e3', from: 'p3', to: 'e3' },

    // 복사가 끝난 뒤에야 생기는 두 갈래. 같은 전문가, 다른 랭크.
    { id: 'e-p7-e7a', from: 'p7', to: 'e7a', color: 'accent', label: '20', labelPos: 0.78 },
    { id: 'e-p7-e7b', from: 'p7', to: 'e7b', color: 'accent', label: '20', labelPos: 0.78 },
  ],
});
