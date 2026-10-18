#!/usr/bin/env node
// Print a starter config for the snippet, taken from one of the demo industries.
//
//   node packages/demo/scripts/starter.ts hospitality > site.json
//   node packages/demo/scripts/starter.ts --list
//
// The output is the whole <script id="intent-config"> block's JSON: the
// config plus the example's tag map. Rename the attributes to your own words.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Example } from '../src/examples/types.ts';

const dir = fileURLToPath(new URL('../src/examples/', import.meta.url));
const ids = readdirSync(dir)
  .filter((f) => f.endsWith('.ts') && !['types.ts', 'index.ts'].includes(f))
  .map((f) => f.slice(0, -3))
  .sort();

const want = process.argv[2];
if (!want || want === '--list' || want === '-h' || want === '--help') {
  console.error(`Usage: starter <industry> > site.json\nIndustries: ${ids.join(', ')}`);
  process.exit(want === '--list' ? 0 : 1);
}
if (!ids.includes(want)) {
  console.error(`No starter named “${want}”. Try one of: ${ids.join(', ')}`);
  process.exit(1);
}

const ex = (await import(`${dir}${want}.ts`)).default as Example;
process.stdout.write(JSON.stringify({ config: ex.config, tags: ex.tags }, null, 2) + '\n');
