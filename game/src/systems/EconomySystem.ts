import type { GameState, ModelTier, Strategy } from './GameState';
import type { ItemDef } from '../data/items';

export class EconomySystem {
  static getModelDayCost(model: ModelTier): number {
    switch (model) {
      case 'free':
        return 0;
      case 'standard':
        return 30;
      case 'frontier':
        return 100;
      case 'local':
        return 0;
      case 'sketchy':
        return 5;
      case 'openSource':
        return 10;
      default:
        return 0;
    }
  }

  static getStrategyModifier(strategy: Strategy): {
    timeBonus: number;
    costMult: number;
    qualityMult: number;
  } {
    switch (strategy) {
      case 'planThenBuild':
        return { timeBonus: 2, costMult: 1.0, qualityMult: 1.2 };
      case 'justStart':
        return { timeBonus: 0, costMult: 1.0, qualityMult: 1.0 };
      case 'oneShot':
        return { timeBonus: -2, costMult: 0.7, qualityMult: 0.7 };
      case 'vibeCode':
        return { 
          timeBonus: 1, 
          costMult: 1.5, 
          qualityMult: 0.5 + Math.random() // random quality (0.5–1.5)
        };
      default:
        return { timeBonus: 0, costMult: 1.0, qualityMult: 1.0 };
    }
  }

  static applyDayCosts(state: GameState): void {
    // Skip cost deduction if Corporate Dev (Company Card)
    if (state.playerClass === 'corporateDev') {
      return;
    }

    const modelCost = this.getModelDayCost(state.model);
    state.budget -= modelCost;

    if (state.budget < 0) {
      state.eventFlags['broke'] = true;
    }
  }

  static getShopPrices(items: ItemDef[], day: number): Map<string, number> {
    const prices = new Map<string, number>();

    items.forEach((item, index) => {
      // Use a simple seeded approach for price fluctuation (±20%)
      // Using index + day as a simple seed
      const seed = day * (index + 1);
      const fluctuation = Math.sin(seed) * 0.2; // -0.2 to +0.2
      const finalPrice = Math.round(item.cost * (1 + fluctuation));
      prices.set(item.id, finalPrice);
    });

    return prices;
  }
}
