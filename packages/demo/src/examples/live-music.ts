// Demo: a fictional live music promoter and venue group, “Foxglove Live”,
// running an arena (Harbor Arena), an amphitheater (Cedar Hill), a club
// (The Velvet Room), and a two-day festival (Riverbend Weekend).

import type { Example } from './types.ts';

const example: Example = {
  id: 'live-music',
  industry: 'Live Music',
  brand: 'Foxglove Live',
  domain: 'foxglovelive.example',
  config: {
    minViews: 3,
    halfLifeDays: 7,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'genre',
        label: 'Genre',
        attributes: [
          { id: 'rock', label: 'Rock' },
          { id: 'hip-hop', label: 'Hip-Hop & R&B' },
          { id: 'country', label: 'Country' },
          { id: 'electronic', label: 'Electronic' },
          { id: 'indie', label: 'Indie & Alternative' },
        ],
      },
      {
        id: 'tier',
        label: 'Ticket Tier',
        attributes: [
          { id: 'ga', label: 'General Admission' },
          { id: 'reserved', label: 'Reserved Seating' },
          { id: 'vip', label: 'VIP' },
          { id: 'hospitality', label: 'Premium Hospitality' },
        ],
      },
      {
        id: 'fan',
        label: 'Fan Type',
        attributes: [
          { id: 'superfan', label: 'Superfan' },
          { id: 'casual', label: 'Casual Fan' },
          { id: 'group', label: 'Group Organizer' },
          { id: 'corporate', label: 'Corporate Buyer' },
        ],
      },
      {
        id: 'event',
        label: 'Event Type',
        attributes: [
          { id: 'arena', label: 'Arena' },
          { id: 'amphitheater', label: 'Amphitheater' },
          { id: 'club', label: 'Club' },
          { id: 'festival', label: 'Festival' },
        ],
      },
      {
        id: 'stage',
        label: 'Fan Stage',
        attributes: [
          { id: 'discover', label: 'Discover' },
          { id: 'consider', label: 'Consider' },
          { id: 'buy', label: 'Buy' },
          { id: 'attend', label: 'Attend' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'festival-superfan',
        label: 'Festival Superfan',
        fingerprint: {
          tier: { vip: 1, ga: 0.6 },
          fan: { superfan: 1 },
          event: { festival: 1 },
          stage: { buy: 1, consider: 0.5 },
        },
      },
      {
        id: 'corporate-suite-buyer',
        label: 'Corporate Suite Buyer',
        fingerprint: {
          tier: { hospitality: 1 },
          fan: { corporate: 1, group: 0.4 },
          event: { arena: 1, amphitheater: 0.4 },
        },
      },
      {
        id: 'date-night-casual',
        label: 'Date-Night Casual',
        fingerprint: {
          tier: { reserved: 1 },
          fan: { casual: 1 },
          event: { amphitheater: 1, club: 0.5 },
          stage: { consider: 1, buy: 0.6 },
        },
      },
      {
        id: 'group-organizer',
        label: 'Group Outing Organizer',
        fingerprint: {
          tier: { ga: 0.6, reserved: 0.8 },
          fan: { group: 1 },
          stage: { consider: 1, buy: 0.5 },
        },
      },
    ],
  },
  content: [
    { id: 'riverbend-lineup', type: 'Event', title: 'Riverbend Weekend 2027: the full lineup', minutes: 4 },
    { id: 'riverbend-passes', type: 'Tickets', title: 'Riverbend passes: GA, GA+, and VIP compared', minutes: 3 },
    { id: 'riverbend-camping', type: 'Guide', title: 'Camping at Riverbend: sites, showers, and early entry', minutes: 5 },
    { id: 'fan-club-presale', type: 'Loyalty', title: 'Foxglove Fan Club: how presale codes work', minutes: 3 },
    { id: 'harbor-arena', type: 'Event', title: 'This season at Harbor Arena', minutes: 3 },
    { id: 'arena-suites', type: 'Hospitality', title: 'Private suites at Harbor Arena', minutes: 4 },
    { id: 'hospitality-inquiry', type: 'Form', title: 'Book a suite or hospitality package for your clients', minutes: 3 },
    { id: 'cedar-hill', type: 'Event', title: 'Summer nights at Cedar Hill Amphitheater', minutes: 3 },
    { id: 'dinner-and-a-show', type: 'Offer', title: 'Dinner and a show: two reserved seats and a prix fixe', minutes: 2 },
    { id: 'velvet-room', type: 'Event', title: 'Coming up at The Velvet Room', minutes: 2 },
    { id: 'country-fall', type: 'Guide', title: 'Country nights this fall at Cedar Hill', minutes: 3 },
    { id: 'hip-hop-season', type: 'Guide', title: 'Hip-hop and R&B: the arena season ahead', minutes: 4 },
    { id: 'after-hours', type: 'Event', title: 'After Hours: electronic sets at The Velvet Room', minutes: 2 },
    { id: 'group-tickets', type: 'Form', title: 'Group tickets for 15 or more', minutes: 3 },
    { id: 'seat-views', type: 'Tool', title: 'Seat maps and the view from your section', minutes: 4 },
    { id: 'know-before', type: 'Guide', title: 'Know before you go: bag policy, parking, and entry', minutes: 3 },
  ],
  tags: {
    'riverbend-lineup': {
      genre: { indie: 0.6, electronic: 0.5, rock: 0.4 },
      event: { festival: 1 },
      fan: { superfan: 0.6, casual: 0.3 },
      stage: { discover: 1 },
    },
    'riverbend-passes': {
      tier: { vip: 1, ga: 0.7 },
      event: { festival: 1 },
      fan: { superfan: 0.6 },
      stage: { buy: 1 },
    },
    'riverbend-camping': {
      event: { festival: 1 },
      fan: { superfan: 1 },
      tier: { vip: 0.3 },
      stage: { consider: 0.8, attend: 0.4 },
    },
    'fan-club-presale': {
      fan: { superfan: 1 },
      stage: { buy: 0.7 },
    },
    'harbor-arena': {
      event: { arena: 1 },
      genre: { 'hip-hop': 0.3, rock: 0.3 },
      stage: { discover: 0.8 },
    },
    'arena-suites': {
      tier: { hospitality: 1 },
      event: { arena: 1 },
      fan: { corporate: 0.8, group: 0.4 },
      stage: { consider: 0.7 },
    },
    'hospitality-inquiry': {
      tier: { hospitality: 1 },
      fan: { corporate: 1 },
      event: { arena: 0.5, amphitheater: 0.4 },
      stage: { buy: 1 },
    },
    'cedar-hill': {
      event: { amphitheater: 1 },
      genre: { country: 0.4, rock: 0.4 },
      fan: { casual: 0.6 },
      stage: { discover: 0.6 },
    },
    'dinner-and-a-show': {
      tier: { reserved: 1 },
      fan: { casual: 1 },
      event: { amphitheater: 0.6, club: 0.4 },
      stage: { buy: 0.8 },
    },
    'velvet-room': {
      event: { club: 1 },
      genre: { indie: 0.5, electronic: 0.3 },
      tier: { ga: 0.6 },
      stage: { discover: 0.7 },
    },
    'country-fall': {
      genre: { country: 1 },
      event: { amphitheater: 0.7 },
      fan: { casual: 0.5 },
      stage: { discover: 0.4, consider: 0.6 },
    },
    'hip-hop-season': {
      genre: { 'hip-hop': 1 },
      event: { arena: 0.8 },
      stage: { discover: 0.8 },
    },
    'after-hours': {
      genre: { electronic: 1 },
      event: { club: 1 },
      tier: { ga: 0.7 },
      fan: { superfan: 0.4 },
      stage: { discover: 0.5 },
    },
    'group-tickets': {
      fan: { group: 1 },
      tier: { reserved: 0.6, ga: 0.5 },
      stage: { buy: 0.8, consider: 0.4 },
    },
    'seat-views': {
      tier: { reserved: 1, hospitality: 0.3 },
      stage: { consider: 1 },
    },
    'know-before': {
      stage: { attend: 1 },
    },
  },
  hero: {
    default: {
      eyebrow: 'Foxglove Live',
      headline: 'Your next great night out.',
      sub: 'Arena tours, summer amphitheater nights, club shows, and Riverbend Weekend. Find the show, then find your seat.',
      cta: 'See what’s on',
    },
    archetypes: {
      'festival-superfan': {
        eyebrow: 'Riverbend Weekend',
        headline: 'Closer to the stage, all weekend.',
        sub: 'VIP passes include a dedicated entry lane, a shaded viewing deck, and Fan Club presale for next year.',
        cta: 'Get VIP passes',
      },
      'corporate-suite-buyer': {
        eyebrow: 'Premium Hospitality',
        headline: 'Host clients in a private suite.',
        sub: 'Suites for 12 to 24 at Harbor Arena, with food and beverage, parking, and one contact for every detail.',
        cta: 'Talk to hospitality',
      },
      'date-night-casual': {
        eyebrow: 'Summer at Cedar Hill',
        headline: 'Dinner, two good seats, one great night.',
        sub: 'Reserved seats and a prix fixe at the Hillside Grill, so the only thing you plan is the drive.',
        cta: 'Reserve date night',
      },
      'group-organizer': {
        eyebrow: 'Group tickets',
        headline: 'Bring the whole crew.',
        sub: 'Seats together for 15 or more, one invoice, and a group lead who answers the phone.',
        cta: 'Start a group order',
      },
    },
    audiences: {
      genre: {
        rock: { headline: 'Loud guitars, all season long.' },
        'hip-hop': { headline: 'The arena season for hip-hop and R&B.' },
        country: { headline: 'Country nights under the stars.' },
        electronic: { headline: 'After Hours at The Velvet Room.' },
        indie: { headline: 'The bands you’ll brag about seeing early.' },
      },
      tier: {
        vip: { cta: 'Compare VIP options' },
        reserved: { cta: 'Pick your seats' },
        hospitality: { eyebrow: 'Premium Hospitality', cta: 'Talk to hospitality' },
      },
      fan: {
        superfan: { eyebrow: 'Foxglove Fan Club', sub: 'Presale codes, early entry, and first look at every announcement.' },
        casual: { sub: 'Good seats, easy parking, and a place to eat before the show.' },
        group: { sub: 'Seats together for 15 or more, with one invoice for the whole group.' },
        corporate: { sub: 'Suites and hospitality packages with food and beverage included.' },
      },
      event: {
        festival: { eyebrow: 'Riverbend Weekend' },
        club: { eyebrow: 'The Velvet Room' },
      },
      stage: {
        attend: { eyebrow: 'Before the show', cta: 'Know before you go' },
      },
    },
  },
  scenarios: [
    {
      id: 'superfan',
      label: 'Festival superfan',
      path: ['riverbend-lineup', 'fan-club-presale', 'riverbend-camping', 'riverbend-passes'],
      expects: 'festival-superfan',
    },
    {
      id: 'suite-buyer',
      label: 'Suite buyer',
      path: ['harbor-arena', 'arena-suites', 'hospitality-inquiry'],
      expects: 'corporate-suite-buyer',
    },
    {
      id: 'date-night',
      label: 'Date night',
      path: ['cedar-hill', 'country-fall', 'seat-views', 'dinner-and-a-show'],
      expects: 'date-night-casual',
    },
    {
      id: 'group',
      label: 'Group organizer',
      path: ['harbor-arena', 'seat-views', 'group-tickets'],
      expects: 'group-organizer',
    },
  ],
};

export default example;
