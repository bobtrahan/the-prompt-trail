import { describe, expect, it } from 'vitest';
import { calcRunningGrade } from './resultsGrade';

// Day 1 cumulativePossible = 50 (PROJECTS[0].maxReputation).
// Exact threshold ratios at possible=50:
//   S  ≥ 0.90 → score ≥ 45     (45/50 = 0.90)
//   A  ≥ 0.75 → score ≥ 37.5   (38/50 = 0.76, 37/50 = 0.74)
//   B  ≥ 0.60 → score ≥ 30     (30/50 = 0.60)
//   C  ≥ 0.45 → score ≥ 22.5   (23/50 = 0.46, 22/50 = 0.44)
//   D  ≥ 0.30 → score ≥ 15     (15/50 = 0.30)
//   F  < 0.30 → score < 15

describe('calcRunningGrade — S/A/B/C/D/F threshold boundaries', () => {
  // S boundary: ≥0.90
  it('score=45 (45/50=0.90) is rank S — at threshold', () => {
    expect(calcRunningGrade([45], 1).rank).toBe('S');
  });
  it('score=44 (44/50=0.88) is rank A — just below S threshold', () => {
    expect(calcRunningGrade([44], 1).rank).toBe('A');
  });

  // A boundary: ≥0.75
  it('score=38 (38/50=0.76) is rank A — above A threshold', () => {
    expect(calcRunningGrade([38], 1).rank).toBe('A');
  });
  it('score=37 (37/50=0.74) is rank B — just below A threshold', () => {
    expect(calcRunningGrade([37], 1).rank).toBe('B');
  });

  // B boundary: ≥0.60
  it('score=30 (30/50=0.60) is rank B — at threshold', () => {
    expect(calcRunningGrade([30], 1).rank).toBe('B');
  });
  it('score=29 (29/50=0.58) is rank C — just below B threshold', () => {
    expect(calcRunningGrade([29], 1).rank).toBe('C');
  });

  // C boundary: ≥0.45
  it('score=23 (23/50=0.46) is rank C — above C threshold', () => {
    expect(calcRunningGrade([23], 1).rank).toBe('C');
  });
  it('score=22 (22/50=0.44) is rank D — just below C threshold', () => {
    expect(calcRunningGrade([22], 1).rank).toBe('D');
  });

  // D boundary: ≥0.30
  it('score=15 (15/50=0.30) is rank D — at threshold', () => {
    expect(calcRunningGrade([15], 1).rank).toBe('D');
  });
  it('score=14 (14/50=0.28) is rank F — just below D threshold', () => {
    expect(calcRunningGrade([14], 1).rank).toBe('F');
  });
});

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
