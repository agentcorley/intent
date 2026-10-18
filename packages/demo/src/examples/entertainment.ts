// Entertainment: a fictional theme park and resort with hotels, seasonal
// events, and group sales. Sixteen pages, four archetypes.

import type { Example } from './types.ts';

const example: Example = {
  id: 'entertainment',
  industry: 'Entertainment',
  brand: 'Starfall Bay Park & Resort',
  domain: 'starfallbay.example',
  config: {
    minViews: 3,
    halfLifeDays: 21,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'party',
        label: 'Party Type',
        attributes: [
          { id: 'young-family', label: 'Young Family' },
          { id: 'teens', label: 'Teens' },
          { id: 'thrill-seekers', label: 'Thrill Seekers' },
          { id: 'adults', label: 'Adults' },
          { id: 'groups', label: 'Groups' },
        ],
      },
      {
        id: 'ticket',
        label: 'Ticket Product',
        attributes: [
          { id: 'day', label: 'Day Ticket' },
          { id: 'multi-day', label: 'Multi-Day Ticket' },
          { id: 'annual-pass', label: 'Annual Pass' },
          { id: 'vip', label: 'VIP Experience' },
        ],
      },
      {
        id: 'addons',
        label: 'Add-Ons',
        attributes: [
          { id: 'dining', label: 'Dining' },
          { id: 'hotel', label: 'Resort Hotel' },
          { id: 'express', label: 'Express Pass' },
        ],
      },
      {
        id: 'timing',
        label: 'Visit Timing',
        attributes: [
          { id: 'summer', label: 'Summer' },
          { id: 'holiday', label: 'Holiday Season' },
          { id: 'off-peak', label: 'Weekday Off-Peak' },
          { id: 'event-nights', label: 'Event Nights' },
        ],
      },
      {
        id: 'stage',
        label: 'Trip Stage',
        attributes: [
          { id: 'dream', label: 'Dream' },
          { id: 'plan', label: 'Plan' },
          { id: 'book', label: 'Book' },
          { id: 'visit', label: 'In Park' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'resort-family',
        label: 'Young Family Planning a Resort Stay',
        fingerprint: {
          party: { 'young-family': 1 },
          ticket: { 'multi-day': 1 },
          addons: { hotel: 1, dining: 0.8 },
          stage: { plan: 1, book: 0.6 },
        },
      },
      {
        id: 'thrill-pass-holder',
        label: 'Local Thrill Seeker, Pass Ready',
        fingerprint: {
          party: { 'thrill-seekers': 1, teens: 0.5 },
          ticket: { 'annual-pass': 1 },
          addons: { express: 1 },
        },
      },
      {
        id: 'event-night-couple',
        label: 'Adults Booking an Event Night',
        fingerprint: {
          party: { adults: 1 },
          ticket: { vip: 1, day: 0.3 },
          addons: { dining: 1, express: 0.5 },
          timing: { 'event-nights': 1 },
        },
      },
      {
        id: 'off-peak-group',
        label: 'Weekday Group Organizer',
        fingerprint: {
          party: { groups: 1 },
          ticket: { day: 1 },
          timing: { 'off-peak': 1 },
        },
      },
    ],
  },
  content: [
    { id: 'resort-hotels', type: 'Hotel', title: 'Stay inside the gates: three resort hotels', minutes: 5 },
    { id: 'multi-day', type: 'Tickets', title: 'Multi-day tickets: more park, lower daily price', minutes: 3 },
    { id: 'little-explorers', type: 'Guide', title: 'Little Explorers Cove: rides for kids under 48 inches', minutes: 6 },
    { id: 'character-breakfast', type: 'Dining', title: 'Character breakfast at the Lighthouse Inn', minutes: 3 },
    { id: 'day-planner', type: 'Tool', title: 'Plan your day: height guide, nap spots, strollers', minutes: 6 },
    { id: 'coasters', type: 'Guide', title: 'Every coaster, ranked by drop, speed, and nerve', minutes: 7 },
    { id: 'stormwake', type: 'Story', title: 'Opening summer 2027: Stormwake, our tallest coaster', minutes: 4 },
    { id: 'annual-pass', type: 'Tickets', title: 'Annual passes: compare three levels', minutes: 4 },
    { id: 'express', type: 'Add-on', title: 'Express Pass: skip the regular line', minutes: 2 },
    { id: 'vip-tour', type: 'Experience', title: 'VIP guided tour with reserved show seating', minutes: 3 },
    { id: 'harvest-nights', type: 'Event', title: 'Harvest Food and Wine Nights, Fridays in October', minutes: 4 },
    { id: 'lantern-nights', type: 'Event', title: 'Lantern Nights: after-dark event tickets', minutes: 3 },
    { id: 'winter-lights', type: 'Event', title: 'Winter Lights, November 20–January 3', minutes: 3 },
    { id: 'group-tickets', type: 'Tickets', title: 'Group tickets for parties of 15 or more', minutes: 3 },
    { id: 'school-days', type: 'Program', title: 'Weekday school and youth group days', minutes: 5 },
    { id: 'company-outings', type: 'Program', title: 'Company picnics and private park buyouts', minutes: 5 },
  ],
  tags: {
    'resort-hotels': { party: { 'young-family': 0.6, adults: 0.3 }, ticket: { 'multi-day': 0.5 }, addons: { hotel: 1 }, stage: { plan: 0.8 } },
    'multi-day': { party: { 'young-family': 0.5 }, ticket: { 'multi-day': 1 }, stage: { plan: 0.6, book: 0.5 } },
    'little-explorers': { party: { 'young-family': 1 }, stage: { dream: 0.6, plan: 0.4 } },
    'character-breakfast': { party: { 'young-family': 1 }, addons: { dining: 1 }, stage: { book: 0.6 } },
    'day-planner': { party: { 'young-family': 1 }, stage: { plan: 1, visit: 0.4 } },
    coasters: { party: { 'thrill-seekers': 1, teens: 0.6 }, stage: { dream: 0.8 } },
    stormwake: { party: { 'thrill-seekers': 1, teens: 0.5 }, timing: { summer: 0.7 }, stage: { dream: 0.8 } },
    'annual-pass': { party: { 'thrill-seekers': 0.4, 'young-family': 0.3 }, ticket: { 'annual-pass': 1 }, stage: { plan: 0.4, book: 0.6 } },
    express: { party: { 'thrill-seekers': 0.6, teens: 0.4 }, addons: { express: 1 }, stage: { book: 0.6 } },
    'vip-tour': { party: { adults: 0.6, groups: 0.3 }, ticket: { vip: 1 }, addons: { express: 0.6 }, stage: { book: 0.5 } },
    'harvest-nights': { party: { adults: 1 }, addons: { dining: 1 }, timing: { 'event-nights': 1 }, stage: { dream: 0.5 } },
    'lantern-nights': { party: { adults: 0.6, teens: 0.5 }, ticket: { day: 0.4 }, timing: { 'event-nights': 1 }, stage: { book: 0.6 } },
    'winter-lights': { party: { 'young-family': 0.5, adults: 0.4 }, timing: { holiday: 1 }, stage: { dream: 0.6 } },
    'group-tickets': { party: { groups: 1 }, ticket: { day: 0.8 }, timing: { 'off-peak': 0.6 }, stage: { book: 0.7 } },
    'school-days': { party: { groups: 1, teens: 0.5 }, ticket: { day: 0.6 }, timing: { 'off-peak': 1 }, stage: { plan: 0.6 } },
    'company-outings': { party: { groups: 1, adults: 0.5 }, addons: { dining: 0.6 }, timing: { 'off-peak': 0.6 }, stage: { plan: 0.6 } },
  },
  hero: {
    default: {
      eyebrow: 'Starfall Bay Park & Resort',
      headline: 'A whole coastline of rides and stories.',
      sub: 'Coasters, gentle rides for little ones, seasonal events, and three resort hotels inside the gates.',
      cta: 'Buy tickets',
    },
    archetypes: {
      'resort-family': {
        eyebrow: 'Family resort stays',
        headline: 'Naps at the hotel, rides by lunch.',
        sub: 'Stay inside the gates, walk back for nap time, and add a character breakfast to your multi-day package.',
        cta: 'Build a family package',
      },
      'thrill-pass-holder': {
        eyebrow: 'Stormwake opens summer 2027',
        headline: 'Ride it first with a pass.',
        sub: 'Pass holders get preview nights for Stormwake, plus Express Pass discounts on every coaster all year.',
        cta: 'Compare annual passes',
      },
      'event-night-couple': {
        eyebrow: 'Harvest Food and Wine Nights',
        headline: 'Fridays in October, reserved for grown-ups.',
        sub: 'Tasting stations, live music, and a VIP table with reserved show seating. Express access included.',
        cta: 'Reserve a VIP night',
      },
      'off-peak-group': {
        eyebrow: 'Groups of 15 or more',
        headline: 'Weekday visits, priced for groups.',
        sub: 'School, youth, and company groups get weekday rates, one coordinator, and meal vouchers billed on one invoice.',
        cta: 'Request group pricing',
      },
    },
    audiences: {
      party: {
        'young-family': { eyebrow: 'For little explorers', headline: 'Rides sized for the smallest guests.' },
        'thrill-seekers': { eyebrow: 'For thrill seekers', headline: 'Taller, faster, and steeper every season.' },
        teens: { eyebrow: 'Bring the crew' },
        adults: { eyebrow: 'Grown-up evenings', headline: 'Food, wine, and the park after dark.' },
        groups: { eyebrow: 'Group visits', cta: 'Get group pricing' },
      },
      addons: {
        hotel: { sub: 'Resort guests enter 30 minutes early and walk back to the room any time.', cta: 'See resort hotels' },
        express: { sub: 'Add Express Pass and skip the regular line on headline rides.', cta: 'Add Express Pass' },
        dining: { sub: 'Reserve character breakfasts and sit-down dinners up to 60 days ahead.' },
      },
      timing: {
        holiday: { headline: 'Winter Lights, November 20–January 3.' },
        'event-nights': { cta: 'See event nights' },
      },
    },
  },
  scenarios: [
    { id: 'family', label: 'Young family', path: ['little-explorers', 'resort-hotels', 'character-breakfast', 'multi-day'], expects: 'resort-family' },
    { id: 'thrill', label: 'Thrill seeker', path: ['coasters', 'stormwake', 'express', 'annual-pass'], expects: 'thrill-pass-holder' },
    { id: 'date-night', label: 'Date night', path: ['harvest-nights', 'lantern-nights', 'vip-tour'], expects: 'event-night-couple' },
    { id: 'group', label: 'Group outing', path: ['school-days', 'company-outings', 'group-tickets'], expects: 'off-peak-group' },
  ],
};

export default example;
