// Tracker: records content views, keeps the visitor's decayed scores in
// first-party storage, and publishes the output contract after every change.

import {
  accumulate, decayState, match,
  type CategoryScores, type EngineConfig, type MatchSet, type VisitorState,
} from '../../core/src/index.ts';

/** contentId → categoryId → attributeId → score. Produced by the crawler, or by hand for now. */
export type ContentTags = Record<string, CategoryScores>;

/** What the `intent:match` event carries. */
export interface MatchDetail extends MatchSet {
  /** Holdout visitors are scored but always see the default experience. */
  holdout: boolean;
}

/** Anything that can hold one string. localStorage by default. */
export interface TrackerStorage {
  get(): string | null;
  set(value: string): void;
  clear(): void;
}

/** The slice of `document` the tracker touches. Lets tests and edge runtimes pass a stand-in. */
export interface DocLike extends EventTarget {
  documentElement: { setAttribute(name: string, value: string): void; removeAttribute(name: string): void };
  cookie: string;
}

export interface TrackerOptions {
  config: EngineConfig;
  tags: ContentTags;
  storage?: TrackerStorage;
  /** Defaults to Date.now. The demo swaps this to fast-forward time. */
  clock?: () => number;
  /** Defaults to Math.random. Used once, to assign the holdout group. */
  random?: () => number;
  /** Where the contract is published. Defaults to `document` when there is one; null skips publishing. */
  doc?: DocLike | null;
  /** Repeat views of the same content inside this window count once. Default 30 minutes. */
  repeatWindowMs?: number;
  storageKey?: string;
  cookieName?: string;
  /** Cookie lifetime, and how long an idle visitor's scores are kept. Default 30. */
  cookieDays?: number;
}

export interface Tracker {
  /**
   * Record a view and publish. `weight` scales stronger actions (2 for a
   * download, 3 for a form fill). Unknown content and repeats inside the
   * window change nothing but still publish.
   */
  view(contentId: string, weight?: number): MatchDetail;
  /** Current matches, without recording anything. */
  matches(): MatchDetail;
  /** Scores decayed to now. */
  state(): VisitorState | undefined;
  /** Publish the current state to the page. */
  refresh(): MatchDetail;
  /** Forget the visitor's signal. Holdout assignment is kept so measurement stays clean. */
  reset(): MatchDetail;
  /** Override the holdout assignment (QA and previews). */
  setHoldout(value: boolean): MatchDetail;
}

interface Stored {
  state?: VisitorState;
  /** contentId → last counted view, for the repeat window. */
  seen: Record<string, number>;
  holdout?: boolean;
}

export const MATCH_EVENT = 'intent:match';

/** Action strength on the same Fibonacci ladder as tags. Use as the `weight` in view(). */
export const ACTIONS = { view: 1, engage: 2, save: 3, download: 5, convert: 8 } as const;
export type Action = keyof typeof ACTIONS;
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export function localStorageAdapter(key: string): TrackerStorage {
  // Storage can throw in private windows or with site data blocked; treat that as empty.
  return {
    get: () => { try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; } },
    set: (v) => { try { globalThis.localStorage?.setItem(key, v); } catch { /* unavailable */ } },
    clear: () => { try { globalThis.localStorage?.removeItem(key); } catch { /* unavailable */ } },
  };
}

export function memoryStorage(): TrackerStorage {
  let value: string | null = null;
  return { get: () => value, set: (v) => { value = v; }, clear: () => { value = null; } };
}

/** Cookie value: `purpose.family~destination.beach~archetype.family-summer-planner`. Ids only, never PII. */
export function cookieValue(detail: MatchDetail): string {
  if (detail.holdout) return 'holdout';
  const parts = detail.audiences.filter((a) => a.audience).map((a) => `${a.category}.${a.audience}`);
  if (detail.archetype.archetype) parts.push(`archetype.${detail.archetype.archetype}`);
  return parts.join('~');
}

export function createTracker(options: TrackerOptions): Tracker {
  const {
    config, tags,
    clock = Date.now,
    random = Math.random,
    repeatWindowMs = 30 * MINUTE,
    storageKey = 'intent:v2',
    cookieName = 'intent',
    cookieDays = 30,
  } = options;
  const storage = options.storage ?? localStorageAdapter(storageKey);
  const doc = options.doc !== undefined ? options.doc : (globalThis as { document?: DocLike }).document ?? null;

  const stored = load();
  // Scores and cookie share one retention window: idle longer than that, start over.
  if (stored.state && clock() - stored.state.updatedAt > cookieDays * DAY) {
    stored.state = undefined;
    stored.seen = {};
    save();
  }
  if (stored.holdout === undefined) {
    stored.holdout = random() * 100 < config.holdoutPercent;
    save();
  }

  function load(): Stored {
    try {
      const parsed = JSON.parse(storage.get() ?? '{}');
      if (parsed && typeof parsed === 'object') return { seen: {}, ...parsed };
    } catch { /* corrupt: start over */ }
    return { seen: {} };
  }

  function save() {
    storage.set(JSON.stringify(stored));
  }

  const matches = (): MatchDetail => ({ ...match(config, stored.state, clock()), holdout: !!stored.holdout });

  function publish(detail: MatchDetail): MatchDetail {
    if (!doc) return detail;
    const html = doc.documentElement;
    const show = !detail.holdout;
    for (const a of detail.audiences) {
      if (show && a.audience) html.setAttribute(`data-intent-${a.category}`, a.audience);
      else html.removeAttribute(`data-intent-${a.category}`);
    }
    if (show && detail.archetype.archetype) html.setAttribute('data-intent-archetype', detail.archetype.archetype);
    else html.removeAttribute('data-intent-archetype');
    if (detail.holdout) html.setAttribute('data-intent-holdout', 'true');
    else html.removeAttribute('data-intent-holdout');

    const value = cookieValue(detail);
    doc.cookie = value
      ? `${cookieName}=${encodeURIComponent(value)}; path=/; max-age=${cookieDays * 86400}; SameSite=Lax`
      : `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
    doc.dispatchEvent(new CustomEvent(MATCH_EVENT, { detail }));
    return detail;
  }

  return {
    view(contentId, weight = 1) {
      const item = tags[contentId];
      const now = clock();
      const last = stored.seen[contentId];
      const repeat = last !== undefined && now - last < repeatWindowMs;
      if (item && !repeat) {
        // A bad weight from page markup should never corrupt the visitor's scores.
        const w = Number.isFinite(weight) && weight > 0 ? Math.min(weight, 10) : 1;
        stored.state = accumulate(stored.state, item, now, config.halfLifeMs, w);
        stored.seen[contentId] = now;
        // Forget timestamps that can no longer block anything.
        for (const [id, t] of Object.entries(stored.seen)) if (now - t >= repeatWindowMs) delete stored.seen[id];
        save();
      }
      return publish(matches());
    },
    matches,
    state: () => (stored.state ? decayState(stored.state, clock(), config.halfLifeMs) : undefined),
    refresh: () => publish(matches()),
    reset() {
      stored.state = undefined;
      stored.seen = {};
      save();
      return publish(matches());
    },
    setHoldout(value) {
      stored.holdout = value;
      save();
      return publish(matches());
    },
  };
}
