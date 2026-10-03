import React, { useState } from 'react';
import { useTheme } from '../theme';

/** Where a card sends the deck. Navigation itself stays in App. */
export type OverviewTarget =
  | { kind: 'module'; nodeId: string }
  | { kind: 'slide'; index: number };

export interface OverviewItem {
  /** react key — unique across both sections */
  key: string;
  /** 1-based position within its section */
  ordinal: number;
  label: string;
  /** short kind badge: 'Scene', 'Scene + 3D', 'Slide', … */
  kindTag: string;
  /** secondary line: scene title, step count, tab labels */
  sub?: string;
  visited: boolean;
  /** the presenter is here (or was here last) */
  current: boolean;
  target: OverviewTarget;
}

export interface OverviewSection {
  title: string;
  items: OverviewItem[];
  /** shown when the section has no items */
  empty?: string;
}

export interface OverviewProps {
  weekTitle: string;
  sections: OverviewSection[];
  onSelect: (target: OverviewTarget) => void;
  onClose: () => void;
}

/** Token hex → same hue at a given alpha; non-hex tokens pass through. */
const alpha = (color: string, a: number): string => {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const Card: React.FC<{ item: OverviewItem; onSelect: (t: OverviewTarget) => void }> = ({
  item,
  onSelect,
}) => {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  const c = t.palette.colors;
  const active = item.current || hover;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.target)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '20px 22px 22px',
        minHeight: 148,
        borderRadius: t.radius.md,
        border: `1px solid ${item.current ? c.accent : hover ? alpha(c.accent, 0.55) : c.border}`,
        background: item.current ? c.accentSoft : hover ? c.surfaceAlt : c.surface,
        boxShadow: item.current
          ? `0 0 0 1px ${c.accent}, 0 14px 40px ${alpha(c.page, 0.65)}`
          : hover
            ? `0 10px 30px ${alpha(c.page, 0.5)}`
            : 'none',
        cursor: 'pointer',
        fontFamily: t.fonts.text,
        transform: active ? 'translateY(-2px)' : 'none',
        transition: 'transform 130ms ease, box-shadow 130ms ease, background 130ms ease, border-color 130ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontFamily: t.fonts.mono,
            fontSize: 15,
            color: item.current ? c.accent : c.muted,
            minWidth: 22,
          }}
        >
          {String(item.ordinal).padStart(2, '0')}
        </span>
        <span
          style={{
            fontSize: 14,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            color: c.textSecondary,
            background: alpha(c.page, 0.55),
            border: `1px solid ${c.border}`,
            borderRadius: 999,
            padding: '3px 11px',
          }}
        >
          {item.kindTag}
        </span>
        <span style={{ flex: 1 }} />
        {item.visited ? (
          <span
            aria-label="visited"
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              background: c.ok,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✓
          </span>
        ) : null}
      </div>

      <div
        style={{
          fontSize: 27,
          fontWeight: 600,
          lineHeight: 1.25,
          color: c.text,
          wordBreak: 'keep-all',
        }}
      >
        {item.label}
      </div>

      {item.sub ? (
        <div
          style={{
            fontSize: 17,
            lineHeight: 1.45,
            color: c.muted,
            wordBreak: 'keep-all',
          }}
        >
          {item.sub}
        </div>
      ) : null}

      {item.current ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 18,
            bottom: 18,
            width: 3,
            borderRadius: 2,
            background: c.accent,
          }}
        />
      ) : null}
    </button>
  );
};

/**
 * Full-screen module map, toggled with 'o'. Purely presentational: it reports
 * a target and App decides how to get there.
 */
export const Overview: React.FC<OverviewProps> = ({ weekTitle, sections, onSelect, onClose }) => {
  const t = useTheme();
  const c = t.palette.colors;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: alpha(c.page, 0.93),
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: t.fonts.text,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 24,
          padding: '30px 48px 22px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: t.fonts.mono,
              fontSize: 15,
              letterSpacing: 2.4,
              textTransform: 'uppercase',
              color: c.accent,
              marginBottom: 8,
            }}
          >
            Overview
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: c.text,
              lineHeight: 1.15,
              wordBreak: 'keep-all',
            }}
          >
            {weekTitle}
          </div>
        </div>
        <div style={{ fontFamily: t.fonts.mono, fontSize: 15, color: c.muted, whiteSpace: 'nowrap' }}>
          Esc · o 닫기
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '30px 48px 40px' }}
      >
        {sections.map((section) => (
          <section key={section.title} style={{ marginBottom: 38 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 21, fontWeight: 600, color: c.textSecondary }}>
                {section.title}
              </span>
              <span style={{ fontFamily: t.fonts.mono, fontSize: 15, color: c.muted }}>
                {section.items.length}
              </span>
              <span style={{ flex: 1, height: 1, background: c.border }} />
            </div>

            {section.items.length === 0 ? (
              <div style={{ fontSize: 18, color: c.muted }}>{section.empty ?? '없음'}</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                  gap: 18,
                }}
              >
                {section.items.map((item) => (
                  <Card key={item.key} item={item} onSelect={onSelect} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <div
        style={{
          padding: '14px 48px 18px',
          borderTop: `1px solid ${c.border}`,
          fontFamily: t.fonts.mono,
          fontSize: 15,
          color: c.muted,
          display: 'flex',
          gap: 26,
          flexWrap: 'wrap',
        }}
      >
        <span>클릭: 이동</span>
        <span>n/p: 가이드 경로</span>
        <span>Space: 다음 단계</span>
        <span>s: 노트 창</span>
        <span>f: 전체화면</span>
      </div>
    </div>
  );
};
