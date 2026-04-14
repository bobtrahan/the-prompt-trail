import { PROJECTS } from '../data/projects';
import type { Strategy, ClassDef } from './GameState';

export interface DayScore {
  baseRep: number;
  accuracyBonus: number;
  strategyBonus: number;
  total: number;
}

export interface FinalScore {
  rawTotal: number;
  multiplier: number;
  finalScore: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export class ScoringSystem {
  static calcDayReputation(
    progress: number,
    accuracy: number,
    strategy: Strategy,
    _classDef: ClassDef, // Keeping for API consistency, underscore for unused
    day: number
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
    }

    const strategyBonus = Math.floor(baseRep * strategyMod);
    const total = baseRep + accuracyBonus + strategyBonus;

    return {
      baseRep,
      accuracyBonus,
      strategyBonus,
      total,
    };
  }

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
