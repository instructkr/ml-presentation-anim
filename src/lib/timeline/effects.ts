export type V3 = [number, number, number];

/**
 * Split a parent progress into per-item staggered progresses.
 * overlap 1 = all together, 0 = strictly one after another.
 */
export const staggerProgress = (
  progress: number,
  index: number,
  count: number,
  overlap = 0.5,
): number => {
  if (count <= 1) return progress;
  const slot = 1 / (count - (count - 1) * overlap);
  const start = index * slot * (1 - overlap);
  const p = (progress - start) / slot;
  return Math.min(1, Math.max(0, p));
};

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const lerp3 = (a: V3, b: V3, t: number): V3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
