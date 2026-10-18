# intent snippet

One script plus one config. Drops into any CMS that lets you edit the page head.

`dist/intent.min.js` is about 14 KB raw, about 5 KB gzipped, with no dependencies and no network calls beyond your own tag map. Build it with `npm run build -w @intent/snippet`. See `example/index.html` for a working hotel page.

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

**2. Tag each page.** Either write the tags inline, so your CMS owns them per page:

```html
<meta name="intent:tags" content='{"trip":{"family":8,"couples":2}}'>
```

or point to an entry in the tag map with `<meta name="intent:id" content="family-suites">`. With neither, the snippet looks up `location.pathname` (with or without a trailing slash). Inline tags win.

The AI tagger (`packages/tagger`, preview) can write the tag map for you: it reads each page and scores it on your categories. Review its output before publishing.

### Scoring in Fibonacci points

Add `"scale": "fibonacci"` to the config and write every score, in tags and archetype fingerprints alike, as 0, 1, 2, 3, 5, or 8:

| Points | Meaning |
|---|---|
| 0 | no signal |
| 1 | passing mention |
| 2 | minor theme |
| 3 | clear secondary theme |
| 5 | strong theme |
| 8 | the page is about this |

The steps widen as they grow, so people and models make the same call instead of debating 6 versus 7. Fingerprints must use exact points; tags (often AI-written) snap to the nearest point. Without `scale`, every score is a 0 to 1 decimal.

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
<a data-intent-track data-intent-tags='{"trip":{"music":8}}' data-intent-weight="convert">Get tickets</a>
```

`data-intent-track` names a content id, or stays empty to use the element’s own `data-intent-tags`. `data-intent-weight` takes a number or an action on the same Fibonacci ladder: `view` 1, `engage` 2 (the default for clicks), `save` 3, `download` 5, `convert` 8.

## Developer API

```js
intent.version                // "0.1.0"
intent.view(id, weight = 1)   // record a content id from the tag map
intent.track(tags, weight = 1) // record ad hoc tags, e.g. { trip: { family: 1 } }
intent.matches()              // current result, nothing recorded
intent.reset()                // forget signal, keep holdout assignment
intent.setHoldout(true)       // QA: force the default experience
intent.on((detail) => {})     // every intent:match; returns an unsubscribe function
intent.apply()                // re-apply slots, e.g. after React or AEM renders new ones
intent.forget()               // consent withdrawn: erase storage, cookie, attributes; stop tracking
intent.optedOut               // true when Global Privacy Control or Do Not Track switched intent off
```

Known data beats inference. After login, feed what you already know, for example `intent.track({ loyalty: { elite: 8 } }, 'convert')` (or the number 8).

To measure lift, send each `intent:match` to your analytics with the variant shown and `detail.holdout`, then compare conversion between matched visitors and the control group.

## Output contract

Identical to every other intent integration:

- `<html>` gets `data-intent-<category>="<attribute>"` per matched audience and `data-intent-archetype="<id>"`. Holdout visitors get only `data-intent-holdout="true"`. The snippet also adds the class `intent-ready`.
- First-party cookie `intent=trip.family~archetype.family-planner`, or `intent=holdout`, for server-side use. Ids only.
- `intent:match` event on `document`, detail `{ ready, views, holdout, audiences, archetype }`. Opted-out visitors get no event at all.

## Privacy

- No PII. Matching runs in the browser; state lives in first-party localStorage (`intent:v2`) and the `intent` cookie.
- intent makes no network calls of its own except fetching your `tagsUrl`. The first-party `intent` cookie, which holds matched ids only, travels to your own server with each request so your edge can use it.
- Idle visitors are forgotten: after 30 days without a read, the cookie expires and stored scores are erased on the next visit.
- Global Privacy Control and Do Not Track are honored by default. Those visitors see defaults; nothing is stored, no attributes or events are published, and `tagsUrl` is not fetched. They are kept out of the control group so they never skew lift. Set `"respectGPC": false` in the config block to turn this off (only if your legal team says so).
- Call `intent.forget()` when a visitor withdraws consent. Inferring interests is still profiling, so load intent behind your consent banner where the law requires it.

## Per-CMS notes

- WordPress: paste both script tags with a header injection plugin (or `wp_head` in a child theme’s `functions.php`), and wrap variants in a Custom HTML block. Render `intent:tags` from a custom field in `header.php`.
- Squarespace: Settings, Advanced, Code Injection, Header. Per page, use Page Settings, Advanced, Page Header Code Injection for the `intent:tags` meta tag. Slots go in a Code block.
- Sitecore, AEM, Optimizely: add the config and script to the main layout or page template. Render the meta tags from content fields on the page item (a tags JSON field, or an id field that matches your tag map), and build slots as a rendering or component whose variants are child datasources.
