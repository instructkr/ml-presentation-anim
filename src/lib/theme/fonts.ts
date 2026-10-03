import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

const LATIN_RANGE = 'U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212';

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
      // Korean serif (FONT_SERIF): the Hangul file first, then its latin subset scoped by range
      loadFont({ family: 'Noto Serif KR', url: staticFile('fonts/NotoSerifKR-Regular.woff2'), weight: '400' }),
      loadFont({ family: 'Noto Serif KR', url: staticFile('fonts/NotoSerifKR-SemiBold.woff2'), weight: '600' }),
      loadFont({
        family: 'Noto Serif KR',
        url: staticFile('fonts/NotoSerifKR-Latin-Regular.woff2'),
        weight: '400',
        unicodeRange: LATIN_RANGE,
      }),
      loadFont({
        family: 'Noto Serif KR',
        url: staticFile('fonts/NotoSerifKR-Latin-SemiBold.woff2'),
        weight: '600',
        unicodeRange: LATIN_RANGE,
      }),
    ]).then(() => {
      loaded = true;
    });
  }
  return promise;
};

export const fontsReady = (): boolean => loaded;
