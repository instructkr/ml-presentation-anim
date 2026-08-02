import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme';
import {
  PRESENTER_CHANNEL,
  openPresenterBus,
  presenterBusSupported,
  resolveNote,
  type PresenterState,
} from '@/lib/explorer/presenterBus';
import { weeks } from '@/weeks';

const two = (n: number): string => String(n).padStart(2, '0');

const fmtElapsed = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
};

const fmtClock = (ms: number): string => {
  const d = new Date(ms);
  return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
};

/**
 * Second-monitor presenter view. Listens on the presenter bus, resolves the
 * week's note for wherever the deck is, and shows it big enough to read at a
 * glance mid-sentence. Never rendered on stream.
 */
export const NotesApp: React.FC = () => {
  const t = useTheme();
  const c = t.palette.colors;

  const [state, setState] = useState<PresenterState | null>(null);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const bus = openPresenterBus();
    const un = bus.subscribe((m) => {
      if (m.type !== 'state') return;
      setState(m);
      setStartAt((prev) => prev ?? Date.now());
    });
    // The deck may already be mid-talk — ask it where it is.
    bus.post({ type: 'hello', at: Date.now() });
    return () => {
      un();
      bus.close();
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = state ? `노트 · ${state.title}` : '발표자 노트';
  }, [state]);

  const week = state ? weeks.find((w) => w.id === state.weekId) : undefined;
  const resolved = state ? resolveNote(week?.notes, state.noteKey, state.stepId) : undefined;

  const shell: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    background: c.page,
    color: c.text,
    fontFamily: t.fonts.sans,
  };

  if (!state) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 40 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: c.baseline,
          }}
        />
        <div style={{ fontSize: 26, color: c.textSecondary, textAlign: 'center', wordBreak: 'keep-all' }}>
          덱 창을 기다리는 중…
        </div>
        <div
          style={{
            fontSize: 18,
            color: c.muted,
            textAlign: 'center',
            lineHeight: 1.6,
            wordBreak: 'keep-all',
            maxWidth: 520,
          }}
        >
          {presenterBusSupported()
            ? '덱 창에서 아무 모듈이나 열면 이 창이 따라옵니다. (덱에서 s 키로 이 창을 엽니다)'
            : '이 브라우저는 BroadcastChannel을 지원하지 않아 덱과 연결할 수 없습니다.'}
        </div>
        <div style={{ fontFamily: t.fonts.mono, fontSize: 14, color: c.baseline, marginTop: 8 }}>
          channel: {PRESENTER_CHANNEL}
        </div>
      </div>
    );
  }

  const stepCount = state.stepCount ?? 0;
  const stepIdx = state.stepIdx ?? 0;

  return (
    <div style={shell}>
      {/* header ─ where we are + the clocks */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 28px 14px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div
          title="연결됨"
          style={{ width: 10, height: 10, borderRadius: 5, background: c.ok, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 17,
              color: c.muted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {state.breadcrumb.filter(Boolean).map((b, i, arr) => (
              <React.Fragment key={`${b}-${i}`}>
                <span style={{ color: i === arr.length - 1 ? c.textSecondary : c.muted }}>{b}</span>
                {i < arr.length - 1 ? <span style={{ color: c.baseline }}>›</span> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setStartAt(Date.now())}
            title="클릭하면 경과 시간을 리셋합니다"
            style={{
              background: 'transparent',
              border: `1px solid ${c.border}`,
              borderRadius: t.radius.sm,
              padding: '4px 12px',
              cursor: 'pointer',
              color: c.text,
              fontFamily: t.fonts.mono,
              fontSize: 22,
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, color: c.muted, fontFamily: t.fonts.sans }}>경과</span>
            {fmtElapsed(now - (startAt ?? now))}
          </button>
          <span style={{ fontFamily: t.fonts.mono, fontSize: 20, color: c.muted }}>
            {fmtClock(now)}
          </span>
        </div>
      </div>

      {/* body ─ title + the note itself */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '22px 28px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1.2,
            color: c.text,
            wordBreak: 'keep-all',
          }}
        >
          {state.title}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${resolved ? c.accent : c.baseline}`,
            borderRadius: t.radius.md,
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              fontSize: 30,
              lineHeight: 1.62,
              color: resolved ? c.text : c.muted,
              fontStyle: resolved ? 'normal' : 'italic',
              wordBreak: 'keep-all',
            }}
          >
            {resolved ? resolved.note : '이 위치에 준비된 노트가 없습니다.'}
          </div>
          <div style={{ fontFamily: t.fonts.mono, fontSize: 13, color: c.muted, opacity: 0.85 }}>
            {resolved ? resolved.key : state.noteKey}
            {state.stepId && (!resolved || resolved.key !== `${state.noteKey}/${state.stepId}`)
              ? `  ·  단계별 노트 없음: ${state.noteKey}/${state.stepId}`
              : ''}
          </div>
        </div>
      </div>

      {/* footer ─ step position + what comes next */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '14px 28px 16px',
          borderTop: `1px solid ${c.border}`,
        }}
      >
        {stepCount > 0 ? (
          <>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
              {Array.from({ length: stepCount }, (_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === stepIdx ? 13 : 9,
                    height: i === stepIdx ? 13 : 9,
                    borderRadius: 7,
                    background:
                      i === stepIdx ? c.accent : i < stepIdx ? c.textSecondary : c.baseline,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: t.fonts.mono,
                fontSize: 19,
                color: c.textSecondary,
                whiteSpace: 'nowrap',
              }}
            >
              {stepIdx + 1} / {stepCount}
              {state.stepId ? <span style={{ color: c.muted }}> · {state.stepId}</span> : null}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 18, color: c.muted }}>단계 없음</div>
        )}

        <span style={{ flex: 1 }} />

        {state.nextLabel ? (
          <div
            style={{
              fontSize: 19,
              color: c.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '50%',
            }}
          >
            <span style={{ color: c.muted }}>다음: </span>
            <span style={{ color: c.accent, fontWeight: 600 }}>{state.nextLabel}</span>
          </div>
        ) : (
          <div style={{ fontSize: 19, color: c.muted }}>마지막</div>
        )}
      </div>
    </div>
  );
};
