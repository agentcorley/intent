// Browser entry: one script plus one config block drops intent into any CMS.
// Reads the config, records the page view, swaps slot variants, and exposes
// window.intent. Any failure leaves the page on its default content.

import { loadConfig } from '../../config/src/index.ts';
import type { CategoryScores, EngineConfig } from '../../core/src/index.ts';
import {
  createTracker, memoryStorage, MATCH_EVENT,
  type ContentTags, type DocLike, type MatchDetail, type Tracker,
} from '../../tracker/src/index.ts';
import {
  cleanTagMap, cleanTags, optedOut, parseSettings, parseTags, parseWeight, pickVariant, resolvePage, tagsId,
  type PrivacySignals, type SnippetSettings,
} from './logic.ts';

const VERSION = '0.1.0';

export interface IntentApi {
  version: string;
  /** Record a view of a content id from the tag map. */
  view(id: string, weight?: number): MatchDetail;
  /** Record ad hoc tags, for content with no id in the map. */
  track(tags: CategoryScores, weight?: number): MatchDetail | null;
  matches(): MatchDetail;
  reset(): MatchDetail;
  setHoldout(value: boolean): MatchDetail;
  /** Call `handler` on every intent:match. Returns an unsubscribe function. */
  on(handler: (detail: MatchDetail) => void): () => void;
}

declare global {
  interface Window { intent?: IntentApi }
}

const READY_CLASS = 'intent-ready';
const STYLE_ID = 'intent-style';
const CACHE_PREFIX = 'intent:tags:';
// Before the script finishes, slots show only their default. If it never finishes, that stays true.
const ANTI_FLICKER =
  `html:not(.${READY_CLASS}) [data-intent-slot]>:not([data-intent-default]),[data-intent-slot]>[hidden]{display:none!important}`;

const log = (message: string) => console.error(`[intent] ${message}`);

injectStyle();
if (!window.intent) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}

function injectStyle() {
  try {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = ANTI_FLICKER;
    (document.head ?? document.documentElement).appendChild(style);
  } catch { /* never break the host page */ }
}

function start() {
  let settings: SnippetSettings;
  let config: EngineConfig;
  try {
    settings = parseSettings(document.getElementById('intent-config')?.textContent);
    config = loadConfig(settings.config);
  } catch (e) {
    log((e as Error).message);
    return;
  }
  try {
    run(settings, config);
  } catch (e) {
    log(`Stopped: ${(e as Error).message}`);
  }
}

function run(settings: SnippetSettings, config: EngineConfig) {
  // GPC or DNT: holdout with nothing stored and no network calls.
  const quiet = optedOut(navigator as Navigator & PrivacySignals, settings.respectGPC !== false);
  const map: ContentTags = cleanTagMap(settings.tags);
  const tracker = createTracker({
    config,
    tags: map,
    doc: quiet ? quietDoc() : (document as unknown as DocLike),
    ...(quiet ? { storage: memoryStorage() } : {}),
  });

  document.addEventListener(MATCH_EVENT, (e) => applySlots((e as CustomEvent<MatchDetail>).detail));
  document.addEventListener('click', (e) => onClick(e, api), true);
  const api = createApi(tracker, map);
  window.intent = api;

  if (quiet) {
    tracker.setHoldout(true);
    document.documentElement.classList.add(READY_CLASS);
    return;
  }

  // Inline or config tags record now. Otherwise slots apply from stored state
  // and the view lands when the remote map does.
  const recorded = recordPage(tracker, map);
  if (!recorded) tracker.refresh();
  document.documentElement.classList.add(READY_CLASS);
  if (settings.tagsUrl) {
    fetchTags(settings.tagsUrl).then((remote) => {
      Object.assign(map, remote, cleanTagMap(settings.tags));
      if (!recorded) recordPage(tracker, map);
    });
  }
}

/** Record the current page. Returns null when the page has no tags. */
function recordPage(tracker: Tracker, map: ContentTags): MatchDetail | null {
  const page = resolvePage({
    inline: parseTags(meta('intent:tags')),
    id: meta('intent:id'),
    path: location.pathname,
    map,
  });
  if (!page) return null;
  map[page.id] = page.tags;
  return tracker.view(page.id);
}

function createApi(tracker: Tracker, map: ContentTags): IntentApi {
  return {
    version: VERSION,
    view: (id, weight = 1) => tracker.view(id, weight),
    track(tags, weight = 1) {
      const clean = cleanTags(tags);
      if (!clean) return null;
      const id = tagsId(clean);
      map[id] = clean;
      return tracker.view(id, weight);
    },
    matches: () => tracker.matches(),
    reset: () => tracker.reset(),
    setHoldout: (value) => tracker.setHoldout(value),
    on(handler) {
      const listener = (e: Event) => handler((e as CustomEvent<MatchDetail>).detail);
      document.addEventListener(MATCH_EVENT, listener);
      return () => document.removeEventListener(MATCH_EVENT, listener);
    },
  };
}

/** Show one child per slot: first matching variant, else the default. */
function applySlots(detail: MatchDetail) {
  document.querySelectorAll('[data-intent-slot]').forEach((slot) => {
    const kids = Array.from(slot.children) as HTMLElement[];
    const pick = pickVariant(
      kids.map((k) => ({ show: k.getAttribute('data-intent-show'), isDefault: k.hasAttribute('data-intent-default') })),
      detail,
    );
    kids.forEach((k, i) => { k.hidden = i !== pick; });
  });
}

/** `data-intent-track="content-id"`, or empty plus `data-intent-tags='{...}'`. */
function onClick(e: Event, api: IntentApi) {
  const el = (e.target as Element | null)?.closest?.('[data-intent-track]');
  if (!el) return;
  const weight = parseWeight(el.getAttribute('data-intent-weight'));
  const id = el.getAttribute('data-intent-track')?.trim();
  if (id) api.view(id, weight);
  else {
    const tags = parseTags(el.getAttribute('data-intent-tags'));
    if (tags) api.track(tags, weight);
  }
}

function meta(name: string): string | null {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? null;
}

/** Fetch the tag map once per session. Failures log and fall back to inline tags. */
async function fetchTags(url: string): Promise<ContentTags> {
  const key = CACHE_PREFIX + url;
  try {
    const hit = sessionStorage.getItem(key);
    if (hit) return cleanTagMap(JSON.parse(hit));
  } catch { /* storage blocked or corrupt */ }
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const map = cleanTagMap(await res.json());
    try { sessionStorage.setItem(key, JSON.stringify(map)); } catch { /* storage blocked */ }
    return map;
  } catch (e) {
    log(`Could not load tags from ${url} (${(e as Error).message}).`);
    return {};
  }
}

/** A document stand-in that publishes attributes and events but never writes the cookie. */
function quietDoc(): DocLike {
  return {
    documentElement: document.documentElement,
    cookie: '',
    addEventListener: document.addEventListener.bind(document),
    removeEventListener: document.removeEventListener.bind(document),
    dispatchEvent: document.dispatchEvent.bind(document),
  };
}
