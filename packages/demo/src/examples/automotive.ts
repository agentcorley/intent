// Automotive: a fictional car brand and its dealer network, from first
// research through the service lane. Sixteen pages, four archetypes.

import type { Example } from './types.ts';

const example: Example = {
  id: 'automotive',
  industry: 'Automotive',
  brand: 'Halvard Motors',
  domain: 'halvardmotors.example',
  config: {
    minViews: 3,
    halfLifeDays: 30,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'model',
        label: 'Model Interest',
        attributes: [
          { id: 'suv', label: 'SUV' },
          { id: 'ev', label: 'EV' },
          { id: 'truck', label: 'Truck' },
          { id: 'sedan', label: 'Sedan' },
        ],
      },
      {
        id: 'powertrain',
        label: 'Powertrain',
        attributes: [
          { id: 'gas', label: 'Gas' },
          { id: 'hybrid', label: 'Hybrid' },
          { id: 'electric', label: 'Electric' },
        ],
      },
      {
        id: 'buyer',
        label: 'Buyer Type',
        attributes: [
          { id: 'first-time', label: 'First-Time Buyer' },
          { id: 'family', label: 'Family Upgrader' },
          { id: 'fleet', label: 'Fleet and Business' },
          { id: 'enthusiast', label: 'Enthusiast' },
        ],
      },
      {
        id: 'ownership',
        label: 'Ownership',
        attributes: [
          { id: 'prospect', label: 'Prospect' },
          { id: 'owner', label: 'Current Owner' },
          { id: 'service', label: 'Service Customer' },
        ],
      },
      {
        id: 'stage',
        label: 'Purchase Stage',
        attributes: [
          { id: 'research', label: 'Research' },
          { id: 'configure', label: 'Configure' },
          { id: 'test-drive', label: 'Test Drive' },
          { id: 'buy', label: 'Buy' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'ev-curious-family',
        label: 'EV-Curious Family Upgrader',
        fingerprint: {
          model: { ev: 1, suv: 0.6 },
          powertrain: { electric: 1, hybrid: 0.2 },
          buyer: { family: 1 },
          stage: { research: 1, configure: 0.5 },
        },
      },
      {
        id: 'fleet-buyer',
        label: 'Fleet Buyer Ready for a Quote',
        fingerprint: {
          model: { truck: 1 },
          buyer: { fleet: 1 },
          stage: { buy: 1, configure: 0.4, research: 0.3 },
        },
      },
      {
        id: 'service-due-owner',
        label: 'Owner Due for Service',
        fingerprint: {
          ownership: { service: 1, owner: 0.8 },
        },
      },
      {
        id: 'first-time-buyer',
        label: 'First-Time Buyer Near Decision',
        fingerprint: {
          model: { sedan: 1, suv: 0.3 },
          buyer: { 'first-time': 1 },
          ownership: { prospect: 1 },
          stage: { research: 0.8, 'test-drive': 0.6, buy: 1 },
        },
      },
    ],
  },
  content: [
    { id: 'strand', type: 'Model', title: '2027 Halvard Strand: three-row SUV', minutes: 4 },
    { id: 'ember', type: 'Model', title: '2027 Halvard Ember: all-electric crossover', minutes: 4 },
    { id: 'ridgeback', type: 'Model', title: '2027 Halvard Ridgeback pickup', minutes: 4 },
    { id: 'lune', type: 'Model', title: '2027 Halvard Lune sedan', minutes: 3 },
    { id: 'home-charging', type: 'Guide', title: 'Home charging explained: Level 1, Level 2, and cost', minutes: 7 },
    { id: 'range-calc', type: 'Tool', title: 'Range and charging cost calculator', minutes: 4 },
    { id: 'car-seats', type: 'Guide', title: 'Three car seats, one row: a family fit guide', minutes: 6 },
    { id: 'build', type: 'Tool', title: 'Build and price your Halvard', minutes: 8 },
    { id: 'test-drive', type: 'Form', title: 'Book a test drive at home or at a dealer', minutes: 2 },
    { id: 'offers', type: 'Offer', title: 'Current lease and APR offers by model', minutes: 3 },
    { id: 'first-car', type: 'Guide', title: 'Your first new car: financing in plain English', minutes: 8 },
    { id: 'fleet', type: 'Program', title: 'Halvard Fleet: volume pricing and upfits', minutes: 5 },
    { id: 'fleet-quote', type: 'Form', title: 'Request a fleet quote', minutes: 3 },
    { id: 'maintenance', type: 'Guide', title: 'Your maintenance schedule by mileage', minutes: 4 },
    { id: 'service', type: 'Form', title: 'Schedule service at your dealer', minutes: 2 },
    { id: 'trade-in', type: 'Tool', title: 'What’s your Halvard worth? Trade-in estimate', minutes: 3 },
  ],
  tags: {
    strand: { model: { suv: 1 }, powertrain: { gas: 0.5, hybrid: 0.6 }, buyer: { family: 0.8 }, ownership: { prospect: 0.4 }, stage: { research: 0.8 } },
    ember: { model: { ev: 1, suv: 0.4 }, powertrain: { electric: 1 }, ownership: { prospect: 0.4 }, stage: { research: 0.8 } },
    ridgeback: { model: { truck: 1 }, powertrain: { gas: 0.7, hybrid: 0.4 }, buyer: { fleet: 0.3, enthusiast: 0.3 }, stage: { research: 0.7 } },
    lune: { model: { sedan: 1 }, powertrain: { gas: 0.5, hybrid: 0.7 }, buyer: { 'first-time': 0.6 }, stage: { research: 0.8 } },
    'home-charging': { model: { ev: 0.7 }, powertrain: { electric: 1 }, ownership: { prospect: 0.3 }, stage: { research: 1 } },
    'range-calc': { model: { ev: 0.8 }, powertrain: { electric: 1 }, stage: { research: 0.6, configure: 0.4 } },
    'car-seats': { model: { suv: 0.8, ev: 0.4 }, buyer: { family: 1 }, stage: { research: 0.7 } },
    build: { ownership: { prospect: 0.5 }, stage: { configure: 1 } },
    'test-drive': { ownership: { prospect: 0.6 }, stage: { 'test-drive': 1 } },
    offers: { model: { sedan: 0.4, suv: 0.4 }, buyer: { 'first-time': 0.4, family: 0.3 }, ownership: { prospect: 0.5 }, stage: { buy: 1 } },
    'first-car': { model: { sedan: 0.3 }, buyer: { 'first-time': 1 }, ownership: { prospect: 0.8 }, stage: { research: 0.6, buy: 0.6 } },
    fleet: { model: { truck: 0.8, suv: 0.3 }, buyer: { fleet: 1 }, stage: { configure: 0.4, buy: 0.6 } },
    'fleet-quote': { model: { truck: 0.5 }, buyer: { fleet: 1 }, stage: { buy: 1 } },
    maintenance: { ownership: { service: 1, owner: 0.6 } },
    service: { ownership: { service: 1, owner: 0.4 } },
    'trade-in': { ownership: { owner: 1 }, stage: { buy: 0.5 } },
  },
  hero: {
    default: {
      eyebrow: 'Halvard Motors',
      headline: 'Built for the miles you actually drive.',
      sub: 'SUVs, sedans, trucks, and the all-electric Ember, sold and serviced by Halvard dealers near you.',
      cta: 'Explore models',
    },
    archetypes: {
      'ev-curious-family': {
        eyebrow: 'Halvard Ember · Family',
        headline: 'Room for three car seats, zero gas stops.',
        sub: 'See what home charging costs on your rate, then build an Ember with the second-row setup your family needs.',
        cta: 'Estimate charging cost',
      },
      'fleet-buyer': {
        eyebrow: 'Halvard Fleet',
        headline: 'Work-ready Ridgebacks, priced by the dozen.',
        sub: 'Volume pricing, factory upfits, and one fleet manager from quote to delivery. Quotes back within two business days.',
        cta: 'Request a fleet quote',
      },
      'service-due-owner': {
        eyebrow: 'For Halvard owners',
        headline: 'Your next service, booked in a minute.',
        sub: 'Pick a time at your dealer, add a loaner or shuttle, and see exactly what this visit covers before you arrive.',
        cta: 'Schedule service',
      },
      'first-time-buyer': {
        eyebrow: 'Your first new car',
        headline: 'A new Lune, with payments that fit.',
        sub: 'Current APR offers, a plain-English financing guide, and a no-pressure test drive at home or at the dealer.',
        cta: 'See current offers',
      },
    },
    audiences: {
      model: {
        suv: { headline: 'Three rows, real cargo space.', cta: 'Explore the Strand' },
        ev: { headline: 'All-electric, charged at home overnight.', cta: 'Explore the Ember' },
        truck: { headline: 'A pickup that shows up for work.', cta: 'Explore the Ridgeback' },
        sedan: { headline: 'The Lune: efficient, quiet, well equipped.', cta: 'Explore the Lune' },
      },
      buyer: {
        'first-time': { eyebrow: 'First-time buyers', sub: 'Financing explained plainly, and offers built for a first new car.' },
        family: { eyebrow: 'For growing families', sub: 'Car seat fit, cargo room, and safety ratings for every model, side by side.' },
        fleet: { eyebrow: 'Fleet and business', sub: 'Volume pricing and upfits through one dedicated fleet manager.' },
        enthusiast: { eyebrow: 'For drivers' },
      },
      ownership: {
        owner: { eyebrow: 'Welcome back', sub: 'See what your Halvard is worth toward the next one.' },
        service: { eyebrow: 'Halvard owners', cta: 'Schedule service' },
      },
    },
  },
  scenarios: [
    { id: 'ev-family', label: 'EV family', path: ['ember', 'car-seats', 'home-charging', 'build'], expects: 'ev-curious-family' },
    { id: 'fleet', label: 'Fleet buyer', path: ['ridgeback', 'fleet', 'fleet-quote'], expects: 'fleet-buyer' },
    { id: 'service', label: 'Owner service', path: ['maintenance', 'service', 'trade-in'], expects: 'service-due-owner' },
    { id: 'first-car', label: 'First car', path: ['lune', 'first-car', 'offers', 'test-drive'], expects: 'first-time-buyer' },
  ],
};

export default example;
