// Retail: a fictional outdoor specialty retailer with stores, ecommerce, and a
// paid membership. Sixteen pages, four archetypes.

import type { Example } from './types.ts';

const example: Example = {
  id: 'retail',
  industry: 'Retail',
  brand: 'Fernbrook Outfitters',
  domain: 'fernbrook.example',
  config: {
    minViews: 3,
    halfLifeDays: 14,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'shopper',
        label: 'Shopper Type',
        attributes: [
          { id: 'gift-buyer', label: 'Gift Buyer' },
          { id: 'enthusiast', label: 'Enthusiast' },
          { id: 'deal-seeker', label: 'Deal Seeker' },
          { id: 'new-to-category', label: 'New to the Outdoors' },
        ],
      },
      {
        id: 'department',
        label: 'Category Interest',
        attributes: [
          { id: 'camp', label: 'Camp and Hike' },
          { id: 'climb', label: 'Climb' },
          { id: 'paddle', label: 'Paddle' },
          { id: 'snow', label: 'Ski and Snowboard' },
          { id: 'apparel', label: 'Trail Apparel' },
        ],
      },
      {
        id: 'channel',
        label: 'Channel Preference',
        attributes: [
          { id: 'online', label: 'Online' },
          { id: 'in-store', label: 'In Store' },
          { id: 'pickup', label: 'Order Online, Pick Up' },
        ],
      },
      {
        id: 'loyalty',
        label: 'Trail Club Status',
        attributes: [
          { id: 'guest', label: 'Guest' },
          { id: 'member', label: 'Member' },
          { id: 'lapsed', label: 'Lapsed Member' },
        ],
      },
      {
        id: 'stage',
        label: 'Shopping Stage',
        attributes: [
          { id: 'browse', label: 'Browse' },
          { id: 'compare', label: 'Compare' },
          { id: 'buy', label: 'Buy' },
          { id: 'own', label: 'Own and Care' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'last-minute-gifter',
        label: 'Last-Minute Gift Buyer',
        fingerprint: {
          shopper: { 'gift-buyer': 1 },
          channel: { pickup: 1, online: 0.6 },
          stage: { buy: 1, browse: 0.3 },
        },
      },
      {
        id: 'committed-climber',
        label: 'Committed Climber, Member',
        fingerprint: {
          shopper: { enthusiast: 1 },
          department: { climb: 1 },
          loyalty: { member: 1 },
          stage: { compare: 1 },
        },
      },
      {
        id: 'first-time-camper',
        label: 'First-Time Camper',
        fingerprint: {
          shopper: { 'new-to-category': 1 },
          department: { camp: 1 },
          channel: { 'in-store': 1, online: 0.3 },
          stage: { browse: 1, compare: 0.5 },
        },
      },
      {
        id: 'member-deal-hunter',
        label: 'Member Deal Hunter',
        fingerprint: {
          shopper: { 'deal-seeker': 1 },
          loyalty: { member: 1 },
        },
      },
    ],
  },
  content: [
    { id: 'gift-guide', type: 'Guide', title: 'Gifts for the person who’s always outside', minutes: 5 },
    { id: 'gifts-under-75', type: 'Collection', title: 'Gifts under $75', minutes: 3 },
    { id: 'gift-cards', type: 'Shop', title: 'Gift cards and e-gift cards', minutes: 2 },
    { id: 'pickup', type: 'Service', title: 'Order online, pick up in two hours', minutes: 2 },
    { id: 'climb-shoes', type: 'Guide', title: 'Climbing shoe fit: aggressive, moderate, or flat', minutes: 7 },
    { id: 'rope-compare', type: 'Tool', title: 'Compare dynamic ropes side by side', minutes: 5 },
    { id: 'climb-nights', type: 'Event', title: 'Trail Club nights at partner climbing gyms', minutes: 3 },
    { id: 'camp-101', type: 'Guide', title: 'Camping 101: your first night out', minutes: 9 },
    { id: 'tent-finder', type: 'Tool', title: 'Tent finder: five questions, three picks', minutes: 4 },
    { id: 'clinics', type: 'Event', title: 'Free in-store clinics: pitch a tent, pack a pack', minutes: 3 },
    { id: 'paddle-rentals', type: 'Service', title: 'Kayak and paddleboard rentals by store', minutes: 3 },
    { id: 'ski-tune', type: 'Service', title: 'Ski and snowboard tune-ups, ready in 48 hours', minutes: 3 },
    { id: 'last-season', type: 'Offer', title: 'Last season’s gear, marked down', minutes: 4 },
    { id: 'gear-swap', type: 'Event', title: 'Members-only gear swap, Saturday 9AM', minutes: 2 },
    { id: 'trail-club', type: 'Program', title: 'Trail Club: your annual member reward', minutes: 4 },
    { id: 'renew', type: 'Form', title: 'Renew your Trail Club membership', minutes: 2 },
  ],
  tags: {
    'gift-guide': { shopper: { 'gift-buyer': 1 }, department: { camp: 0.4, apparel: 0.5 }, stage: { browse: 0.6 } },
    'gifts-under-75': { shopper: { 'gift-buyer': 1, 'deal-seeker': 0.4 }, department: { apparel: 0.4 }, stage: { buy: 0.5 } },
    'gift-cards': { shopper: { 'gift-buyer': 1 }, channel: { online: 0.6 }, stage: { buy: 1 } },
    pickup: { shopper: { 'gift-buyer': 0.4 }, channel: { pickup: 1, online: 0.4 }, stage: { buy: 0.7 } },
    'climb-shoes': { shopper: { enthusiast: 0.8 }, department: { climb: 1 }, stage: { compare: 1 } },
    'rope-compare': { shopper: { enthusiast: 1 }, department: { climb: 1 }, channel: { online: 0.4 }, stage: { compare: 1 } },
    'climb-nights': { shopper: { enthusiast: 0.6 }, department: { climb: 0.8 }, channel: { 'in-store': 0.5 }, loyalty: { member: 1 } },
    'camp-101': { shopper: { 'new-to-category': 1 }, department: { camp: 1 }, stage: { browse: 1 } },
    'tent-finder': { shopper: { 'new-to-category': 0.6 }, department: { camp: 1 }, channel: { online: 0.4 }, stage: { compare: 0.8 } },
    clinics: { shopper: { 'new-to-category': 0.8 }, department: { camp: 0.7, climb: 0.3 }, channel: { 'in-store': 1 }, stage: { browse: 0.6 } },
    'paddle-rentals': { shopper: { 'new-to-category': 0.5 }, department: { paddle: 1 }, channel: { 'in-store': 0.8 }, stage: { browse: 0.5 } },
    'ski-tune': { shopper: { enthusiast: 0.6 }, department: { snow: 1 }, channel: { 'in-store': 0.8 }, stage: { own: 1 } },
    'last-season': { shopper: { 'deal-seeker': 1 }, department: { apparel: 0.5, snow: 0.4 }, channel: { online: 0.5 }, stage: { buy: 0.6 } },
    'gear-swap': { shopper: { 'deal-seeker': 1 }, channel: { 'in-store': 1 }, loyalty: { member: 1 }, stage: { buy: 0.5 } },
    'trail-club': { shopper: { 'deal-seeker': 0.5 }, loyalty: { member: 1, guest: 0.3 }, stage: { own: 0.4 } },
    renew: { loyalty: { lapsed: 1 }, shopper: { 'deal-seeker': 0.3 }, stage: { own: 0.3 } },
  },
  hero: {
    default: {
      eyebrow: 'Fernbrook Outfitters',
      headline: 'Gear for wherever the weekend goes.',
      sub: 'Camp, climb, paddle, and ski gear, fitted by people who use it. Shop online or in any of our stores.',
      cta: 'Shop new arrivals',
    },
    archetypes: {
      'last-minute-gifter': {
        eyebrow: 'Gifts, ready today',
        headline: 'Order by 3PM, pick up tonight.',
        sub: 'Choose a gift online and we’ll have it wrapped at the counter in two hours. Free gift receipt included.',
        cta: 'Find a gift fast',
      },
      'committed-climber': {
        eyebrow: 'Trail Club · Climb',
        headline: 'Your next rope, compared honestly.',
        sub: 'Side-by-side specs on weight, sheath, and dry treatment. Members earn their annual reward on every climbing purchase.',
        cta: 'Compare ropes',
      },
      'first-time-camper': {
        eyebrow: 'New to camping',
        headline: 'Your first night out, sorted.',
        sub: 'Join a free Saturday clinic, try tents on the floor, and leave with a kit that fits your trip and budget.',
        cta: 'Book a free clinic',
      },
      'member-deal-hunter': {
        eyebrow: 'Trail Club members',
        headline: 'Members shop the gear swap first.',
        sub: 'Used and last-season gear, inspected by our shop staff. Members get first pick Saturday at 9AM.',
        cta: 'See swap details',
      },
    },
    audiences: {
      shopper: {
        'gift-buyer': { eyebrow: 'Gifts they’ll actually use', cta: 'Shop gifts' },
        enthusiast: { eyebrow: 'For people who go often' },
        'deal-seeker': { eyebrow: 'Last season, marked down', cta: 'Shop markdowns' },
        'new-to-category': { eyebrow: 'Just getting started', cta: 'Start here' },
      },
      department: {
        camp: { headline: 'Sleep well wherever you pitch.' },
        climb: { headline: 'Shoes, ropes, and racks, fitted right.' },
        paddle: { headline: 'Rent a boat before you buy one.' },
        snow: { headline: 'Tuned, waxed, and ready for opening day.' },
        apparel: { headline: 'Layers that earn their space.' },
      },
      channel: {
        pickup: { sub: 'Order online and pick up in two hours at your nearest Fernbrook store.' },
        'in-store': { sub: 'Our staff fit boots, packs, and shoes in person. Find a store near you.' },
      },
    },
  },
  scenarios: [
    { id: 'gifter', label: 'Gift buyer', path: ['gift-guide', 'gifts-under-75', 'pickup', 'gift-cards'], expects: 'last-minute-gifter' },
    { id: 'climber', label: 'Climber', path: ['climb-shoes', 'rope-compare', 'climb-nights', 'trail-club'], expects: 'committed-climber' },
    { id: 'camper', label: 'First camper', path: ['camp-101', 'tent-finder', 'clinics'], expects: 'first-time-camper' },
    { id: 'deals', label: 'Deal hunter', path: ['last-season', 'gear-swap', 'trail-club'], expects: 'member-deal-hunter' },
  ],
};

export default example;
