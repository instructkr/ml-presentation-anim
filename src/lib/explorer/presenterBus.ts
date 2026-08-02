/**
 * Deck ↔ notes-window link.
 *
 * One BroadcastChannel, two message kinds: the deck posts 'state' on every
 * navigation / step / tab / slide change, and the notes window posts 'hello'
 * when it opens so a deck that is already mid-talk answers with its current
 * state instead of leaving the presenter on a placeholder.
 *
 * App-level code, not a Remotion scene — wall-clock time is fine here.
 */

export const PRESENTER_CHANNEL = 'ml-anim-presenter';

export type PresenterView = 'home' | 'detail' | 'slides';

export interface PresenterState {
  type: 'state';
  weekId: string;
  view: PresenterView;
  /** notes lookup key: node/group id, scene id, or '_home' */
  noteKey: string;
  /** heading for the current location */
  title: string;
  breadcrumb: string[];
  stepId?: string;
  stepIdx?: number;
  stepCount?: number;
  /** label of whatever the guided path serves up next */
  nextLabel?: string;
  /** wall-clock ms at broadcast */
  at: number;
}

/** Sent by a notes window on open: "deck, tell me where you are." */
export interface PresenterHello {
  type: 'hello';
  at: number;
}

export type PresenterMessage = PresenterState | PresenterHello;

export interface PresenterBus {
  post: (msg: PresenterMessage) => void;
  /** returns an unsubscribe fn */
  subscribe: (fn: (msg: PresenterMessage) => void) => () => void;
  close: () => void;
}

/** BroadcastChannel is absent in the Remotion/node bundle and old Safari. */
export const presenterBusSupported = (): boolean => typeof BroadcastChannel !== 'undefined';

const inertBus: PresenterBus = {
  post: () => undefined,
  subscribe: () => () => undefined,
  close: () => undefined,
};

export const openPresenterBus = (name: string = PRESENTER_CHANNEL): PresenterBus => {
  if (!presenterBusSupported()) return inertBus;

  const channel = new BroadcastChannel(name);
  const listeners = new Set<(msg: PresenterMessage) => void>();

  const onMessage = (e: MessageEvent) => {
    const data = e.data as Partial<PresenterMessage> | null;
    if (!data || typeof data !== 'object') return;
    if (data.type !== 'state' && data.type !== 'hello') return;
    listeners.forEach((fn) => fn(data as PresenterMessage));
  };
  channel.addEventListener('message', onMessage);

  return {
    post: (msg) => {
      // A closed channel throws; the deck must never die because the notes
      // window went away mid-talk.
      try {
        channel.postMessage(msg);
      } catch {
        /* channel closed */
      }
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    close: () => {
      listeners.clear();
      channel.removeEventListener('message', onMessage);
      channel.close();
    },
  };
};

/**
 * Most-specific-wins note lookup: '<noteKey>/<stepId>' beats '<noteKey>'.
 * Returns undefined when the week has nothing to say about this spot.
 */
export const resolveNote = (
  notes: Record<string, string> | undefined,
  noteKey: string,
  stepId?: string,
): { note: string; key: string } | undefined => {
  if (!notes) return undefined;
  if (stepId) {
    const stepKey = `${noteKey}/${stepId}`;
    const stepNote = notes[stepKey];
    if (stepNote) return { note: stepNote, key: stepKey };
  }
  const note = notes[noteKey];
  return note ? { note, key: noteKey } : undefined;
};
