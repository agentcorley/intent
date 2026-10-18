// Config schema and load-time validation. Limits are deliberate; see CLAUDE.md.

import type { EngineConfig } from '../../core/src/index.ts';

export const MAX_CATEGORIES = 5;
export const MAX_ATTRIBUTES = 8;
/** Used by the output contract (`data-intent-archetype`, `data-intent-holdout`). */
export const RESERVED_IDS = ['archetype', 'holdout'];

export const DEFAULTS = {
  audienceRadius: 0.6,
  archetypeRadius: 0.6,
  minViews: 3,
  halfLifeDays: 14,
  holdoutPercent: 5,
};

export class ConfigError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super(`Invalid intent config:\n- ${errors.join('\n- ')}`);
    this.name = 'ConfigError';
    this.errors = errors;
  }
}

/** Marketer-facing config: half-life in days, sensible defaults for every number. */
export type ConfigInput = Pick<EngineConfig, 'categories'> &
  Partial<Pick<EngineConfig, 'archetypes' | 'audienceRadius' | 'archetypeRadius' | 'minViews' | 'holdoutPercent'>> & {
    halfLifeDays?: number;
  };

const DAY_MS = 24 * 60 * 60 * 1000;
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isId = (x: unknown): x is string => typeof x === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(x);
const ID_RULE = 'lowercase letters, numbers, and hyphens';

/** Collect every problem rather than stopping at the first, so a UI can show them all. */
export function validateConfig(input: unknown): string[] {
  const errors: string[] = [];
  const c = input as Partial<ConfigInput> | null;
  if (!c || typeof c !== 'object') return ['Config must be an object.'];

  const positive = (key: keyof typeof DEFAULTS) => {
    const v = c[key];
    if (v !== undefined && (!isNum(v) || v <= 0)) errors.push(`${key} must be a number above 0.`);
  };
  positive('audienceRadius');
  positive('archetypeRadius');
  positive('halfLifeDays');
  if (c.minViews !== undefined && (!Number.isInteger(c.minViews) || c.minViews < 1)) {
    errors.push('minViews must be a whole number, 1 or more.');
  }
  if (c.holdoutPercent !== undefined && (!isNum(c.holdoutPercent) || c.holdoutPercent < 0 || c.holdoutPercent > 50)) {
    errors.push('holdoutPercent must be between 0 and 50.');
  }

  /* Categories */
  if (!Array.isArray(c.categories) || c.categories.length === 0) {
    errors.push('At least one category is required.');
    return errors;
  }
  if (c.categories.length > MAX_CATEGORIES) {
    errors.push(`Up to ${MAX_CATEGORIES} categories are allowed; found ${c.categories.length}.`);
  }

  const attrsByCategory = new Map<string, Set<string>>();
  c.categories.forEach((cat, i) => {
    const where = `categories[${i}]${isId(cat?.id) ? ` (${cat.id})` : ''}`;
    if (!isId(cat?.id)) errors.push(`${where}: id is required (${ID_RULE}).`);
    else if (RESERVED_IDS.includes(cat.id)) errors.push(`${where}: “${cat.id}” is reserved.`);
    else if (attrsByCategory.has(cat.id)) errors.push(`${where}: duplicate category id.`);

    if (!Array.isArray(cat?.attributes) || cat.attributes.length === 0) {
      errors.push(`${where}: at least one attribute is required.`);
      return;
    }
    if (cat.attributes.length > MAX_ATTRIBUTES) {
      errors.push(`${where}: up to ${MAX_ATTRIBUTES} attributes are allowed; found ${cat.attributes.length}.`);
    }
    const ids = new Set<string>();
    cat.attributes.forEach((a, j) => {
      if (!isId(a?.id)) errors.push(`${where}.attributes[${j}]: id is required (${ID_RULE}).`);
      else if (ids.has(a.id)) errors.push(`${where}.attributes[${j}]: duplicate attribute id “${a.id}”.`);
      else ids.add(a.id);
    });
    if (isId(cat.id) && !attrsByCategory.has(cat.id)) attrsByCategory.set(cat.id, ids);
  });

  /* Archetypes (optional: audiences work without any) */
  if (c.archetypes !== undefined && !Array.isArray(c.archetypes)) {
    errors.push('archetypes must be a list.');
    return errors;
  }
  const archetypeIds = new Set<string>();
  (c.archetypes ?? []).forEach((arch, i) => {
    const where = `archetypes[${i}]${isId(arch?.id) ? ` (${arch.id})` : ''}`;
    if (!isId(arch?.id)) errors.push(`${where}: id is required (${ID_RULE}).`);
    else if (archetypeIds.has(arch.id)) errors.push(`${where}: duplicate archetype id.`);
    else archetypeIds.add(arch.id);

    const fp = arch?.fingerprint;
    if (!fp || typeof fp !== 'object' || Object.keys(fp).length === 0) {
      errors.push(`${where}: fingerprint must name at least one category.`);
      return;
    }
    for (const [cid, targets] of Object.entries(fp)) {
      const attrs = attrsByCategory.get(cid);
      if (!attrs) {
        errors.push(`${where}: “${cid}” is not a category.`);
        continue;
      }
      let any = false;
      for (const [aid, v] of Object.entries(targets ?? {})) {
        if (!attrs.has(aid)) errors.push(`${where}: “${aid}” is not an attribute of ${cid}.`);
        else if (!isNum(v) || v < 0 || v > 1) errors.push(`${where}: ${cid}.${aid} must be between 0 and 1.`);
        else if (v > 0) any = true;
      }
      if (!any) errors.push(`${where}: ${cid} needs at least one target above 0, or leave the category out to mean “any”.`);
    }
  });

  return errors;
}

/** Validate, apply defaults, and convert to the engine's shape. Throws ConfigError listing every problem. */
export function loadConfig(input: unknown): EngineConfig {
  const errors = validateConfig(input);
  if (errors.length) throw new ConfigError(errors);
  const c = input as ConfigInput;
  return {
    categories: c.categories,
    archetypes: c.archetypes ?? [],
    audienceRadius: c.audienceRadius ?? DEFAULTS.audienceRadius,
    archetypeRadius: c.archetypeRadius ?? DEFAULTS.archetypeRadius,
    minViews: c.minViews ?? DEFAULTS.minViews,
    holdoutPercent: c.holdoutPercent ?? DEFAULTS.holdoutPercent,
    halfLifeMs: (c.halfLifeDays ?? DEFAULTS.halfLifeDays) * DAY_MS,
  };
}
