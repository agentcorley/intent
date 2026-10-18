// Every industry example must be valid, internally consistent, and its demo
// scenarios must land on the archetype they promise.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateConfig, loadConfig } from '../../config/src/index.ts';
import { createTracker, memoryStorage } from '../../tracker/src/index.ts';
import type { Example } from '../src/examples/types.ts';

const dir = fileURLToPath(new URL('../src/examples/', import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !['types.ts', 'index.ts'].includes(f));

const BANNED = [/\u2014/, /\bdelve/i, /\bsynergy/i, /\btapestry/i, /\bcatalyst/i, /\bcatalyze/i, /\bpinnacle/i, /\bquintessential/i];

for (const file of files) {
  test(`example ${file}`, async () => {
    const source = readFileSync(dir + file, 'utf8');
    for (const re of BANNED) assert.doesNotMatch(source, re, `${file}: banned text ${re}`);

    const ex = (await import(dir + file)).default as Example;
    assert.ok(ex?.id && ex.brand && ex.industry, `${file}: id, brand, industry`);
    assert.deepEqual(validateConfig(ex.config), [], `${file}: config`);
    const config = loadConfig(ex.config);

    const cats = new Map(config.categories.map((c) => [c.id, new Set(c.attributes.map((a) => a.id))]));
    const contentIds = new Set(ex.content.map((c) => c.id));
    assert.equal(contentIds.size, ex.content.length, `${file}: duplicate content ids`);
    assert.ok(ex.content.length >= 12, `${file}: at least 12 content items`);

    for (const [cid, t] of Object.entries(ex.tags)) {
      assert.ok(contentIds.has(cid), `${file}: tags for unknown content ${cid}`);
      for (const [cat, attrs] of Object.entries(t)) {
        assert.ok(cats.has(cat), `${file}: ${cid} tags unknown category ${cat}`);
        for (const [a, v] of Object.entries(attrs)) {
          assert.ok(cats.get(cat)!.has(a), `${file}: ${cid} tags unknown attribute ${cat}.${a}`);
          assert.ok(v > 0 && v <= 1, `${file}: ${cid} ${cat}.${a} out of range`);
        }
      }
    }
    for (const c of ex.content) assert.ok(ex.tags[c.id], `${file}: ${c.id} has no tags`);

    const archIds = new Set(config.archetypes.map((a) => a.id));
    assert.ok(archIds.size >= 4, `${file}: at least 4 archetypes`);
    assert.ok(config.archetypes.some((a) => Object.keys(a.fingerprint).length < config.categories.length), `${file}: one archetype should skip a category (“any”)`);
    for (const id of archIds) assert.ok(ex.hero.archetypes[id], `${file}: hero copy for archetype ${id}`);
    for (const [cat, attrs] of Object.entries(ex.hero.audiences)) {
      for (const a of Object.keys(attrs)) assert.ok(cats.get(cat)?.has(a), `${file}: hero audience ${cat}.${a} unknown`);
    }

    assert.ok(ex.scenarios.length >= 3, `${file}: at least 3 scenarios`);
    for (const s of ex.scenarios) {
      for (const id of s.path) assert.ok(contentIds.has(id), `${file}: scenario ${s.id} reads unknown ${id}`);
      const t = createTracker({ config, tags: ex.tags, storage: memoryStorage(), doc: null, random: () => 1 });
      let d = t.matches();
      for (const id of s.path) d = t.view(id);
      assert.equal(d.archetype.archetype, s.expects, `${file}: scenario ${s.id} landed on ${d.archetype.archetype ?? 'nothing'} (nearest ${d.archetype.nearest}, d²=${d.archetype.distance.toFixed(3)})`);
    }
  });
}
