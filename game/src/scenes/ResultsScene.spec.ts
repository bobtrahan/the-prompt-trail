import { describe, expect, it } from 'vitest';
import { calcRunningGrade } from './resultsGrade';

describe('calcRunningGrade', () => {
  it('uses cumulative earned rep against cumulative project max through the completed day', () => {
    const result = calcRunningGrade([50, 45, 30], 3);

    expect(result.cumulativeEarned).toBe(125);
    expect(result.cumulativePossible).toBe(185);
    expect(result.rank).toBe('B');
  });

  it('ignores future day scores beyond the completed day', () => {
    const result = calcRunningGrade([45, 999], 1);

    expect(result.cumulativeEarned).toBe(45);
    expect(result.cumulativePossible).toBe(50);
    expect(result.rank).toBe('S');
  });

  it('matches the S/A/B/C/D/F thresholds used for final rank cutoffs', () => {
    expect(calcRunningGrade([45], 1).rank).toBe('S');
    expect(calcRunningGrade([38], 1).rank).toBe('A');
    expect(calcRunningGrade([30], 1).rank).toBe('B');
    expect(calcRunningGrade([23], 1).rank).toBe('C');
    expect(calcRunningGrade([15], 1).rank).toBe('D');
    expect(calcRunningGrade([14], 1).rank).toBe('F');
  });
});
