import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from './EconomySystem';
import { createInitialState, resetState } from './GameState';
import type { GameState, ModelTier, Strategy } from './GameState';
import { SHOP_ITEMS } from '../data/items';

// Tests for EconomySystem.getModelQualityMod — maps model tier to quality modifier
describe('EconomySystem.getModelQualityMod', () => {
  it('free → -0.15', () => expect(EconomySystem.getModelQualityMod('free')).toBe(-0.15));
  it('sketchy → -0.10', () => expect(EconomySystem.getModelQualityMod('sketchy')).toBe(-0.10));
  it('local → -0.05', () => expect(EconomySystem.getModelQualityMod('local')).toBe(-0.05));
  it('openSource → 0', () => expect(EconomySystem.getModelQualityMod('openSource')).toBe(0));
  it('standard → 0.05', () => expect(EconomySystem.getModelQualityMod('standard')).toBe(0.05));
  it('frontier → 0.15', () => expect(EconomySystem.getModelQualityMod('frontier')).toBe(0.15));
});

// Tests for EconomySystem.getModelDayCost — maps model tier to daily cost
describe('EconomySystem.getModelDayCost', () => {
  it('free → 0', () => expect(EconomySystem.getModelDayCost('free')).toBe(0));
  it('sketchy → 5', () => expect(EconomySystem.getModelDayCost('sketchy')).toBe(5));
  it('local → 0', () => expect(EconomySystem.getModelDayCost('local')).toBe(0));
  it('openSource → 10', () => expect(EconomySystem.getModelDayCost('openSource')).toBe(10));
  it('standard → 30', () => expect(EconomySystem.getModelDayCost('standard')).toBe(30));
  it('frontier → 100', () => expect(EconomySystem.getModelDayCost('frontier')).toBe(100));
});

// Tests for EconomySystem.getStrategyModifier — returns cost/quality/time data per strategy
describe('EconomySystem.getStrategyModifier', () => {
  it('planThenBuild → strategyCost 60, qualityMult 1.2, timeBonus 2', () => {
    const mod = EconomySystem.getStrategyModifier('planThenBuild');
    expect(mod.strategyCost).toBe(60);
    expect(mod.qualityMult).toBe(1.2);
    expect(mod.timeBonus).toBe(2);
  });

  it('justStart → strategyCost 30, qualityMult 1.0, timeBonus 0', () => {
    const mod = EconomySystem.getStrategyModifier('justStart');
    expect(mod.strategyCost).toBe(30);
    expect(mod.qualityMult).toBe(1.0);
    expect(mod.timeBonus).toBe(0);
  });

  it('oneShot → strategyCost 10, qualityMult 0.7, timeBonus -2', () => {
    const mod = EconomySystem.getStrategyModifier('oneShot');
    expect(mod.strategyCost).toBe(10);
    expect(mod.qualityMult).toBe(0.7);
    expect(mod.timeBonus).toBe(-2);
  });

  it('vibeCode → qualityMult >= 0.5 and < 1.5 every time (10 runs)', () => {
    for (let i = 0; i < 10; i++) {
      const mod = EconomySystem.getStrategyModifier('vibeCode');
      expect(mod.qualityMult).toBeGreaterThanOrEqual(0.5);
      expect(mod.qualityMult).toBeLessThan(1.5);
    }
  });

});

// Tests for EconomySystem.applyDayCosts — deducts costs, handles bankruptcy/discounts
describe('EconomySystem.applyDayCosts', () => {
  beforeEach(() => resetState());

  it('deducts model + strategy cost — standard ($30) + justStart ($30) → 440', () => {
    const state = createInitialState();
    state.budget = 500;
    state.model = 'standard';
    state.strategy = 'justStart';
    EconomySystem.applyDayCosts(state);
    expect(state.budget).toBe(440);
  });

  it('skips cost for corporateDev', () => {
    const state = createInitialState();
    state.budget = 500;
    state.playerClass = 'corporateDev';
    state.model = 'frontier';
    state.strategy = 'planThenBuild';
    EconomySystem.applyDayCosts(state);
    expect(state.budget).toBe(500);
  });

  it('broke flag + force-downgrade — frontier ($100) + planThenBuild ($60) → broke, free, budget 0', () => {
    const state = createInitialState();
    state.budget = 50;
    state.model = 'frontier';
    state.strategy = 'planThenBuild';
    EconomySystem.applyDayCosts(state);
    expect(state.eventFlags['broke']).toBe(true);
    expect(state.model).toBe('free');
    expect(state.budget).toBe(0);
  });

  it('applies modelCostDiscount=0.5 — frontier becomes $50, total=80 (50+30), budget 420', () => {
    const state = createInitialState();
    state.budget = 500;
    state.model = 'frontier';
    state.strategy = 'justStart';
    state.modelCostDiscount = 0.5;
    EconomySystem.applyDayCosts(state);
    // frontier $100 * 0.5 = $50, justStart $30 → $80 total
    expect(state.budget).toBe(420);
  });

  it('zero cost — free + oneShot → budget decreases by exactly 10', () => {
    const state = createInitialState();
    state.budget = 200;
    state.model = 'free';
    state.strategy = 'oneShot';
    EconomySystem.applyDayCosts(state);
    expect(state.budget).toBe(190);
  });

  it('broke flag NOT set when budget exactly covers costs', () => {
    const state = createInitialState();
    state.budget = 40; // standard $30 + oneShot $10 = $40
    state.model = 'standard';
    state.strategy = 'oneShot';
    EconomySystem.applyDayCosts(state);
    expect(state.budget).toBe(0);
    expect(state.eventFlags['broke']).toBeFalsy();
  });

  it('broke flag set when 1 short', () => {
    const state = createInitialState();
    state.budget = 39; // standard $30 + oneShot $10 = $40, 1 short
    state.model = 'standard';
    state.strategy = 'oneShot';
    EconomySystem.applyDayCosts(state);
    expect(state.eventFlags['broke']).toBe(true);
  });

  it('no strategy cost when strategy is null — only model cost deducted', () => {
    const state = createInitialState();
    state.budget = 500;
    state.model = 'standard';
    state.strategy = null;
    EconomySystem.applyDayCosts(state);
    expect(state.budget).toBe(470); // only $30 model cost
  });
});

// Tests for EconomySystem.getShopPrices — generates price map from items + day seed
describe('EconomySystem.getShopPrices', () => {
  it('returns price for every item — map size === SHOP_ITEMS.length', () => {
    const prices = EconomySystem.getShopPrices(SHOP_ITEMS, 1);
    expect(prices.size).toBe(SHOP_ITEMS.length);
  });

  it('prices within ±20% of baseCost', () => {
    const prices = EconomySystem.getShopPrices(SHOP_ITEMS, 1);
    for (const item of SHOP_ITEMS) {
      const price = prices.get(item.id)!;
      const min = Math.round(item.baseCost * 0.8);
      const max = Math.round(item.baseCost * 1.2);
      expect(price).toBeGreaterThanOrEqual(min);
      expect(price).toBeLessThanOrEqual(max);
    }
  });

  it('different days produce different prices', () => {
    const prices1 = EconomySystem.getShopPrices(SHOP_ITEMS, 1);
    const prices5 = EconomySystem.getShopPrices(SHOP_ITEMS, 5);
    // At least one item should have a different price
    const anyDiff = SHOP_ITEMS.some(item => prices1.get(item.id) !== prices5.get(item.id));
    expect(anyDiff).toBe(true);
  });

  it('same day always produces same prices', () => {
    const pricesA = EconomySystem.getShopPrices(SHOP_ITEMS, 3);
    const pricesB = EconomySystem.getShopPrices(SHOP_ITEMS, 3);
    for (const item of SHOP_ITEMS) {
      expect(pricesA.get(item.id)).toBe(pricesB.get(item.id));
    }
  });
});
