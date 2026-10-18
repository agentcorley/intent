#!/usr/bin/env node
// intent-tag: AI-tag a list of pages and write the tag map the snippet reads.
//
//   node packages/tagger/src/cli.ts --config site.json --out tags.json https://example.com/a https://example.com/b
//
// site.json is the snippet's config block ({ "config": {...} }) or the config itself.
// Scores come back in Fibonacci points; they are written in the config's own scale.
// Review the output before publishing it.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { loadConfig, POINTS_MAX, type ConfigInput } from '../../config/src/index.ts';
import type { ContentTags } from '../../tracker/src/index.ts';
import { DEFAULT_MODEL, htmlToPage, tagPage, TaggerError } from './index.ts';

function args(argv: string[]) {
  const out = { config: '', out: 'intent-tags.json', model: DEFAULT_MODEL, merge: false, urls: [] as string[] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--config') out.config = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--model') out.model = argv[++i];
    else if (a === '--merge') out.merge = true;
    else if (a === '--help' || a === '-h') return null;
    else out.urls.push(a);
  }
  return out.config && out.urls.length ? out : null;
}

const opts = args(process.argv.slice(2));
if (!opts) {
  console.log('Usage: intent-tag --config site.json [--out tags.json] [--merge] [--model id] <url>...');
  process.exit(1);
}

const file = JSON.parse(readFileSync(opts.config, 'utf8'));
const input: ConfigInput = file.config ?? file;
loadConfig(input); // fail fast, with every problem listed
const fib = input.scale === 'fibonacci';

const map: ContentTags = opts.merge && existsSync(opts.out) ? JSON.parse(readFileSync(opts.out, 'utf8')) : {};
const client = new Anthropic();
let failed = 0;

for (const url of opts.urls) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'intent-tagger/0.1' } });
    if (!res.ok) throw new TaggerError(`${url} returned ${res.status}.`);
    const page = htmlToPage(url, await res.text());
    const tagged = await tagPage(client, input, page, { model: opts.model });

    const key = new URL(url).pathname;
    map[key] = fib
      ? tagged.tags
      : Object.fromEntries(Object.entries(tagged.tags).map(([c, a]) => [c, Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v / POINTS_MAX]))]));

    const summary = Object.entries(tagged.tags)
      .flatMap(([c, a]) => Object.entries(a).map(([k, v]) => `${c}.${k} ${v}`))
      .join(', ');
    console.log(`✓ ${key}  ${summary || '(no signal)'}${tagged.truncated ? '  [long page: first part only]' : ''}`);
    console.log(`  ${tagged.reason}  (tokens: ${tagged.usage.input} in, ${tagged.usage.cached} cached, ${tagged.usage.output} out)`);
  } catch (e) {
    failed++;
    if (e instanceof Anthropic.AuthenticationError) {
      console.error('✗ Not signed in to the Claude API. Set ANTHROPIC_API_KEY or run `ant auth login`.');
      break;
    } else if (e instanceof Anthropic.RateLimitError) {
      console.error(`✗ ${url}: rate limited. Try again shortly or tag fewer pages per run.`);
    } else if (e instanceof Anthropic.APIError) {
      console.error(`✗ ${url}: API error ${e.status}: ${e.message}`);
    } else {
      console.error(`✗ ${url}: ${(e as Error).message}`);
    }
  }
}

writeFileSync(opts.out, JSON.stringify(map, null, 2) + '\n');
console.log(`\nWrote ${Object.keys(map).length} pages to ${opts.out}${failed ? ` (${failed} failed)` : ''}. Review before publishing.`);
process.exit(failed ? 1 : 0);
