import './style.css';
import { loadConfig } from '../../config/src/index.ts';
import { createTracker, MATCH_EVENT, type MatchDetail, type Tracker } from '../../tracker/src/index.ts';
import { normalize, SIGNAL_FLOOR, type EngineConfig } from '../../core/src/index.ts';
import { examples } from './examples/index.ts';
import type { Copy, Example } from './examples/types.ts';
import { mountGraph } from './graph-mount.ts';

const DAY = 24 * 60 * 60 * 1000;
const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

// Demo-only state (clock offset, read counts, chosen industry). Wrapped: storage can be unavailable.
const store = {
  get<T>(key: string, fallback: T): T {
    try { return (JSON.parse(localStorage.getItem(`intent-demo3:${key}`) ?? 'null') as T) ?? fallback; } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(`intent-demo3:${key}`, JSON.stringify(value)); } catch { /* unavailable */ }
  },
};

/* ---------- Current example ---------- */

let ex: Example;
let config: EngineConfig;
let tracker: Tracker;
let offset = 0;
let counts: Record<string, number> = {};
let hue = new Map<string, string>();
let categoryById = new Map<string, EngineConfig['categories'][number]>();
let archetypeById = new Map<string, EngineConfig['archetypes'][number]>();

const attrLabel = (cid: string, aid: string | null) =>
  aid ? categoryById.get(cid)?.attributes.find((a) => a.id === aid)?.label ?? aid : '';
const archLabel = (id: string | null) => (id ? archetypeById.get(id)?.label ?? id : '');
/** Category hue class by config order: k1 to k5. */
const k = (cid: string) => hue.get(cid) ?? 'k1';

/** Plain-language closeness. Not a probability, so no percentage. */
const closeness = (fit: number) => (fit >= 0.66 ? 'Strong match' : fit >= 0.33 ? 'Good match' : 'Edge of range');

const graph = mountGraph($('#graph'));

function load(id: string) {
  ex = examples.find((e) => e.id === id) ?? examples[0];
  config = loadConfig(ex.config);
  categoryById = new Map(config.categories.map((c) => [c.id, c]));
  archetypeById = new Map(config.archetypes.map((a) => [a.id, a]));
  hue = new Map(config.categories.map((c, i) => [c.id, `k${i + 1}`]));
  offset = store.get(`${ex.id}:offset`, 0);
  counts = store.get(`${ex.id}:counts`, {});
  store.set('example', ex.id);
  if (location.hash.slice(1) !== ex.id) history.replaceState(null, '', `#${ex.id}`);

  // Attributes from the previous industry's categories must not linger on <html>.
  for (const a of [...document.documentElement.attributes]) {
    if (a.name.startsWith('data-intent-')) document.documentElement.removeAttribute(a.name);
  }

  // random: () => 1 keeps the demo visitor out of the control group unless the switch is on.
  tracker = createTracker({
    config, tags: ex.tags, clock: () => Date.now() + offset, random: () => 1, storageKey: `intent-demo:${ex.id}`,
  });

  $<HTMLSelectElement>('#industry-select').value = ex.id;
  $('#url').textContent = ex.domain;
  $('#half-life').textContent = `${Math.round(config.halfLifeMs / DAY)}-day half-life`;
  $('#scenarios').innerHTML = ex.scenarios.map((s) => `<button data-scenario="${s.id}">${s.label}</button>`).join('');
  heroKey = '';
  lastLog = '';
  logEl.innerHTML = '';
  buildCards();
  buildAudiences();
  graph.load(ex, config);
  renderDay();
  tracker.refresh();
}

/* ---------- Industry switcher, scenarios, time ---------- */

$('#industry').innerHTML = `
  <label class="label" for="industry-select">Industry</label>
  <span class="select"><select id="industry-select">${examples
    .map((e) => `<option value="${e.id}">${e.industry}</option>`)
    .join('')}</select></span>`;
$('#industry').addEventListener('change', (e) => {
  if (!playing) load((e.target as HTMLSelectElement).value);
});
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (id && id !== ex.id && !playing) load(id);
});

let playing = false;
$('#scenarios').addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-scenario]');
  const scenario = ex.scenarios.find((s) => s.id === btn?.dataset.scenario);
  if (!scenario || playing) return;
  playing = true;
  document.body.classList.add('playing');
  btn!.classList.add('active');
  resetVisitor();
  for (const id of scenario.path) {
    await wait(560);
    read(id);
  }
  await wait(400);
  btn!.classList.remove('active');
  document.body.classList.remove('playing');
  playing = false;
});

$('#ff').addEventListener('click', () => {
  offset += 7 * DAY;
  store.set(`${ex.id}:offset`, offset);
  renderDay();
  document.body.classList.remove('decaying');
  void document.body.offsetWidth;
  document.body.classList.add('decaying');
  tracker.refresh();
});

$('#reset').addEventListener('click', () => resetVisitor());

const holdoutBox = $<HTMLInputElement>('#holdout');
holdoutBox.addEventListener('change', () => tracker.setHoldout(holdoutBox.checked));

function resetVisitor() {
  offset = 0;
  counts = {};
  store.set(`${ex.id}:offset`, offset);
  store.set(`${ex.id}:counts`, counts);
  renderDay();
  tracker.reset();
}

function renderDay() {
  $('#day').textContent = `Day ${Math.round(offset / DAY)}`;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

/* ---------- Content cards ---------- */

const cards = $('#cards');

function buildCards() {
  cards.innerHTML = ex.content
    .map((item) => {
      const dots = config.categories
        .map((c) => {
          const strength = Math.max(0, ...Object.values(ex.tags[item.id]?.[c.id] ?? {}));
          return `<i class="dot ${k(c.id)}" style="--s:${strength}" title="${c.label}"></i>`;
        })
        .join('');
      return `
      <button class="card" data-id="${item.id}" title="${item.title}">
        <span class="card-top">
          <span class="type">${item.type}</span>
          <span class="next" aria-hidden="true"></span>
        </span>
        <span class="title">${item.title}</span>
        <span class="card-foot">
          <span class="meta">${item.minutes} min</span>
          <span class="read" aria-live="polite"></span>
          <span class="dots">${dots}</span>
        </span>
      </button>`;
    })
    .join('');
}

cards.addEventListener('click', (e) => {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.card');
  if (card && !playing) read(card.dataset.id!);
});

function read(id: string) {
  const before = tracker.matches().views;
  const card = cards.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
  // The tracker fires the match event synchronously, so counts must be set first.
  counts[id] = (counts[id] ?? 0) + 1;
  const after = tracker.view(id).views;
  if (after === before) {
    // Repeat inside the 30-minute window: the engine ignored it.
    counts[id] -= 1;
    card.classList.remove('repeat');
    void card.offsetWidth;
    card.classList.add('repeat');
    card.querySelector('.read')!.textContent = 'Repeat ignored';
    setTimeout(() => renderCards(tracker.matches()), 1400);
    return;
  }
  store.set(`${ex.id}:counts`, counts);
  card.classList.remove('pulse');
  void card.offsetWidth;
  card.classList.add('pulse');
  renderCards(tracker.matches());
}

function renderCards(d: MatchDetail) {
  // “Up next”: unread content whose tags overlap most with the matched archetype.
  // Overlap, not distance: an unrelated page must not outrank a related one.
  const arch = d.archetype.archetype ? archetypeById.get(d.archetype.archetype) : undefined;
  const next = new Set<string>();
  if (arch && !d.holdout) {
    const overlap = (id: string) =>
      Object.entries(arch.fingerprint).reduce(
        (s, [cid, target]) => s + Object.entries(target).reduce((t, [aid, v]) => t + v * (ex.tags[id]?.[cid]?.[aid] ?? 0), 0),
        0,
      );
    ex.content
      .filter((c) => !counts[c.id])
      .map((c) => ({ id: c.id, score: overlap(c.id) }))
      .filter((c) => c.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .forEach((c) => next.add(c.id));
  }
  for (const card of cards.querySelectorAll<HTMLElement>('.card')) {
    const id = card.dataset.id!;
    const n = counts[id] ?? 0;
    card.classList.toggle('is-read', n > 0);
    card.querySelector('.read')!.textContent = n ? (n > 1 ? `Read ×${n}` : 'Read') : '';
    card.classList.toggle('is-next', next.has(id));
    card.querySelector('.next')!.textContent = next.has(id) && arch ? 'Up next' : '';
  }
}

/* ---------- Hero (activation) ---------- */

const heroEl = $('#hero');
let heroKey = '';

/** Archetype owns the hero. Otherwise audiences fill fields, earlier categories first, over the default. */
function composeHero(arch: string | null, aud: Record<string, string | null>): Copy {
  if (arch && ex.hero.archetypes[arch]) return ex.hero.archetypes[arch];
  const copy: Partial<Copy> = {};
  for (const c of config.categories) {
    const partial = aud[c.id] ? ex.hero.audiences[c.id]?.[aud[c.id]!] : undefined;
    for (const [field, value] of Object.entries(partial ?? {})) {
      copy[field as keyof Copy] ??= value;
    }
  }
  return { ...ex.hero.default, ...copy };
}

function renderHero(d: MatchDetail) {
  // Control-group visitors see the default, exactly as the CMS would serve them.
  const live = !d.holdout;
  const aud = Object.fromEntries(d.audiences.map((a) => [a.category, live ? a.audience : null]));
  const arch = live ? d.archetype.archetype : null;
  const key = `${ex.id}|${arch}|${d.audiences.map((a) => aud[a.category] ?? '-').join('|')}`;
  if (key === heroKey) return;
  heroKey = key;

  const copy = composeHero(arch, aud);
  const chips = [
    arch ? `<span class="chip arch">${archLabel(arch)}</span>` : '',
    ...d.audiences.filter((a) => aud[a.category]).map((a) => `<span class="chip ${k(a.category)}">${attrLabel(a.category, a.audience)}</span>`),
  ].filter(Boolean);
  const label = d.holdout ? 'Control group · default on purpose' : chips.length ? (arch ? 'Archetype' : 'Personalized for') : d.ready ? 'Signal too mixed' : 'Learning';

  heroEl.innerHTML = `
    <div class="hero-glow" aria-hidden="true">
      ${config.categories.map((c) => `<i class="${k(c.id)}" style="opacity:${aud[c.id] ? 0.5 : 0}"></i>`).join('')}
      <i class="g-arch" style="opacity:${arch ? 0.55 : 0}"></i>
    </div>
    <div class="hero-copy swap">
      <span class="eyebrow">${copy.eyebrow}</span>
      <h1>${copy.headline}</h1>
      <p>${copy.sub}</p>
      <span class="cta">${copy.cta} <span aria-hidden="true">→</span></span>
    </div>
    <div class="hero-foot">
      <span class="for">${label}</span>
      ${chips.join('')}
    </div>`;
}

/* ---------- Engine: warm-up ---------- */

function renderWarmup(d: MatchDetail) {
  const pips = Array.from({ length: config.minViews }, (_, i) => `<i class="${i < d.views ? 'on' : ''}"></i>`).join('');
  $('#warmup').innerHTML = d.ready
    ? `<span class="live-dot"></span>Matching live · ${d.views} reads`
    : `<span class="pips">${pips}</span>${d.views} of ${config.minViews} reads before matching`;
}

/* ---------- Engine: archetype ---------- */

const archEl = $('#archetype');

function renderArchetype(d: MatchDetail) {
  const a = d.archetype;
  const id = a.archetype ?? a.nearest;
  const fp = id ? archetypeById.get(id)!.fingerprint : {};
  const state = a.archetype ? 'matched' : a.nearest ? 'near' : 'idle';
  const r2 = config.archetypeRadius ** 2;
  const fit = Number.isFinite(a.distance) ? Math.max(0, 1 - a.distance / r2) : 0;

  const title =
    state === 'matched' ? archLabel(a.archetype)
    : state === 'near' ? `Closest: ${archLabel(a.nearest)}`
    : 'No archetype yet';
  const status =
    state === 'matched' ? closeness(fit)
    : state === 'near'
      ? !d.ready ? 'warming up'
      : a.missing.length ? `waiting on ${a.missing.map((m) => categoryById.get(m)?.label ?? m).join(' and ')}`
      : 'not close enough yet'
    : 'waiting for signal';

  const rows = config.categories
    .map((c) => {
      const target = fp[c.id];
      const part = a.categories.find((p) => p.category === c.id);
      if (!target) {
        return `<li class="any"><span class="c-name">${c.label}</span><span class="c-target">Any</span><span class="c-gap"></span></li>`;
      }
      const names = Object.entries(target)
        .sort((x, y) => y[1] - x[1])
        .map(([aid, v]) => `<span class="${v >= 0.75 ? 'strong' : ''}">${attrLabel(c.id, aid)}</span>`)
        .join('');
      // Per-category closeness: 1 at a perfect fit, 0 at distance ≥ 1.
      const close = part ? Math.max(0, 1 - part.distance) : 0;
      return `<li class="${k(c.id)}"><span class="c-name">${c.label}</span><span class="c-target">${names}</span>
        <span class="c-gap" title="How close this visitor is on ${c.label}"><i style="transform:scaleX(${close})"></i></span></li>`;
    })
    .join('');

  archEl.dataset.state = state;
  archEl.innerHTML = `
    <header>
      <span class="eyebrow-sm">Archetype</span>
      <span class="a-status">${status}</span>
    </header>
    <h3 class="a-title ${state === 'matched' ? 'swap' : ''}">${title}</h3>
    <div class="fit"><span class="fit-bar"><i style="transform:scaleX(${fit})"></i></span></div>
    ${
      state === 'idle'
        ? `<div class="roster"><span class="eyebrow-sm">Watching for</span>${config.archetypes
            .map((x) => `<span>${x.label}</span>`)
            .join('')}</div>`
        : `<ul class="fingerprint">${rows}</ul>`
    }`;
}

/* ---------- Engine: audiences ---------- */

const audEl = $('#audiences');

function buildAudiences() {
  audEl.innerHTML = config.categories
    .map(
      (c) => `
    <section class="aud ${k(c.id)}" data-category="${c.id}">
      <header>
        <h4>${c.label}</h4>
        <span class="pill"></span>
      </header>
      <ul>
        ${c.attributes
          .map((a) => `<li data-attr="${a.id}"><span class="t-label">${a.label}</span><span class="track"><i class="fill"></i></span></li>`)
          .join('')}
      </ul>
      <span class="signal">strength <b>0.00</b></span>
    </section>`,
    )
    .join('');
}

function renderAudiences(d: MatchDetail) {
  const state = tracker.state();
  for (const r of d.audiences) {
    const el = audEl.querySelector<HTMLElement>(`[data-category="${r.category}"]`);
    if (!el) continue;
    const c = categoryById.get(r.category)!;
    const raw = state?.scores[r.category];
    const visitor = normalize(raw, c.attributes);
    const signal = Object.values(raw ?? {}).reduce((s, v) => s + v, 0);
    el.querySelector('.signal b')!.textContent = signal.toFixed(2);

    const s = r.audience ? 'matched' : r.nearest ? 'near' : 'idle';
    el.dataset.state = s;
    el.querySelector('.pill')!.textContent =
      s === 'matched' ? attrLabel(r.category, r.audience)
      : s !== 'near' ? '–'
      : !d.ready ? '…'
      : Math.max(...Object.values(raw ?? {})) < SIGNAL_FLOOR ? 'Weak'
      : 'Mixed';

    for (const li of el.querySelectorAll<HTMLElement>('li[data-attr]')) {
      const aid = li.dataset.attr!;
      li.querySelector<HTMLElement>('.fill')!.style.transform = `scaleX(${visitor?.[aid] ?? 0})`;
      li.classList.toggle('lead', aid === (r.audience ?? r.nearest));
    }
  }
}

/* ---------- What the CMS receives ---------- */

const attrsEl = $('#attrs');
const logEl = $('#log');
let lastLog = '';

function renderContract(d: MatchDetail) {
  const html = document.documentElement;
  const keys = [...config.categories.map((c) => c.id), 'archetype', 'holdout'];
  const lines = keys.map((key) => {
    const v = html.getAttribute(`data-intent-${key}`);
    const cls = key === 'archetype' ? 'is-arch' : key === 'holdout' ? 'is-hold' : k(key);
    return v
      ? `  <span class="k">data-intent-${key}</span>=<span class="v ${cls}">"${v}"</span>`
      : `  <span class="k dim">data-intent-${key}</span>`;
  });
  const cookie = document.cookie.split('; ').find((c) => c.startsWith('intent='))?.slice(7) ?? '';
  attrsEl.innerHTML =
    `<span class="c">&lt;html</span>\n${lines.join('\n')}<span class="c">&gt;</span>\n\n` +
    `<span class="k">cookie</span> intent=${cookie ? `<span class="v">${decodeURIComponent(cookie)}</span>` : '<span class="c">(none)</span>'}`;

  holdoutBox.checked = d.holdout;

  const summary = `${d.holdout}|${d.archetype.archetype}|${d.audiences.map((a) => a.audience).join(',')}`;
  if (summary === lastLog) return;
  lastLog = summary;
  const time = new Date(Date.now() + offset).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const matched = d.audiences.filter((a) => a.audience).length;
  const what = d.holdout
    ? '<span class="is-hold">control group</span>'
    : d.archetype.archetype
      ? `<span class="is-arch">${d.archetype.archetype}</span>`
      : `<span class="dim">no archetype</span>`;
  const li = document.createElement('li');
  li.innerHTML = `<span class="time">${time}</span><span class="ev">intent:match</span><span class="sum">${what}<span class="dim">${matched}/${config.categories.length} audiences</span></span>`;
  logEl.prepend(li);
  while (logEl.children.length > 4) logEl.lastElementChild!.remove();
}

/* ---------- Wire to the contract, exactly as a CMS would ---------- */

document.addEventListener(MATCH_EVENT, (e) => {
  const d = (e as CustomEvent<MatchDetail>).detail;
  renderHero(d);
  renderWarmup(d);
  renderArchetype(d);
  renderAudiences(d);
  renderCards(d);
  renderContract(d);
  graph.update(tracker.state(), d);
});

load(location.hash.slice(1) || store.get('example', examples[0]?.id ?? ''));
