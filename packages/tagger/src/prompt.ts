// The tagger's prompt, output schema, and result parsing. Pure: no network, testable offline.

import { POINTS, snapToPoint, type ConfigInput } from '../../config/src/index.ts';
import type { CategoryScores } from '../../core/src/index.ts';

export interface Page {
  url: string;
  title: string;
  text: string;
  /** True when the page text was cut to fit; the result says so. */
  truncated?: boolean;
}

export interface TagResult {
  /** Fibonacci points per category and attribute. Zeros are dropped. */
  tags: CategoryScores;
  /** One sentence on what the page signals, for the reviewer. */
  reason: string;
}

const LADDER = [0, ...POINTS];

/**
 * The system prompt. Built only from the config, so it is byte-stable across
 * every page in a run and caches.
 */
export function buildSystem(config: ConfigInput): string {
  const lists = config.categories
    .map((c) => {
      const attrs = c.attributes.map((a) => `    - ${a.id}: ${a.label ?? a.id}`).join('\n');
      return `- ${c.id} (${c.label ?? c.id})\n${attrs}`;
    })
    .join('\n');

  return `You tag web pages for a personalization engine. For each page, score what reading it signals about the reader’s interests, on the brand’s own categories.

Score every attribute on this Fibonacci scale:
0 = no signal
1 = passing mention
2 = minor theme
3 = clear secondary theme
5 = strong theme; a reader likely shares this interest
8 = the page is about this; a reader almost certainly shares this interest

Score the reader’s likely interest, not every word on the page. A pricing page signals buying stage strongly even if it lists every product. Navigation, footers, and boilerplate signal nothing. Most attributes on most pages are 0. Use 8 sparingly.

Categories and attributes (use these ids exactly):
${lists}

Return the scores and one plain sentence explaining the strongest signals.`;
}

/** JSON schema for structured output: every category and attribute, each one of 0, 1, 2, 3, 5, 8. */
export function buildSchema(config: ConfigInput): Record<string, unknown> {
  const categories: Record<string, unknown> = {};
  for (const c of config.categories) {
    const attrs: Record<string, unknown> = {};
    for (const a of c.attributes) attrs[a.id] = { type: 'integer', enum: LADDER };
    categories[c.id] = {
      type: 'object',
      properties: attrs,
      required: c.attributes.map((a) => a.id),
      additionalProperties: false,
    };
  }
  return {
    type: 'object',
    properties: {
      tags: {
        type: 'object',
        properties: categories,
        required: config.categories.map((c) => c.id),
        additionalProperties: false,
      },
      reason: { type: 'string' },
    },
    required: ['tags', 'reason'],
    additionalProperties: false,
  };
}

/** The per-page user message. Everything that varies goes here, after the cached system prompt. */
export function pageMessage(page: Page): string {
  const note = page.truncated ? '\n(The page was long; this is the first part of its text.)' : '';
  return `URL: ${page.url}\nTitle: ${page.title}${note}\n\n<page>\n${page.text}\n</page>`;
}

/**
 * Parse the model's JSON into points. Unknown ids are dropped, off-ladder
 * numbers snap to the nearest point, and zeros are removed.
 */
export function parseResult(json: string, config: ConfigInput): TagResult {
  const raw = JSON.parse(json) as { tags?: Record<string, Record<string, unknown>>; reason?: unknown };
  const tags: CategoryScores = {};
  for (const c of config.categories) {
    const scores = raw.tags?.[c.id];
    if (!scores || typeof scores !== 'object') continue;
    for (const a of c.attributes) {
      const v = scores[a.id];
      const p = typeof v === 'number' ? snapToPoint(v) : 0;
      if (p > 0) (tags[c.id] ??= {})[a.id] = p;
    }
  }
  return { tags, reason: typeof raw.reason === 'string' ? raw.reason.trim() : '' };
}
