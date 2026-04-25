import { describe, it, expect, beforeEach } from 'vitest';
import { ShopSystem } from './ShopSystem';
import { createInitialState, resetState } from './GameState';
import type { ItemDef } from '../data/items';
import { SHOP_ITEMS } from '../data/items';

function makeItem(overrides: Partial<ItemDef> = {}): ItemDef {
  return {
    id: 'test-item',
    name: 'Test Item',
    category: 'consumable',
    baseCost: 100,
    description: 'A test item',
    effect: 'Test effect',
    ...overrides,
  };
}

// Tests for ShopSystem.canBuy — checks purchase eligibility logic
describe('ShopSystem.canBuy', () => {
  beforeEach(() => resetState());

  it('returns ok:true when budget is sufficient', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({ baseCost: 100 });
    expect(ShopSystem.canBuy(state, item, 100)).toEqual({ ok: true });
  });

  it('returns insufficient funds when budget < price', () => {
    const state = createInitialState();
    state.budget = 50;
    const item = makeItem({ baseCost: 100 });
    expect(ShopSystem.canBuy(state, item, 100)).toEqual({ ok: false, reason: 'Insufficient funds' });
  });

  it('returns already unlocked for owned model', () => {
    const state = createInitialState();
    state.budget = 500;
    state.unlockedModels = ['free', 'standard'];
    const item = makeItem({
      category: 'model',
      mechanical: { type: 'unlockModel', value: 'standard' },
    });
    expect(ShopSystem.canBuy(state, item, 100)).toEqual({ ok: false, reason: 'Model already unlocked' });
  });

  it('allows buying a model not yet unlocked', () => {
    const state = createInitialState();
    state.budget = 500;
    state.unlockedModels = ['free'];
    const item = makeItem({
      category: 'model',
      mechanical: { type: 'unlockModel', value: 'standard' },
    });
    expect(ShopSystem.canBuy(state, item, 100)).toEqual({ ok: true });
  });

  it('returns already installed for owned hardware', () => {
    const state = createInitialState();
    state.budget = 500;
    state.ownedUpgrades = ['hw-monitor'];
    const item = makeItem({ id: 'hw-monitor', category: 'hardware' });
    expect(ShopSystem.canBuy(state, item, 75)).toEqual({ ok: false, reason: 'Upgrade already installed' });
  });

  it('returns already unlocked for agent slot at or above current', () => {
    const state = createInitialState();
    state.budget = 500;
    state.agentSlots = 2;
    const item = makeItem({
      category: 'agentSlot',
      mechanical: { type: 'unlockSlot', value: 2 },
    });
    expect(ShopSystem.canBuy(state, item, 100)).toEqual({ ok: false, reason: 'Slot already unlocked' });
  });

  it('allows buying agent slot above current', () => {
    const state = createInitialState();
    state.budget = 500;
    state.agentSlots = 1;
    const item = makeItem({
      category: 'agentSlot',
      mechanical: { type: 'unlockSlot', value: 2 },
    });
    expect(ShopSystem.canBuy(state, item, 100)).toEqual({ ok: true });
  });

  it('returns already purchased for owned joke', () => {
    const state = createInitialState();
    state.budget = 500;
    state.purchasedJokes = ['joke-quantum'];
    const item = makeItem({ id: 'joke-quantum', category: 'joke' });
    expect(ShopSystem.canBuy(state, item, 50)).toEqual({ ok: false, reason: 'Already purchased' });
  });

  it('blocks repair when hardware is 100', () => {
    const state = createInitialState();
    state.budget = 500;
    state.hardwareHp = 100;
    const item = makeItem({ category: 'repair' });
    expect(ShopSystem.canBuy(state, item, 50)).toEqual({ ok: false, reason: 'Hardware at maximum health' });
  });
});

// Tests for ShopSystem.buyItem — checks purchase effects on game state
describe('ShopSystem.buyItem', () => {
  beforeEach(() => resetState());

  it('deducts budget on successful purchase', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({ category: 'consumable', mechanical: { type: 'nextDaySpeed', value: 0.05 } });
    ShopSystem.buyItem(state, item, 100);
    expect(state.budget).toBe(400);
  });

  it('returns success:false if canBuy fails', () => {
    const state = createInitialState();
    state.budget = 0;
    const item = makeItem({ baseCost: 100 });
    const result = ShopSystem.buyItem(state, item, 100);
    expect(result.success).toBe(false);
  });

  it('unlocks model on model purchase', () => {
    const state = createInitialState();
    state.budget = 500;
    state.unlockedModels = ['free'];
    const item = makeItem({
      category: 'model',
      mechanical: { type: 'unlockModel', value: 'frontier' },
    });
    ShopSystem.buyItem(state, item, 100);
    expect(state.unlockedModels).toContain('frontier');
  });

  it('unlocks agent slot', () => {
    const state = createInitialState();
    state.budget = 500;
    state.agentSlots = 1;
    const item = makeItem({
      category: 'agentSlot',
      mechanical: { type: 'unlockSlot', value: 2 },
    });
    ShopSystem.buyItem(state, item, 100);
    expect(state.agentSlots).toBe(2);
  });

  it('adds hardware upgrade to ownedUpgrades', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({
      id: 'hw-monitor',
      category: 'hardware',
      mechanical: { type: 'globalSpeed', value: 0.05 },
    });
    ShopSystem.buyItem(state, item, 75);
    expect(state.ownedUpgrades).toContain('hw-monitor');
  });

  it('adds consumable to activeConsumables', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({
      id: 'con-coffee',
      category: 'consumable',
      mechanical: { type: 'nextDaySpeed', value: 0.05 },
    });
    ShopSystem.buyItem(state, item, 100);
    expect(state.activeConsumables).toContain('con-coffee');
  });

  it('repairs hardware (capped at 100)', () => {
    const state = createInitialState();
    state.budget = 500;
    state.hardwareHp = 80;
    const item = makeItem({
      category: 'repair',
      mechanical: { type: 'repairHardware', value: 30 },
    });
    ShopSystem.buyItem(state, item, 50);
    expect(state.hardwareHp).toBe(100);
  });

  it('repairs hardware (partial heal)', () => {
    const state = createInitialState();
    state.budget = 500;
    state.hardwareHp = 50;
    const item = makeItem({
      category: 'repair',
      mechanical: { type: 'repairHardware', value: 30 },
    });
    ShopSystem.buyItem(state, item, 50);
    expect(state.hardwareHp).toBe(80);
  });

  it('joke item adds to purchasedJokes', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({
      id: 'joke-quantum',
      category: 'joke',
      jokeResult: 'It works!',
    });
    ShopSystem.buyItem(state, item, 50);
    expect(state.purchasedJokes).toContain('joke-quantum');
  });

  it('joke item returns jokeResult as message', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({
      id: 'joke-test',
      category: 'joke',
      jokeResult: 'Ha ha very funny',
    });
    const result = ShopSystem.buyItem(state, item, 50);
    expect(result.message).toBe('Ha ha very funny');
  });

  it('joke-egpu refunds $25', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({
      id: 'joke-egpu',
      category: 'joke',
      jokeResult: 'You got a refund!',
    });
    ShopSystem.buyItem(state, item, 75);
    expect(state.budget).toBe(450); // 500 - 75 + 25 = 450
  });

  it('cannot buy same joke twice', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({
      id: 'joke-dup',
      category: 'joke',
      jokeResult: 'Heh',
    });
    ShopSystem.buyItem(state, item, 50);
    const result = ShopSystem.buyItem(state, item, 50);
    expect(result.success).toBe(false);
  });

  it('cannot buy same hardware twice', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({
      id: 'hw-monitor',
      category: 'hardware',
      mechanical: { type: 'globalSpeed', value: 0.05 },
    });
    ShopSystem.buyItem(state, item, 75);
    const result = ShopSystem.buyItem(state, item, 75);
    expect(result.success).toBe(false);
  });

  it('consumables can be bought multiple times', () => {
    const state = createInitialState();
    state.budget = 500;
    const item = makeItem({
      id: 'con-coffee',
      category: 'consumable',
      mechanical: { type: 'nextDaySpeed', value: 0.05 },
    });
    const r1 = ShopSystem.buyItem(state, item, 50);
    const r2 = ShopSystem.buyItem(state, item, 50);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});

// Tests for ShopSystem.getDealOfTheDay — checks daily deal rotation logic
describe('ShopSystem.getDealOfTheDay', () => {
  it('returns an item id from filtered list (not joke or repair)', () => {
    const deal = ShopSystem.getDealOfTheDay(SHOP_ITEMS, 1);
    const item = SHOP_ITEMS.find(i => i.id === deal);
    expect(item).toBeDefined();
    expect(item!.category).not.toBe('joke');
    expect(item!.category).not.toBe('repair');
  });

  it('different days return different deals', () => {
    const deal1 = ShopSystem.getDealOfTheDay(SHOP_ITEMS, 1);
    const deal2 = ShopSystem.getDealOfTheDay(SHOP_ITEMS, 2);
    // They may differ (depends on list length — just ensure the function runs both)
    // With enough items they should differ
    expect(typeof deal1).toBe('string');
    expect(typeof deal2).toBe('string');
    // They shouldn't be the same given a sufficiently large filtered list
    expect(deal1).not.toBe(deal2);
  });

  it('returns empty string for empty list', () => {
    expect(ShopSystem.getDealOfTheDay([], 1)).toBe('');
  });

  it('never returns a joke or repair — iterate days 1-13', () => {
    for (let day = 1; day <= 13; day++) {
      const deal = ShopSystem.getDealOfTheDay(SHOP_ITEMS, day);
      const item = SHOP_ITEMS.find(i => i.id === deal);
      expect(item).toBeDefined();
      expect(item!.category).not.toBe('joke');
      expect(item!.category).not.toBe('repair');
    }
  });
});
