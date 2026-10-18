// Every example in this folder, flagship first. Adding a file here adds it to the switcher.

import type { Example } from './types.ts';

const ORDER = [
  'hospitality', 'travel', 'live-music', 'sports', 'entertainment',
  'media', 'retail', 'automotive', 'transportation',
];

const modules = import.meta.glob<{ default: Example }>(['./*.ts', '!./index.ts', '!./types.ts'], { eager: true });

export const examples: Example[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.id);
    const ib = ORDER.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
