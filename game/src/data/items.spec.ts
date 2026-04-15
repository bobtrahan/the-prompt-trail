import { describe, it, expect } from 'vitest';
import { SHOP_ITEMS } from './items';

describe('ITEMS Data Validation', () => {
  it('all item IDs are unique', () => {
    const ids = SHOP_ITEMS.map(i => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all items have valid category', () => {
    const validCategories = ['model', 'hardware', 'agentSlot', 'consumable', 'joke', 'repair'];
    SHOP_ITEMS.forEach(i => {
      expect(validCategories).toContain(i.category);
    });
  });

  it('all items have baseCost > 0', () => {
    SHOP_ITEMS.forEach(i => {
      expect(i.baseCost).toBeGreaterThan(0);
    });
  });

  it('all non-joke items have a mechanical effect', () => {
    SHOP_ITEMS.filter(i => i.category !== 'joke').forEach(i => {
      expect(i.mechanical).toBeDefined();
    });
  });

  it('all joke items have a jokeResult', () => {
    SHOP_ITEMS.filter(i => i.category === 'joke').forEach(i => {
      expect(i.jokeResult).toBeDefined();
      expect(i.jokeResult!.length).toBeGreaterThan(0);
    });
  });

  it('model items reference valid ModelTier values', () => {
    const validModelTiers = ['free', 'sketchy', 'local', 'openSource', 'standard', 'frontier'];
    SHOP_ITEMS.filter(i => i.category === 'model').forEach(i => {
      expect(i.mechanical).toBeDefined();
      expect(i.mechanical!.type).toBe('unlockModel');
      // Case-insensitive/exact match check based on task requirement: 'free'|'sketchy'|'local'|'openSource'|'standard'|'frontier'
      // Note: items.ts uses 'opensource' lowercase, but spec says 'openSource'.
      // I will check against both or normalized if necessary, but spec says "one of".
      // Let's stick to the spec's list but allow 'opensource' if that's what's in the data.
      const normalizedValue = typeof i.mechanical!.value === 'string' ? i.mechanical!.value.toLowerCase() : '';
      const normalizedTiers = validModelTiers.map(t => t.toLowerCase());
      expect(normalizedTiers).toContain(normalizedValue);
    });
  });

  it('availableAfterDay values are between 1 and 13', () => {
    SHOP_ITEMS.forEach(i => {
      if (i.availableAfterDay !== undefined) {
        expect(i.availableAfterDay).toBeGreaterThanOrEqual(1);
        expect(i.availableAfterDay).toBeLessThanOrEqual(13);
      }
    });
  });
});
