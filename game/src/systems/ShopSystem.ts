import type { ItemDef } from '../data/items';
import type { GameState, ModelTier } from './GameState';

export class ShopSystem {
  /**
   * Checks if an item can be purchased.
   */
  static canBuy(state: GameState, item: ItemDef, price: number): { ok: boolean; reason?: string } {
    // 1. Check budget
    if (state.budget < price) {
      return { ok: false, reason: 'Insufficient funds' };
    }

    // 2. Check if already owned/unlocked
    if (item.category === 'model') {
      const modelTier = item.mechanical?.value as ModelTier;
      if (state.unlockedModels.includes(modelTier)) {
        return { ok: false, reason: 'Model already unlocked' };
      }
    }

    if (item.category === 'hardware') {
      if (state.ownedUpgrades.includes(item.id)) {
        return { ok: false, reason: 'Upgrade already installed' };
      }
    }

    if (item.category === 'agentSlot') {
      const slotCount = item.mechanical?.value as number;
      if (state.agentSlots >= slotCount) {
        return { ok: false, reason: 'Slot already unlocked' };
      }
    }

    if (item.category === 'joke') {
      if (state.purchasedJokes.includes(item.id)) {
        return { ok: false, reason: 'Already purchased' };
      }
    }

    // Note: consumables and repairs can be bought multiple times (repairs if health < 100)
    if (item.category === 'repair' && state.hardwareHp >= 100) {
      return { ok: false, reason: 'Hardware at maximum health' };
    }

    return { ok: true };
  }

  /**
   * Applies the purchase of an item to the game state.
   */
  static buyItem(state: GameState, item: ItemDef, price: number): { success: boolean; message: string } {
    const check = this.canBuy(state, item, price);
    if (!check.ok) {
      return { success: false, message: check.reason || 'Cannot buy item' };
    }

    // Deduct budget
    state.budget -= price;

    // Joke items handling
    if (item.category === 'joke') {
      state.purchasedJokes.push(item.id);
      
      // Special case: joke-egpu refunds 25
      if (item.id === 'joke-egpu') {
        state.budget += 25;
      }

      return { success: true, message: item.jokeResult || 'Purchased!' };
    }

    // Mechanical effects application
    if (item.mechanical) {
      const { type, value } = item.mechanical;

      switch (type) {
        case 'unlockModel':
          state.unlockedModels.push(value as ModelTier);
          break;

        case 'unlockSlot':
          state.agentSlots = Math.max(state.agentSlots, value as number);
          break;

        case 'eventWeightMod':
        case 'localModelSpeed':
        case 'immuneTo':
        case 'globalSpeed':
        case 'typingForgiveness':
        case 'autoResolve':
          state.ownedUpgrades.push(item.id);
          break;

        case 'nextDaySpeed':
        case 'nextDaySpeedJitters':
        case 'oneTimeProtection':
        case 'modelCostDiscount':
        case 'oneTimeAutoResolve':
          state.activeConsumables.push(item.id);
          break;

        case 'repairHardware':
          state.hardwareHp = Math.min(100, state.hardwareHp + 30);
          break;
      }
    }

    return { success: true, message: `Successfully purchased ${item.name}!` };
  }

  /**
   * Returns the item ID for the "Deal of the Day" (50% off).
   * Rotates daily through non-joke items.
   */
  static getDealOfTheDay(items: ItemDef[], day: number): string {
    const filteredItems = items.filter(i => i.category !== 'joke' && i.category !== 'repair');
    if (filteredItems.length === 0) return '';
    
    return filteredItems[day % filteredItems.length].id;
  }
}
