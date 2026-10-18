// Demo: a fictional pro soccer club, “Lakeshore Union FC”, playing at Foundry
// Park. One site sells single games, plans, and suites, runs the team store,
// streams matches, and speaks to supporters a thousand miles away.

import type { Example } from './types.ts';

const example: Example = {
  id: 'sports',
  industry: 'Sports',
  brand: 'Lakeshore Union FC',
  domain: 'lakeshoreunion.example',
  config: {
    minViews: 3,
    halfLifeDays: 14,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'product',
        label: 'Ticket Product',
        attributes: [
          { id: 'single', label: 'Single Match' },
          { id: 'mini', label: 'Mini Plan' },
          { id: 'season', label: 'Season Membership' },
          { id: 'premium', label: 'Premium Seating & Suites' },
        ],
      },
      {
        id: 'fan',
        label: 'Fan Type',
        attributes: [
          { id: 'die-hard', label: 'Die-Hard' },
          { id: 'family', label: 'Family' },
          { id: 'corporate', label: 'Corporate' },
          { id: 'out-of-market', label: 'Out of Market' },
        ],
      },
      {
        id: 'engagement',
        label: 'Engagement',
        attributes: [
          { id: 'tickets', label: 'Tickets' },
          { id: 'merch', label: 'Merchandise' },
          { id: 'streaming', label: 'Streaming & Media' },
          { id: 'community', label: 'Community' },
        ],
      },
      {
        id: 'stage',
        label: 'Fan Stage',
        attributes: [
          { id: 'explore', label: 'Explore' },
          { id: 'compare', label: 'Compare' },
          { id: 'buy', label: 'Buy' },
          { id: 'member', label: 'Season Member' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'season-member-prospect',
        label: 'Season Member Prospect',
        fingerprint: {
          product: { season: 1, mini: 0.5 },
          fan: { 'die-hard': 1 },
          engagement: { tickets: 1, community: 0.5 },
          stage: { compare: 1, buy: 0.6 },
        },
      },
      {
        id: 'family-first-timer',
        label: 'Family First-Timer',
        fingerprint: {
          product: { single: 1, mini: 0.3 },
          fan: { family: 1 },
          engagement: { tickets: 1, community: 0.4 },
          stage: { explore: 1, buy: 0.5 },
        },
      },
      {
        id: 'corporate-premium',
        label: 'Corporate Premium Buyer',
        fingerprint: {
          product: { premium: 1 },
          fan: { corporate: 1 },
        },
      },
      {
        id: 'out-of-market-supporter',
        label: 'Out-of-Market Supporter',
        fingerprint: {
          fan: { 'out-of-market': 1, 'die-hard': 0.5 },
          engagement: { streaming: 1, merch: 0.6 },
        },
      },
    ],
  },
  content: [
    { id: 'schedule', type: 'Tickets', title: '2027 schedule and single-match tickets', minutes: 3 },
    { id: 'family-pack', type: 'Offer', title: 'Family four-pack: tickets, hot dogs, and a youth scarf', minutes: 2 },
    { id: 'junior-union', type: 'Membership', title: 'Junior Union: the kids club for fans 12 and under', minutes: 3 },
    { id: 'first-match', type: 'Guide', title: 'Your first match at Foundry Park', minutes: 4 },
    { id: 'mini-plans', type: 'Tickets', title: 'Mini plans: pick five home matches', minutes: 3 },
    { id: 'season-memberships', type: 'Tickets', title: 'Season memberships: benefits and pricing by section', minutes: 5 },
    { id: 'seat-selector', type: 'Tool', title: 'Seat selector: the view from every section', minutes: 4 },
    { id: 'membership-deposit', type: 'Form', title: 'Place a season membership deposit', minutes: 2 },
    { id: 'premium-seating', type: 'Premium', title: 'The Forge Club and field-level suites', minutes: 4 },
    { id: 'corporate-hospitality', type: 'Form', title: 'Corporate hospitality and group suite inquiry', minutes: 3 },
    { id: 'watch-live', type: 'Streaming', title: 'Watch every match: streaming and broadcast guide', minutes: 3 },
    { id: 'union-podcast', type: 'Media', title: 'The Union Podcast and full match highlights', minutes: 25 },
    { id: 'team-store', type: 'Shop', title: 'Team store: the 2027 home kit', minutes: 2 },
    { id: 'supporters', type: 'Community', title: 'Supporters groups and the North End', minutes: 5 },
    { id: 'member-hub', type: 'Member', title: 'Member hub: ticket transfers, exchanges, and perks', minutes: 3 },
    { id: 'matchday-guide', type: 'Guide', title: 'Matchday guide: parking, gates, and bag policy', minutes: 3 },
  ],
  tags: {
    schedule: {
      product: { single: 1 },
      engagement: { tickets: 1 },
      stage: { explore: 0.8 },
    },
    'family-pack': {
      product: { single: 0.8 },
      fan: { family: 1 },
      engagement: { tickets: 0.8 },
      stage: { buy: 0.7 },
    },
    'junior-union': {
      fan: { family: 1 },
      engagement: { community: 0.7 },
      stage: { explore: 0.5 },
    },
    'first-match': {
      fan: { family: 0.6 },
      product: { single: 0.5 },
      engagement: { tickets: 0.5 },
      stage: { explore: 1 },
    },
    'mini-plans': {
      product: { mini: 1, season: 0.3 },
      engagement: { tickets: 1 },
      fan: { 'die-hard': 0.4, family: 0.3 },
      stage: { compare: 0.8 },
    },
    'season-memberships': {
      product: { season: 1 },
      fan: { 'die-hard': 0.8 },
      engagement: { tickets: 1 },
      stage: { compare: 1 },
    },
    'seat-selector': {
      product: { season: 0.5, premium: 0.4, mini: 0.3 },
      engagement: { tickets: 0.8 },
      stage: { compare: 1 },
    },
    'membership-deposit': {
      product: { season: 1 },
      fan: { 'die-hard': 0.6 },
      engagement: { tickets: 0.8 },
      stage: { buy: 1 },
    },
    'premium-seating': {
      product: { premium: 1 },
      fan: { corporate: 0.8 },
      engagement: { tickets: 0.6 },
      stage: { compare: 0.6 },
    },
    'corporate-hospitality': {
      product: { premium: 1 },
      fan: { corporate: 1 },
      stage: { buy: 0.8 },
    },
    'watch-live': {
      engagement: { streaming: 1 },
      fan: { 'out-of-market': 1 },
    },
    'union-podcast': {
      engagement: { streaming: 0.8, community: 0.3 },
      fan: { 'die-hard': 0.7, 'out-of-market': 0.5 },
    },
    'team-store': {
      engagement: { merch: 1 },
      fan: { 'out-of-market': 0.4, family: 0.3, 'die-hard': 0.3 },
      stage: { buy: 0.5 },
    },
    supporters: {
      engagement: { community: 1 },
      fan: { 'die-hard': 1 },
      stage: { explore: 0.4 },
    },
    'member-hub': {
      product: { season: 0.8 },
      stage: { member: 1 },
    },
    'matchday-guide': {
      engagement: { tickets: 0.4 },
      stage: { member: 0.4, buy: 0.3 },
    },
  },
  hero: {
    default: {
      eyebrow: 'Lakeshore Union FC',
      headline: 'Foundry Park is louder with you.',
      sub: 'Single matches, plans, and season memberships for the 2027 season. Every seat sees the whole pitch.',
      cta: 'Get tickets',
    },
    archetypes: {
      'season-member-prospect': {
        eyebrow: 'Season memberships for 2027',
        headline: 'Your seat, every home match.',
        sub: 'Lock in your section, pay in monthly installments, and get first access to playoff tickets and away trips.',
        cta: 'Place a deposit',
      },
      'family-first-timer': {
        eyebrow: 'Your first match',
        headline: 'Bring the kids to Foundry Park.',
        sub: 'The family four-pack covers tickets, hot dogs, and a youth scarf. Junior Union members get a postmatch high five.',
        cta: 'Get a family four-pack',
      },
      'corporate-premium': {
        eyebrow: 'The Forge Club',
        headline: 'Host clients at field level.',
        sub: 'Suites and club seats with food and beverage, private entry, and an account manager for every match.',
        cta: 'Talk to premium sales',
      },
      'out-of-market-supporter': {
        eyebrow: 'Union fans everywhere',
        headline: 'Every match, wherever you are.',
        sub: 'Stream every match live, catch the podcast after, and get the 2027 home kit shipped to your door.',
        cta: 'Watch live',
      },
    },
    audiences: {
      product: {
        single: { cta: 'Pick a match' },
        mini: { headline: 'Five matches, your picks.', cta: 'Build a mini plan' },
        season: { headline: 'Your seat, every home match.', cta: 'Compare memberships' },
        premium: { eyebrow: 'Premium Seating', cta: 'Talk to premium sales' },
      },
      fan: {
        'die-hard': { eyebrow: 'For the North End', sub: 'Supporters sections, away trips, and first access to playoff tickets.' },
        family: { eyebrow: 'For families', sub: 'Family four-packs, the Junior Union kids club, and quieter sections near the concourse.' },
        corporate: { sub: 'Suites, club seats, and group hospitality with food and beverage included.' },
        'out-of-market': { eyebrow: 'Union fans everywhere', sub: 'Every match streamed live, with the home kit shipped anywhere.' },
      },
      engagement: {
        merch: { headline: 'The 2027 home kit is here.', cta: 'Shop the kit' },
        streaming: { cta: 'Watch live' },
      },
      stage: {
        member: { eyebrow: 'Welcome back, member', cta: 'Open the member hub' },
      },
    },
  },
  scenarios: [
    {
      id: 'season',
      label: 'Season prospect',
      path: ['supporters', 'mini-plans', 'season-memberships', 'seat-selector', 'membership-deposit'],
      expects: 'season-member-prospect',
    },
    {
      id: 'family',
      label: 'Family first-timer',
      path: ['first-match', 'junior-union', 'schedule', 'family-pack'],
      expects: 'family-first-timer',
    },
    {
      id: 'corporate',
      label: 'Suite buyer',
      path: ['seat-selector', 'premium-seating', 'corporate-hospitality'],
      expects: 'corporate-premium',
    },
    {
      id: 'out-of-market',
      label: 'Faraway fan',
      path: ['union-podcast', 'watch-live', 'team-store'],
      expects: 'out-of-market-supporter',
    },
  ],
};

export default example;
