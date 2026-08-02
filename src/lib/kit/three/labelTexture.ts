import * as THREE from 'three';

const cache = new Map<string, { texture: THREE.CanvasTexture; aspect: number }>();

/**
 * Deterministic text label as a canvas texture (drei's <Text> loads fonts
 * asynchronously, which breaks render determinism — this doesn't).
 * Fonts are already loaded by FontGate before any scene renders.
 */
export const makeLabelTexture = (
  text: string,
  color = '#ffffff',
  fontPx = 96,
): { texture: THREE.CanvasTexture; aspect: number } => {
  const key = `${text}|${color}|${fontPx}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const font = `600 ${fontPx}px Pretendard, 'JetBrains Mono', sans-serif`;
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = font;
  const textW = Math.ceil(measure.measureText(text).width);
  const pad = Math.round(fontPx * 0.25);

  const canvas = document.createElement('canvas');
  canvas.width = textW + pad * 2;
  canvas.height = Math.round(fontPx * 1.35);
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;

  const entry = { texture, aspect: canvas.width / canvas.height };
  cache.set(key, entry);
  return entry;
};
