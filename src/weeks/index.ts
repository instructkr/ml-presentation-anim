import type { WeekManifest } from '@/lib/explorer/types';
import { week20260805 } from './2026-08-05-moe-demo/manifest';
import { week20260812 } from './2026-08-12-kimi-k3/manifest';
import { week20260812Infra } from './2026-08-12-kimi-k3-infra/manifest';

/**
 * SINGLE registration point — both the Remotion Root (webpack) and the deck
 * (Vite) import this. Never use import.meta.glob / require.context here.
 */
export const weeks: WeekManifest[] = [week20260812, week20260812Infra, week20260805];
