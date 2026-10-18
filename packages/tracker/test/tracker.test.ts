import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { EngineConfig } from '../../core/src/index.ts';
import {
  createTracker, memoryStorage, cookieValue, MATCH_EVENT,
  type ContentTags, type DocLike, type MatchDetail, type TrackerOptions,
} from '../src/index.ts';

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

const config: EngineConfig = {
  categories: [
    { id: 'visitor', attributes: [{ id: 'customer' }, { id: 'dealer' }] },
    { id: 'product', attributes: [{ id: 'a' }, { id: 'b' }] },
  ],
  archetypes: [{ id: 'dealer-b', fingerprint: { visitor: { dealer: 1 }, product: { b: 1 } } }],
  audienceRadius: 0.6,
  archetypeRadius: 0.6,
  minViews: 2,
  halfLifeMs: 7 * DAY,
  holdoutPercent: 5,
};

const tags: ContentTags = {
  'dealer-program': { visitor: { dealer: 1 } },
  'product-a': { product: { a: 1 } },
  'product-b': { product: { b: 1 }, visitor: { dealer: 0.3 } },
};

/** Not in holdout, clock under test control, no DOM. */
function make(overrides: Partial<TrackerOptions> = {}) {
  let now = 0;
  const tracker = createTracker({
    config, tags, storage: memoryStorage(), doc: null, random: () => 0.99, clock: () => now, ...overrides,
  });
  return { tracker, advance: (ms: number) => { now += ms; } };
}

function fakeDoc() {
  const attrs = new Map<string, string>();
  const events: MatchDetail[] = [];
  const doc = Object.assign(new EventTarget(), {
    cookie: '',
    documentElement: {
      setAttribute: (k: string, v: string) => { attrs.set(k, v); },
      removeAttribute: (k: string) => { attrs.delete(k); },
    },
  }) as DocLike;
  doc.addEventListener(MATCH_EVENT, (e) => events.push((e as CustomEvent<MatchDetail>).detail));
  return { doc, attrs, events };
}

const audiences = (d: MatchDetail) => d.audiences.map((a) => a.audience);

test('a new visitor has no matches', () => {
  const d = make().tracker.matches();
  assert.equal(d.ready, false);
  assert.deepEqual(audiences(d), [null, null]);
});

test('views build audiences and the archetype once minViews is reached', () => {
  const { tracker } = make();
  assert.equal(tracker.view('dealer-program').ready, false);
  const d = tracker.view('product-b');
  assert.deepEqual(audiences(d), ['dealer', 'b']);
  assert.equal(d.archetype.archetype, 'dealer-b');
});

test('repeat views inside the window count once', () => {
  const { tracker, advance } = make();
  tracker.view('product-a');
  tracker.view('product-a');
  assert.equal(tracker.matches().views, 1);
  advance(31 * MIN);
  assert.equal(tracker.view('product-a').views, 2);
});

test('weight scales stronger actions', () => {
  const { tracker } = make();
  tracker.view('product-a');
  tracker.view('product-b', 3);
  assert.equal(tracker.state()!.scores.product.b, 3);
  assert.equal(tracker.matches().audiences[1].audience, 'b');
});

test('bad weights fall back to 1 and huge weights are capped at 10', () => {
  const { tracker, advance } = make();
  tracker.view('product-b', Number.NaN);
  advance(31 * MIN);
  tracker.view('product-b', -5);
  advance(31 * MIN);
  tracker.view('product-b', 1000);
  // 1 + 1 + 10, less a sliver of decay over the hour between views.
  assert.ok(Math.abs(tracker.state()!.scores.product.b - 12) < 0.01);
});

test('unknown content ids change nothing', () => {
  const storage = memoryStorage();
  const { tracker } = make({ storage });
  const before = storage.get();
  tracker.view('nope');
  assert.equal(storage.get(), before);
  assert.equal(tracker.matches().views, 0);
});

test('older signal decays, so recent reads win', () => {
  const { tracker, advance } = make();
  tracker.view('product-a');
  advance(31 * MIN);
  tracker.view('product-a');
  advance(21 * DAY);
  tracker.view('product-b');
  // a: 2 × 1/8 = 0.25 against b: 1.
  assert.equal(tracker.matches().audiences[1].audience, 'b');
});

test('state persists across tracker instances, and corrupt storage starts fresh', () => {
  const storage = memoryStorage();
  const first = make({ storage }).tracker;
  first.view('dealer-program');
  first.view('product-b');
  assert.equal(make({ storage }).tracker.matches().archetype.archetype, 'dealer-b');

  storage.set('{not json');
  assert.equal(make({ storage }).tracker.matches().views, 0);
});

test('idle visitors are forgotten after the cookie lifetime', () => {
  const storage = memoryStorage();
  let now = 0;
  const opts = { config, tags, storage, doc: null, random: () => 0.99, clock: () => now };
  const t = createTracker(opts);
  t.view('dealer-program');
  t.view('product-b');
  now = 29 * DAY;
  assert.equal(createTracker(opts).matches().views, 2);
  now = 31 * DAY;
  assert.equal(createTracker(opts).matches().views, 0);
});

test('holdout is assigned once, by holdoutPercent, and survives reset', () => {
  const storage = memoryStorage();
  const t = make({ storage, random: () => 0.01 }).tracker;
  assert.equal(t.matches().holdout, true);
  // A later random draw does not reassign.
  assert.equal(make({ storage, random: () => 0.99 }).tracker.matches().holdout, true);
  assert.equal(t.reset().holdout, true);
  assert.equal(make({ random: () => 0.06 }).tracker.matches().holdout, false);
});

test('publishes attributes, cookie, and the match event', () => {
  const { doc, attrs, events } = fakeDoc();
  const { tracker } = make({ doc });
  tracker.view('dealer-program');
  assert.equal(attrs.size, 0);
  tracker.view('product-b');
  assert.equal(attrs.get('data-intent-visitor'), 'dealer');
  assert.equal(attrs.get('data-intent-product'), 'b');
  assert.equal(attrs.get('data-intent-archetype'), 'dealer-b');
  assert.match(doc.cookie, /^intent=visitor\.dealer~product\.b~archetype\.dealer-b;/);
  assert.equal(events.length, 2);

  tracker.reset();
  assert.equal(attrs.size, 0);
  assert.match(doc.cookie, /max-age=0/);
});

test('holdout visitors are scored but the page sees only the holdout flag', () => {
  const { doc, attrs, events } = fakeDoc();
  const { tracker } = make({ doc });
  tracker.view('dealer-program');
  tracker.view('product-b');
  const d = tracker.setHoldout(true);
  assert.equal(d.archetype.archetype, 'dealer-b');
  assert.deepEqual([...attrs.entries()], [['data-intent-holdout', 'true']]);
  assert.match(doc.cookie, /^intent=holdout;/);
  assert.equal(events.at(-1)!.holdout, true);
});

test('cookieValue lists only matches', () => {
  const d = make().tracker.matches();
  assert.equal(cookieValue(d), '');
});
