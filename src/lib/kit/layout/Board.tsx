import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useTheme } from '../../theme';

export interface BoardProps {
  /** quiet heading, top left — names the idea, never explains it */
  title?: React.ReactNode;
  /** small source line, bottom right (paper section) */
  source?: React.ReactNode;
  /** the equation line — a `Formula` */
  formula?: React.ReactNode;
  /** the picture: a size-less `DiagramView`, or a chart inside `<Fill>` */
  figure?: React.ReactNode;
  /** the phrase line — `Captions` (one phrase per beat) or a single `Phrase` */
  caption?: React.ReactNode;
  /**
   * `stack` (default): formula above the figure, phrase below — all on one centre line.
   * `split`: figure on the left, formula and phrase stacked on the right.
   */
  layout?: 'stack' | 'split';
  /**
   * full-frame layer behind the slots — a `ThreeScene`, which always renders at
   * the full 1920×1080. Title, formula and phrase stay in their usual places on top.
   */
  backdrop?: React.ReactNode;
  /** free-form content instead of the slots — only when nothing above fits */
  children?: React.ReactNode;
}

/** widest the content column gets inside the 1920 frame */
const COLUMN = 1560;
/** room the phrase line always keeps (two lines of `md`), so the figure never resizes between beats */
const CAPTION_ROOM = 104;

/**
 * The 1920×1080 scene frame of the blackboard look: a black canvas with three
 * fixed slots — equation, figure, phrase — that share one centre line and one
 * column width. Scenes fill slots and never position anything themselves, which
 * is what keeps edges and baselines lined up from scene to scene.
 */
export const Board: React.FC<BoardProps> = ({ title, source, formula, figure, caption, layout = 'stack', backdrop, children }) => {
  const t = useTheme();
  const slot: React.CSSProperties = { minWidth: 0, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' };
  const captionSlot = caption ? <div style={{ ...slot, minHeight: CAPTION_ROOM }}>{caption}</div> : null;

  let content: React.ReactNode;
  if (children) {
    content = children;
  } else if (layout === 'split') {
    content = (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          columnGap: t.space(8),
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ position: 'relative', minWidth: 0, minHeight: 0 }}>{figure}</div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: t.space(6), minWidth: 0 }}>
          {formula ? <div style={slot}>{formula}</div> : null}
          {captionSlot}
        </div>
      </div>
    );
  } else if (!figure && !backdrop) {
    // an equation on its own: centred, with its phrase underneath
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: t.space(7), height: '100%' }}>
        {formula ? <div style={slot}>{formula}</div> : null}
        {captionSlot}
      </div>
    );
  } else {
    content = (
      <div
        style={{
          display: 'grid',
          gridTemplateRows: `${formula ? 'auto ' : ''}minmax(0, 1fr)${caption ? ' auto' : ''}`,
          rowGap: t.space(4),
          width: '100%',
          height: '100%',
        }}
      >
        {formula ? <div style={slot}>{formula}</div> : null}
        <div style={{ position: 'relative', minWidth: 0, minHeight: 0 }}>{figure}</div>
        {captionSlot}
      </div>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: t.palette.colors.bg,
        color: t.palette.colors.text,
        fontFamily: t.fonts.text,
        wordBreak: 'keep-all',
        lineHeight: 1.4,
        padding: `${t.space(6)}px ${t.space(9)}px ${t.space(8)}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {backdrop ? <AbsoluteFill>{backdrop}</AbsoluteFill> : null}
      {title ? (
        <div style={{ position: 'relative', fontSize: t.fontSize.md, fontWeight: 600, color: t.palette.colors.textSecondary, marginBottom: t.space(3) }}>
          {title}
        </div>
      ) : null}
      <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: COLUMN, alignSelf: 'center', position: 'relative' }}>
        {content}
      </div>
      {source ? (
        <div
          style={{
            position: 'absolute',
            right: t.space(6),
            bottom: t.space(3),
            fontSize: t.fontSize.xs,
            color: t.palette.colors.muted,
          }}
        >
          {source}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
