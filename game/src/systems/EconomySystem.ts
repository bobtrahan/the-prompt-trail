import type { GameState, ModelTier, Strategy } from './GameState';
import type { ItemDef } from '../data/items';

export class EconomySystem {
  /**
   * Return the reputation modifier (−0.15 to +0.15) for a given model tier.
   * @param model The active model tier.
   * @returns Decimal multiplier applied to baseRep as a bonus.
   */
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
      default: {
        const _exhaustive: never = model;
        return _exhaustive;
      }
    }
  }

  /**
   * Return the daily budget cost in dollars for a given model tier.
   * @param model The active model tier.
   * @returns Cost in dollars deducted at the end of each day.
   */
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
      default: {
        const _exhaustive: never = model;
        return _exhaustive;
      }
    }
  }

  /**
   * Return time/cost/quality modifiers and risk label for a given strategy.
   * @param strategy The chosen strategy.
   * @returns Object with timeBonus (seconds), costMult, qualityMult, strategyCost, and riskLabel.
   */
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
      default: {
        const _exhaustive: never = strategy;
        return _exhaustive;
      }
    }
  }

  /**
   * Deduct model and strategy costs from state.budget; set 'broke' flag and force free tier if bankrupt.
   * @param state Mutable game state; budget, model, and eventFlags are modified in place.
   */
  static applyDayCosts(state: GameState): void {
    // Skip cost deduction if Corporate Dev (Company Card)
    if (state.playerClass === 'corporateDev') {
      return;
    }

    let modelCost = this.getModelDayCost(state.model);
    if (state.eventFlags['model-cost-triple']) {
      modelCost *= 3;
    }
    let finalModelCost = modelCost;
    if (state.modelCostDiscount > 0) {
      finalModelCost = Math.round(modelCost * (1 - state.modelCostDiscount));
    }

    const strategyCost = state.strategy ? this.getStrategyModifier(state.strategy).strategyCost : 0;
    state.budget -= (finalModelCost + strategyCost);

    if (state.budget < 0) {
      state.eventFlags['broke'] = true;
      // Force downgrade to free tier — API credits revoked
      state.model = 'free';
      state.budget = 0; // Clamp to zero, no negative tracking
    }
  }

  /**
   * Generate a seeded price map for shop items with ±20% fluctuation based on day.
   * @param items Array of item definitions with baseCost.
   * @param day Current day number used as part of the price seed.
   * @returns Map of item id → price in dollars.
   */
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
