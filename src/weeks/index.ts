import type { WeekManifest } from '@/lib/explorer/types';
import { week20260805 } from './2026-08-05-moe-demo/manifest';

/**
 * SINGLE registration point — both the Remotion Root (webpack) and the deck
 * (Vite) import this. Never use import.meta.glob / require.context here.
 */
export const weeks: WeekManifest[] = [week20260805];
