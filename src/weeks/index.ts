import type { WeekManifest } from '@/lib/explorer/types';
import { week20260805 } from './2026-08-05-moe-demo/manifest';
import { week20260812 } from './2026-08-12-kimi-k3/manifest';
import { week20260812Infra } from './2026-08-12-kimi-k3-infra/manifest';
import { week20260913 } from './2026-09-13-deepseek-v41-flash/manifest';
import { week20260920 } from './2026-09-20-engram/manifest';
import { week20260927 } from './2026-09-27-mimo-v26/manifest';
import { week20261003 } from './2026-10-03-style-pilot/manifest';
import { week20261004 } from './2026-10-04-mimo-v26-rl/manifest';

/**
 * SINGLE registration point — both the Remotion Root (webpack) and the deck
 * (Vite) import this. Never use import.meta.glob / require.context here.
 */
export const weeks: WeekManifest[] = [week20261004, week20261003, week20260927, week20260920,week20260913, week20260812,week20260812Infra, week20260805];
