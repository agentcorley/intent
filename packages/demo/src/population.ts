// Simulated visitor population for the aggregate view. Pure and deterministic:
// the same example, config, size, and seed always give the same population.

import { accumulate, match, type EngineConfig, type MatchSet, type VisitorState } from '../../core/src/index.ts';
import type { Example } from './examples/types.ts';

export interface SimulatedVisitor {
  state: VisitorState;
  detail: MatchSet;
}

export interface Population {
  size: number;
  visitors: SimulatedVisitor[];
  /** categoryId → attributeId → visitors whose audience is that attribute. */
  audienceCounts: Record<string, Record<string, number>>;
  /** archetypeId → visitors matched to it. */
  archetypeCounts: Record<string, number>;
  /** Visitors matched to no archetype. */
  unmatched: number;
  /** archetypeId → "category.attribute" → visitors with both. */
  coOccurrence: Record<string, Record<string, number>>;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Fixed start so results never depend on the wall clock. */
const EPOCH = Date.UTC(2026, 9, 1);
/** Content types that count as a stronger action than a page view. */
const ACTION = /download|form|quote|demo|book|ticket|trial|contact|request|apply|reserve|rfp/i;

/** Small seeded PRNG (mulberry32). Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const int = (rand: Rand, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(rand: Rand, list: T[]): T => list[Math.floor(rand() * list.length)];

/** A scenario path with noise: maybe drop or swap one item, then add 0–2 random reads. */
function noisyPath(rand: Rand, path: string[], ids: string[]): string[] {
  const out = [...path];
  const roll = rand();
  if (roll < 0.25 && out.length > 2) out.splice(int(rand, 0, out.length - 1), 1);
  else if (roll < 0.5 && out.length) out[int(rand, 0, out.length - 1)] = pick(rand, ids);
  const extra = int(rand, 0, 2);
  for (let i = 0; i < extra; i++) out.splice(int(rand, 0, out.length), 0, pick(rand, ids));
  return out;
}

/** 2–7 distinct items in random order. */
function browse(rand: Rand, ids: string[]): string[] {
  const pool = [...ids];
  const n = Math.min(pool.length, int(rand, 2, 7));
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

function weightFor(rand: Rand, type: string | undefined): number {
  if (!type || !ACTION.test(type)) return 1;
  return rand() < 0.5 ? int(rand, 2, 3) : 1;
}

export function simulatePopulation(example: Example, config: EngineConfig, n = 400, seed = 7): Population {
  const rand = mulberry32(seed);
  const ids = example.content.map((c) => c.id);
  const typeById = new Map(example.content.map((c) => [c.id, c.type]));
  const paths = example.scenarios.map((s) => s.path.filter((id) => typeById.has(id))).filter((p) => p.length);

  const audienceCounts: Population['audienceCounts'] = {};
  for (const c of config.categories) audienceCounts[c.id] = Object.fromEntries(c.attributes.map((a) => [a.id, 0]));
  const archetypeCounts: Population['archetypeCounts'] = Object.fromEntries(config.archetypes.map((a) => [a.id, 0]));
  const coOccurrence: Population['coOccurrence'] = Object.fromEntries(config.archetypes.map((a) => [a.id, {}]));
  let unmatched = 0;

  const visitors: SimulatedVisitor[] = [];
  for (let v = 0; v < n; v++) {
    const reads = paths.length && rand() < 0.6 ? noisyPath(rand, pick(rand, paths), ids) : browse(rand, ids);
    // Visits start somewhere in the first three days; reads are minutes to a day apart.
    let now = EPOCH + Math.floor(rand() * 3 * DAY);
    let state: VisitorState | undefined;
    const lastSeen = new Map<string, number>();
    for (const id of reads) {
      now += rand() < 0.75 ? int(rand, 1, 12) * MINUTE : int(rand, 2, 30) * HOUR;
      const tags = example.tags[id];
      const last = lastSeen.get(id);
      // Mirror the tracker: unknown content and repeats inside 30 minutes count once.
      if (!tags || (last !== undefined && now - last < 30 * MINUTE)) continue;
      lastSeen.set(id, now);
      state = accumulate(state, tags, now, config.halfLifeMs, weightFor(rand, typeById.get(id)));
    }
    const final: VisitorState = state ?? { scores: {}, views: 0, updatedAt: now };
    const detail = match(config, final, now);
    visitors.push({ state: final, detail });

    const arch = detail.archetype.archetype;
    if (arch) archetypeCounts[arch] = (archetypeCounts[arch] ?? 0) + 1;
    else unmatched++;
    for (const a of detail.audiences) {
      if (!a.audience) continue;
      audienceCounts[a.category][a.audience] = (audienceCounts[a.category]?.[a.audience] ?? 0) + 1;
      if (arch) {
        const key = `${a.category}.${a.audience}`;
        coOccurrence[arch][key] = (coOccurrence[arch][key] ?? 0) + 1;
      }
    }
  }

  return { size: n, visitors, audienceCounts, archetypeCounts, unmatched, coOccurrence };
}
