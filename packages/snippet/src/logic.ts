// Pure snippet logic: no DOM, no storage. Unit-tested in Node.

import type { CategoryScores } from '../../core/src/index.ts';
import type { ConfigInput } from '../../config/src/index.ts';
import type { ContentTags, MatchDetail } from '../../tracker/src/index.ts';

/** What a site puts in `<script type="application/json" id="intent-config">`. */
export interface SnippetSettings {
  config: ConfigInput;
  tags?: ContentTags;
  tagsUrl?: string;
  /** Honor Global Privacy Control and Do Not Track. Default true. */
  respectGPC?: boolean;
}

export const DEFAULT_TRACK_WEIGHT = 2;

/** Parse the JSON block. Throws a readable Error when the shape is wrong; config itself is validated by loadConfig. */
export function parseSettings(text: string | null | undefined): SnippetSettings {
  if (!text || !text.trim()) throw new Error('No config found. Add <script type="application/json" id="intent-config">.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The intent-config block is not valid JSON.');
  }
  const s = parsed as Partial<SnippetSettings> | null;
  if (!s || typeof s !== 'object' || !s.config) throw new Error('The intent-config block needs a "config" object.');
  if (s.tags !== undefined && !isObject(s.tags)) throw new Error('"tags" must be an object of content id to tags.');
  if (s.tagsUrl !== undefined && typeof s.tagsUrl !== 'string') throw new Error('"tagsUrl" must be a string.');
  return s as SnippetSettings;
}

const isObject = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/** Parse content tags JSON (`{"industry":{"tech":0.8}}`). Null when missing or malformed. */
export function parseTags(text: string | null | undefined): CategoryScores | null {
  if (!text) return null;
  try {
    return cleanTags(JSON.parse(text));
  } catch {
    return null;
  }
}

/** Keep only finite numeric scores. Null when nothing usable is left. */
export function cleanTags(input: unknown): CategoryScores | null {
  if (!isObject(input)) return null;
  const out: CategoryScores = {};
  for (const [c, attrs] of Object.entries(input)) {
    if (!isObject(attrs)) continue;
    for (const [a, v] of Object.entries(attrs)) {
      if (typeof v === 'number' && Number.isFinite(v)) (out[c] ??= {})[a] = v;
    }
  }
  return Object.keys(out).length ? out : null;
}

/** Clean a whole tag map (from tagsUrl or the config block), dropping unusable entries. */
export function cleanTagMap(input: unknown): ContentTags {
  const out: ContentTags = {};
  if (!isObject(input)) return out;
  for (const [id, tags] of Object.entries(input)) {
    const clean = cleanTags(tags);
    if (clean) out[id] = clean;
  }
  return out;
}

/** Paths to try in the tag map: as given, then with or without a trailing slash. */
export function pathCandidates(path: string): string[] {
  if (path === '/' || !path) return ['/'];
  return path.endsWith('/') ? [path, path.slice(0, -1)] : [path, `${path}/`];
}

export interface PageInput {
  /** Parsed `<meta name="intent:tags">`, if any. */
  inline: CategoryScores | null;
  /** `<meta name="intent:id">`, if any. */
  id: string | null;
  /** location.pathname */
  path: string;
  map: ContentTags;
}

/**
 * The current page's content id and tags. Inline tags win (a CMS writes them
 * per page with no central map); otherwise the id or path is looked up.
 */
export function resolvePage(page: PageInput): { id: string; tags: CategoryScores } | null {
  const id = page.id?.trim() || null;
  if (page.inline) return { id: id ?? page.path, tags: page.inline };
  for (const key of id ? [id] : pathCandidates(page.path)) {
    if (Object.prototype.hasOwnProperty.call(page.map, key)) return { id: key, tags: page.map[key] };
  }
  return null;
}

/** A stable content id for ad hoc tags, so the repeat window still applies to them. */
export function tagsId(tags: CategoryScores): string {
  const sorted = Object.keys(tags).sort().map((c) => [c, Object.keys(tags[c]).sort().map((a) => [a, tags[c][a]])]);
  return `tags:${JSON.stringify(sorted)}`;
}

/** Weight from `data-intent-weight`. Missing or invalid falls back to the default. */
export function parseWeight(value: string | null | undefined, fallback = DEFAULT_TRACK_WEIGHT): number {
  if (value == null || value.trim() === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/* ---------- Slots ---------- */

export interface Condition {
  /** A category id, or "archetype". */
  key: string;
  value: string;
}

/** `"archetype:family-planner, industry:retail"` → two conditions, OR'd. Malformed parts are dropped. */
export function parseCondition(text: string | null | undefined): Condition[] {
  if (!text) return [];
  const out: Condition[] = [];
  for (const part of text.split(',')) {
    const i = part.indexOf(':');
    if (i < 1) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key && value) out.push({ key, value });
  }
  return out;
}

/** True when any condition holds. Holdout visitors and unready visitors match nothing. */
export function conditionMatches(conditions: Condition[], detail: MatchDetail): boolean {
  if (detail.holdout || !detail.ready) return false;
  return conditions.some(({ key, value }) =>
    key === 'archetype'
      ? detail.archetype.archetype === value
      : detail.audiences.some((a) => a.category === key && a.audience === value),
  );
}

export interface Variant {
  /** `data-intent-show`, or null. */
  show: string | null;
  /** Has `data-intent-default`. */
  isDefault: boolean;
}

/** Index of the variant to show: the first match, else the default, else -1 (show nothing). */
export function pickVariant(variants: Variant[], detail: MatchDetail): number {
  const hit = variants.findIndex((v) => v.show !== null && conditionMatches(parseCondition(v.show), detail));
  return hit >= 0 ? hit : variants.findIndex((v) => v.isDefault);
}

/* ---------- Privacy ---------- */

export interface PrivacySignals {
  globalPrivacyControl?: boolean;
  doNotTrack?: string | null;
}

/** True when the visitor asked not to be tracked and the site honors it (the default). */
export function optedOut(nav: PrivacySignals | undefined, respect = true): boolean {
  if (!respect || !nav) return false;
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
}
