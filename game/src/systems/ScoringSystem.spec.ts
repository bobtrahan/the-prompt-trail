import { describe, it, expect } from 'vitest';
import { ScoringSystem } from './ScoringSystem';
import { PROJECTS } from '../data/projects';
import type { ClassDef } from '../data/classes';
import { CLASS_DEFS } from '../data/classes';

const dummyClass: ClassDef = CLASS_DEFS.indieHacker;

// Tests for ScoringSystem.calcDayReputation — calculates per-day rep from progress/accuracy/strategy
describe('ScoringSystem.calcDayReputation', () => {
  it('0% progress yields 0 total', () => {
    const result = ScoringSystem.calcDayReputation(0, 1.0, 'justStart', dummyClass, 1);
    expect(result.total).toBe(0);
  });

  it('100% progress yields maxReputation as baseRep — PROJECTS[0].maxReputation (50)', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'justStart', dummyClass, 1);
    expect(result.baseRep).toBe(PROJECTS[0].maxReputation); // 50
  });

  it('50% progress yields half maxReputation as baseRep', () => {
    const result = ScoringSystem.calcDayReputation(50, 0, 'justStart', dummyClass, 1);
    expect(result.baseRep).toBe(25);
  });

  it('accuracy bonus = floor(accuracy * 0.3 * baseRep) — progress=100, accuracy=1.0 → 15', () => {
    const result = ScoringSystem.calcDayReputation(100, 1.0, 'justStart', dummyClass, 1);
    // baseRep = 50, accuracyBonus = floor(1.0 * 0.3 * 50) = 15
    expect(result.accuracyBonus).toBe(15);
  });

  it('accuracy=0 yields 0 accuracy bonus', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'justStart', dummyClass, 1);
    expect(result.accuracyBonus).toBe(0);
  });

  it('planThenBuild gives +15% strategy bonus — floor(50*0.15)===7', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'planThenBuild', dummyClass, 1);
    expect(result.strategyBonus).toBe(Math.floor(50 * 0.15)); // 7
  });

  it('justStart gives 0 strategy bonus', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'justStart', dummyClass, 1);
    expect(result.strategyBonus).toBe(0);
  });

  it('oneShot gives -10% — floor(50*-0.10)===-5', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'oneShot', dummyClass, 1);
    expect(result.strategyBonus).toBe(Math.floor(50 * -0.10)); // -5
  });

  it('vibeCode strategy bonus bounded [-20%, +40%] — run 20 times', () => {
    for (let i = 0; i < 20; i++) {
      const result = ScoringSystem.calcDayReputation(100, 0, 'vibeCode', dummyClass, 1);
      const baseRep = 50;
      const minBonus = Math.floor(baseRep * -0.2);
      const maxBonus = Math.floor(baseRep * 0.4);
      expect(result.strategyBonus).toBeGreaterThanOrEqual(minBonus);
      expect(result.strategyBonus).toBeLessThanOrEqual(maxBonus);
    }
  });

  it('total = baseRep + accuracyBonus + strategyBonus — complex case', () => {
    // progress=80, accuracy=0.75, planThenBuild, day=5 (maxRep=120)
    // baseRep = floor(80/100 * 120) = 96
    // accuracyBonus = floor(0.75 * 0.3 * 96) = floor(21.6) = 21
    // strategyBonus = floor(96 * 0.15) = floor(14.4) = 14
    // total = 96 + 21 + 14 = 131
    const result = ScoringSystem.calcDayReputation(80, 0.75, 'planThenBuild', dummyClass, 5);
    expect(result.baseRep).toBe(96);
    expect(result.accuracyBonus).toBe(21);
    expect(result.strategyBonus).toBe(14);
    expect(result.total).toBe(131);
  });

  it('day 13 uses maxReputation 500', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'justStart', dummyClass, 13);
    expect(result.baseRep).toBe(500);
  });
});

// Tests for ScoringSystem.calcFinalScore — sums scores, applies multiplier, assigns rank
describe('ScoringSystem.calcFinalScore', () => {
  it('rawTotal is sum of dayScores — [10,20,30] → 60', () => {
    const result = ScoringSystem.calcFinalScore([10, 20, 30], 1.0);
    expect(result.rawTotal).toBe(60);
  });

  it('finalScore applies class multiplier — rawTotal 100, multiplier 2.0 → 200', () => {
    const result = ScoringSystem.calcFinalScore([100], 2.0);
    expect(result.finalScore).toBe(200);
  });

  it('floors fractional — rawTotal 33, multiplier 1.5 → 49', () => {
    const result = ScoringSystem.calcFinalScore([33], 1.5);
    expect(result.finalScore).toBe(49);
  });

  it('rank S for >= 90% of maxPossibleRaw (2730) — dayScores summing to >= 2457', () => {
    // maxPossibleRaw = sum of all project maxReputation = 2730
    // 90% = 2457
    const result = ScoringSystem.calcFinalScore([2457], 1.0);
    expect(result.rank).toBe('S');
  });

  it('rank A for >= 75% but < 90%', () => {
    // 75% of 2730 = 2047.5, 90% = 2457
    const result = ScoringSystem.calcFinalScore([2100], 1.0);
    expect(result.rank).toBe('A');
  });

  it('rank F for < 30%', () => {
    // 30% of 2730 = 819
    const result = ScoringSystem.calcFinalScore([100], 1.0);
    expect(result.rank).toBe('F');
  });

  it('empty dayScores → rawTotal 0, rank F', () => {
    const result = ScoringSystem.calcFinalScore([], 1.0);
    expect(result.rawTotal).toBe(0);
    expect(result.rank).toBe('F');
  });

  it('rank based on rawTotal not finalScore — dayScores summing to 2500 → S regardless of multiplier', () => {
    const result = ScoringSystem.calcFinalScore([2500], 0.1);
    expect(result.rank).toBe('S');
  });
});
