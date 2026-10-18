// Transportation: a fictional intercity rail operator with four corridors,
// passes, first class, and group sales. Sixteen pages, four archetypes.

import type { Example } from './types.ts';

const example: Example = {
  id: 'transportation',
  industry: 'Transportation',
  brand: 'Calder Rail',
  domain: 'calderrail.example',
  config: {
    minViews: 3,
    halfLifeDays: 14,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'rider',
        label: 'Rider Type',
        attributes: [
          { id: 'commuter', label: 'Commuter' },
          { id: 'leisure', label: 'Leisure' },
          { id: 'business', label: 'Business' },
          { id: 'student', label: 'Student' },
        ],
      },
      {
        id: 'product',
        label: 'Ticket Product',
        attributes: [
          { id: 'single', label: 'Single Ticket' },
          { id: 'pass', label: 'Monthly or Annual Pass' },
          { id: 'first-class', label: 'First Class' },
          { id: 'group', label: 'Group Ticket' },
        ],
      },
      {
        id: 'corridor',
        label: 'Route Corridor',
        attributes: [
          { id: 'harbor', label: 'Harbor Line' },
          { id: 'capital', label: 'Capital Line' },
          { id: 'lakes', label: 'Lakes Line' },
          { id: 'valley', label: 'Valley Line' },
        ],
      },
      {
        id: 'purpose',
        label: 'Trip Purpose',
        attributes: [
          { id: 'commute', label: 'Daily Commute' },
          { id: 'meeting', label: 'Meetings' },
          { id: 'getaway', label: 'Weekend Getaway' },
          { id: 'event', label: 'Game or Event' },
          { id: 'family-visit', label: 'Visiting Family' },
        ],
      },
      {
        id: 'stage',
        label: 'Trip Stage',
        attributes: [
          { id: 'plan', label: 'Plan' },
          { id: 'book', label: 'Book' },
          { id: 'ride', label: 'Ride' },
          { id: 'manage', label: 'Change or Refund' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'pass-ready-commuter',
        label: 'Commuter Ready for a Pass',
        fingerprint: {
          rider: { commuter: 1 },
          product: { pass: 1, single: 0.3 },
          purpose: { commute: 1 },
        },
      },
      {
        id: 'capital-business-traveler',
        label: 'Capital Line Business Traveler',
        fingerprint: {
          rider: { business: 1 },
          product: { 'first-class': 1 },
          corridor: { capital: 1 },
          purpose: { meeting: 1 },
        },
      },
      {
        id: 'car-free-weekender',
        label: 'Car-Free Weekender',
        fingerprint: {
          rider: { leisure: 1 },
          product: { single: 1 },
          purpose: { getaway: 1 },
          stage: { plan: 1, book: 0.6 },
        },
      },
      {
        id: 'group-event-organizer',
        label: 'Group Event Organizer',
        fingerprint: {
          product: { group: 1 },
          purpose: { event: 1 },
        },
      },
    ],
  },
  content: [
    { id: 'passes', type: 'Product', title: 'Monthly and annual passes', minutes: 3 },
    { id: 'pass-calc', type: 'Tool', title: 'Pass or pay as you go? Savings calculator', minutes: 3 },
    { id: 'harbor-times', type: 'Schedule', title: 'Harbor Line timetable, weekday peak', minutes: 2 },
    { id: 'capital-express', type: 'Route', title: 'Capital Line: hourly express, 6AM to 10PM', minutes: 3 },
    { id: 'first-class', type: 'Product', title: 'First class: a table, quiet car, and Wi-Fi', minutes: 3 },
    { id: 'corporate', type: 'Program', title: 'Corporate travel accounts with monthly billing', minutes: 5 },
    { id: 'lakes-weekend', type: 'Guide', title: 'Two nights in the Lakes, no car needed', minutes: 8 },
    { id: 'valley-day-trips', type: 'Guide', title: 'Valley Line day trips to wine country', minutes: 6 },
    { id: 'weekend-fares', type: 'Offer', title: 'Weekend fares from $19 each way', minutes: 2 },
    { id: 'student-fares', type: 'Product', title: 'Student fare card: a third off every trip', minutes: 3 },
    { id: 'holiday-travel', type: 'Guide', title: 'Getting home for the holidays: book early', minutes: 5 },
    { id: 'group-tickets', type: 'Product', title: 'Group tickets for parties of 10 or more', minutes: 3 },
    { id: 'game-day', type: 'Event', title: 'Game day trains to Riverside Stadium', minutes: 3 },
    { id: 'live-departures', type: 'Tool', title: 'Live departures and platform changes', minutes: 1 },
    { id: 'stations', type: 'Guide', title: 'Station guide: parking, bikes, and step-free access', minutes: 4 },
    { id: 'change-ticket', type: 'Service', title: 'Change or refund a ticket', minutes: 2 },
  ],
  tags: {
    passes: { rider: { commuter: 1 }, product: { pass: 1 }, purpose: { commute: 0.8 }, stage: { book: 0.6 } },
    'pass-calc': { rider: { commuter: 0.9 }, product: { pass: 0.9, single: 0.5 }, purpose: { commute: 1 }, stage: { plan: 0.8 } },
    'harbor-times': { rider: { commuter: 0.6 }, corridor: { harbor: 1 }, purpose: { commute: 0.6 }, stage: { plan: 0.5, ride: 0.6 } },
    'capital-express': { rider: { business: 0.6, commuter: 0.3 }, corridor: { capital: 1 }, purpose: { meeting: 0.5 }, stage: { plan: 0.6 } },
    'first-class': { rider: { business: 1 }, product: { 'first-class': 1 }, corridor: { capital: 0.6 }, purpose: { meeting: 0.6 }, stage: { book: 0.5 } },
    corporate: { rider: { business: 1 }, product: { 'first-class': 0.5 }, purpose: { meeting: 1 }, stage: { book: 0.6 } },
    'lakes-weekend': { rider: { leisure: 1 }, corridor: { lakes: 1 }, purpose: { getaway: 1 }, stage: { plan: 1 } },
    'valley-day-trips': { rider: { leisure: 0.9 }, product: { group: 0.3 }, corridor: { valley: 1 }, purpose: { getaway: 0.8 }, stage: { plan: 0.8 } },
    'weekend-fares': { rider: { leisure: 0.7, student: 0.4 }, product: { single: 1 }, purpose: { getaway: 0.6 }, stage: { book: 1 } },
    'student-fares': { rider: { student: 1 }, product: { single: 0.6 }, purpose: { 'family-visit': 0.5 }, stage: { book: 0.5 } },
    'holiday-travel': { rider: { student: 0.6, leisure: 0.3 }, product: { single: 0.5 }, purpose: { 'family-visit': 1 }, stage: { plan: 0.8 } },
    'group-tickets': { rider: { leisure: 0.4 }, product: { group: 1 }, purpose: { event: 0.6 }, stage: { book: 0.8 } },
    'game-day': { rider: { leisure: 0.5 }, product: { group: 0.5 }, corridor: { valley: 0.4 }, purpose: { event: 1 }, stage: { ride: 0.5 } },
    'live-departures': { rider: { commuter: 0.5 }, purpose: { commute: 0.4 }, stage: { ride: 1 } },
    stations: { rider: { commuter: 0.4, leisure: 0.3 }, stage: { plan: 0.6, ride: 0.4 } },
    'change-ticket': { stage: { manage: 1 } },
  },
  hero: {
    default: {
      eyebrow: 'Calder Rail',
      headline: 'City center to city center.',
      sub: 'Four lines, hundreds of daily departures, and fares that reward booking ahead.',
      cta: 'Find a train',
    },
    archetypes: {
      'pass-ready-commuter': {
        eyebrow: 'For daily riders',
        headline: 'Riding most weekdays? A pass pays.',
        sub: 'Enter your trips per week and see what a monthly pass saves against single fares, before your next renewal date.',
        cta: 'Run the numbers',
      },
      'capital-business-traveler': {
        eyebrow: 'Capital Line · First class',
        headline: 'Arrive downtown with the deck finished.',
        sub: 'A table, a quiet car, and reliable Wi-Fi on every hourly express. Corporate accounts bill monthly.',
        cta: 'Book first class',
      },
      'car-free-weekender': {
        eyebrow: 'Weekends by rail',
        headline: 'Leave the car. Take the weekend.',
        sub: 'Lakes and Valley Line escapes, walkable from the station, with weekend fares from $19 each way.',
        cta: 'Plan a getaway',
      },
      'group-event-organizer': {
        eyebrow: 'Groups of 10 or more',
        headline: 'Bring the whole section to the game.',
        sub: 'Reserved group seating on game day trains, one booking, one confirmation, and a group rate for every rider.',
        cta: 'Book group travel',
      },
    },
    audiences: {
      rider: {
        commuter: { eyebrow: 'For commuters', cta: 'Compare passes' },
        leisure: { eyebrow: 'Weekend and day trips' },
        business: { eyebrow: 'For business travel', cta: 'See first class' },
        student: { eyebrow: 'Students ride for less', cta: 'Get a student card' },
      },
      corridor: {
        harbor: { headline: 'Harbor Line, every 15 minutes at peak.' },
        capital: { headline: 'Capital Line express, every hour.' },
        lakes: { headline: 'The Lakes Line, window seat included.' },
        valley: { headline: 'Valley Line to wine country and the stadium.' },
      },
      purpose: {
        commute: { sub: 'Live departures, platform alerts, and passes priced for riding most weekdays.' },
        getaway: { sub: 'Book early for the lowest weekend fares, and leave the parking to us.' },
        'family-visit': { sub: 'Holiday trains fill early. Book now and change for free up to 24 hours before.' },
      },
    },
  },
  scenarios: [
    { id: 'commuter', label: 'Commuter', path: ['harbor-times', 'pass-calc', 'passes', 'live-departures'], expects: 'pass-ready-commuter' },
    { id: 'business', label: 'Business trip', path: ['capital-express', 'first-class', 'corporate'], expects: 'capital-business-traveler' },
    { id: 'weekender', label: 'Weekender', path: ['lakes-weekend', 'valley-day-trips', 'weekend-fares'], expects: 'car-free-weekender' },
    { id: 'group', label: 'Game day group', path: ['game-day', 'group-tickets', 'stations'], expects: 'group-event-organizer' },
  ],
};

export default example;
