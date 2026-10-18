// Intent knowledge graph: a draggable, drill-down view of how the engine sees
// one visitor (or a whole population). Pure SVG plus d3-force, no framework.
//
// Layout: a hub at the center, categories on a ring around it, attributes
// orbiting their category, archetypes on an inner ring with dashed edges to
// every attribute in their fingerprint. Positions persist across updates;
// data changes only resize and restyle nodes.

import {
  forceSimulation, forceLink, forceManyBody, forceCollide, forceRadial,
  type Simulation, type SimulationNodeDatum, type SimulationLinkDatum,
} from 'd3-force';
import {
  normalize, categoryDistance,
  type EngineConfig, type MatchSet, type VisitorState, type Scores, type CategoryDistance,
} from '../../core/src/index.ts';
import type { Population } from './population.ts';
import './graph.css';

export type GraphMode = 'visitor' | 'aggregate';

export interface GraphLabels {
  /** Toggle and hub label in visitor mode. Default “This visitor”. */
  visitor?: string;
  /** Toggle and hub label in aggregate mode. Default “All visitors”. */
  population?: string;
}

export interface GraphOptions {
  config: EngineConfig;
  labels?: GraphLabels;
  /** Starting mode. Default 'visitor'. */
  mode?: GraphMode;
}

export interface GraphHandle {
  showVisitor(state: VisitorState | undefined, detail: MatchSet): void;
  showPopulation(pop: Population): void;
  setMode(mode: GraphMode): void;
  destroy(): void;
}

type Kind = 'hub' | 'category' | 'attribute' | 'archetype';

interface GNode extends SimulationNodeDatum {
  id: string;
  kind: Kind;
  label: string;
  cat?: string;
  attr?: string;
  arch?: string;
  /** Category order, 0-based, for the hue. */
  hue: number;
  /** Displayed radius, eased toward `tr`. */
  r: number;
  tr: number;
  pinned: boolean;
  g: SVGGElement;
  shape: SVGCircleElement;
  text: SVGTextElement;
}

interface GLink extends SimulationLinkDatum<GNode> {
  id: string;
  kind: 'spoke' | 'orbit' | 'print';
  source: GNode;
  target: GNode;
  /** Fingerprint target value for print edges, 1 otherwise. */
  w: number;
  arch?: string;
  line: SVGLineElement;
}

interface ArchFit {
  distance: number;
  parts: CategoryDistance[];
}

interface VisitorView {
  state: VisitorState | undefined;
  detail: MatchSet;
  norm: Record<string, Scores | null>;
  arch: Map<string, ArchFit>;
}

const SVG = 'http://www.w3.org/2000/svg';
const R_CAT = 160;
const R_ARCH = 82;
const MIN_K = 0.35;
const MAX_K = 3;
const DRAG_SLOP = 4;
const KIND_CLASS: Record<Kind, string> = { hub: 'hub', category: 'cat', attribute: 'attr', archetype: 'arch' };

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const num = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : 'n/a');
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/** Mean distance per archetype, computed the same way core does it, for every archetype. */
function archetypeFits(config: EngineConfig, norm: Record<string, Scores | null>): Map<string, ArchFit> {
  const byId = new Map(config.categories.map((c) => [c.id, c]));
  const out = new Map<string, ArchFit>();
  for (const a of config.archetypes) {
    const parts: CategoryDistance[] = [];
    for (const [cid, target] of Object.entries(a.fingerprint)) {
      const c = byId.get(cid);
      if (c) parts.push(categoryDistance(c, norm[cid] ?? null, target));
    }
    const distance = parts.length ? parts.reduce((s, p) => s + p.distance, 0) / parts.length : Infinity;
    out.set(a.id, { distance, parts });
  }
  return out;
}

export function createIntentGraph(root: HTMLElement, opts: GraphOptions): GraphHandle {
  const { config } = opts;
  const labels = { visitor: 'This visitor', population: 'All visitors', ...opts.labels };
  const uid = `ig${Math.random().toString(36).slice(2, 8)}`;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = motion.matches;

  const catById = new Map(config.categories.map((c, i) => [c.id, { ...c, index: i }]));
  const archById = new Map(config.archetypes.map((a) => [a.id, a]));
  const catLabel = (cid: string) => catById.get(cid)?.label ?? cid;
  const attrLabel = (cid: string, aid: string) => catById.get(cid)?.attributes.find((a) => a.id === aid)?.label ?? aid;

  let mode: GraphMode = opts.mode ?? 'visitor';
  let visitor: VisitorView | null = null;
  let population: Population | null = null;
  let selected: GNode | null = null;
  const collapsed = new Set<string>();

  /* ---------- DOM ---------- */

  const wrap = document.createElement('div');
  wrap.className = 'ig';
  wrap.innerHTML = `
    <div class="ig-stage">
      <div class="ig-bar">
        <div class="ig-seg" role="group" aria-label="Graph view">
          <button type="button" data-mode="visitor">${esc(labels.visitor)}</button>
          <button type="button" data-mode="aggregate">${esc(labels.population)}</button>
        </div>
        <button type="button" class="ig-btn" data-act="reset">Reset view</button>
      </div>
      <svg class="ig-svg" role="group" aria-label="Intent graph: categories, attributes, and archetypes">
        <defs>
          <linearGradient id="${uid}-arch" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style="stop-color: var(--ig-arch-a)" />
            <stop offset="1" style="stop-color: var(--ig-arch-b)" />
          </linearGradient>
          <filter id="${uid}-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <g class="ig-view">
          <g class="ig-edges"></g>
          <g class="ig-nodes"></g>
        </g>
      </svg>
      <nav class="ig-crumbs" aria-label="Graph path"></nav>
      <p class="ig-hint" aria-hidden="true">Drag nodes · pinch or Ctrl+scroll to zoom · click a category to fold it</p>
      <aside class="ig-panel" aria-live="polite" hidden></aside>
      <div class="ig-tip" role="tooltip" hidden></div>
    </div>`;
  root.appendChild(wrap);

  const stage = wrap.querySelector<HTMLElement>('.ig-stage')!;
  const svg = wrap.querySelector<SVGSVGElement>('.ig-svg')!;
  const viewG = svg.querySelector<SVGGElement>('.ig-view')!;
  const edgeG = svg.querySelector<SVGGElement>('.ig-edges')!;
  const nodeG = svg.querySelector<SVGGElement>('.ig-nodes')!;
  const panel = wrap.querySelector<HTMLElement>('.ig-panel')!;
  const tip = wrap.querySelector<HTMLElement>('.ig-tip')!;
  const crumbs = wrap.querySelector<HTMLElement>('.ig-crumbs')!;
  const seg = wrap.querySelector<HTMLElement>('.ig-seg')!;
  const gradient = `url(#${uid}-arch)`;

  /* ---------- Nodes ---------- */

  const nodes: GNode[] = [];
  const nodeById = new Map<string, GNode>();

  function addNode(n: Omit<GNode, 'g' | 'shape' | 'text' | 'r' | 'pinned'>, extra: (g: SVGGElement) => void = () => {}): GNode {
    const g = el('g', { class: `ig-node ig-${KIND_CLASS[n.kind]}` });
    g.style.setProperty('--hue', `var(--ig-c${(n.hue % 5) + 1})`);
    const ring = el('circle', { class: 'ig-ring', r: n.tr + 5 });
    const shape = el('circle', { class: 'ig-shape', r: n.tr });
    const text = el('text', { class: 'ig-label', 'text-anchor': 'middle' });
    g.append(ring, shape);
    extra(g);
    g.append(text);
    if (n.kind !== 'hub') {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
    }
    nodeG.appendChild(g);
    const node: GNode = { ...n, r: n.tr, pinned: false, g, shape, text };
    g.addEventListener('pointerdown', (e) => onNodeDown(e, node));
    g.addEventListener('dblclick', (e) => { e.stopPropagation(); unpin(node); });
    g.addEventListener('keydown', (e) => onNodeKey(e, node));
    g.addEventListener('pointerenter', () => showTip(node));
    g.addEventListener('pointerleave', () => hideTip());
    g.addEventListener('focus', () => showTip(node));
    g.addEventListener('blur', () => hideTip());
    nodes.push(node);
    nodeById.set(node.id, node);
    return node;
  }

  const hubRing = el('circle', { class: 'ig-progress', r: 37, transform: 'rotate(-90)' });
  const hubNum = el('text', { class: 'ig-hub-num', 'text-anchor': 'middle', y: 2 });
  const hubCap = el('text', { class: 'ig-hub-cap', 'text-anchor': 'middle', y: 15 });
  const hub = addNode({ id: 'hub', kind: 'hub', label: labels.visitor, hue: 0, tr: 30, fx: 0, fy: 0, x: 0, y: 0 }, (g) => {
    g.insertBefore(hubRing, g.firstChild);
    g.append(hubNum, hubCap);
  });
  hubRing.style.stroke = gradient;

  const nCat = config.categories.length;
  config.categories.forEach((c, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / nCat;
    const count = el('text', { class: 'ig-cat-count', 'text-anchor': 'middle', y: 4 });
    count.textContent = String(c.attributes.length);
    addNode(
      { id: `c:${c.id}`, kind: 'category', label: c.label ?? c.id, cat: c.id, hue: i, tr: 17, x: Math.cos(angle) * R_CAT, y: Math.sin(angle) * R_CAT },
      (g) => g.append(count),
    );
    const m = c.attributes.length;
    c.attributes.forEach((a, j) => {
      const t = angle + (j - (m - 1) / 2) * 0.32;
      const rr = R_CAT + 70;
      addNode({ id: `a:${c.id}.${a.id}`, kind: 'attribute', label: a.label ?? a.id, cat: c.id, attr: a.id, hue: i, tr: 7, x: Math.cos(t) * rr, y: Math.sin(t) * rr });
    });
  });

  config.archetypes.forEach((a, i) => {
    // Start each archetype at the mean angle of the categories it names.
    const angles = Object.keys(a.fingerprint).map((cid) => catById.get(cid)?.index ?? 0).map((k) => -Math.PI / 2 + (k * 2 * Math.PI) / nCat);
    const sx = angles.reduce((s, t) => s + Math.cos(t), 0) || Math.cos(i);
    const sy = angles.reduce((s, t) => s + Math.sin(t), 0) || Math.sin(i);
    const t = Math.atan2(sy, sx) + i * 0.05;
    const halo = el('circle', { class: 'ig-halo', r: 22, filter: `url(#${uid}-glow)` });
    halo.style.fill = gradient;
    const node = addNode({ id: `x:${a.id}`, kind: 'archetype', label: a.label ?? a.id, arch: a.id, hue: 0, tr: 12, x: Math.cos(t) * R_ARCH, y: Math.sin(t) * R_ARCH }, (g) => {
      g.insertBefore(halo, g.firstChild);
    });
    node.shape.style.stroke = gradient;
  });

  /* ---------- Links ---------- */

  const lineById = new Map<string, SVGLineElement>();
  let links: GLink[] = [];

  function lineFor(id: string, kind: GLink['kind']): SVGLineElement {
    let line = lineById.get(id);
    if (!line) {
      line = el('line', { class: `ig-edge ig-${kind}` });
      lineById.set(id, line);
    }
    return line;
  }

  /** Rebuild the link list for the current fold state. Print edges to a folded category land on the category. */
  function buildLinks(): GLink[] {
    const out: GLink[] = [];
    for (const c of config.categories) {
      const cn = nodeById.get(`c:${c.id}`)!;
      out.push({ id: `s:${c.id}`, kind: 'spoke', source: hub, target: cn, w: 1, line: lineFor(`s:${c.id}`, 'spoke') });
      if (collapsed.has(c.id)) continue;
      for (const a of c.attributes) {
        const id = `o:${c.id}.${a.id}`;
        out.push({ id, kind: 'orbit', source: cn, target: nodeById.get(`a:${c.id}.${a.id}`)!, w: 1, line: lineFor(id, 'orbit') });
      }
    }
    for (const a of config.archetypes) {
      const xn = nodeById.get(`x:${a.id}`)!;
      for (const [cid, target] of Object.entries(a.fingerprint)) {
        if (!catById.has(cid)) continue;
        if (collapsed.has(cid)) {
          const w = Math.max(0, ...Object.values(target));
          const id = `p:${a.id}:${cid}`;
          if (w > 0) out.push({ id, kind: 'print', source: xn, target: nodeById.get(`c:${cid}`)!, w, arch: a.id, line: lineFor(id, 'print') });
          continue;
        }
        for (const [aid, w] of Object.entries(target)) {
          const tn = nodeById.get(`a:${cid}.${aid}`);
          const id = `p:${a.id}:${cid}.${aid}`;
          if (tn && w > 0) out.push({ id, kind: 'print', source: xn, target: tn, w, arch: a.id, line: lineFor(id, 'print') });
        }
      }
    }
    // Keep only live lines in the DOM, prints under spokes under orbits.
    const order = { print: 0, spoke: 1, orbit: 2 };
    edgeG.replaceChildren(...[...out].sort((a, b) => order[a.kind] - order[b.kind]).map((l) => l.line));
    for (const l of out) l.line.style.setProperty('--hue', `var(--ig-c${((l.target.hue ?? 0) % 5) + 1})`);
    return out;
  }

  const visible = () => nodes.filter((n) => !(n.kind === 'attribute' && collapsed.has(n.cat!)));

  /* ---------- Simulation ---------- */

  const linkForce = forceLink<GNode, GLink>()
    .id((n) => n.id)
    .distance((l) => (l.kind === 'spoke' ? R_CAT : l.kind === 'orbit' ? 54 + l.target.tr : R_CAT * 0.8))
    .strength((l) => (l.kind === 'spoke' ? 0.2 : l.kind === 'orbit' ? 0.7 : 0.015 + 0.04 * l.w));
  const collide = forceCollide<GNode>()
    .radius((n) => n.tr + (n.kind === 'attribute' ? 13 : n.kind === 'hub' ? 28 : 14))
    .strength(0.9);
  const sim: Simulation<GNode, GLink> = forceSimulation<GNode, GLink>()
    .alphaDecay(0.04)
    .velocityDecay(0.45)
    .force('link', linkForce)
    .force('charge', forceManyBody<GNode>().strength((n) => ({ hub: -420, category: -260, attribute: -120, archetype: -160 })[n.kind]).distanceMax(340))
    .force('collide', collide)
    .force(
      'radial',
      forceRadial<GNode>((n) => ({ hub: 0, category: R_CAT, attribute: R_CAT + 75, archetype: R_ARCH })[n.kind], 0, 0)
        .strength((n) => ({ hub: 0, category: 0.35, attribute: 0.07, archetype: 0.3 })[n.kind]),
    )
    .stop();

  function rebuildGraph() {
    links = buildLinks();
    sim.nodes(visible());
    linkForce.links(links);
  }

  /** Re-read radii into the forces after sizes change, then nudge the layout. */
  function reheat(alpha: number) {
    collide.radius(collide.radius());
    linkForce.distance(linkForce.distance());
    sim.alpha(Math.max(sim.alpha(), alpha));
    if (reduce) settle();
    kick();
  }

  function settle() {
    while (sim.alpha() > sim.alphaMin()) sim.tick();
  }

  /* ---------- View (pan and zoom) ---------- */

  let w = 0;
  let h = 0;
  const view = { k: 1, x: 0, y: 0 };
  let viewGoal: typeof view | null = null;
  let userMoved = false;

  function measure() {
    const rect = svg.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    svg.setAttribute('viewBox', `${-w / 2} ${-h / 2} ${w} ${h}`);
  }

  /** The transform that fits every visible node, leaving room for the toolbar. */
  function fitView(): typeof view {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of visible()) {
      const padX = n.tr + (n.kind === 'hub' ? 10 : 34);
      x0 = Math.min(x0, n.x! - padX); x1 = Math.max(x1, n.x! + padX);
      y0 = Math.min(y0, n.y! - n.tr - 6); y1 = Math.max(y1, n.y! + n.tr + 20);
    }
    const top = 48, bottom = 34;
    const k = clamp(Math.min(w / (x1 - x0 + 16), (h - top - bottom) / (y1 - y0)), MIN_K, 1.4);
    return { k, x: -((x0 + x1) / 2) * k, y: -((y0 + y1) / 2) * k + (top - bottom) / 2 };
  }

  function resetView(animate = true) {
    userMoved = false;
    const goal = fitView();
    if (!animate || reduce) Object.assign(view, goal);
    else viewGoal = goal;
    kick();
  }

  function zoomAt(px: number, py: number, factor: number) {
    const k = clamp(view.k * factor, MIN_K, MAX_K);
    view.x = px - ((px - view.x) * k) / view.k;
    view.y = py - ((py - view.y) * k) / view.k;
    view.k = k;
    viewGoal = null;
    userMoved = true;
    kick();
  }

  /** Client point to viewBox coordinates (origin at the stage center). */
  function toBox(cx: number, cy: number): [number, number] {
    const rect = svg.getBoundingClientRect();
    return [cx - rect.left - w / 2, cy - rect.top - h / 2];
  }
  const toSim = (cx: number, cy: number): [number, number] => {
    const [bx, by] = toBox(cx, cy);
    return [(bx - view.x) / view.k, (by - view.y) / view.k];
  };

  /* ---------- Render loop ---------- */

  let raf = 0;
  let dragging: GNode | null = null;

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function frame() {
    raf = 0;
    let busy = false;
    if (sim.alpha() > sim.alphaMin() || dragging) {
      sim.tick();
      busy = true;
    }
    for (const n of nodes) {
      const d = n.tr - n.r;
      if (Math.abs(d) > 0.05 && !reduce) { n.r += d * 0.18; busy = true; } else n.r = n.tr;
    }
    if (viewGoal) {
      const g = viewGoal;
      view.k += (g.k - view.k) * 0.2; view.x += (g.x - view.x) * 0.2; view.y += (g.y - view.y) * 0.2;
      if (Math.abs(g.k - view.k) < 0.002 && Math.abs(g.x - view.x) < 0.5 && Math.abs(g.y - view.y) < 0.5) {
        Object.assign(view, g);
        viewGoal = null;
      } else busy = true;
    }
    render();
    if (busy) kick();
  }

  function render() {
    viewG.setAttribute('transform', `translate(${view.x.toFixed(2)},${view.y.toFixed(2)}) scale(${view.k.toFixed(4)})`);
    for (const n of nodes) {
      n.g.setAttribute('transform', `translate(${(n.x ?? 0).toFixed(1)},${(n.y ?? 0).toFixed(1)})`);
      const r = n.r.toFixed(2);
      if (n.shape.getAttribute('r') !== r) {
        n.shape.setAttribute('r', r);
        (n.g.querySelector('.ig-ring') as SVGCircleElement).setAttribute('r', (n.r + 5).toFixed(2));
        if (n.kind !== 'attribute') n.text.setAttribute('y', (n.r + (n.kind === 'category' ? 15 : 13)).toFixed(1));
        if (n.kind === 'archetype') (n.g.querySelector('.ig-halo') as SVGCircleElement).setAttribute('r', (n.r + 9).toFixed(2));
      }
      if (n.kind === 'attribute') placeLabel(n);
    }
    for (const l of links) {
      l.line.setAttribute('x1', (l.source.x ?? 0).toFixed(1));
      l.line.setAttribute('y1', (l.source.y ?? 0).toFixed(1));
      l.line.setAttribute('x2', (l.target.x ?? 0).toFixed(1));
      l.line.setAttribute('y2', (l.target.y ?? 0).toFixed(1));
    }
  }

  /** Attribute labels sit on the far side from their category, so siblings fan out instead of stacking. */
  function placeLabel(n: GNode) {
    const c = nodeById.get(`c:${n.cat}`)!;
    const t = Math.atan2((n.y ?? 0) - (c.y ?? 0), (n.x ?? 0) - (c.x ?? 0));
    const cos = Math.cos(t), sin = Math.sin(t);
    let x = 0, y = 0, anchor = 'middle';
    if (Math.abs(cos) > 0.55) {
      anchor = cos > 0 ? 'start' : 'end';
      x = (n.r + 5) * Math.sign(cos);
      y = 3.5 + sin * 4;
    } else y = sin > 0 ? n.r + 12 : -(n.r + 5);
    n.text.setAttribute('x', x.toFixed(1));
    n.text.setAttribute('y', y.toFixed(1));
    if (n.text.getAttribute('text-anchor') !== anchor) n.text.setAttribute('text-anchor', anchor);
  }

  /* ---------- Painting data ---------- */

  function setLabel(n: GNode, main: string, extra?: string) {
    n.text.textContent = main;
    if (extra) {
      const t = el('tspan', { class: 'ig-pct', dx: 4 });
      t.textContent = extra;
      n.text.appendChild(t);
    }
  }

  function paint() {
    wrap.classList.toggle('ig-agg', mode === 'aggregate');
    for (const b of seg.querySelectorAll<HTMLButtonElement>('button')) {
      const on = b.dataset.mode === mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
      if (b.dataset.mode === 'aggregate') b.disabled = !population;
    }
    if (mode === 'aggregate' && population) paintPopulation(population);
    else paintVisitor();
    for (const l of links) l.line.style.setProperty('--w', String(l.w));
    paintFocus();
    renderPanel();
    reheat(0.12);
  }

  function paintVisitor() {
    const v = visitor;
    const detail = v?.detail;
    const matchedArch = detail?.archetype.archetype ?? null;
    const nearestArch = detail?.archetype.nearest ?? null;
    wrap.classList.toggle('ig-has-match', !!matchedArch);

    const views = detail?.views ?? 0;
    hub.label = labels.visitor;
    setLabel(hub, labels.visitor);
    hubNum.textContent = String(views);
    hubCap.textContent = views === 1 ? 'view' : 'views';
    progress(detail?.ready ? 1 : Math.min(1, views / Math.max(1, config.minViews)), !!detail?.ready);
    hub.g.classList.toggle('is-ready', !!detail?.ready);

    for (const n of nodes) {
      if (n.kind === 'category') {
        const aud = detail?.audiences.find((a) => a.category === n.cat)?.audience ?? null;
        n.g.classList.toggle('is-aud', !!aud);
        setLabel(n, n.label);
        n.g.style.setProperty('--o', '1');
      } else if (n.kind === 'attribute') {
        const s = v?.norm[n.cat!]?.[n.attr!] ?? 0;
        const res = detail?.audiences.find((a) => a.category === n.cat);
        const isAud = res?.audience === n.attr;
        n.tr = 5 + 13 * s;
        n.g.style.setProperty('--o', (0.28 + 0.72 * s).toFixed(3));
        n.g.classList.toggle('is-aud', isAud);
        n.g.classList.toggle('is-nearest', !isAud && s > 0 && res?.nearest === n.attr);
        setLabel(n, n.label);
      } else if (n.kind === 'archetype') {
        const fit = v?.arch.get(n.arch!);
        const hasSignal = !!v && Object.values(v.norm).some(Boolean);
        const close = hasSignal && fit ? 1 / (1 + fit.distance / config.archetypeRadius ** 2) : 0;
        n.tr = 11 + 12 * close;
        n.g.classList.toggle('is-match', matchedArch === n.arch);
        n.g.classList.toggle('is-nearest', !matchedArch && hasSignal && nearestArch === n.arch);
        n.g.style.setProperty('--o', matchedArch && matchedArch !== n.arch ? '0.35' : (0.55 + 0.45 * close).toFixed(3));
        setLabel(n, n.label);
      }
      ariaFor(n);
    }
    for (const l of links) {
      if (l.kind === 'print') {
        l.line.classList.toggle('is-lit', l.arch === matchedArch);
        l.line.classList.toggle('is-hint', !matchedArch && l.arch === nearestArch && !!v && Object.values(v.norm).some(Boolean));
      } else if (l.kind === 'orbit') {
        const s = v?.norm[l.target.cat!]?.[l.target.attr!] ?? 0;
        l.line.style.setProperty('--s', s.toFixed(3));
      }
    }
  }

  function paintPopulation(pop: Population) {
    wrap.classList.remove('ig-has-match');
    const size = Math.max(1, pop.size);
    hub.label = labels.population;
    setLabel(hub, labels.population);
    hubNum.textContent = String(pop.size);
    hubCap.textContent = 'visitors';
    progress(1 - pop.unmatched / size, true);
    hub.g.classList.add('is-ready');

    const topArch = Object.entries(pop.archetypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    for (const n of nodes) {
      if (n.kind === 'category') {
        n.g.classList.remove('is-aud');
        setLabel(n, n.label);
        n.g.style.setProperty('--o', '1');
      } else if (n.kind === 'attribute') {
        const counts = pop.audienceCounts[n.cat!] ?? {};
        const share = (counts[n.attr!] ?? 0) / size;
        const top = Math.max(0, ...Object.values(counts));
        n.tr = 5 + 26 * Math.sqrt(share);
        n.g.style.setProperty('--o', (0.4 + 0.6 * Math.min(1, share * 3)).toFixed(3));
        n.g.classList.toggle('is-aud', top > 0 && counts[n.attr!] === top);
        n.g.classList.remove('is-nearest');
        setLabel(n, n.label, pct(share));
      } else if (n.kind === 'archetype') {
        const share = (pop.archetypeCounts[n.arch!] ?? 0) / size;
        n.tr = 10 + 28 * Math.sqrt(share);
        n.g.style.setProperty('--o', (0.5 + 0.5 * Math.min(1, share * 4)).toFixed(3));
        n.g.classList.toggle('is-match', n.arch === topArch && share > 0);
        n.g.classList.remove('is-nearest');
        setLabel(n, n.label, pct(share));
      }
      ariaFor(n);
    }
    for (const l of links) {
      l.line.classList.remove('is-lit', 'is-hint');
      if (l.kind === 'orbit') {
        const share = (pop.audienceCounts[l.target.cat!]?.[l.target.attr!] ?? 0) / size;
        l.line.style.setProperty('--s', Math.min(1, share * 2.5).toFixed(3));
      }
    }
  }

  function progress(share: number, ready: boolean) {
    const c = 2 * Math.PI * 37;
    hubRing.style.strokeDasharray = `${(c * clamp(share, 0, 1)).toFixed(1)} ${c.toFixed(1)}`;
    hubRing.classList.toggle('is-ready', ready);
  }

  function ariaFor(n: GNode) {
    const bits = [n.label];
    if (n.kind === 'category') {
      const aud = mode === 'visitor' ? visitor?.detail.audiences.find((a) => a.category === n.cat)?.audience : null;
      bits.push('category', aud ? `audience ${attrLabel(n.cat!, aud)}` : 'no audience', collapsed.has(n.cat!) ? 'folded' : 'expanded');
      n.g.setAttribute('aria-expanded', String(!collapsed.has(n.cat!)));
    } else if (n.kind === 'attribute') {
      bits.push(`${catLabel(n.cat!)} attribute`, tipValue(n));
    } else if (n.kind === 'archetype') {
      bits.push('archetype', tipValue(n));
    }
    if (n.kind !== 'hub') n.g.setAttribute('aria-label', bits.filter(Boolean).join(', '));
    if (n.kind !== 'hub' && n.kind !== 'category') n.g.setAttribute('aria-pressed', String(selected === n));
  }

  /* ---------- Selection and drill-down ---------- */

  function neighbors(n: GNode): Set<GNode> {
    const out = new Set<GNode>([n]);
    for (const l of links) {
      if (l.kind === 'spoke') continue;
      if (l.source === n) out.add(l.target);
      if (l.target === n) out.add(l.source);
    }
    return out;
  }

  function paintFocus() {
    const near = selected ? neighbors(selected) : null;
    wrap.classList.toggle('ig-focus', !!selected);
    for (const n of nodes) {
      n.g.classList.toggle('is-sel', n === selected);
      n.g.classList.toggle('is-near', !!near?.has(n));
    }
    for (const l of links) l.line.classList.toggle('is-near', !!selected && (l.source === selected || l.target === selected));
    renderCrumbs();
  }

  function select(n: GNode | null) {
    selected = n && (n.kind === 'attribute' || n.kind === 'archetype') ? n : null;
    hideTip();
    paintFocus();
    renderPanel();
    for (const x of nodes) ariaFor(x);
  }

  function toggleCategory(cid: string) {
    const folding = !collapsed.has(cid);
    const cn = nodeById.get(`c:${cid}`)!;
    if (folding) {
      collapsed.add(cid);
      if (selected?.cat === cid && selected.kind === 'attribute') selected = null;
    } else {
      collapsed.delete(cid);
      // Bloom the attributes out from their category.
      for (const n of nodes) {
        if (n.kind !== 'attribute' || n.cat !== cid) continue;
        n.x = cn.x! + (Math.random() - 0.5) * 8;
        n.y = cn.y! + (Math.random() - 0.5) * 8;
        n.vx = n.vy = 0;
        n.r = 0;
      }
    }
    for (const n of nodes) if (n.kind === 'attribute' && n.cat === cid) n.g.toggleAttribute('hidden', folding);
    cn.g.classList.toggle('is-folded', folding);
    const count = catById.get(cid)!.attributes.length;
    cn.g.querySelector('.ig-cat-count')!.textContent = folding ? `+${count}` : String(count);
    rebuildGraph();
    paint();
    reheat(0.5);
  }

  function activate(n: GNode) {
    if (n.kind === 'category') toggleCategory(n.cat!);
    else if (n.kind === 'hub') select(null);
    else select(selected === n ? null : n);
  }

  function centerOn(n: GNode) {
    userMoved = true;
    viewGoal = { k: view.k, x: -(n.x ?? 0) * view.k, y: -(n.y ?? 0) * view.k };
    if (reduce) { Object.assign(view, viewGoal); viewGoal = null; }
    kick();
  }

  function renderCrumbs() {
    const parts = [`<button type="button" data-crumb="root"${selected ? '' : ' aria-current="true"'}>Overview</button>`];
    if (selected?.kind === 'attribute') {
      parts.push(`<button type="button" data-crumb="cat">${esc(catLabel(selected.cat!))}</button>`);
      parts.push(`<span aria-current="true">${esc(selected.label)}</span>`);
    } else if (selected?.kind === 'archetype') {
      parts.push(`<span>Archetypes</span>`, `<span aria-current="true">${esc(selected.label)}</span>`);
    }
    crumbs.innerHTML = parts.join('<i aria-hidden="true">/</i>');
  }

  /* ---------- Details panel ---------- */

  function row(k: string, v: string) {
    return `<div class="ig-row"><dt>${k}</dt><dd>${v}</dd></div>`;
  }
  function bar(share: number, label: string, value: string, hue?: number) {
    const style = hue === undefined ? '' : ` style="--hue: var(--ig-c${(hue % 5) + 1})"`;
    return `<li${style}><span class="ig-bar-label">${label}</span><span class="ig-bar-val">${value}</span><i style="--v:${clamp(share, 0, 1).toFixed(3)}"></i></li>`;
  }

  function renderPanel() {
    const n = selected;
    if (!n) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }
    panel.hidden = false;
    const kicker = n.kind === 'attribute' ? `Audience · ${esc(catLabel(n.cat!))}` : 'Archetype';
    const body = n.kind === 'attribute' ? attributeBody(n) : archetypeBody(n);
    panel.style.setProperty('--hue', `var(--ig-c${(n.hue % 5) + 1})`);
    panel.className = `ig-panel ig-panel-${n.kind}`;
    panel.innerHTML = `
      <header>
        <span class="ig-kicker">${kicker}</span>
        <button type="button" class="ig-close" data-act="back" aria-label="Back to overview">Back</button>
      </header>
      <h3>${esc(n.label)}</h3>
      ${body}`;
  }

  function attributeBody(n: GNode): string {
    const cat = n.cat!, attr = n.attr!;
    const cl = esc(catLabel(cat));
    const about = `<p class="ig-about">Visitors land in this audience when their ${cl} signal leans clearly toward ${esc(n.label)}.</p>`;
    const targeting = config.archetypes.filter((a) => (a.fingerprint[cat]?.[attr] ?? 0) > 0);

    if (mode === 'aggregate' && population) {
      const count = population.audienceCounts[cat]?.[attr] ?? 0;
      const share = count / Math.max(1, population.size);
      return `${about}<dl>${row('Visitors in it', `${pct(share)} <small>${count} of ${population.size}</small>`)}${row(
        'Targeted by',
        targeting.length ? targeting.map((a) => esc(a.label ?? a.id)).join(', ') : 'No archetype',
      )}</dl>`;
    }

    const v = visitor;
    const s = v?.norm[cat]?.[attr] ?? 0;
    const raw = v?.state ? v.state.scores[cat]?.[attr] ?? 0 : 0;
    const res = v?.detail.audiences.find((a) => a.category === cat);
    const status = !v || !v.detail.ready
      ? `Warming up (${v?.detail.views ?? 0} of ${config.minViews} views)`
      : res?.audience === attr ? '<b class="ig-yes">Matched</b>'
      : res?.nearest === attr ? `Nearest, outside radius (${num(res.distance)} > ${num(config.audienceRadius ** 2)})`
      : res?.audience ? `No, ${esc(attrLabel(cat, res.audience))} wins` : 'No';

    // Contribution to the matched (or nearest) archetype's mean distance.
    const archId = v?.detail.archetype.archetype ?? v?.detail.archetype.nearest ?? null;
    let contrib = 'n/a';
    if (archId && v) {
      const fit = v.arch.get(archId)!;
      const part = fit.parts.find((p) => p.category === cat);
      const name = esc(archById.get(archId)?.label ?? archId);
      if (!part) contrib = `${name} ignores ${cl} (any)`;
      else {
        const c = part.contributions.find((x) => x.attribute === attr)!;
        contrib = `+${num(c.value / fit.parts.length)} of ${num(fit.distance)} to ${name} <small>target ${num(c.target)}</small>`;
      }
    }
    return `${about}<div class="ig-meter" style="--v:${s.toFixed(3)}"><span>Score</span><b>${num(s)}</b><i></i></div><dl>${row('Raw signal', num(raw))}${row(
      'Audience',
      status,
    )}${row('Archetype distance', contrib)}</dl>`;
  }

  function archetypeBody(n: GNode): string {
    const a = archById.get(n.arch!)!;
    const named = Object.keys(a.fingerprint).filter((cid) => catById.has(cid));
    const any = config.categories.filter((c) => !named.includes(c.id)).map((c) => esc(c.label ?? c.id));
    const about = `<p class="ig-about">A fingerprint across ${named.length} ${named.length === 1 ? 'category' : 'categories'}${
      any.length ? `. Any ${any.join(', ')}` : ''
    }.</p>`;
    const print = `<ul class="ig-bars">${named
      .flatMap((cid) =>
        Object.entries(a.fingerprint[cid])
          .filter(([, t]) => t > 0)
          .map(([aid, t]) => {
            const vs = mode === 'visitor' ? visitor?.norm[cid]?.[aid] ?? 0 : null;
            return bar(t, `${esc(catLabel(cid))}: ${esc(attrLabel(cid, aid))}`, vs === null ? `target ${num(t)}` : `${num(vs)} / ${num(t)}`, catById.get(cid)!.index);
          }),
      )
      .join('')}</ul>`;

    if (mode === 'aggregate' && population) {
      const count = population.archetypeCounts[a.id] ?? 0;
      const share = count / Math.max(1, population.size);
      const co = Object.entries(population.coOccurrence[a.id] ?? {}).sort((x, y) => y[1] - x[1]).slice(0, 5);
      const list = co.length
        ? `<h4>Top audiences alongside it</h4><ul class="ig-bars">${co
            .map(([key, c]) => {
              const [cid, aid] = key.split('.');
              return bar(c / Math.max(1, count), `${esc(catLabel(cid))}: ${esc(attrLabel(cid, aid))}`, pct(c / Math.max(1, count)), catById.get(cid)?.index);
            })
            .join('')}</ul>`
        : '<p class="ig-about">No visitors matched it in this sample.</p>';
      return `${about}<dl>${row('Visitors matched', `${pct(share)} <small>${count} of ${population.size}</small>`)}</dl>${list}<h4>Fingerprint</h4>${print}`;
    }

    const v = visitor;
    const fit = v?.arch.get(a.id);
    const r2 = config.archetypeRadius ** 2;
    const status = !v || !Object.values(v.norm).some(Boolean) ? 'No signal yet'
      : v.detail.archetype.archetype === a.id ? '<b class="ig-yes">Matched</b>'
      : !v.detail.ready && v.detail.archetype.nearest === a.id ? `Nearest, warming up (${v.detail.views} of ${config.minViews})`
      : v.detail.archetype.nearest === a.id ? 'Nearest, outside radius'
      : 'Not nearest';
    return `${about}<dl>${row('Status', status)}${row('Mean distance', `${num(fit?.distance ?? Infinity)} <small>match at ≤ ${num(r2)}</small>`)}</dl><h4>Fingerprint · you / target</h4>${print}`;
  }

  /* ---------- Tooltip ---------- */

  function tipValue(n: GNode): string {
    if (mode === 'aggregate' && population) {
      const size = Math.max(1, population.size);
      if (n.kind === 'attribute') return `${pct((population.audienceCounts[n.cat!]?.[n.attr!] ?? 0) / size)} of visitors`;
      if (n.kind === 'archetype') return `${pct((population.archetypeCounts[n.arch!] ?? 0) / size)} of visitors matched`;
      return '';
    }
    if (n.kind === 'attribute') {
      const s = visitor?.norm[n.cat!]?.[n.attr!] ?? 0;
      const aud = visitor?.detail.audiences.find((a) => a.category === n.cat)?.audience === n.attr;
      return `score ${num(s)}${aud ? ', matched audience' : ''}`;
    }
    if (n.kind === 'archetype') {
      if (visitor?.detail.archetype.archetype === n.arch) return 'matched';
      const d = visitor?.arch.get(n.arch!)?.distance;
      return visitor && Object.values(visitor.norm).some(Boolean) && d !== undefined ? `distance ${num(d)}` : 'no signal yet';
    }
    return '';
  }

  function showTip(n: GNode) {
    if (dragging) return;
    let head = esc(n.label);
    let body = '';
    if (n.kind === 'hub') body = mode === 'aggregate' && population ? `${pct(1 - population.unmatched / Math.max(1, population.size))} matched an archetype` : `${visitor?.detail.views ?? 0} tagged views`;
    else if (n.kind === 'category') {
      const aud = mode === 'visitor' ? visitor?.detail.audiences.find((a) => a.category === n.cat)?.audience : null;
      body = `${aud ? `Audience: ${esc(attrLabel(n.cat!, aud))}` : 'No audience yet'} · click to ${collapsed.has(n.cat!) ? 'unfold' : 'fold'}`;
    } else {
      head = `${esc(n.label)}${n.kind === 'attribute' ? ` <span>${esc(catLabel(n.cat!))}</span>` : ''}`;
      body = tipValue(n);
    }
    tip.innerHTML = `<b>${head}</b>${body ? `<span class="ig-tip-body">${body}</span>` : ''}`;
    tip.hidden = false;
    const sr = stage.getBoundingClientRect();
    const nr = n.shape.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const x = clamp(nr.left + nr.width / 2 - sr.left - tw / 2, 6, sr.width - tw - 6);
    const above = nr.top - sr.top - tip.offsetHeight - 8;
    tip.style.transform = `translate(${x}px, ${above > 4 ? above : nr.bottom - sr.top + 8}px)`;
  }

  function hideTip() {
    tip.hidden = true;
  }

  /* ---------- Pointer interaction ---------- */

  let press: { node: GNode; id: number; sx: number; sy: number; moved: boolean; wasPinned: boolean } | null = null;

  function onNodeDown(e: PointerEvent, n: GNode) {
    if (n.kind === 'hub' || e.button > 0) return; // the hub behaves like background: it pans
    e.stopPropagation();
    n.g.setPointerCapture(e.pointerId);
    press = { node: n, id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, wasPinned: n.pinned };
  }

  function onNodeMove(e: PointerEvent) {
    if (!press || e.pointerId !== press.id) return;
    const n = press.node;
    if (!press.moved && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < DRAG_SLOP) return;
    if (!press.moved) {
      press.moved = true;
      dragging = n;
      hideTip();
      wrap.classList.add('ig-dragging');
      sim.alphaTarget(0.25);
    }
    const [x, y] = toSim(e.clientX, e.clientY);
    n.fx = x;
    n.fy = y;
    kick();
  }

  function onNodeUp(e: PointerEvent) {
    if (!press || e.pointerId !== press.id) return;
    const { node: n, moved } = press;
    press = null;
    if (moved) {
      // Dropped nodes stay pinned where they land; double-click releases them.
      n.pinned = true;
      n.g.classList.add('is-pinned');
      dragging = null;
      wrap.classList.remove('ig-dragging');
      sim.alphaTarget(0);
      if (reduce) settle();
      kick();
    } else if (e.type === 'pointerup') activate(n);
  }

  function unpin(n: GNode) {
    if (n.kind === 'hub') return;
    n.fx = n.fy = null;
    n.pinned = false;
    n.g.classList.remove('is-pinned');
    reheat(0.3);
  }

  const pointers = new Map<number, [number, number]>();
  let gesture: { k: number; x: number; y: number; dist: number; mid: [number, number]; tap: boolean; sx: number; sy: number } | null = null;

  function startGesture() {
    const pts = [...pointers.values()];
    const mid: [number, number] = pts.length > 1 ? [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2] : pts[0];
    const dist = pts.length > 1 ? Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) : 0;
    gesture = { ...view, dist, mid, tap: pts.length === 1 && !gesture, sx: mid[0], sy: mid[1] };
  }

  function onBgDown(e: PointerEvent) {
    if (e.button > 0) return;
    svg.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, toBox(e.clientX, e.clientY));
    viewGoal = null;
    startGesture();
    wrap.classList.add('ig-panning');
  }

  function onBgMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId) || !gesture) return;
    pointers.set(e.pointerId, toBox(e.clientX, e.clientY));
    const pts = [...pointers.values()];
    const g = gesture;
    if (pts.length > 1) {
      const mid: [number, number] = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
      const dist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
      const k = clamp(g.k * (dist / Math.max(1, g.dist)), MIN_K, MAX_K);
      view.k = k;
      view.x = mid[0] - ((g.mid[0] - g.x) * k) / g.k;
      view.y = mid[1] - ((g.mid[1] - g.y) * k) / g.k;
      g.tap = false;
    } else {
      const [x, y] = pts[0];
      if (Math.hypot(x - g.sx, y - g.sy) > DRAG_SLOP) g.tap = false;
      view.x = g.x + (x - g.mid[0]);
      view.y = g.y + (y - g.mid[1]);
    }
    userMoved = true;
    kick();
  }

  function onBgUp(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    const tap = gesture?.tap && e.type === 'pointerup';
    if (pointers.size) startGesture();
    else {
      gesture = null;
      wrap.classList.remove('ig-panning');
      if (tap) select(null);
    }
  }

  function onWheel(e: WheelEvent) {
    // Plain scrolling belongs to the page. Pinch (reported as ctrl+wheel) or Ctrl/Cmd+scroll zooms.
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? h : 1;
    const [px, py] = toBox(e.clientX, e.clientY);
    zoomAt(px, py, Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0015)));
  }

  function onNodeKey(e: KeyboardEvent, n: GNode) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(n);
    }
  }

  function onRootKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && selected) {
      const back = selected;
      select(null);
      back.g.focus();
    }
  }

  function onClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    const m = t.closest<HTMLButtonElement>('button[data-mode]');
    if (m && !m.disabled) handle.setMode(m.dataset.mode as GraphMode);
    const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (act === 'reset') resetView();
    if (act === 'back') {
      const back = selected;
      select(null);
      back?.g.focus();
    }
    const crumb = t.closest<HTMLElement>('[data-crumb]')?.dataset.crumb;
    if (crumb === 'root') select(null);
    if (crumb === 'cat' && selected?.cat) centerOn(nodeById.get(`c:${selected.cat}`)!);
  }

  svg.addEventListener('pointerdown', onBgDown);
  svg.addEventListener('pointermove', onBgMove);
  svg.addEventListener('pointerup', onBgUp);
  svg.addEventListener('pointercancel', onBgUp);
  svg.addEventListener('wheel', onWheel, { passive: false });
  nodeG.addEventListener('pointermove', onNodeMove);
  nodeG.addEventListener('pointerup', onNodeUp);
  nodeG.addEventListener('pointercancel', onNodeUp);
  wrap.addEventListener('keydown', onRootKey);
  wrap.addEventListener('click', onClick);

  const onMotion = () => {
    reduce = motion.matches;
    wrap.classList.toggle('ig-reduce', reduce);
  };
  motion.addEventListener('change', onMotion);
  onMotion();

  const resize = new ResizeObserver(() => {
    measure();
    if (!userMoved) resetView(false);
    render();
  });
  resize.observe(svg);

  /* ---------- Start ---------- */

  rebuildGraph();
  for (let i = 0; i < 180; i++) sim.tick();
  measure();
  paint();
  if (reduce) settle();
  resetView(false);
  render();
  kick();

  const handle: GraphHandle = {
    showVisitor(state, detail) {
      const norm: Record<string, Scores | null> = {};
      for (const c of config.categories) norm[c.id] = normalize(state?.scores[c.id], c.attributes);
      visitor = { state, detail, norm, arch: archetypeFits(config, norm) };
      if (mode === 'visitor') paint();
    },
    showPopulation(pop) {
      population = pop;
      paint();
    },
    setMode(next) {
      if (next === 'aggregate' && !population) return;
      if (next === mode) return;
      mode = next;
      paint();
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      sim.stop();
      resize.disconnect();
      motion.removeEventListener('change', onMotion);
      wrap.remove();
    },
  };
  return handle;
}
