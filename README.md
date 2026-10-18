<p>
  <strong>intent</strong> <sub>(working name) · v0.1 · stealth preview</sub>
</p>

# Your site learns what each visitor cares about, and adapts to fit.

intent matches every visitor to the audiences and archetypes they resemble, using the one signal they already give you: what they choose to read. It runs in the browser, collects no personal data, and keeps a control group so you can prove the lift.

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

Pick an industry, press **Play a visitor**, and watch the site rewrite its hero as the engine learns. The knowledge graph below the demo shows one visitor’s profile or the whole simulated audience, and every node explains itself on click.

## How it works

| Step | Who | What happens |
|---|---|---|
| **Tag** | You (AI tagging is on the roadmap) | Each page gets a 0–1 score for the attributes it signals. |
| **Read** | The visitor | Each read adds that page’s scores to the visitor’s profile. Old interest fades. |
| **Match** | The engine | It finds the audience the visitor leans toward in each category, and the archetype they resemble most. |
| **Adapt** | Your site | It shows the variant built for that match. Everyone else sees the default. |

### Five terms

- **Category:** one of up to 5 lists your business cares about, such as *Trip Purpose* or *Ticket Tier*.
- **Attribute:** an item on a list, such as *Family* or *VIP*. Up to 8 per category.
- **Audience:** the attribute a visitor clearly leans toward in a category. Found automatically; nothing to configure.
- **Archetype:** a valuable combination across categories that you design, such as *Family Summer Planner*. Categories it leaves out mean “any”.
- **Control group:** a small, persistent share of visitors (5% by default) who always see the default, so you can measure lift.

### The math

- Each category is scaled 0–1 by its strongest attribute, so the *shape* of interest matters more than raw volume. A floor of one full-strength tag keeps a trace of signal faint.
- **Audience:** the nearest single attribute by Euclidean distance, if it is close enough (`audienceRadius`). Otherwise *Mixed* or *Weak*, and the visitor sees the default.
- **Archetype:** squared Euclidean distance per category, **averaged** across the categories the archetype names, so broad archetypes don’t win by naming fewer categories. An archetype only matches once the visitor has shown some signal in every category it names; until then the demo says what it is waiting on.
- Nothing matches until a visitor has read `minViews` tagged pages (default 3).
- Interest decays with a half-life you choose per industry (default 14 days; the live music demo uses 7). Repeat views of the same page within 30 minutes count once.

Every result names the nearest match even on a miss, with a per-attribute breakdown, so any decision can be explained.

## What works today

| | Status |
|---|---|
| Matching engine (`packages/core`), zero dependencies, browser and edge | ✅ Working, tested |
| Config validation with every error listed (`packages/config`) | ✅ Working, tested |
| Visitor tracking, decay, repeat window, action weights, control group (`packages/tracker`) | ✅ Working, tested |
| One-script drop-in with no-code content slots (`packages/snippet`), 4.8 KB gzipped | ✅ Working, v0 |
| Live demo with nine customer-experience examples and a knowledge graph (`packages/demo`) | ✅ Working |
| AI tagging of your content | 🔜 Roadmap |
| AI-written variants per archetype | 🔜 Roadmap |
| CMS plugins (WordPress first) | 🔜 Roadmap |
| Reporting on lift against the control group | 🔜 Roadmap (events are emitted today; send them to your analytics) |

## Quickstart: drop it into any site

See [`packages/snippet/README.md`](packages/snippet/README.md) for the full guide. The short version:

```html
<!-- 1. Your categories and archetypes -->
<script type="application/json" id="intent-config">
  { "config": { "categories": [ … ], "archetypes": [ … ] } }
</script>

<!-- 2. What this page is about -->
<meta name="intent:tags" content='{"trip-purpose":{"family":0.9},"destination":{"beach":0.8}}'>

<!-- 3. Variants. The first match wins; everyone else sees the default. -->
<div data-intent-slot>
  <section data-intent-show="archetype:family-summer-planner">Kids stay and eat free this summer.</section>
  <section data-intent-default>Find your next stay.</section>
</div>

<script src="intent.min.js" defer></script>
```

The built file is committed at [`packages/snippet/dist/intent.min.js`](packages/snippet/dist/intent.min.js), so there is nothing to build. Single-page apps call `intent.view(id)` on route changes.

## Or use the engine directly

```ts
import { loadConfig } from './packages/config/src/index.ts';
import { createTracker } from './packages/tracker/src/index.ts';

const tracker = createTracker({ config: loadConfig(myConfig), tags: myTagMap });
tracker.view('summer-family-offer');            // a page read
tracker.view('group-proposal-form', 3);          // a stronger action
document.addEventListener('intent:match', (e) => console.log(e.detail));
```

### What your site receives

- `<html data-intent-<category>="<attribute>" data-intent-archetype="<id>">` for CSS or server-side variants.
- A first-party cookie, `intent=trip-purpose.family~archetype.family-summer-planner`, for the edge or server.
- An `intent:match` DOM event with the full result, including the nearest match and the reasons.
- Control-group visitors get only `data-intent-holdout="true"` and `intent=holdout`.

## Privacy

- No names, emails, or other personal data are collected or needed.
- Matching runs in the visitor’s browser. Nothing is sent to a server by intent.
- Storage is first-party only (`localStorage` and one cookie). Idle profiles are cleared after 30 days.
- Inferring interests is still profiling. Load intent behind your consent banner where the law requires it. The snippet honors Global Privacy Control by default.
- Avoid sensitive categories (health, finances, accessibility) in your configuration.

## Develop

```bash
npm test           # every package, Node’s built-in test runner
npm run dev        # the demo
npm run build      # the snippet bundle and the demo
```

Node 22.18 or newer runs the TypeScript directly; there is no build step for the engine packages. v0 packages are source-first and not yet published to npm.

## Status

v0.1, stealth preview. The API may change. Issues and ideas are welcome.

## License

[MIT](LICENSE)
