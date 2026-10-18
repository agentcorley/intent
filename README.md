<p>
  <strong>intent</strong> <sub>(working name) · v0.1 · stealth preview</sub>
</p>

# Your site learns what each visitor cares about, and adapts to fit.

intent matches every visitor to the audiences and archetypes they resemble, using the one signal they already give you: what they choose to read. AI tags your pages, the engine matches in the visitor’s browser, and a built-in control group proves the lift. No forms, no personal data.

Built for customer-experience brands: hotels and resorts, airlines, live music, sports, theme parks, streaming and media, retail, automotive, and transportation.

[![CI](https://github.com/agentcorley/intent/actions/workflows/ci.yml/badge.svg)](https://github.com/agentcorley/intent/actions/workflows/ci.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Core: zero dependencies](https://img.shields.io/badge/core-zero%20dependencies-brightgreen)

> **Not third-party “intent data.”** intent never buys, sells, or shares data about anyone. It only learns from reading behavior on your own site, inside the visitor’s browser.

---

## See it

```bash
git clone https://github.com/agentcorley/intent.git
cd intent
npm install
npm run dev        # http://localhost:5173
```

Pick an industry, press **Play a visitor**, and watch the site rewrite its hero as the engine learns. The knowledge graph below the demo shows one visitor’s profile or a simulated audience of 400, and every node explains itself on click.

## How it works

| Step | Who | What happens |
|---|---|---|
| Tag | AI tags, you approve | Each page gets Fibonacci points (1, 2, 3, 5, 8) for the attributes it signals. |
| Read | The visitor | Each read adds that page’s points to the visitor’s profile. Old interest fades. |
| Match | The engine | It finds the audience the visitor leans toward in each category, and the archetype they resemble most. |
| Adapt | Your site | It shows the variant built for that match. Everyone else sees the default. |

### Five terms

- Category: one of up to 5 lists your business cares about, such as *Trip Purpose* or *Ticket Tier*.
- Attribute: an item on a list, such as *Family* or *VIP*. Up to 8 per category.
- Audience: the attribute a visitor clearly leans toward in a category. Found automatically; nothing to configure.
- Archetype: a valuable combination across categories that you design, such as *Family Summer Planner*. Categories it leaves out mean “any”.
- Control group: a small, persistent share of visitors (5% by default) who always see the default, so you can measure lift.

## AI-native

intent is built for models to read and write.

- One scoring ladder for everything a person or a model writes: Fibonacci points 0, 1, 2, 3, 5, 8. The steps widen as they grow, so people and models make the same call instead of debating 6 versus 7. Page tags, archetype targets, and action strength (`view` 1, `engage` 2, `save` 3, `download` 5, `convert` 8) all use it. Set `"scale": "fibonacci"` in the config; the engine converts to 0–1 internally.
- An AI tagger (preview, [`packages/tagger`](packages/tagger)) reads each page and returns points for every attribute through a strict JSON schema built from your config. Its system prompt depends only on your config, so it caches across every page in a run. A person reviews the output before it ships.

```bash
export ANTHROPIC_API_KEY=…
node packages/tagger/src/cli.ts --config site.json --out tags.json https://example.com/summer https://example.com/meetings
```

## The math

- Each category is scaled 0–1 by its strongest attribute, so the *shape* of interest matters more than raw volume. A floor of one full-strength tag keeps a trace of signal faint.
- Audience: the nearest single attribute by Euclidean distance, if it is close enough (`audienceRadius`). Otherwise *Mixed* or *Weak*, and the visitor sees the default.
- Archetype: squared Euclidean distance per category, averaged across the categories the archetype names, so broad archetypes don’t win by naming fewer categories. An archetype only matches once the visitor has shown some signal in every category it names; until then the demo says what it is waiting on.
- Nothing matches until a visitor has read `minViews` tagged pages (default 3).
- Interest decays with a half-life you choose per industry (default 14 days; the live music demo uses 7). Repeat views of the same page within 30 minutes count once.

Every result names the nearest match even on a miss, with a per-attribute breakdown, so any decision can be explained.

## What works today

| | Status |
|---|---|
| Matching engine (`packages/core`), zero dependencies, browser and edge | ✅ Working, tested |
| Config validation with every error listed, Fibonacci scale (`packages/config`) | ✅ Working, tested |
| Visitor tracking, decay, repeat window, action weights, control group (`packages/tracker`) | ✅ Working, tested |
| One-script drop-in with no-code content slots, about 5 KB gzipped (`packages/snippet`) | ✅ Working, v0 |
| Live demo with nine customer-experience examples and a knowledge graph (`packages/demo`) | ✅ Working |
| AI tagger (`packages/tagger`) | 🧪 Preview: tested offline, review its output |
| AI-written variants per archetype | 🔜 Roadmap |
| CMS plugins (WordPress first) | 🔜 Roadmap |
| Lift reporting against the control group | 🔜 Roadmap (events are emitted today; send them to your analytics) |

## Quickstart: drop it into any site

See [`packages/snippet/README.md`](packages/snippet/README.md) for the full guide. The short version (config abbreviated):

```html
<!-- 1. Your categories and archetypes, scored in Fibonacci points -->
<script type="application/json" id="intent-config">
  { "config": { "scale": "fibonacci", "categories": [ … ], "archetypes": [ … ] } }
</script>
<!-- Load in the head, without defer or async, so variants never flash. -->
<script src="intent.min.js"></script>

<!-- 2. What this page is about -->
<meta name="intent:tags" content='{"purpose":{"family":8},"destination":{"beach":5}}'>

<!-- 3. Variants. The first match wins; everyone else sees the default. -->
<div data-intent-slot>
  <section data-intent-show="archetype:family-summer-planner">Kids stay and eat free this summer.</section>
  <section data-intent-default>Find your next stay.</section>
</div>
```

The built file is committed at [`packages/snippet/dist/intent.min.js`](packages/snippet/dist/intent.min.js), so there is nothing to build. Single-page apps call `intent.view(id)` on route changes and `intent.apply()` after rendering new slots.

## Or use the engine directly

```ts
import { loadConfig } from './packages/config/src/index.ts';
import { createTracker, ACTIONS } from './packages/tracker/src/index.ts';

const tracker = createTracker({ config: loadConfig(myConfig), tags: myTagMap });
tracker.view('summer-family-offer');                  // a page read
tracker.view('group-proposal-form', ACTIONS.convert); // a stronger action
document.addEventListener('intent:match', (e) => console.log(e.detail));
```

### What your site receives

- `<html data-intent-<category>="<attribute>" data-intent-archetype="<id>">` for CSS or server-side variants.
- A first-party cookie, `intent=purpose.family~archetype.family-summer-planner`, for the edge or server.
- An `intent:match` DOM event with the full result, including the nearest match and the reasons.
- Control-group visitors get only `data-intent-holdout="true"` and `intent=holdout`.

## Privacy

- No names, emails, or other personal data are collected or needed.
- Matching runs in the visitor’s browser. intent makes no network calls of its own; the first-party cookie, which holds matched ids only, travels to your own server with each request so your edge can use it.
- Storage is first-party only (`localStorage` and one cookie). After 30 idle days the cookie expires and stored scores are erased on the next visit. `intent.forget()` erases everything at once when consent is withdrawn.
- The snippet honors Global Privacy Control and Do Not Track by default: those visitors see defaults, nothing is stored, and they stay out of the control group.
- Inferring interests is still profiling. Load intent behind your consent banner where the law requires it, and keep sensitive categories (health, finances, accessibility) out of your configuration.

## Develop

```bash
npm test           # every package, Node’s built-in test runner
npm run dev        # the demo
npm run build      # the snippet bundle and the demo
```

Node 22.18 or newer runs the TypeScript directly; there is no build step for the engine packages. v0 packages are source-first and not yet published to npm. The engine has zero dependencies; the demo uses Vite and d3-force, and the tagger uses the Anthropic SDK.

## Status

v0.1, stealth preview. The API may change. Issues and ideas are welcome.

## License

[MIT](LICENSE)
