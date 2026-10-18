// Flagship demo: a fictional upscale hotel and resort group, “Aldermere Hotels
// & Resorts”, with a beach resort, a mountain lodge, a wine country inn, and
// city hotels. Leisure, business, and group travelers all land on one site.

import type { Example } from './types.ts';

const example: Example = {
  id: 'hospitality',
  industry: 'Hospitality',
  brand: 'Aldermere Hotels & Resorts',
  domain: 'aldermerehotels.example',
  config: {
    minViews: 3,
    halfLifeDays: 14,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'traveler',
        label: 'Traveler Type',
        attributes: [
          { id: 'leisure', label: 'Leisure' },
          { id: 'business', label: 'Business' },
          { id: 'groups', label: 'Groups & Events' },
        ],
      },
      {
        id: 'destination',
        label: 'Destination',
        attributes: [
          { id: 'beach', label: 'Beach' },
          { id: 'city', label: 'City' },
          { id: 'mountain', label: 'Mountain' },
          { id: 'wine-country', label: 'Wine Country' },
        ],
      },
      {
        id: 'purpose',
        label: 'Trip Purpose',
        attributes: [
          { id: 'family', label: 'Family' },
          { id: 'couples', label: 'Couples' },
          { id: 'wellness', label: 'Wellness' },
          { id: 'meetings', label: 'Meetings & Events' },
          { id: 'celebrations', label: 'Weddings & Celebrations' },
        ],
      },
      {
        id: 'stage',
        label: 'Booking Stage',
        attributes: [
          { id: 'dream', label: 'Dream' },
          { id: 'plan', label: 'Plan' },
          { id: 'book', label: 'Book' },
          { id: 'stay', label: 'Stay' },
        ],
      },
      {
        id: 'loyalty',
        label: 'Aldermere Circle',
        attributes: [
          { id: 'guest', label: 'Not Yet a Member' },
          { id: 'member', label: 'Member' },
          { id: 'elite', label: 'Gold & Platinum' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'family-summer-planner',
        label: 'Family Summer Planner',
        fingerprint: {
          traveler: { leisure: 1 },
          destination: { beach: 1, mountain: 0.3 },
          purpose: { family: 1 },
          stage: { dream: 0.4, plan: 1, book: 0.5 },
        },
      },
      {
        id: 'corporate-event-planner',
        label: 'Corporate Event Planner',
        fingerprint: {
          traveler: { groups: 1, business: 0.5 },
          purpose: { meetings: 1 },
          stage: { plan: 1, book: 0.6 },
        },
      },
      {
        id: 'elite-weekend-escaper',
        label: 'Loyalty Elite Weekend Escaper',
        fingerprint: {
          traveler: { leisure: 1 },
          purpose: { couples: 1, wellness: 0.3 },
          stage: { book: 1, plan: 0.4 },
          loyalty: { elite: 1, member: 0.4 },
        },
      },
      {
        id: 'wellness-seeker',
        label: 'Wellness Seeker',
        fingerprint: {
          traveler: { leisure: 1 },
          destination: { mountain: 1, 'wine-country': 0.5 },
          purpose: { wellness: 1, couples: 0.3 },
          stage: { dream: 1, plan: 0.6 },
        },
      },
      {
        id: 'road-warrior',
        label: 'Business Road Warrior',
        fingerprint: {
          traveler: { business: 1 },
          destination: { city: 1 },
          loyalty: { member: 1, elite: 0.6 },
        },
      },
    ],
  },
  content: [
    { id: 'summer-family', type: 'Offer', title: 'Summer family escape: kids stay and eat free', minutes: 3 },
    { id: 'kids-club', type: 'Guide', title: 'Inside the Tidewater Kids Club at Pelican Key', minutes: 4 },
    { id: 'pelican-key', type: 'Destination', title: 'Pelican Key: a Gulf Coast beach resort guide', minutes: 6 },
    { id: 'highland-lodge', type: 'Destination', title: 'Highland Lodge: ski, hike, and slow down', minutes: 5 },
    { id: 'vale-house', type: 'Destination', title: 'Vale House: harvest season in wine country', minutes: 5 },
    { id: 'city-hotels', type: 'Hotels', title: 'Aldermere Midtown and Riverside: downtown, walkable', minutes: 3 },
    { id: 'meetings', type: 'Landing', title: 'Meetings and events at Aldermere', minutes: 4 },
    { id: 'event-spaces', type: 'Tool', title: 'Event space finder: capacity charts and floor plans', minutes: 6 },
    { id: 'group-rfp', type: 'Form', title: 'Request a group proposal for 10 or more rooms', minutes: 3 },
    { id: 'spa-retreat', type: 'Offer', title: 'Three-night wellness retreat at Highland Lodge', minutes: 4 },
    { id: 'weekend-for-two', type: 'Offer', title: 'Weekend for two: suite upgrade and 2PM checkout', minutes: 2 },
    { id: 'weddings', type: 'Guide', title: 'Weddings at Vale House: the vineyard lawn and barrel room', minutes: 7 },
    { id: 'circle-tiers', type: 'Loyalty', title: 'Aldermere Circle: tiers, points, and member rates', minutes: 4 },
    { id: 'suite-upgrades', type: 'Loyalty', title: 'Platinum suite upgrades: how confirmed upgrades work', minutes: 3 },
    { id: 'check-rates', type: 'Tool', title: 'Check rates and availability', minutes: 2 },
    { id: 'pre-arrival', type: 'Stay', title: 'Before you arrive: dining, spa, and airport transfers', minutes: 3 },
  ],
  tags: {
    'summer-family': {
      traveler: { leisure: 1 },
      destination: { beach: 0.6, mountain: 0.3 },
      purpose: { family: 1 },
      stage: { plan: 0.8, book: 0.4 },
    },
    'kids-club': {
      traveler: { leisure: 0.8 },
      destination: { beach: 0.8 },
      purpose: { family: 1 },
      stage: { plan: 0.7 },
    },
    'pelican-key': {
      traveler: { leisure: 0.7 },
      destination: { beach: 1 },
      purpose: { family: 0.4, couples: 0.4 },
      stage: { dream: 0.8 },
    },
    'highland-lodge': {
      traveler: { leisure: 0.7 },
      destination: { mountain: 1 },
      purpose: { wellness: 0.5, family: 0.3 },
      stage: { dream: 0.8 },
    },
    'vale-house': {
      traveler: { leisure: 0.7 },
      destination: { 'wine-country': 1 },
      purpose: { couples: 0.6, wellness: 0.3 },
      stage: { dream: 0.8 },
    },
    'city-hotels': {
      traveler: { business: 0.8, leisure: 0.3 },
      destination: { city: 1 },
      stage: { plan: 0.5 },
    },
    meetings: {
      traveler: { groups: 1, business: 0.5 },
      purpose: { meetings: 1 },
      stage: { plan: 0.5, dream: 0.3 },
    },
    'event-spaces': {
      traveler: { groups: 1 },
      purpose: { meetings: 0.8, celebrations: 0.4 },
      stage: { plan: 1 },
    },
    'group-rfp': {
      traveler: { groups: 1, business: 0.4 },
      purpose: { meetings: 0.8 },
      stage: { book: 1 },
    },
    'spa-retreat': {
      traveler: { leisure: 0.8 },
      destination: { mountain: 0.8 },
      purpose: { wellness: 1 },
      stage: { plan: 0.6, dream: 0.4 },
    },
    'weekend-for-two': {
      traveler: { leisure: 1 },
      purpose: { couples: 1 },
      stage: { book: 0.8 },
      loyalty: { member: 0.4 },
    },
    weddings: {
      traveler: { groups: 0.6, leisure: 0.4 },
      destination: { 'wine-country': 0.7 },
      purpose: { celebrations: 1 },
      stage: { plan: 0.8 },
    },
    'circle-tiers': {
      loyalty: { member: 1, guest: 0.4 },
      traveler: { business: 0.3, leisure: 0.3 },
      stage: { plan: 0.3 },
    },
    'suite-upgrades': {
      loyalty: { elite: 1 },
      stage: { book: 0.5, stay: 0.4 },
    },
    'check-rates': {
      stage: { book: 1 },
    },
    'pre-arrival': {
      stage: { stay: 1 },
      purpose: { wellness: 0.3 },
      loyalty: { member: 0.3 },
    },
  },
  hero: {
    default: {
      eyebrow: 'Aldermere Hotels & Resorts',
      headline: 'Stay somewhere that remembers you.',
      sub: 'Beach, mountain, wine country, and city hotels, with a team that knows your name by the second night.',
      cta: 'Find your stay',
    },
    archetypes: {
      'family-summer-planner': {
        eyebrow: 'Summer at Pelican Key',
        headline: 'The summer they’ll still talk about.',
        sub: 'Kids stay and eat free, the Tidewater Kids Club runs every day, and connecting rooms are held for families.',
        cta: 'Plan a family summer',
      },
      'corporate-event-planner': {
        eyebrow: 'Meetings & Events',
        headline: 'Your next offsite, handled end to end.',
        sub: 'One planner, one proposal, room blocks and event space across every Aldermere. Proposals within one business day.',
        cta: 'Request a proposal',
      },
      'elite-weekend-escaper': {
        eyebrow: 'For Gold and Platinum members',
        headline: 'Make it a suite weekend.',
        sub: 'Gold and Platinum members get confirmed upgrades and 2PM checkout. Book by Thursday for Friday arrival.',
        cta: 'Book your weekend',
      },
      'wellness-seeker': {
        eyebrow: 'Highland Lodge',
        headline: 'Three quiet days in the mountains.',
        sub: 'Morning trail walks, a mineral soak, and a spa treatment each day. No agenda unless you want one.',
        cta: 'See the retreat',
      },
      'road-warrior': {
        eyebrow: 'Aldermere Circle',
        headline: 'The city stay that works like you do.',
        sub: 'Member rates, mobile key, and a quiet room on a high floor. Points on every night, including corporate rates.',
        cta: 'Book with member rates',
      },
    },
    audiences: {
      traveler: {
        leisure: { eyebrow: 'For time away' },
        business: { eyebrow: 'For the work trip', cta: 'See city hotels' },
        groups: { eyebrow: 'Groups & Events', cta: 'Request a proposal' },
      },
      destination: {
        beach: { headline: 'Gulf water, white sand, slower mornings.' },
        city: { headline: 'Downtown, walkable, and quiet at night.' },
        mountain: { headline: 'Fresh air and a fire after dinner.' },
        'wine-country': { headline: 'Harvest season at Vale House.' },
      },
      purpose: {
        family: { sub: 'Connecting rooms, a kids club, and menus everyone at the table will actually eat.' },
        couples: { sub: 'Suites with a view, late checkout, and dinner reservations we hold for two.' },
        wellness: { sub: 'Spa, trails, and mineral pools, with the pace set by you.' },
        meetings: { sub: 'Event space, room blocks, and one planner from first call to final invoice.' },
        celebrations: { sub: 'Vineyard lawns and private dining for weddings and milestone weekends.' },
      },
      stage: {
        book: { cta: 'Check rates' },
        stay: { eyebrow: 'Before you arrive', cta: 'Plan your stay' },
      },
      loyalty: {
        guest: { cta: 'Join Aldermere Circle' },
        elite: { eyebrow: 'For Gold and Platinum members' },
      },
    },
  },
  scenarios: [
    {
      id: 'family',
      label: 'Family planner',
      path: ['pelican-key', 'summer-family', 'kids-club', 'check-rates'],
      expects: 'family-summer-planner',
    },
    {
      id: 'event-planner',
      label: 'Event planner',
      path: ['meetings', 'city-hotels', 'event-spaces', 'group-rfp'],
      expects: 'corporate-event-planner',
    },
    {
      id: 'elite',
      label: 'Elite weekender',
      path: ['suite-upgrades', 'weekend-for-two', 'vale-house', 'check-rates'],
      expects: 'elite-weekend-escaper',
    },
    {
      id: 'wellness',
      label: 'Wellness seeker',
      path: ['highland-lodge', 'spa-retreat', 'vale-house'],
      expects: 'wellness-seeker',
    },
    {
      id: 'road-warrior',
      label: 'Road warrior',
      path: ['city-hotels', 'circle-tiers', 'check-rates', 'suite-upgrades'],
      expects: 'road-warrior',
    },
  ],
};

export default example;
