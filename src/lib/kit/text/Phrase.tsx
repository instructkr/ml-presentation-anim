import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { Appear, wipeStyle } from '../../timeline/Appear';
import { useSceneMeta } from '../../timeline/context';
import { resolveColor, useTheme } from '../../theme';

export interface PhraseProps {
  size?: 'sm' | 'md' | 'lg';
  /** token / ink name or raw CSS (default: text) */
  color?: string;
  align?: 'center' | 'left';
  /** step on which it is wiped in; omit to show it from frame 0 */
  step?: string;
  /** seconds into the step */
  delay?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const usePhraseStyle = (size: 'sm' | 'md' | 'lg', color: string | undefined, align: 'center' | 'left') => {
  const t = useTheme();
  return {
    fontFamily: t.fonts.text,
    fontSize: t.fontSize[size],
    lineHeight: 1.4,
    color: resolveColor(t, color, t.palette.colors.text),
    textAlign: align,
    wordBreak: 'keep-all',
    textWrap: 'balance',
  } satisfies React.CSSProperties;
};

/**
 * A short line of plain text set straight on the background — no card, no
 * border. One phrase carries one idea in everyday words; the picture and the
 * presenter's voice carry the rest. Colour a quantity's name with `Term`.
 */
export const Phrase: React.FC<PhraseProps> = ({ size = 'md', color, align = 'center', step, delay = 0, style, children }) => {
  const base = usePhraseStyle(size, color, align);
  const body = <div style={{ ...base, ...style }}>{children}</div>;
  return step ? (
    <Appear step={step} effect="wipe" delay={delay} duration={0.7}>
      {body}
    </Appear>
  ) : (
    body
  );
};

export interface CaptionItem {
  /** the phrase takes over the caption line on this step */
  step: string;
  text: React.ReactNode;
}

const OUT_SECONDS = 0.25;
const IN_DELAY = 0.2;
const IN_SECONDS = 0.7;

/**
 * The caption line of a scene: one phrase at a time. Each item wipes in on its
 * step and leaves when the next one arrives; a step without an item keeps the
 * previous phrase. All phrases share one cell sized to the tallest, so the
 * figure above never moves.
 *
 * Must render inside a defineScene() component.
 */
export const Captions: React.FC<{
  items: CaptionItem[];
  size?: 'sm' | 'md' | 'lg';
  align?: 'center' | 'left';
  style?: React.CSSProperties;
}> = ({ items, size = 'md', align = 'center', style }) => {
  const t = useTheme();
  const meta = useSceneMeta();
  const frame = useCurrentFrame();
  const base = usePhraseStyle(size, undefined, align);
  const placed = items
    .map((item) => ({ item, at: meta.steps.find((s) => s.id === item.step) }))
    .sort((a, b) => (a.at?.startFrame ?? 0) - (b.at?.startFrame ?? 0));
  const unknown = placed.filter((p) => !p.at).map((p) => p.item.step);

  return (
    <div style={{ display: 'grid', ...style }}>
      {placed.map(({ item, at }, i) => {
        if (!at) return null;
        const next = placed.slice(i + 1).find((p) => p.at)?.at;
        const start = at.startFrame + IN_DELAY * meta.fps;
        const end = Math.max(start + 1, Math.min(start + IN_SECONDS * meta.fps, at.animEndFrame));
        const arrive = interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const leave = next
          ? interpolate(frame, [next.startFrame, next.startFrame + OUT_SECONDS * meta.fps], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            })
          : 0;
        return (
          <div key={item.step} style={{ gridArea: '1 / 1', alignSelf: 'center', opacity: 1 - leave, ...wipeStyle(arrive) }}>
            <div style={base}>{item.text}</div>
          </div>
        );
      })}
      {unknown.length > 0 ? (
        <div
          style={{
            gridArea: '1 / 1',
            justifySelf: 'center',
            background: t.palette.colors.danger,
            color: '#fff',
            fontSize: 22,
            fontFamily: t.fonts.mono,
            padding: '6px 12px',
            borderRadius: 8,
          }}
        >
          Captions: unknown steps: {unknown.join(', ')}
        </div>
      ) : null}
    </div>
  );
};
