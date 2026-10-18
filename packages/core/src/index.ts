// Intent matching core. Pure functions, zero dependencies, browser and edge safe.
//
// Categories hold attributes. A visitor's audience in each category is the
// attribute they clearly lean toward. An archetype is a fingerprint across
// categories; the visitor matches the nearest one by Euclidean distance.

/** attributeId → score */
export type Scores = Record<string, number>;
/** categoryId → attributeId → score */
export type CategoryScores = Record<string, Scores>;

export interface Attribute {
  id: string;
  label?: string;
}

export interface Category {
  id: string;
  label?: string;
  attributes: Attribute[];
}

export interface Archetype {
  id: string;
  label?: string;
  /**
   * Target 0–1 per attribute, grouped by category. A category left out means
   * “any”: it is ignored. Inside a named category, unlisted attributes are 0.
   */
  fingerprint: CategoryScores;
}

export interface EngineConfig {
  categories: Category[];
  archetypes: Archetype[];
  /** Max distance from a single attribute for a category audience to count. */
  audienceRadius: number;
  /** Max mean distance for an archetype to count. */
  archetypeRadius: number;
  /** Tagged content views needed before anything matches. */
  minViews: number;
  /** Signal half-life in milliseconds. */
  halfLifeMs: number;
  /** Share of visitors (0–50) who always see the default, for measuring lift. */
  holdoutPercent: number;
}

/** Everything the engine knows about one visitor. */
export interface VisitorState {
  scores: CategoryScores;
  /** Count of tagged content views. Not decayed. */
  views: number;
  /** Epoch ms of the last update; decay runs from here. */
  updatedAt: number;
}

export interface Contribution {
  attribute: string;
  visitor: number;
  target: number;
  /** (v − s)². These sum to the category distance. */
  value: number;
}

export interface CategoryDistance {
  category: string;
  distance: number;
  contributions: Contribution[];
}

export interface AudienceResult extends CategoryDistance {
  /** Matched attribute, or null with too little or too mixed a signal. */
  audience: string | null;
  /** Closest attribute even when not matched, so a miss is explainable. */
  nearest: string | null;
}

export interface ArchetypeResult {
  archetype: string | null;
  nearest: string | null;
  /** Mean squared distance across the categories the archetype names. */
  distance: number;
  /** Per-category breakdown against the nearest archetype. */
  categories: CategoryDistance[];
  /** Categories the nearest archetype names where the visitor has no signal yet. */
  missing: string[];
}

export interface MatchSet {
  /** False until the visitor reaches `minViews`; nothing matches before then. */
  ready: boolean;
  views: number;
  audiences: AudienceResult[];
  archetype: ArchetypeResult;
}

/* ---------- Signal ---------- */

/** Halve the signal every `halfLifeMs`. */
export function decay(value: number, elapsedMs: number, halfLifeMs: number): number {
  if (elapsedMs <= 0) return value;
  return value * Math.pow(0.5, elapsedMs / halfLifeMs);
}

/** Decay every score forward to `now`. */
export function decayState(state: VisitorState, now: number, halfLifeMs: number): VisitorState {
  const elapsed = now - state.updatedAt;
  const scores: CategoryScores = {};
  for (const [category, attrs] of Object.entries(state.scores)) {
    scores[category] = {};
    for (const [attr, value] of Object.entries(attrs)) scores[category][attr] = decay(value, elapsed, halfLifeMs);
  }
  return { scores, views: state.views, updatedAt: Math.max(now, state.updatedAt) };
}

/**
 * Decay to `now`, then add one piece of content's tags. `weight` scales
 * stronger actions (a download or form fill) above a page view.
 */
export function accumulate(
  state: VisitorState | undefined,
  tags: CategoryScores,
  now: number,
  halfLifeMs: number,
  weight = 1,
): VisitorState {
  const base = state ? decayState(state, now, halfLifeMs) : { scores: {}, views: 0, updatedAt: now };
  const scores: CategoryScores = {};
  for (const [c, attrs] of Object.entries(base.scores)) scores[c] = { ...attrs };
  for (const [c, attrs] of Object.entries(tags)) {
    scores[c] ??= {};
    for (const [a, value] of Object.entries(attrs)) scores[c][a] = (scores[c][a] ?? 0) + value * weight;
  }
  return { scores, views: base.views + 1, updatedAt: base.updatedAt };
}

/* ---------- Distance ---------- */

/**
 * Scale a category to 0–1 by its strongest attribute, so the shape of
 * interest matters and raw volume doesn't. The divisor never drops below
 * `SIGNAL_FLOOR` (one full-strength tag), so a trace of signal stays faint
 * and stale interest fades out as it decays. Null when there's no signal.
 */
export const SIGNAL_FLOOR = 1;

export function normalize(scores: Scores | undefined, attributes: Attribute[]): Scores | null {
  let max = 0;
  for (const a of attributes) max = Math.max(max, scores?.[a.id] ?? 0);
  if (max <= 0) return null;
  const divisor = Math.max(max, SIGNAL_FLOOR);
  const out: Scores = {};
  for (const a of attributes) out[a.id] = Math.max(0, scores?.[a.id] ?? 0) / divisor;
  return out;
}

/** Squared Euclidean distance within one category. A null visitor counts as all zeros. */
export function categoryDistance(category: Category, visitor: Scores | null, target: Scores): CategoryDistance {
  let distance = 0;
  const contributions: Contribution[] = [];
  for (const a of category.attributes) {
    const v = visitor?.[a.id] ?? 0;
    const s = target[a.id] ?? 0;
    const value = (v - s) ** 2;
    distance += value;
    contributions.push({ attribute: a.id, visitor: v, target: s, value });
  }
  return { category: category.id, distance, contributions };
}

/* ---------- Matching ---------- */

/** Nearest single attribute in a category. Ties go to the attribute listed first. */
export function matchAudience(category: Category, scores: Scores | undefined, radius: number): AudienceResult {
  const visitor = normalize(scores, category.attributes);
  if (!visitor) {
    return { category: category.id, audience: null, nearest: null, distance: Infinity, contributions: [] };
  }
  let best: (CategoryDistance & { attribute: string }) | null = null;
  for (const a of category.attributes) {
    const d = categoryDistance(category, visitor, { [a.id]: 1 });
    if (!best || d.distance < best.distance) best = { ...d, attribute: a.id };
  }
  return {
    category: category.id,
    audience: best!.distance <= radius ** 2 ? best!.attribute : null,
    nearest: best!.attribute,
    distance: best!.distance,
    contributions: best!.contributions,
  };
}

/**
 * Nearest archetype. Distance is the mean across the categories an archetype
 * names, so a broad archetype doesn't win just by naming fewer categories.
 * An archetype only matches when the visitor has some signal in every category
 * it names: no evidence is not a match. The nearest archetype is still reported,
 * with what it is waiting on. Ties go to the archetype listed first.
 */
export function matchArchetype(
  categories: Category[],
  archetypes: Archetype[],
  scores: CategoryScores,
  radius: number,
): ArchetypeResult {
  const none: ArchetypeResult = { archetype: null, nearest: null, distance: Infinity, categories: [], missing: [] };
  const byId = new Map(categories.map((c) => [c.id, c]));
  const visitor = new Map(categories.map((c) => [c.id, normalize(scores[c.id], c.attributes)]));
  if (![...visitor.values()].some(Boolean)) return none;

  let nearest: ArchetypeResult | null = null;
  let eligible: ArchetypeResult | null = null;
  for (const archetype of archetypes) {
    const parts: CategoryDistance[] = [];
    const missing: string[] = [];
    for (const [cid, target] of Object.entries(archetype.fingerprint)) {
      const category = byId.get(cid);
      if (!category) continue;
      const v = visitor.get(cid) ?? null;
      if (!v) missing.push(cid);
      parts.push(categoryDistance(category, v, target));
    }
    if (!parts.length) continue;
    const distance = parts.reduce((s, p) => s + p.distance, 0) / parts.length;
    const result = { archetype: null, nearest: archetype.id, distance, categories: parts, missing };
    if (!nearest || distance < nearest.distance) nearest = result;
    if (!missing.length && (!eligible || distance < eligible.distance)) eligible = result;
  }
  if (eligible && eligible.distance <= radius ** 2) return { ...eligible, archetype: eligible.nearest };
  return nearest ?? none;
}

/**
 * Everything at once. Decays the visitor to `now`. Below `minViews`, nearest
 * results are still computed for explanation, but nothing is matched.
 */
export function match(config: EngineConfig, state: VisitorState | undefined, now: number): MatchSet {
  const current = state ? decayState(state, now, config.halfLifeMs) : undefined;
  const scores = current?.scores ?? {};
  const views = current?.views ?? 0;
  const ready = views >= config.minViews;

  const audiences = config.categories.map((c) => {
    const r = matchAudience(c, scores[c.id], config.audienceRadius);
    return ready ? r : { ...r, audience: null };
  });
  const found = matchArchetype(config.categories, config.archetypes, scores, config.archetypeRadius);
  const archetype = ready ? found : { ...found, archetype: null };

  return { ready, views, audiences, archetype };
}
