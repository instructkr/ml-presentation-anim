/**
 * Fig. 9, top-left panel (§5.3): DeepSWE v1.1 benchmark score at each
 * checkpoint of the main RL runs (30 steps). Read off the page-22 figure at 6×
 * by pixel colour (dark orange = Pro, light orange = Flash), one value per
 * step from the centre of the line at that step's x — 그래프에서 읽은 근사값,
 * good to about ±0.3. The two ends agree with the text of §4.1 (Pro 58.4 →
 * 72.6, Flash 48.7 → 65.7, average@3). x = RL step.
 */
const pts = (ys: number[]) => ys.map((y, i) => ({ x: i + 1, y }));

export const fig9Score = {
  pro: pts([
    58.4, 56.4, 58.4, 60.4, 59.6, 58.6, 60.4, 62.2, 63.0, 63.8, 65.7, 66.0, 63.4, 64.5, 63.4, 65.2, 66.3, 67.5, 67.9,
    68.1, 68.2, 70.8, 70.4, 69.4, 68.8, 72.3, 69.6, 68.4, 71.0, 72.6,
  ]),
  flash: pts([
    48.7, 53.0, 56.8, 54.2, 57.0, 54.6, 55.9, 57.1, 58.6, 59.8, 54.6, 60.8, 57.7, 59.5, 60.8, 63.5, 58.6, 64.0, 61.8,
    63.5, 59.6, 63.7, 61.6, 65.8, 65.0, 66.1, 66.1, 67.7, 65.9, 65.7,
  ]),
};

export const firstY = (pts: { y: number }[]): number => pts[0]!.y;
export const lastY = (pts: { y: number }[]): number => pts[pts.length - 1]!.y;
