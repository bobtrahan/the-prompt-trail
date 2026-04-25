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

  it('justStart gives +5% strategy bonus — floor(50*0.05)===2', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'justStart', dummyClass, 1);
    expect(result.strategyBonus).toBe(Math.floor(50 * 0.05)); // 2
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

  it('total = baseRep + accuracyBonus + strategyBonus + modelBonus — complex case', () => {
    // progress=80, accuracy=0.75, planThenBuild, day=5 (maxRep=120), model=standard
    // baseRep = floor(80/100 * 120) = 96
    // accuracyBonus = floor(0.75 * 0.3 * 96) = floor(21.6) = 21
    // strategyBonus = floor(96 * 0.15) = floor(14.4) = 14
    // modelBonus = floor(96 * 0.10) = 9  (standard = +10%)
    // total = 96 + 21 + 14 + 9 = 140
    const result = ScoringSystem.calcDayReputation(80, 0.75, 'planThenBuild', dummyClass, 5, 'standard');
    expect(result.baseRep).toBe(96);
    expect(result.accuracyBonus).toBe(21);
    expect(result.strategyBonus).toBe(14);
    expect(result.modelBonus).toBe(9);
    expect(result.total).toBe(140);
  });

  it('free model gives -20% modelBonus — baseRep=50 → modelBonus=-10', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'justStart', dummyClass, 1, 'free');
    expect(result.modelBonus).toBe(Math.floor(50 * -0.20)); // -10
    // total = 50 + 0 + floor(50*0.05) + floor(50*-0.20) = 50 + 2 - 10 = 42
    expect(result.total).toBe(42);
  });

  it('frontier model gives +20% modelBonus — baseRep=50 → modelBonus=10', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'justStart', dummyClass, 1, 'frontier');
    expect(result.modelBonus).toBe(Math.floor(50 * 0.20)); // 10
    // total = 50 + 0 + floor(50*0.05) + 10 = 50 + 2 + 10 = 62
    expect(result.total).toBe(62);
  });

  it('day 13 uses maxReputation 500', () => {
    const result = ScoringSystem.calcDayReputation(100, 0, 'justStart', dummyClass, 13, 'openSource');
    expect(result.baseRep).toBe(500);
    expect(result.modelBonus).toBe(0); // openSource = 0% mod
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

  it('rank S for >= 115% of maxPossibleRaw (2730) — dayScores summing to >= 3140', () => {
    // maxPossibleRaw = sum of all project maxReputation = 2730
    // 115% = 3139.5 → need 3140
    const result = ScoringSystem.calcFinalScore([3140], 1.0);
    expect(result.rank).toBe('S');
  });

  it('rank A for >= 90% but < 115%', () => {
    // 90% of 2730 = 2457, 115% = 3139.5
    const result = ScoringSystem.calcFinalScore([2600], 1.0);
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

  it('rank based on rawTotal not finalScore — dayScores summing to 2500 → A regardless of multiplier', () => {
    // 2500/2730 = 0.916 — above A threshold (0.90), below S threshold (1.15)
    const result = ScoringSystem.calcFinalScore([2500], 0.1);
    expect(result.rank).toBe('A');
  });
});
