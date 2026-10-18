import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig, loadConfig, ConfigError, MAX_CATEGORIES, MAX_ATTRIBUTES, DEFAULTS } from '../src/index.ts';

const attrs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `a${i}` }));
const category = (id: string, n = 3) => ({ id, attributes: attrs(n) });
const valid = () => ({
  categories: [category('industry'), category('product')],
  archetypes: [{ id: 'x', fingerprint: { industry: { a0: 1 }, product: { a1: 0.8, a2: 0.2 } } }],
});
const errs = (c: unknown) => validateConfig(c).join('\n');

test('a valid config passes and gets defaults', () => {
  assert.deepEqual(validateConfig(valid()), []);
  const c = loadConfig(valid());
  assert.equal(c.minViews, DEFAULTS.minViews);
  assert.equal(c.holdoutPercent, DEFAULTS.holdoutPercent);
  assert.equal(c.halfLifeMs, DEFAULTS.halfLifeDays * 24 * 60 * 60 * 1000);
});

test('archetypes are optional', () => {
  assert.deepEqual(loadConfig({ categories: [category('industry')] }).archetypes, []);
});

test(`allows exactly ${MAX_CATEGORIES} categories of ${MAX_ATTRIBUTES} attributes`, () => {
  const c = { categories: ['a', 'b', 'c', 'd', 'e'].map((id) => category(id, MAX_ATTRIBUTES)) };
  assert.deepEqual(validateConfig(c), []);
});

test(`rejects more than ${MAX_CATEGORIES} categories or ${MAX_ATTRIBUTES} attributes`, () => {
  assert.match(errs({ categories: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => category(id)) }), /Up to 5 categories/);
  assert.match(errs({ categories: [category('a', MAX_ATTRIBUTES + 1)] }), /up to 8 attributes/);
});

test('rejects empty categories and attributes', () => {
  assert.match(errs({ categories: [] }), /At least one category/);
  assert.match(errs({ categories: [{ id: 'a', attributes: [] }] }), /at least one attribute/);
});

test('rejects duplicate, malformed, and reserved ids', () => {
  assert.match(errs({ categories: [category('a'), category('a')] }), /duplicate category id/);
  assert.match(errs({ categories: [{ id: 'a', attributes: [{ id: 'x' }, { id: 'x' }] }] }), /duplicate attribute id/);
  assert.match(errs({ categories: [category('Has Spaces')] }), /lowercase letters/);
  assert.match(errs({ categories: [category('archetype')] }), /reserved/);
  assert.match(errs({ categories: [category('holdout')] }), /reserved/);
  const dupArch = { ...valid(), archetypes: [valid().archetypes[0], valid().archetypes[0]] };
  assert.match(errs(dupArch), /duplicate archetype id/);
});

test('rejects archetype fingerprints that are empty or point nowhere', () => {
  const arch = (fingerprint: unknown) => errs({ ...valid(), archetypes: [{ id: 'x', fingerprint }] });
  assert.match(arch({}), /at least one category/);
  assert.match(arch({ nope: { a0: 1 } }), /“nope” is not a category/);
  assert.match(arch({ industry: { zz: 1 } }), /“zz” is not an attribute of industry/);
  assert.match(arch({ industry: { a0: 1.5 } }), /must be between 0 and 1/);
  assert.match(arch({ industry: { a0: 0 } }), /leave the category out to mean “any”/);
});

test('rejects bad numbers', () => {
  const e = errs({ ...valid(), audienceRadius: 0, archetypeRadius: -1, halfLifeDays: 'x', minViews: 1.5, holdoutPercent: 60 });
  for (const key of ['audienceRadius', 'archetypeRadius', 'halfLifeDays', 'minViews', 'holdoutPercent']) {
    assert.match(e, new RegExp(key));
  }
});

test('loadConfig throws a ConfigError listing every problem', () => {
  assert.throws(() => loadConfig({ minViews: 0, holdoutPercent: -1, categories: [] }), (e: unknown) => {
    assert.ok(e instanceof ConfigError);
    assert.equal(e.errors.length, 3);
    return true;
  });
});

test('rejects non-objects', () => {
  assert.deepEqual(validateConfig(null), ['Config must be an object.']);
});
