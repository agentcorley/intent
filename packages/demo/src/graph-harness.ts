// Dev harness for the intent graph: http://localhost:5173/graph.html
// Self-contained fixture (a fictional hotel brand) so it never depends on the
// example files. Wires the graph exactly the way main.ts should.

import { loadConfig } from '../../config/src/index.ts';
import { createTracker, memoryStorage, MATCH_EVENT, type MatchDetail } from '../../tracker/src/index.ts';
import { createIntentGraph, type GraphHandle } from './graph.ts';
import { simulatePopulation } from './population.ts';
import type { Example } from './examples/types.ts';

const copy = { eyebrow: 'Harbor & Pine', headline: 'Stay a little longer.', sub: 'Coastal hotels.', cta: 'Book' };

const fixture: Example = {
  id: 'harness-hotel',
  industry: 'Hospitality',
  brand: 'Harbor & Pine Hotels',
  domain: 'harborpine.example',
  config: {
    categories: [
      { id: 'trip', label: 'Trip Type', attributes: [
        { id: 'business', label: 'Business' }, { id: 'leisure', label: 'Leisure' },
        { id: 'family', label: 'Family' }, { id: 'event', label: 'Event' },
      ] },
      { id: 'stay', label: 'Stay Length', attributes: [
        { id: 'night', label: 'One night' }, { id: 'weekend', label: 'Weekend' }, { id: 'extended', label: 'Extended' },
      ] },
      { id: 'interest', label: 'Interest', attributes: [
        { id: 'dining', label: 'Dining' }, { id: 'spa', label: 'Spa' }, { id: 'meetings', label: 'Meetings' },
        { id: 'outdoors', label: 'Outdoors' }, { id: 'kids', label: 'Kids' },
      ] },
      { id: 'stage', label: 'Booking Stage', attributes: [
        { id: 'dreaming', label: 'Dreaming' }, { id: 'comparing', label: 'Comparing' }, { id: 'booking', label: 'Booking' },
      ] },
    ],
    archetypes: [
      { id: 'road-warrior', label: 'Road warrior', fingerprint: { trip: { business: 1 }, stay: { night: 1 }, interest: { meetings: 0.6 } } },
      { id: 'family-weekender', label: 'Family weekender', fingerprint: { trip: { family: 1 }, stay: { weekend: 1 }, interest: { kids: 1, outdoors: 0.5 } } },
      { id: 'spa-escape', label: 'Spa escape', fingerprint: { trip: { leisure: 1 }, interest: { spa: 1, dining: 0.5 } } },
      { id: 'event-planner', label: 'Event planner', fingerprint: { trip: { event: 1 }, interest: { meetings: 1 }, stage: { comparing: 0.6 } } },
    ],
    halfLifeDays: 7,
  },
  content: [
    { id: 'corporate-rates', type: 'Offer', title: 'Corporate rates', minutes: 2 },
    { id: 'meeting-rooms', type: 'Venue', title: 'Meeting rooms and AV', minutes: 4 },
    { id: 'wedding-lawn', type: 'Venue', title: 'Weddings on the lawn', minutes: 5 },
    { id: 'kids-club', type: 'Guide', title: 'Kids club', minutes: 3 },
    { id: 'family-suites', type: 'Rooms', title: 'Family suites', minutes: 3 },
    { id: 'trail-map', type: 'Guide', title: 'Coastal trail map', minutes: 6 },
    { id: 'spa-menu', type: 'Menu', title: 'Spa menu', minutes: 3 },
    { id: 'tasting-dinner', type: 'Dining', title: 'Chef’s tasting dinner', minutes: 4 },
    { id: 'extended-stay', type: 'Rooms', title: 'Extended stays', minutes: 3 },
    { id: 'express-checkin', type: 'Guide', title: 'Express check-in', minutes: 1 },
    { id: 'rfp', type: 'Request', title: 'Request a proposal', minutes: 2 },
    { id: 'book-weekend', type: 'Booking', title: 'Book a weekend', minutes: 2 },
    { id: 'spa-day-pass', type: 'Offer', title: 'Spa day pass', minutes: 2 },
  ],
  tags: {
    'corporate-rates': { trip: { business: 1 }, stay: { night: 0.6 }, interest: { meetings: 0.3 }, stage: { comparing: 0.5 } },
    'meeting-rooms': { trip: { event: 0.6, business: 0.5 }, interest: { meetings: 1 }, stage: { comparing: 0.4 } },
    'wedding-lawn': { trip: { event: 1 }, interest: { dining: 0.4 }, stage: { comparing: 0.5 } },
    'kids-club': { trip: { family: 1 }, interest: { kids: 1 }, stay: { weekend: 0.5 } },
    'family-suites': { trip: { family: 0.8 }, interest: { kids: 0.5 }, stay: { weekend: 0.6 }, stage: { comparing: 0.5 } },
    'trail-map': { trip: { leisure: 0.5, family: 0.4 }, interest: { outdoors: 1 }, stage: { dreaming: 0.6 } },
    'spa-menu': { trip: { leisure: 1 }, interest: { spa: 1 }, stage: { dreaming: 0.4 } },
    'tasting-dinner': { trip: { leisure: 0.6 }, interest: { dining: 1 }, stay: { weekend: 0.3 } },
    'extended-stay': { trip: { business: 0.6 }, stay: { extended: 1 }, stage: { comparing: 0.5 } },
    'express-checkin': { trip: { business: 0.8 }, stay: { night: 1 } },
    rfp: { trip: { event: 1 }, interest: { meetings: 0.8 }, stage: { booking: 1 } },
    'book-weekend': { trip: { leisure: 0.4, family: 0.4 }, stay: { weekend: 1 }, stage: { booking: 1 } },
    'spa-day-pass': { trip: { leisure: 0.6 }, interest: { spa: 0.8 }, stay: { night: 0.4 }, stage: { booking: 0.5 } },
  },
  hero: { default: copy, archetypes: {}, audiences: {} },
  scenarios: [
    { id: 'road', label: 'Road warrior', path: ['corporate-rates', 'express-checkin', 'meeting-rooms'], expects: 'road-warrior' },
    { id: 'family', label: 'Family trip', path: ['kids-club', 'family-suites', 'trail-map', 'book-weekend'], expects: 'family-weekender' },
    { id: 'spa', label: 'Spa escape', path: ['spa-menu', 'tasting-dinner', 'spa-day-pass'], expects: 'spa-escape' },
  ],
};

const DAY = 24 * 60 * 60 * 1000;
const config = loadConfig(fixture.config);
const $ = (sel: string) => document.querySelector(sel) as HTMLElement;

let offset = 0;
const tracker = createTracker({ config, tags: fixture.tags, storage: memoryStorage(), clock: () => Date.now() + offset, random: () => 1 });
const population = simulatePopulation(fixture, config);

let graph: GraphHandle;
function mount() {
  graph?.destroy();
  graph = createIntentGraph($('#graph'), { config });
  graph.showPopulation(population);
  graph.showVisitor(tracker.state(), tracker.matches());
}
mount();

// The integration main.ts needs: redraw the visitor on every match event.
document.addEventListener(MATCH_EVENT, (e) => {
  const d = (e as CustomEvent<MatchDetail>).detail;
  graph.showVisitor(tracker.state(), d);
  const aud = d.audiences.filter((a) => a.audience).map((a) => `${a.category}.${a.audience}`);
  $('#status').textContent = `views ${d.views} · ready ${d.ready} · archetype ${d.archetype.archetype ?? `none (nearest ${d.archetype.nearest ?? 'none'})`} · ${aud.join(' ') || 'no audiences'}`;
});

for (const s of fixture.scenarios) {
  const b = document.createElement('button');
  b.textContent = s.label;
  b.addEventListener('click', async () => {
    tracker.reset();
    offset = 0;
    for (const id of s.path) {
      read(id);
      await new Promise((r) => setTimeout(r, 450));
    }
  });
  $('#scenarios').appendChild(b);
}

for (const c of fixture.content) {
  const b = document.createElement('button');
  b.textContent = c.title;
  b.dataset.id = c.id;
  b.addEventListener('click', () => read(c.id));
  $('#content').appendChild(b);
}

function read(id: string) {
  // Step the clock past the 30-minute repeat window so every click counts.
  offset += 31 * 60 * 1000;
  tracker.view(id);
  $('#content').querySelector(`[data-id="${id}"]`)?.classList.add('read');
}

$('#ff').addEventListener('click', () => {
  offset += 7 * DAY;
  tracker.refresh();
});
$('#reset').addEventListener('click', () => {
  offset = 0;
  tracker.reset();
  for (const b of $('#content').querySelectorAll('button')) b.classList.remove('read');
});
$('#mode-v').addEventListener('click', () => graph.setMode('visitor'));
$('#mode-a').addEventListener('click', () => graph.setMode('aggregate'));
$('#remount').addEventListener('click', mount);

// Handy for poking at it from the console.
Object.assign(window, { graph, tracker, population, config });
