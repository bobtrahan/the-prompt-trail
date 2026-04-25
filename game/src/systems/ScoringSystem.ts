import { PROJECTS } from '../data/projects';
import type { Strategy, ModelTier } from './GameState';
import type { ClassDef } from '../data/classes';
import { EconomySystem } from './EconomySystem';

export interface DayScore {
  baseRep: number;
  accuracyBonus: number;
  strategyBonus: number;
  modelBonus: number;
  total: number;
}

export interface FinalScore {
  rawTotal: number;
  multiplier: number;
  finalScore: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export class ScoringSystem {
  /**
   * Calculate reputation earned for a single day from progress, accuracy, strategy, model, and day difficulty.
   * @param progress Completion percentage (0–100).
   * @param accuracy Typing accuracy (0–1).
   * @param strategy Player strategy choice.
   * @param _classDef Class definition (reserved for future class-specific modifiers).
   * @param day Current day number (1–13), used to look up maxReputation.
   * @param model Active model tier; defaults to 'standard'.
   * @returns Breakdown of baseRep, accuracyBonus, strategyBonus, modelBonus, and total.
   */
  static calcDayReputation(
    progress: number,
    accuracy: number,
    strategy: Strategy,
    _classDef: ClassDef, // Keeping for API consistency, underscore for unused
    day: number,
    model: ModelTier = 'standard'
  ): DayScore {
    const project = PROJECTS[day - 1];
    const maxRepForDay = project ? project.maxReputation : 100;

    // baseRep = (progress/100) * maxRepForDay
    const baseRep = Math.floor((progress / 100) * maxRepForDay);

    // accuracyBonus = accuracy * 0.3 * baseRep
    const accuracyBonus = Math.floor(accuracy * 0.3 * baseRep);

    // strategyMod: planThenBuild +15%, justStart 0%, oneShot -10%, vibeCode random(-20% to +40%)
    let strategyMod = 0;
    switch (strategy) {
      case 'planThenBuild':
        strategyMod = 0.15;
        break;
      case 'justStart':
        strategyMod = 0;
        break;
      case 'oneShot':
        strategyMod = -0.10;
        break;
      case 'vibeCode':
        // random(-0.2 to +0.4)
        strategyMod = Math.random() * 0.6 - 0.2;
        break;
      default: {
        const _exhaustive: never = strategy;
        throw new Error(`Unhandled strategy: ${_exhaustive}`);
      }
    }

    const strategyBonus = Math.floor(baseRep * strategyMod);

    // Model quality bonus: free = -15%, frontier = +15%
    const modelQualityMod = EconomySystem.getModelQualityMod(model);
    const modelBonus = Math.floor(baseRep * modelQualityMod);

    const total = baseRep + accuracyBonus + strategyBonus + modelBonus;

    return {
      baseRep,
      accuracyBonus,
      strategyBonus,
      modelBonus,
      total,
    };
  }

  /**
   * Compute the final score and rank from accumulated day scores and class multiplier.
   * @param dayScores Array of per-day reputation totals.
   * @param classMultiplier Class score multiplier applied to rawTotal.
   * @returns rawTotal, multiplier, finalScore, and letter rank (S/A/B/C/D/F).
   */
  static calcFinalScore(dayScores: number[], classMultiplier: number): FinalScore {
    const rawTotal = dayScores.reduce((sum, score) => sum + score, 0);
    const finalScore = Math.floor(rawTotal * classMultiplier);

    // Total possible base rep (100% progress, 100% accuracy, best strategy +15%)
    // But we'll base it on just the sum of maxReputation across 13 days for simplicity
    const maxPossibleRaw = PROJECTS.reduce((sum, p) => sum + p.maxReputation, 0);
    
    // Calculate percentage based on rawTotal vs maxPossibleRaw
    // (Ignoring multiplier for rank thresholds so harder classes can actually get S)
    const percentage = rawTotal / maxPossibleRaw;

    let rank: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (percentage >= 0.90) rank = 'S';
    else if (percentage >= 0.75) rank = 'A';
    else if (percentage >= 0.60) rank = 'B';
    else if (percentage >= 0.45) rank = 'C';
    else if (percentage >= 0.30) rank = 'D';

    return {
      rawTotal,
      multiplier: classMultiplier,
      finalScore,
      rank,
    };
  }
}
