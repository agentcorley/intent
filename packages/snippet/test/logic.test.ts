import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { MatchDetail } from '../../tracker/src/index.ts';
import {
  cleanTagMap, cleanTags, conditionMatches, optedOut, parseCondition, parseSettings, parseTags, parseWeight,
  pathCandidates, pickVariant, resolvePage, tagsId, DEFAULT_TRACK_WEIGHT,
} from '../src/logic.ts';

/** A ready, non-holdout visitor in the given audiences and archetype. */
function detail(audiences: Record<string, string | null>, archetype: string | null = null, extra: Partial<MatchDetail> = {}): MatchDetail {
  return {
    ready: true,
    views: 5,
    holdout: false,
    audiences: Object.entries(audiences).map(([category, audience]) => ({
      category, audience, nearest: audience, distance: 0, contributions: [],
    })),
    archetype: { archetype, nearest: archetype, distance: 0, categories: [] },
    ...extra,
  };
}

/* ---------- Settings and tags ---------- */

test('parseSettings reads the config block', () => {
  const s = parseSettings('{"config":{"categories":[]},"tagsUrl":"/tags.json"}');
  assert.equal(s.tagsUrl, '/tags.json');
  assert.deepEqual(s.config, { categories: [] });
});

test('parseSettings explains missing, malformed, and misshapen blocks', () => {
  assert.throws(() => parseSettings(null), /No config found/);
  assert.throws(() => parseSettings('  '), /No config found/);
  assert.throws(() => parseSettings('{oops'), /not valid JSON/);
  assert.throws(() => parseSettings('{"tags":{}}'), /needs a "config" object/);
  assert.throws(() => parseSettings('{"config":{},"tags":[]}'), /"tags" must be/);
  assert.throws(() => parseSettings('{"config":{},"tagsUrl":3}'), /"tagsUrl" must be/);
});

test('parseTags keeps numeric scores and rejects junk', () => {
  assert.deepEqual(parseTags('{"industry":{"tech":0.8,"bad":"x"},"nope":3}'), { industry: { tech: 0.8 } });
  assert.equal(parseTags('{"industry":{}}'), null);
  assert.equal(parseTags('[1,2]'), null);
  assert.equal(parseTags('not json'), null);
  assert.equal(parseTags(null), null);
});

test('cleanTagMap drops unusable entries', () => {
  assert.deepEqual(cleanTagMap({ '/a': { trip: { family: 1 } }, '/b': 'x', '/c': {} }), { '/a': { trip: { family: 1 } } });
  assert.deepEqual(cleanTagMap(null), {});
});

/* ---------- Page resolution ---------- */

const map = {
  '/suites/': { trip: { family: 1 } },
  '/spa': { trip: { wellness: 1 } },
  'offer-42': { trip: { business: 0.7 } },
};

test('inline tags win over the map, keyed by intent:id or path', () => {
  const inline = { trip: { wellness: 0.5 } };
  assert.deepEqual(resolvePage({ inline, id: null, path: '/spa', map }), { id: '/spa', tags: inline });
  assert.deepEqual(resolvePage({ inline, id: 'page-7', path: '/spa', map }), { id: 'page-7', tags: inline });
});

test('intent:id is looked up in the map and beats the path', () => {
  assert.deepEqual(resolvePage({ inline: null, id: 'offer-42', path: '/spa', map }), { id: 'offer-42', tags: map['offer-42'] });
  assert.equal(resolvePage({ inline: null, id: 'missing', path: '/spa', map }), null);
});

test('path lookup tolerates a trailing slash either way', () => {
  assert.deepEqual(pathCandidates('/'), ['/']);
  assert.deepEqual(pathCandidates('/spa'), ['/spa', '/spa/']);
  assert.equal(resolvePage({ inline: null, id: null, path: '/suites', map })?.id, '/suites/');
  assert.equal(resolvePage({ inline: null, id: null, path: '/spa/', map })?.id, '/spa');
  assert.equal(resolvePage({ inline: null, id: null, path: '/nowhere', map }), null);
});

test('resolvePage ignores inherited keys', () => {
  assert.equal(resolvePage({ inline: null, id: 'toString', path: '/', map }), null);
});

test('tagsId is stable regardless of key order', () => {
  assert.equal(tagsId({ a: { x: 1, y: 2 }, b: { z: 1 } }), tagsId({ b: { z: 1 }, a: { y: 2, x: 1 } }));
  assert.notEqual(tagsId({ a: { x: 1 } }), tagsId({ a: { x: 0.5 } }));
});

test('parseWeight defaults to 2 and rejects nonsense', () => {
  assert.equal(DEFAULT_TRACK_WEIGHT, 2);
  assert.equal(parseWeight(null), 2);
  assert.equal(parseWeight(''), 2);
  assert.equal(parseWeight('3'), 3);
  assert.equal(parseWeight('0.5'), 0.5);
  assert.equal(parseWeight('0'), 2);
  assert.equal(parseWeight('-1'), 2);
  assert.equal(parseWeight('heavy'), 2);
});

/* ---------- Conditions and variants ---------- */

test('parseCondition reads a comma list and drops malformed parts', () => {
  assert.deepEqual(parseCondition('archetype:family-planner, industry:retail'), [
    { key: 'archetype', value: 'family-planner' },
    { key: 'industry', value: 'retail' },
  ]);
  assert.deepEqual(parseCondition('nocolon, :x, y:, trip:spa'), [{ key: 'trip', value: 'spa' }]);
  assert.deepEqual(parseCondition(''), []);
  assert.deepEqual(parseCondition(null), []);
});

test('conditions match archetypes and audiences, OR across the list', () => {
  const d = detail({ trip: 'family', stay: null }, 'family-planner');
  assert.equal(conditionMatches(parseCondition('archetype:family-planner'), d), true);
  assert.equal(conditionMatches(parseCondition('trip:family'), d), true);
  assert.equal(conditionMatches(parseCondition('trip:business'), d), false);
  assert.equal(conditionMatches(parseCondition('trip:business, archetype:family-planner'), d), true);
  assert.equal(conditionMatches(parseCondition('stay:suite'), d), false, 'null audience never matches');
  assert.equal(conditionMatches(parseCondition('unknown:x'), d), false);
  assert.equal(conditionMatches([], d), false);
});

test('holdout and warm-up visitors match nothing', () => {
  const cond = parseCondition('archetype:family-planner');
  assert.equal(conditionMatches(cond, detail({}, 'family-planner', { holdout: true })), false);
  assert.equal(conditionMatches(cond, detail({}, 'family-planner', { ready: false })), false);
});

const hero = [
  { show: 'archetype:business-traveler', isDefault: false },
  { show: 'archetype:family-planner, trip:family', isDefault: false },
  { show: null, isDefault: true },
];

test('pickVariant shows the first match', () => {
  assert.equal(pickVariant(hero, detail({ trip: 'family' })), 1);
  assert.equal(pickVariant(hero, detail({ trip: 'business' }, 'business-traveler')), 0);
});

test('first listed variant wins when several match', () => {
  const both = [
    { show: 'trip:family', isDefault: false },
    { show: 'archetype:family-planner', isDefault: false },
    { show: null, isDefault: true },
  ];
  assert.equal(pickVariant(both, detail({ trip: 'family' }, 'family-planner')), 0);
});

test('pickVariant falls back to the default, wherever it sits', () => {
  assert.equal(pickVariant(hero, detail({ trip: 'wellness' })), 2);
  const defaultFirst = [{ show: null, isDefault: true }, ...hero.slice(0, 2)];
  assert.equal(pickVariant(defaultFirst, detail({})), 0);
});

test('holdout always gets the default', () => {
  assert.equal(pickVariant(hero, detail({ trip: 'family' }, 'family-planner', { holdout: true })), 2);
});

test('no match and no default shows nothing', () => {
  assert.equal(pickVariant(hero.slice(0, 2), detail({})), -1);
  assert.equal(pickVariant([], detail({})), -1);
});

/* ---------- Privacy ---------- */

test('GPC and DNT opt out by default; respectGPC false turns that off', () => {
  assert.equal(optedOut({ globalPrivacyControl: true }), true);
  assert.equal(optedOut({ doNotTrack: '1' }), true);
  assert.equal(optedOut({ doNotTrack: '0', globalPrivacyControl: false }), false);
  assert.equal(optedOut({}), false);
  assert.equal(optedOut(undefined), false);
  assert.equal(optedOut({ globalPrivacyControl: true }, false), false);
});

test('fibonacci scale: tags in points become 0–1, sloppy values snap', () => {
  assert.deepEqual(cleanTags({ trip: { family: 8, beach: 4.2 } }, 'fibonacci'), { trip: { family: 1, beach: 0.625 } });
  assert.deepEqual(parseTags('{"trip":{"family":3}}', 'fibonacci'), { trip: { family: 0.375 } });
  assert.deepEqual(cleanTagMap({ page: { trip: { family: 5 } } }, 'fibonacci'), { page: { trip: { family: 0.625 } } });
});

test('parseWeight accepts action names on the Fibonacci ladder', () => {
  assert.equal(parseWeight('download'), 5);
  assert.equal(parseWeight('Convert'), 8);
  assert.equal(parseWeight('3'), 3);
  assert.equal(parseWeight('nonsense'), 2);
});
