// AI tagging preview: Claude reads a page and scores it on the brand's
// categories in Fibonacci points. A person reviews before anything ships.

import Anthropic from '@anthropic-ai/sdk';
import type { ConfigInput } from '../../config/src/index.ts';
import { buildSchema, buildSystem, pageMessage, parseResult, type Page, type TagResult } from './prompt.ts';

export { htmlToPage, MAX_CHARS } from './extract.ts';
export { buildSchema, buildSystem, pageMessage, parseResult, type Page, type TagResult } from './prompt.ts';

export const DEFAULT_MODEL = 'claude-opus-5-5';

export interface TagOptions {
  model?: string;
  /** Tagging is classification; medium is plenty for most sites. */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
}

export interface TaggedPage extends TagResult {
  url: string;
  truncated: boolean;
  usage: { input: number; cached: number; output: number };
}

export class TaggerError extends Error {}

/** Tag one page. Reuse one client across pages so the cached system prompt is shared. */
export async function tagPage(client: Anthropic, config: ConfigInput, page: Page, opts: TagOptions = {}): Promise<TaggedPage> {
  const response = await client.beta.messages.create({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: 16000,
    // If a request is declined, the API retries it on its recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    // The system prompt depends only on the config, so it is identical for every page and caches.
    system: [{ type: 'text', text: buildSystem(config), cache_control: { type: 'ephemeral' } }],
    output_config: {
      effort: opts.effort ?? 'medium',
      format: { type: 'json_schema', schema: buildSchema(config) },
    },
    messages: [{ role: 'user', content: pageMessage(page) }],
  });

  if (response.stop_reason === 'refusal') throw new TaggerError(`Declined to tag ${page.url}.`);
  if (response.stop_reason === 'max_tokens') throw new TaggerError(`Ran out of room tagging ${page.url}.`);
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new TaggerError(`No result for ${page.url}.`);

  return {
    url: page.url,
    truncated: !!page.truncated,
    ...parseResult(text.text, config),
    usage: {
      input: response.usage.input_tokens,
      cached: response.usage.cache_read_input_tokens ?? 0,
      output: response.usage.output_tokens,
    },
  };
}
