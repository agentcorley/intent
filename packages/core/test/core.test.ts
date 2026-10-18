import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decay, decayState, accumulate, normalize, categoryDistance, matchAudience, matchArchetype, match,
  type Category, type Archetype, type EngineConfig,
} from '../src/index.ts';

const HOUR = 60 * 60 * 1000;
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

const industry: Category = {
  id: 'industry',
  attributes: [{ id: 'finance' }, { id: 'manufacturing' }, { id: 'tech' }],
};
const visitorType: Category = {
  id: 'visitor',
  attributes: [{ id: 'customer' }, { id: 'dealer' }, { id: 'investor' }],
};
const product: Category = {
  id: 'product',
  attributes: [{ id: 'a' }, { id: 'b' }],
};
const categories = [industry, visitorType, product];

const archetypes: Archetype[] = [
  // Specific: names all three categories.
  { id: 'tech-buyer-a', fingerprint: { industry: { tech: 1 }, visitor: { customer: 1 }, product: { a: 1 } } },
  // Broad: any industry, any visitor type.
  { id: 'b-fan', fingerprint: { product: { b: 1 } } },
  { id: 'dealer', fingerprint: { visitor: { dealer: 1 } } },
];

const config: EngineConfig = {
  categories,
  archetypes,
  audienceRadius: 0.6,
  archetypeRadius: 0.6,
  minViews: 2,
  halfLifeMs: HOUR,
  holdoutPercent: 0,
};

/* ---------- Signal ---------- */

test('decay halves the value every half-life and ignores clock skew', () => {
  assert.equal(decay(8, 0, HOUR), 8);
  assert.equal(decay(8, HOUR, HOUR), 4);
  assert.equal(decay(8, 2 * HOUR, HOUR), 2);
  assert.equal(decay(8, -HOUR, HOUR), 8);
});

test('decayState decays every attribute, keeps views, moves time forward', () => {
  const s = decayState({ scores: { industry: { tech: 4 }, product: { a: 2 } }, views: 3, updatedAt: 0 }, HOUR, HOUR);
  assert.deepEqual(s, { scores: { industry: { tech: 2 }, product: { a: 1 } }, views: 3, updatedAt: HOUR });
});

test('accumulate starts from nothing and counts the view', () => {
  assert.deepEqual(accumulate(undefined, { product: { a: 0.5 } }, 10, HOUR), {
    scores: { product: { a: 0.5 } }, views: 1, updatedAt: 10,
  });
});

test('accumulate decays old signal first, then adds weighted tags', () => {
  const s = accumulate({ scores: { product: { a: 1 } }, views: 1, updatedAt: 0 }, { product: { a: 0.5, b: 1 } }, HOUR, HOUR, 2);
  assert.deepEqual(s.scores, { product: { a: 1.5, b: 2 } });
  assert.equal(s.views, 2);
});

test('accumulate does not mutate the previous state', () => {
  const prev = { scores: { product: { a: 1 } }, views: 1, updatedAt: 0 };
  accumulate(prev, { product: { a: 1 } }, 0, HOUR);
  assert.deepEqual(prev.scores, { product: { a: 1 } });
});

/* ---------- Distance ---------- */

test('normalize scales by the strongest attribute', () => {
  assert.deepEqual(normalize({ finance: 2, tech: 4 }, industry.attributes), { finance: 0.5, manufacturing: 0, tech: 1 });
});

test('normalize returns null for missing, empty, or all-zero scores', () => {
  assert.equal(normalize(undefined, industry.attributes), null);
  assert.equal(normalize({}, industry.attributes), null);
  assert.equal(normalize({ tech: 0 }, industry.attributes), null);
});

test('normalize keeps a trace of signal faint (signal floor)', () => {
  assert.deepEqual(normalize({ tech: 0.3 }, industry.attributes), { finance: 0, manufacturing: 0, tech: 0.3 });
  assert.equal(matchAudience(industry, { tech: 0.3 }, 0.6).audience, null);
  assert.equal(matchAudience(industry, { tech: 0.3 }, 0.6).nearest, 'tech');
});

test('stale interest fades out of its audience as it decays', () => {
  let s = accumulate(undefined, { industry: { tech: 1 } }, 0, HOUR);
  s = accumulate(s, { industry: { tech: 1 } }, 0, HOUR);
  s = accumulate(s, { product: { a: 1 } }, 0, HOUR);
  assert.equal(match(config, s, 0).audiences[0].audience, 'tech');
  // Three half-lives: 2 → 0.25, below the floor and outside the radius.
  assert.equal(match(config, s, 3 * HOUR).audiences[0].audience, null);
});

test('normalize ignores attributes outside the category', () => {
  assert.deepEqual(normalize({ other: 10, tech: 2 }, industry.attributes), { finance: 0, manufacturing: 0, tech: 1 });
});

test('categoryDistance sums squared gaps; contributions add up', () => {
  const d = categoryDistance(industry, { finance: 0.5, manufacturing: 0, tech: 1 }, { tech: 1 });
  close(d.distance, 0.25);
  close(d.contributions.reduce((s, c) => s + c.value, 0), d.distance);
});

test('categoryDistance treats no signal as all zeros', () => {
  close(categoryDistance(product, null, { a: 1 }).distance, 1);
});

/* ---------- Audiences ---------- */

test('matchAudience picks the clear leader', () => {
  const r = matchAudience(industry, { tech: 3, finance: 1 }, 0.6);
  assert.equal(r.audience, 'tech');
  close(r.distance, (1 / 3) ** 2);
});

test('matchAudience is volume-independent', () => {
  assert.deepEqual(matchAudience(industry, { tech: 1 }, 0.6), matchAudience(industry, { tech: 50 }, 0.6));
});

test('matchAudience returns null on a mixed signal but names the nearest', () => {
  const r = matchAudience(industry, { tech: 1, finance: 0.9 }, 0.6);
  assert.equal(r.audience, null);
  assert.equal(r.nearest, 'tech');
});

test('matchAudience breaks exact ties by attribute order', () => {
  assert.equal(matchAudience(industry, { tech: 1, finance: 1 }, 2).audience, 'finance');
});

test('matchAudience returns null with no signal', () => {
  assert.deepEqual(matchAudience(industry, undefined, 0.6), {
    category: 'industry', audience: null, nearest: null, distance: Infinity, contributions: [],
  });
});

/* ---------- Archetypes ---------- */

test('matchArchetype finds the archetype across categories', () => {
  const r = matchArchetype(categories, archetypes, {
    industry: { tech: 1 }, visitor: { customer: 1 }, product: { a: 1 },
  }, 0.6);
  assert.equal(r.archetype, 'tech-buyer-a');
  close(r.distance, 0);
  assert.deepEqual(r.categories.map((c) => c.category), ['industry', 'visitor', 'product']);
});

test('categories an archetype leaves out are ignored (“any”)', () => {
  for (const ind of ['finance', 'manufacturing', 'tech']) {
    const r = matchArchetype(categories, archetypes, { industry: { [ind]: 1 }, visitor: { dealer: 1 } }, 0.6);
    assert.equal(r.archetype, 'dealer');
    assert.deepEqual(r.categories.map((c) => c.category), ['visitor']);
  }
});

test('distance is a mean, so broad archetypes do not win by naming fewer categories', () => {
  // Strong fit on two of three categories for the specific archetype; weak product B signal.
  const r = matchArchetype(categories, archetypes, {
    industry: { tech: 1 }, visitor: { customer: 1 }, product: { a: 1, b: 0.6 },
  }, 0.6);
  // Specific: (0 + 0 + 0.36) / 3 = 0.12. Broad b-fan: (1 + 0.16) / 1 = 1.16.
  assert.equal(r.archetype, 'tech-buyer-a');
  close(r.distance, 0.12);
});

test('a missing category counts against an archetype that names it', () => {
  const r = matchArchetype(categories, [archetypes[0]], { product: { a: 1 } }, 0.6);
  // Industry and visitor have no signal: (1 + 1 + 0) / 3.
  close(r.distance, 2 / 3);
  assert.equal(r.archetype, null);
  assert.equal(r.nearest, 'tech-buyer-a');
  assert.deepEqual(r.missing, ['industry', 'visitor']);
});

test('no signal in a named category blocks the match, however close the rest is', () => {
  // Perfect on industry and product, nothing on visitor type: mean 1/3, inside a generous radius.
  const r = matchArchetype(categories, [archetypes[0]], { industry: { tech: 1 }, product: { a: 1 } }, 0.8);
  assert.equal(r.archetype, null);
  assert.deepEqual(r.missing, ['visitor']);
});

test('a farther archetype with full evidence beats a nearer one missing evidence', () => {
  const pair: Archetype[] = [
    { id: 'needs-visitor', fingerprint: { product: { a: 1 }, visitor: { customer: 1 } } },
    { id: 'product-only', fingerprint: { product: { a: 1, b: 0.5 } } },
  ];
  const r = matchArchetype(categories, pair, { product: { a: 1 } }, 0.6);
  assert.equal(r.archetype, 'product-only');
});

test('matchArchetype returns null outside the radius but explains why', () => {
  const r = matchArchetype(categories, archetypes, { product: { a: 0.5, b: 1 } }, 0.1);
  assert.equal(r.archetype, null);
  assert.equal(r.nearest, 'b-fan');
  assert.ok(r.categories.length > 0);
});

test('matchArchetype breaks ties by archetype order', () => {
  const twins: Archetype[] = [
    { id: 'first', fingerprint: { product: { a: 1 } } },
    { id: 'second', fingerprint: { product: { a: 1 } } },
  ];
  assert.equal(matchArchetype(categories, twins, { product: { a: 1 } }, 1).archetype, 'first');
});

test('matchArchetype handles no signal and no archetypes', () => {
  assert.deepEqual(matchArchetype(categories, archetypes, {}, 1), { archetype: null, nearest: null, distance: Infinity, categories: [], missing: [] });
  assert.equal(matchArchetype(categories, [], { product: { a: 1 } }, 1).nearest, null);
});

/* ---------- match ---------- */

test('match holds back every match until minViews', () => {
  const one = accumulate(undefined, { visitor: { dealer: 1 } }, 0, HOUR);
  const early = match(config, one, 0);
  assert.equal(early.ready, false);
  assert.equal(early.audiences[1].audience, null);
  assert.equal(early.audiences[1].nearest, 'dealer');
  assert.equal(early.archetype.archetype, null);
  assert.equal(early.archetype.nearest, 'dealer');

  const two = accumulate(one, { visitor: { dealer: 1 } }, 0, HOUR);
  const ready = match(config, two, 0);
  assert.equal(ready.ready, true);
  assert.equal(ready.audiences[1].audience, 'dealer');
  assert.equal(ready.archetype.archetype, 'dealer');
});

test('match with no visitor returns an empty, not-ready set', () => {
  const r = match(config, undefined, 0);
  assert.equal(r.ready, false);
  assert.equal(r.views, 0);
  assert.deepEqual(r.audiences.map((a) => a.audience), [null, null, null]);
});

test('match decays to now: recent signal outweighs old', () => {
  let s = accumulate(undefined, { product: { a: 1 } }, 0, HOUR);
  s = accumulate(s, { product: { a: 1 } }, 0, HOUR);
  s = accumulate(s, { product: { b: 1 } }, 4 * HOUR, HOUR);
  // a: 2 decayed by 4 half-lives = 0.125; b: 1.
  assert.equal(match(config, s, 4 * HOUR).audiences[2].audience, 'b');
});
