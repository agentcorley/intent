// Simulated population: deterministic, and every count adds up.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../../config/src/index.ts';
import { simulatePopulation, mulberry32 } from '../src/population.ts';
import type { Example } from '../src/examples/types.ts';

const copy = { eyebrow: '', headline: '', sub: '', cta: '' };
const example: Example = {
  id: 'test',
  industry: 'Test',
  brand: 'Test Co',
  domain: 'test.example',
  config: {
    categories: [
      { id: 'trip', attributes: [{ id: 'business' }, { id: 'leisure' }, { id: 'family' }] },
      { id: 'stay', attributes: [{ id: 'night' }, { id: 'weekend' }] },
      { id: 'interest', attributes: [{ id: 'spa' }, { id: 'meetings' }, { id: 'kids' }] },
    ],
    archetypes: [
      { id: 'road', fingerprint: { trip: { business: 1 }, stay: { night: 1 } } },
      { id: 'family', fingerprint: { trip: { family: 1 }, interest: { kids: 1 } } },
      { id: 'spa', fingerprint: { trip: { leisure: 1 }, interest: { spa: 1 } } },
    ],
  },
  content: [
    { id: 'rates', type: 'Offer', title: 'Rates', minutes: 1 },
    { id: 'rooms', type: 'Venue', title: 'Rooms', minutes: 1 },
    { id: 'kids', type: 'Guide', title: 'Kids', minutes: 1 },
    { id: 'suites', type: 'Rooms', title: 'Suites', minutes: 1 },
    { id: 'spa', type: 'Menu', title: 'Spa', minutes: 1 },
    { id: 'pass', type: 'Booking', title: 'Pass', minutes: 1 },
    { id: 'rfp', type: 'Request', title: 'RFP', minutes: 1 },
  ],
  tags: {
    rates: { trip: { business: 1 }, stay: { night: 0.6 } },
    rooms: { trip: { business: 0.5 }, interest: { meetings: 1 } },
    kids: { trip: { family: 1 }, interest: { kids: 1 } },
    suites: { trip: { family: 0.8 }, stay: { weekend: 1 } },
    spa: { trip: { leisure: 1 }, interest: { spa: 1 } },
    pass: { trip: { leisure: 0.6 }, interest: { spa: 0.8 }, stay: { night: 0.4 } },
    rfp: { trip: { business: 0.7 }, interest: { meetings: 0.8 } },
  },
  hero: { default: copy, archetypes: {}, audiences: {} },
  scenarios: [
    { id: 'a', label: 'Road', path: ['rates', 'rooms', 'rates'], expects: 'road' },
    { id: 'b', label: 'Family', path: ['kids', 'suites', 'kids'], expects: 'family' },
    { id: 'c', label: 'Spa', path: ['spa', 'pass', 'spa'], expects: 'spa' },
  ],
};
const config = loadConfig(example.config);

test('mulberry32 is deterministic and in [0, 1)', () => {
  const a = mulberry32(42), b = mulberry32(42);
  for (let i = 0; i < 100; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test('same seed gives the same population; another seed differs', () => {
  const p1 = simulatePopulation(example, config, 200, 7);
  const p2 = simulatePopulation(example, config, 200, 7);
  assert.deepEqual(p1, p2);
  const p3 = simulatePopulation(example, config, 200, 8);
  assert.notDeepEqual(p1.visitors.map((v) => v.state), p3.visitors.map((v) => v.state));
});

test('defaults to 400 visitors', () => {
  const p = simulatePopulation(example, config);
  assert.equal(p.size, 400);
  assert.equal(p.visitors.length, 400);
});

test('archetype counts plus unmatched sum to the population', () => {
  const p = simulatePopulation(example, config, 300, 3);
  const matched = Object.values(p.archetypeCounts).reduce((s, n) => s + n, 0);
  assert.equal(matched + p.unmatched, p.size);
  assert.deepEqual(Object.keys(p.archetypeCounts).sort(), ['family', 'road', 'spa']);
  assert.ok(matched > 0, 'some visitors match an archetype');
  assert.ok(p.unmatched > 0, 'some visitors match none');
});

test('every visitor’s audiences are counted exactly once', () => {
  const p = simulatePopulation(example, config, 300, 11);
  const expected: Record<string, Record<string, number>> = {};
  for (const c of config.categories) expected[c.id] = Object.fromEntries(c.attributes.map((a) => [a.id, 0]));
  for (const v of p.visitors) for (const a of v.detail.audiences) if (a.audience) expected[a.category][a.audience]++;
  assert.deepEqual(p.audienceCounts, expected);

  // Per category, no visitor holds more than one audience.
  for (const c of config.categories) {
    const total = Object.values(p.audienceCounts[c.id]).reduce((s, n) => s + n, 0);
    assert.ok(total <= p.size);
  }
});

test('co-occurrence counts audiences only for visitors matched to that archetype', () => {
  const p = simulatePopulation(example, config, 300, 5);
  for (const [arch, pairs] of Object.entries(p.coOccurrence)) {
    const members = p.visitors.filter((v) => v.detail.archetype.archetype === arch);
    assert.equal(members.length, p.archetypeCounts[arch]);
    for (const [key, n] of Object.entries(pairs)) {
      const [cat, attr] = key.split('.');
      const expected = members.filter((v) => v.detail.audiences.some((a) => a.category === cat && a.audience === attr)).length;
      assert.equal(n, expected, `${arch} × ${key}`);
      assert.ok(n <= p.archetypeCounts[arch]);
    }
  }
});

test('visitors carry real engine state with views and spread-out timestamps', () => {
  const p = simulatePopulation(example, config, 100, 9);
  for (const v of p.visitors) {
    assert.equal(v.detail.views, v.state.views);
    assert.ok(v.state.views >= 1);
  }
  const times = p.visitors.map((v) => v.state.updatedAt);
  assert.ok(Math.max(...times) - Math.min(...times) > 24 * 60 * 60 * 1000, 'timestamps span more than a day');
});
