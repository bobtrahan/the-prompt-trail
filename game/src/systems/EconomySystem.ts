import type { GameState, ModelTier, Strategy } from './GameState';
import type { ItemDef } from '../data/items';

export class EconomySystem {
  static getModelQualityMod(model: ModelTier): number {
    switch (model) {
      case 'free':
        return -0.15;
      case 'sketchy':
        return -0.10;
      case 'local':
        return -0.05;
      case 'openSource':
        return 0;
      case 'standard':
        return 0.05;
      case 'frontier':
        return 0.15;
      default:
        return 0;
    }
  }

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
    strategyCost: number;
    riskLabel: string;
  } {
    switch (strategy) {
      case 'planThenBuild':
        return { timeBonus: 2, costMult: 1.0, qualityMult: 1.2, strategyCost: 60, riskLabel: 'Low Risk · $60' };
      case 'justStart':
        return { timeBonus: 0, costMult: 1.0, qualityMult: 1.0, strategyCost: 30, riskLabel: 'Medium Risk · $30' };
      case 'oneShot':
        return { timeBonus: -2, costMult: 0.7, qualityMult: 0.7, strategyCost: 10, riskLabel: 'High Risk · $10' };
      case 'vibeCode':
        return { 
          timeBonus: 1, 
          costMult: 1.5, 
          qualityMult: 0.5 + Math.random(),
          strategyCost: 45,
          riskLabel: '??? · $45',
        };
      default:
        return { timeBonus: 0, costMult: 1.0, qualityMult: 1.0, strategyCost: 0, riskLabel: '' };
    }
  }

  static applyDayCosts(state: GameState): void {
    // Skip cost deduction if Corporate Dev (Company Card)
    if (state.playerClass === 'corporateDev') {
      return;
    }

    const modelCost = this.getModelDayCost(state.model);
    const strategyCost = state.strategy ? this.getStrategyModifier(state.strategy).strategyCost : 0;
    state.budget -= (modelCost + strategyCost);

    if (state.budget < 0) {
      state.eventFlags['broke'] = true;
      // Force downgrade to free tier — API credits revoked
      state.model = 'free';
      state.budget = 0; // Clamp to zero, no negative tracking
    }
  }

  static getShopPrices(items: ItemDef[], day: number): Map<string, number> {
    const prices = new Map<string, number>();

    items.forEach((item, index) => {
      // Use a simple seeded approach for price fluctuation (±20%)
      // Using index + day as a simple seed
      const seed = day * (index + 1);
      const fluctuation = Math.sin(seed) * 0.2; // -0.2 to +0.2
      const finalPrice = Math.round(item.baseCost * (1 + fluctuation));
      prices.set(item.id, finalPrice);
    });

    return prices;
  }
}
