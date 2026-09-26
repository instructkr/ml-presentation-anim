/**
 * Fig. 9, bottom-left panel (§5.3): "Total tokens (K)" of DeepSWE v1.1
 * evaluation trajectories at each checkpoint of the main RL runs (30 steps).
 * Read off the page-22 figure at 4× by pixel colour (light orange = Flash,
 * dark orange = Pro), one value per step, rounded to 1K — 그래프에서 읽은
 * 근사값. x = RL step.
 */
const pts = (ys: number[]) => ys.map((y, i) => ({ x: i + 1, y }));

export const fig9Tokens = {
  flash: pts([
    154, 158, 154, 156, 158, 158, 160, 161, 163, 166, 170, 170, 177, 176, 177, 182, 193, 200, 197, 203, 207, 209, 225,
    214, 220, 229, 229, 229, 234, 236,
  ]),
  pro: pts([
    139, 136, 139, 141, 139, 145, 145, 146, 149, 151, 155, 159, 162, 162, 167, 169, 170, 177, 179, 183, 189, 193, 199,
    201, 203, 205, 208, 210, 214, 214,
  ]),
};
