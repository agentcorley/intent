// The shape every demo example follows. One file per industry in this folder.

import type { ConfigInput } from '../../../config/src/index.ts';
import type { ContentTags } from '../../../tracker/src/index.ts';

export interface Copy {
  eyebrow: string;
  headline: string;
  sub: string;
  cta: string;
}

export interface ContentItem {
  id: string;
  /** Short content type shown on the card, e.g. “Offer”, “Guide”, “Tickets”. */
  type: string;
  title: string;
  minutes: number;
}

export interface Scenario {
  id: string;
  /** Button label, 1–3 words, e.g. “Family planner”. */
  label: string;
  /** Content ids read in order. Must land on the intended archetype. */
  path: string[];
  /** The archetype this path is designed to reach. Checked by tests. */
  expects: string;
}

export interface Example {
  id: string;
  /** Industry label for the switcher, e.g. “Hospitality”. */
  industry: string;
  /** Fictional brand. Never a real company. */
  brand: string;
  domain: string;
  config: ConfigInput;
  content: ContentItem[];
  tags: ContentTags;
  hero: {
    default: Copy;
    /** An archetype owns the whole hero. Keyed by archetype id. */
    archetypes: Record<string, Copy>;
    /**
     * Without an archetype, matched audiences compose the hero. Keyed by
     * category id, then attribute id. Categories listed earlier in the config
     * win a field when two audiences both set it.
     */
    audiences: Record<string, Record<string, Partial<Copy>>>;
  };
  scenarios: Scenario[];
}
