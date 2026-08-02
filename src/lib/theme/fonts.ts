import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

let promise: Promise<void> | null = null;
let loaded = false;

/**
 * Idempotent font preload; both the deck (before mount) and Remotion scenes
 * (via FontGate + delayRender) await this so renders never capture fallback
 * glyphs.
 */
export const ensureFontsLoaded = (): Promise<void> => {
  if (!promise) {
    promise = Promise.all([
      loadFont({ family: 'Pretendard', url: staticFile('fonts/Pretendard-Regular.woff2'), weight: '400' }),
      loadFont({ family: 'Pretendard', url: staticFile('fonts/Pretendard-SemiBold.woff2'), weight: '600' }),
      loadFont({ family: 'Pretendard', url: staticFile('fonts/Pretendard-Bold.woff2'), weight: '700' }),
      loadFont({ family: 'JetBrains Mono', url: staticFile('fonts/JetBrainsMono-Regular.woff2'), weight: '400' }),
    ]).then(() => {
      loaded = true;
    });
  }
  return promise;
};

export const fontsReady = (): boolean => loaded;
