// Demo: a fictional full-service airline, “Aurelian Airways”, with a premium
// cabin, a loyalty program (Aurelian Miles), and a co-branded card. One site
// serves the family beach trip, the road warrior, and the anniversary in Rome.

import type { Example } from './types.ts';

const example: Example = {
  id: 'travel',
  industry: 'Travel',
  brand: 'Aurelian Airways',
  domain: 'aurelianair.example',
  config: {
    minViews: 3,
    halfLifeDays: 10,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'cabin',
        label: 'Cabin Interest',
        attributes: [
          { id: 'economy', label: 'Main Cabin' },
          { id: 'premium-economy', label: 'Premium Economy' },
          { id: 'business', label: 'Aurelian Suite (Business)' },
        ],
      },
      {
        id: 'trip',
        label: 'Trip Type',
        attributes: [
          { id: 'getaway', label: 'Getaway' },
          { id: 'business', label: 'Business Trip' },
          { id: 'family', label: 'Family Vacation' },
          { id: 'visiting', label: 'Visiting Friends & Family' },
        ],
      },
      {
        id: 'region',
        label: 'Route Region',
        attributes: [
          { id: 'domestic', label: 'Domestic' },
          { id: 'caribbean', label: 'Caribbean & Mexico' },
          { id: 'europe', label: 'Europe' },
          { id: 'asia-pacific', label: 'Asia Pacific' },
        ],
      },
      {
        id: 'traveler',
        label: 'Traveler Status',
        attributes: [
          { id: 'new', label: 'New to Aurelian' },
          { id: 'member', label: 'Aurelian Miles Member' },
          { id: 'elite', label: 'Gold & Platinum' },
          { id: 'cardmember', label: 'Aurelian Cardmember' },
        ],
      },
      {
        id: 'stage',
        label: 'Trip Stage',
        attributes: [
          { id: 'inspire', label: 'Inspire' },
          { id: 'search', label: 'Search' },
          { id: 'book', label: 'Book' },
          { id: 'travel', label: 'Travel' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'family-beach-planner',
        label: 'Family Beach Planner',
        fingerprint: {
          cabin: { economy: 1 },
          trip: { family: 1, getaway: 0.4 },
          region: { caribbean: 1 },
          stage: { search: 1, inspire: 0.5 },
        },
      },
      {
        id: 'premium-europe-leisure',
        label: 'Premium Europe Leisure',
        fingerprint: {
          cabin: { business: 1, 'premium-economy': 0.4 },
          trip: { getaway: 1 },
          region: { europe: 1 },
        },
      },
      {
        id: 'corporate-road-warrior',
        label: 'Corporate Road Warrior',
        fingerprint: {
          cabin: { business: 0.7, economy: 0.4 },
          trip: { business: 1 },
          region: { domestic: 1 },
          traveler: { elite: 1, member: 0.4 },
        },
      },
      {
        id: 'card-ready-member',
        label: 'Card-Ready Member',
        fingerprint: {
          trip: { visiting: 1, getaway: 0.5 },
          traveler: { member: 1, cardmember: 0.7 },
          stage: { search: 0.6, book: 0.6 },
        },
      },
    ],
  },
  content: [
    { id: 'europe-sale', type: 'Offer', title: 'Spring fare sale: nonstop to Lisbon, Rome, and Copenhagen', minutes: 2 },
    { id: 'aurelian-suite', type: 'Cabin', title: 'The Aurelian Suite: lie-flat business class, seat by seat', minutes: 5 },
    { id: 'premium-economy', type: 'Cabin', title: 'Premium Economy: more legroom and a quieter cabin', minutes: 3 },
    { id: 'rome-guide', type: 'Guide', title: 'Four days in Rome without the rush', minutes: 7 },
    { id: 'caribbean-routes', type: 'Destination', title: 'Beach routes to the Caribbean and Mexico', minutes: 4 },
    { id: 'flying-with-kids', type: 'Guide', title: 'Flying with kids: seats together, strollers, car seats', minutes: 5 },
    { id: 'family-fares', type: 'Offer', title: 'Family fares: kids under 12 fly for less this summer', minutes: 2 },
    { id: 'tokyo-launch', type: 'Story', title: 'New nonstop service to Tokyo and Seoul', minutes: 4 },
    { id: 'for-business', type: 'Program', title: 'Aurelian for Business: corporate travel program', minutes: 4 },
    { id: 'shuttle-schedule', type: 'Tool', title: 'Hourly shuttle schedule: Boston, New York, Washington', minutes: 2 },
    { id: 'status-tiers', type: 'Loyalty', title: 'Gold and Platinum: what status unlocks', minutes: 4 },
    { id: 'upgrade-list', type: 'Loyalty', title: 'How upgrades clear: the upgrade list explained', minutes: 3 },
    { id: 'aurelian-card', type: 'Offer', title: 'The Aurelian Card: miles on everyday spend, first bag free', minutes: 3 },
    { id: 'award-calculator', type: 'Tool', title: 'Award calculator: what your miles can book', minutes: 4 },
    { id: 'flight-search', type: 'Tool', title: 'Flight search with flexible dates', minutes: 2 },
    { id: 'check-in', type: 'Travel', title: 'Check in, choose seats, and track your flight', minutes: 2 },
  ],
  tags: {
    'europe-sale': {
      trip: { getaway: 0.8 },
      region: { europe: 1 },
      stage: { search: 0.7, inspire: 0.3 },
    },
    'aurelian-suite': {
      cabin: { business: 1 },
      trip: { business: 0.4, getaway: 0.3 },
      region: { europe: 0.3, 'asia-pacific': 0.3 },
      stage: { inspire: 0.4 },
    },
    'premium-economy': {
      cabin: { 'premium-economy': 1 },
      trip: { getaway: 0.4 },
      stage: { search: 0.4 },
    },
    'rome-guide': {
      trip: { getaway: 1 },
      region: { europe: 1 },
      stage: { inspire: 1 },
    },
    'caribbean-routes': {
      trip: { family: 0.5, getaway: 0.6 },
      region: { caribbean: 1 },
      stage: { inspire: 0.7 },
    },
    'flying-with-kids': {
      cabin: { economy: 0.8 },
      trip: { family: 1 },
      stage: { search: 0.5, travel: 0.3 },
    },
    'family-fares': {
      cabin: { economy: 1 },
      trip: { family: 1 },
      region: { caribbean: 0.5, domestic: 0.4 },
      stage: { search: 0.8 },
    },
    'tokyo-launch': {
      region: { 'asia-pacific': 1 },
      cabin: { business: 0.4 },
      stage: { inspire: 0.7 },
    },
    'for-business': {
      trip: { business: 1 },
      cabin: { business: 0.5 },
      traveler: { member: 0.4, elite: 0.3 },
    },
    'shuttle-schedule': {
      trip: { business: 0.9 },
      region: { domestic: 1 },
      cabin: { economy: 0.4 },
      stage: { search: 0.6 },
    },
    'status-tiers': {
      traveler: { elite: 1, member: 0.4 },
      trip: { business: 0.4 },
    },
    'upgrade-list': {
      traveler: { elite: 1 },
      cabin: { business: 0.7 },
      stage: { travel: 0.4 },
    },
    'aurelian-card': {
      traveler: { cardmember: 1, member: 0.6, new: 0.3 },
      trip: { visiting: 0.4, getaway: 0.3 },
      stage: { book: 0.4 },
    },
    'award-calculator': {
      traveler: { member: 1 },
      trip: { getaway: 0.5, visiting: 0.5 },
      stage: { search: 0.8 },
    },
    'flight-search': {
      stage: { search: 0.6, book: 0.7 },
      trip: { visiting: 0.4 },
    },
    'check-in': {
      stage: { travel: 1 },
    },
  },
  hero: {
    default: {
      eyebrow: 'Aurelian Airways',
      headline: 'Go farther, arrive better.',
      sub: 'Nonstops across the Americas, Europe, and Asia, with seats that recline and crews who answer the call button.',
      cta: 'Search flights',
    },
    archetypes: {
      'family-beach-planner': {
        eyebrow: 'Family fares to the beach',
        headline: 'Seats together, every time.',
        sub: 'Families are seated together at no charge, strollers check free, and nonstops reach the Caribbean and Mexico.',
        cta: 'Find family fares',
      },
      'premium-europe-leisure': {
        eyebrow: 'The Aurelian Suite to Europe',
        headline: 'Arrive in Rome actually rested.',
        sub: 'Lie-flat suites with a door, dinner on your schedule, and arrivals timed for a morning in the city.',
        cta: 'See Europe in Suite',
      },
      'corporate-road-warrior': {
        eyebrow: 'For Gold and Platinum members',
        headline: 'Fly the corridor like you own it.',
        sub: 'Status members get priority on the upgrade list, hourly shuttles between Boston, New York, and Washington, and miles on corporate fares.',
        cta: 'Check upgrade status',
      },
      'card-ready-member': {
        eyebrow: 'Aurelian Miles members',
        headline: 'Get home on miles more often.',
        sub: 'The Aurelian Card earns miles on groceries and gas, checks your first bag free, and boards you early.',
        cta: 'See card benefits',
      },
    },
    audiences: {
      cabin: {
        economy: { cta: 'Find low fares' },
        'premium-economy': { headline: 'More room, without the business fare.' },
        business: { headline: 'Lie flat, wake up there.', cta: 'Explore the Suite' },
      },
      trip: {
        business: { eyebrow: 'For business travel', sub: 'Hourly shuttles, same-day changes, and miles on every corporate fare.' },
        family: { eyebrow: 'Traveling as a family', sub: 'Seats together at no charge and strollers checked free at the gate.' },
        getaway: { eyebrow: 'For the trip you’ve been planning' },
        visiting: { eyebrow: 'Going home for the holidays', sub: 'Book holiday travel with miles or cash, and change plans without a fee.' },
      },
      region: {
        caribbean: { headline: 'Nonstop to the beach.' },
        europe: { headline: 'Nonstop to Lisbon, Rome, and Copenhagen.' },
        'asia-pacific': { headline: 'Now flying nonstop to Tokyo and Seoul.' },
      },
      traveler: {
        new: { cta: 'Join Aurelian Miles' },
        elite: { eyebrow: 'For Gold and Platinum members' },
      },
    },
  },
  scenarios: [
    {
      id: 'family',
      label: 'Family planner',
      path: ['caribbean-routes', 'flying-with-kids', 'family-fares', 'flight-search'],
      expects: 'family-beach-planner',
    },
    {
      id: 'europe',
      label: 'Europe in Suite',
      path: ['rome-guide', 'aurelian-suite', 'europe-sale'],
      expects: 'premium-europe-leisure',
    },
    {
      id: 'road-warrior',
      label: 'Road warrior',
      path: ['shuttle-schedule', 'for-business', 'status-tiers', 'upgrade-list'],
      expects: 'corporate-road-warrior',
    },
    {
      id: 'card',
      label: 'Card prospect',
      path: ['award-calculator', 'flight-search', 'aurelian-card'],
      expects: 'card-ready-member',
    },
  ],
};

export default example;
