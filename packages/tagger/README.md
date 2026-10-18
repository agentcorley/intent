# intent tagger (preview)

Claude reads each page and scores it on your categories in Fibonacci points (0, 1, 2, 3, 5, 8). The output is the tag map the snippet reads. A person reviews it before it ships.

```bash
export ANTHROPIC_API_KEY=…   # or sign in with `ant auth login`
node packages/tagger/src/cli.ts --config site.json --out tags.json https://example.com/summer https://example.com/meetings
```

- `--config` takes the snippet’s config block (`{ "config": { … } }`) or the config itself.
- `--merge` keeps pages already in `--out`; `--model` overrides the default (`claude-opus-5-5`).
- Results are keyed by URL path, so the snippet finds them through `tagsUrl` with no per-page markup. They are written in your config’s scale: points for `"scale": "fibonacci"`, 0 to 1 otherwise.

How it works:

- The system prompt is built only from your config, so it is identical for every page and caches across a run.
- Output is constrained by a JSON schema generated from your categories: every attribute, each one of 0, 1, 2, 3, 5, 8. Stray values snap to the nearest point; unknown ids are dropped.
- Navigation, headers, footers, scripts, and styles are stripped before reading. Very long pages are cut at 60,000 characters and flagged in the output, never silently.
- If a request is declined, the API retries it on its recommended fallback model.

Preview status: the prompt, schema, parsing, and page extraction are unit-tested offline. Tag a handful of pages and review the scores before running it across a whole site.

```ts
import Anthropic from '@anthropic-ai/sdk';
import { htmlToPage, tagPage } from './packages/tagger/src/index.ts';

const result = await tagPage(new Anthropic(), config, htmlToPage(url, html));
// { tags: { purpose: { family: 8 } }, reason: '…', truncated: false, usage: { … } }
```
