// Media: a fictional streaming service and newsroom under one subscription
// brand, from first sample to retention. Sixteen pages, four archetypes.

import type { Example } from './types.ts';

const example: Example = {
  id: 'media',
  industry: 'Media',
  brand: 'Northlight',
  domain: 'northlight.example',
  config: {
    minViews: 3,
    halfLifeDays: 7,
    audienceRadius: 0.6,
    archetypeRadius: 0.6,
    holdoutPercent: 5,
    categories: [
      {
        id: 'genre',
        label: 'Content Genre',
        attributes: [
          { id: 'drama', label: 'Drama' },
          { id: 'documentary', label: 'Documentary' },
          { id: 'news', label: 'News' },
          { id: 'sports', label: 'Live Sports' },
          { id: 'kids', label: 'Kids and Family' },
        ],
      },
      {
        id: 'tier',
        label: 'Subscription Tier',
        attributes: [
          { id: 'free', label: 'Free With Ads' },
          { id: 'standard', label: 'Standard' },
          { id: 'premium', label: 'Premium' },
          { id: 'bundle', label: 'Stream and News Bundle' },
        ],
      },
      {
        id: 'audience',
        label: 'Audience Type',
        attributes: [
          { id: 'binge-watcher', label: 'Binge Watcher' },
          { id: 'news-reader', label: 'News Reader' },
          { id: 'sports-fan', label: 'Sports Fan' },
          { id: 'family', label: 'Family' },
        ],
      },
      {
        id: 'device',
        label: 'Device',
        attributes: [
          { id: 'tv', label: 'TV' },
          { id: 'mobile', label: 'Mobile' },
          { id: 'web', label: 'Web' },
        ],
      },
      {
        id: 'stage',
        label: 'Lifecycle Stage',
        attributes: [
          { id: 'sample', label: 'Sample' },
          { id: 'trial', label: 'Trial' },
          { id: 'subscribe', label: 'Subscribe' },
          { id: 'retain', label: 'Retain' },
        ],
      },
    ],
    archetypes: [
      {
        id: 'trial-binger',
        label: 'Drama Binger on a Free Trial',
        fingerprint: {
          genre: { drama: 1, documentary: 0.2 },
          audience: { 'binge-watcher': 1 },
          stage: { sample: 0.8, trial: 1 },
        },
      },
      {
        id: 'bundle-ready-reader',
        label: 'Loyal Reader, Bundle Ready',
        fingerprint: {
          genre: { news: 1 },
          tier: { bundle: 1 },
          audience: { 'news-reader': 1 },
          stage: { subscribe: 1, sample: 0.7 },
        },
      },
      {
        id: 'mobile-sports-fan',
        label: 'Mobile Sports Fan',
        fingerprint: {
          genre: { sports: 1 },
          tier: { premium: 1 },
          audience: { 'sports-fan': 1 },
          device: { mobile: 1 },
        },
      },
      {
        id: 'family-at-risk',
        label: 'Family at Risk of Canceling',
        fingerprint: {
          genre: { kids: 1 },
          audience: { family: 1 },
          device: { tv: 1 },
          stage: { retain: 1 },
        },
      },
    ],
  },
  content: [
    { id: 'saltmarsh', type: 'Series', title: 'Now streaming: The Saltmarsh, season two', minutes: 3 },
    { id: 'limited-series', type: 'List', title: 'Ten limited series to finish this weekend', minutes: 5 },
    { id: 'free-trial', type: 'Offer', title: 'Start your seven-day free trial', minutes: 2 },
    { id: 'plans', type: 'Plan', title: 'Compare plans: Free, Standard, Premium', minutes: 3 },
    { id: 'watershed', type: 'Series', title: 'Inside the Watershed: a four-part documentary', minutes: 3 },
    { id: 'morning-ledger', type: 'Newsletter', title: 'The Morning Ledger: your 6AM briefing', minutes: 4 },
    { id: 'investigation', type: 'Story', title: 'Investigation: where the county’s water money went', minutes: 12 },
    { id: 'bundle', type: 'Offer', title: 'The Ledger and Northlight+, one subscription', minutes: 2 },
    { id: 'live-sports', type: 'Schedule', title: 'Live this weekend: every match on Premium', minutes: 2 },
    { id: 'sports-app', type: 'App', title: 'Scores, alerts, and live games on your phone', minutes: 2 },
    { id: 'premium', type: 'Upgrade', title: 'Add 4K, more screens, and live sports', minutes: 2 },
    { id: 'kids-profiles', type: 'Feature', title: 'Kids profiles with parental controls', minutes: 3 },
    { id: 'movie-night', type: 'List', title: 'Friday family movie night picks', minutes: 4 },
    { id: 'tv-setup', type: 'Help', title: 'Get Northlight+ on your TV', minutes: 2 },
    { id: 'downloads', type: 'Help', title: 'Download to watch offline', minutes: 2 },
    { id: 'pause', type: 'Account', title: 'Pause your plan instead of canceling', minutes: 2 },
  ],
  tags: {
    saltmarsh: { genre: { drama: 1 }, audience: { 'binge-watcher': 1 }, device: { tv: 0.5 }, stage: { sample: 0.6 } },
    'limited-series': { genre: { drama: 1, documentary: 0.3 }, audience: { 'binge-watcher': 1 }, stage: { sample: 0.6 } },
    'free-trial': { tier: { standard: 0.6, premium: 0.4 }, audience: { 'binge-watcher': 0.5 }, stage: { trial: 1 } },
    plans: { tier: { free: 0.5, standard: 0.8, premium: 0.8, bundle: 0.5 }, stage: { subscribe: 0.8 } },
    watershed: { genre: { documentary: 1 }, audience: { 'binge-watcher': 0.5, 'news-reader': 0.4 }, device: { tv: 0.4 }, stage: { sample: 0.5 } },
    'morning-ledger': { genre: { news: 1 }, audience: { 'news-reader': 1 }, device: { mobile: 0.6 }, stage: { sample: 0.5 } },
    investigation: { genre: { news: 1 }, audience: { 'news-reader': 1 }, device: { web: 0.7 }, stage: { sample: 0.8 } },
    bundle: { genre: { news: 0.4, drama: 0.3 }, tier: { bundle: 1 }, audience: { 'news-reader': 0.7, 'binge-watcher': 0.3 }, stage: { subscribe: 1 } },
    'live-sports': { genre: { sports: 1 }, tier: { premium: 0.8 }, audience: { 'sports-fan': 1 }, stage: { sample: 0.4 } },
    'sports-app': { genre: { sports: 0.8 }, audience: { 'sports-fan': 0.8 }, device: { mobile: 1 }, stage: { trial: 0.3 } },
    premium: { genre: { sports: 0.4 }, tier: { premium: 1 }, audience: { family: 0.3 }, stage: { subscribe: 0.6 } },
    'kids-profiles': { genre: { kids: 1 }, audience: { family: 1 }, device: { tv: 0.5 }, stage: { subscribe: 0.3, retain: 0.4 } },
    'movie-night': { genre: { kids: 0.8 }, audience: { family: 1 }, device: { tv: 0.8 }, stage: { retain: 0.6 } },
    'tv-setup': { audience: { family: 0.3, 'binge-watcher': 0.3 }, device: { tv: 1 }, stage: { retain: 0.4 } },
    downloads: { audience: { family: 0.4, 'binge-watcher': 0.4 }, device: { mobile: 1 }, stage: { retain: 0.5 } },
    pause: { tier: { free: 0.5 }, stage: { retain: 1 } },
  },
  hero: {
    default: {
      eyebrow: 'Northlight',
      headline: 'Stories worth staying in for.',
      sub: 'Original series, documentaries, live sports, and the Ledger newsroom, on every screen you own.',
      cta: 'Start watching',
    },
    archetypes: {
      'trial-binger': {
        eyebrow: 'Your trial, well spent',
        headline: 'Season two of The Saltmarsh is waiting.',
        sub: 'All eight episodes are streaming now. Keep watching after your trial on Standard, and pick up right where you left off.',
        cta: 'Keep watching',
      },
      'bundle-ready-reader': {
        eyebrow: 'For Ledger readers',
        headline: 'The reporting you read, plus Northlight+.',
        sub: 'One subscription covers unlimited Ledger stories, the Morning Ledger, and every Northlight+ documentary and series.',
        cta: 'See the bundle',
      },
      'mobile-sports-fan': {
        eyebrow: 'Live on Premium',
        headline: 'Every match, live on your phone.',
        sub: 'Premium streams every weekend fixture with score alerts and multiview. Watch on the go or cast to the TV.',
        cta: 'Upgrade to Premium',
      },
      'family-at-risk': {
        eyebrow: 'For your household',
        headline: 'Friday movie night, already picked.',
        sub: 'New family picks every week, kids profiles with parental controls, and a pause option if the season gets busy.',
        cta: 'See this week’s picks',
      },
    },
    audiences: {
      genre: {
        drama: { headline: 'The series everyone finishes in a weekend.' },
        documentary: { headline: 'Documentaries that change the conversation.' },
        news: { headline: 'Reporting you can’t find anywhere else.' },
        sports: { headline: 'Live sports, every weekend.' },
        kids: { headline: 'Shows the whole family agrees on.' },
      },
      audience: {
        'binge-watcher': { eyebrow: 'Up next for you', cta: 'Keep watching' },
        'news-reader': { eyebrow: 'From the Ledger newsroom', cta: 'Read the latest' },
        'sports-fan': { eyebrow: 'Live this weekend', cta: 'See the schedule' },
        family: { eyebrow: 'For the whole family', cta: 'Set up kids profiles' },
      },
      stage: {
        trial: { sub: 'Your trial includes everything on Standard. Cancel anytime before it ends.' },
        retain: { sub: 'Need a break? Pause your plan for up to three months and keep your watchlist.' },
      },
    },
  },
  scenarios: [
    { id: 'binger', label: 'Trial binger', path: ['saltmarsh', 'limited-series', 'free-trial'], expects: 'trial-binger' },
    { id: 'reader', label: 'News reader', path: ['morning-ledger', 'investigation', 'bundle'], expects: 'bundle-ready-reader' },
    { id: 'sports', label: 'Sports fan', path: ['live-sports', 'sports-app', 'premium'], expects: 'mobile-sports-fan' },
    { id: 'family', label: 'Family', path: ['kids-profiles', 'movie-night', 'tv-setup', 'pause'], expects: 'family-at-risk' },
  ],
};

export default example;
