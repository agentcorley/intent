# intent snippet

One script plus one config. Drops into any CMS that lets you edit the page head.

`dist/intent.min.js` is about 12.7 KB raw, 4.8 KB gzipped, with no dependencies and no network calls beyond your own tag map. Build it with `npm run build -w @intent/snippet`. See `example/index.html` for a working hotel page.

## Install in 3 steps

**1. Paste the config and the script into the page head.**

```html
<script type="application/json" id="intent-config">
{
  "config": {
    "categories": [
      { "id": "trip", "attributes": [{ "id": "business" }, { "id": "family" }] }
    ],
    "archetypes": [
      { "id": "family-planner", "fingerprint": { "trip": { "family": 1 } } }
    ]
  },
  "tagsUrl": "/intent-tags.json"
}
</script>
<script src="/path/to/intent.min.js"></script>
```

`config` is the standard intent config (categories, attributes, archetypes, radii, `minViews`, `halfLifeDays`, `holdoutPercent`). An invalid config logs one `[intent]` error listing every problem, and the page keeps its defaults.

Optional keys: `tags` (an inline tag map, content id to tags), `tagsUrl` (a JSON tag map fetched once per session and cached in sessionStorage), and `respectGPC` (default `true`).

Load the script without `defer` or `async` so its anti-flicker style lands before the body renders. If you must load it async, paste this into the head yourself:

```html
<style>html:not(.intent-ready) [data-intent-slot]>:not([data-intent-default]){display:none!important}</style>
```

**2. Tag each page.** Either write the tags inline, so the CMS or crawler owns them per page:

```html
<meta name="intent:tags" content='{"trip":{"family":0.8}}'>
```

or point to an entry in the tag map with `<meta name="intent:id" content="family-suites">`. With neither, the snippet looks up `location.pathname` (with or without a trailing slash). Inline tags win.

**3. Wrap variants in a slot.**

```html
<section data-intent-slot="hero">
  <div data-intent-show="archetype:family-planner">…</div>
  <div data-intent-show="trip:business, trip:family">…</div>
  <div data-intent-default>…</div>
</section>
```

The first child whose condition matches is shown; otherwise the default. A comma list means OR. Conditions are `archetype:<id>` or `<category>:<attribute>`. Holdout visitors and visitors still warming up always see the default. Slots re-evaluate on every match.

## Action tracking

```html
<button data-intent-track="family-suites">Explore</button>
<a data-intent-track data-intent-tags='{"trip":{"music":1}}' data-intent-weight="3">Get tickets</a>
```

`data-intent-track` names a content id, or stays empty to use the element’s own `data-intent-tags`. `data-intent-weight` defaults to 2 (a click counts more than a page view).

## Developer API

```js
intent.version                // "0.1.0"
intent.view(id, weight = 1)   // record a content id from the tag map
intent.track(tags, weight = 1) // record ad hoc tags, e.g. { trip: { family: 1 } }
intent.matches()              // current result, nothing recorded
intent.reset()                // forget signal, keep holdout assignment
intent.setHoldout(true)       // QA: force the default experience
intent.on((detail) => {})     // every intent:match; returns an unsubscribe function
```

## Output contract

Identical to every other intent integration:

- `<html>` gets `data-intent-<category>="<attribute>"` per matched audience and `data-intent-archetype="<id>"`. Holdout visitors get only `data-intent-holdout="true"`. The snippet also adds the class `intent-ready`.
- First-party cookie `intent=trip.family~archetype.family-planner`, or `intent=holdout`, for server-side use. Ids only.
- `intent:match` event on `document`, detail `{ ready, views, holdout, audiences, archetype }`.

## Privacy

- No PII, no third-party calls. Matching runs in the browser; state lives in first-party localStorage (`intent:v2`) and the `intent` cookie.
- The only request is your own `tagsUrl`.
- **Global Privacy Control and Do Not Track are honored by default.** Those visitors run as holdout: they see defaults, nothing is written to localStorage, sessionStorage, or cookies, and `tagsUrl` is not fetched. Set `"respectGPC": false` in the config block to turn this off (only if your legal team says so).

## Per-CMS notes

- **WordPress:** paste both script tags with a header injection plugin (or `wp_head` in a child theme’s `functions.php`), and wrap variants in a Custom HTML block. Render `intent:tags` from a custom field in `header.php`.
- **Squarespace:** Settings, Advanced, Code Injection, Header. Per page, use Page Settings, Advanced, Page Header Code Injection for the `intent:tags` meta tag. Slots go in a Code block.
- **Sitecore, AEM, Optimizely:** add the config and script to the main layout or page template. Render the meta tags from content fields on the page item (a tags JSON field, or an id field that matches the crawler’s tag map), and build slots as a rendering or component whose variants are child datasources.
