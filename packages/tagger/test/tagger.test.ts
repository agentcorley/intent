import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigInput } from '../../config/src/index.ts';
import { buildSchema, buildSystem, pageMessage, parseResult } from '../src/prompt.ts';
import { htmlToPage, MAX_CHARS } from '../src/extract.ts';

const config: ConfigInput = {
  scale: 'fibonacci',
  categories: [
    { id: 'purpose', label: 'Trip Purpose', attributes: [{ id: 'family', label: 'Family' }, { id: 'couples', label: 'Couples' }] },
    { id: 'stage', label: 'Booking Stage', attributes: [{ id: 'plan' }, { id: 'book' }] },
  ],
};

test('system prompt lists every id and is identical across calls, so it caches', () => {
  const s = buildSystem(config);
  for (const id of ['purpose', 'family', 'couples', 'stage', 'plan', 'book', 'Trip Purpose']) assert.ok(s.includes(id), id);
  assert.equal(s, buildSystem(config));
  assert.doesNotMatch(s, /\u2014/);
});

test('schema requires every attribute, on the Fibonacci ladder only', () => {
  const schema = buildSchema(config) as any;
  assert.deepEqual(schema.required, ['tags', 'reason']);
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.properties.tags.required, ['purpose', 'stage']);
  assert.deepEqual(schema.properties.tags.properties.purpose.required, ['family', 'couples']);
  assert.deepEqual(schema.properties.tags.properties.purpose.properties.family.enum, [0, 1, 2, 3, 5, 8]);
});

test('parseResult keeps points, snaps strays, drops zeros and unknown ids', () => {
  const r = parseResult(JSON.stringify({
    tags: { purpose: { family: 8, couples: 0, pets: 5 }, stage: { plan: 4, book: 1 }, nope: { x: 8 } },
    reason: '  A family summer offer. ',
  }), config);
  assert.deepEqual(r.tags, { purpose: { family: 8 }, stage: { plan: 5, book: 1 } });
  assert.equal(r.reason, 'A family summer offer.');
});

test('parseResult survives missing pieces', () => {
  assert.deepEqual(parseResult('{"tags":{}}', config), { tags: {}, reason: '' });
});

test('htmlToPage keeps the content and drops scripts, styles, and boilerplate', () => {
  const page = htmlToPage('https://h.example/summer', `
    <html><head><title>Summer &amp; family</title>
    <meta name="description" content="Kids stay free."><style>.x{}</style></head>
    <body><nav>Home Rooms Offers</nav><script>track()</script>
    <h1>Summer family escape</h1><p>Kids&rsquo; club every day.</p><footer>© Brand</footer></body></html>`);
  assert.equal(page.title, 'Summer & family');
  assert.match(page.text, /^Kids stay free\./);
  assert.match(page.text, /Summer family escape\nKids’ club every day\./);
  assert.doesNotMatch(page.text, /Home Rooms|track\(\)|© Brand|\.x\{\}/);
  assert.equal(page.truncated, false);
});

test('long pages are cut and flagged, never silently', () => {
  const page = htmlToPage('https://h.example/long', `<p>${'word '.repeat(20_000)}</p>`);
  assert.equal(page.text.length, MAX_CHARS);
  assert.equal(page.truncated, true);
  assert.match(pageMessage(page), /first part of its text/);
});
