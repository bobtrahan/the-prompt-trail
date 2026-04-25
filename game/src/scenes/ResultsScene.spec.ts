import { describe, expect, it } from 'vitest';
import { calcRunningGrade } from './resultsGrade';

// Day 1 cumulativePossible = 50 (PROJECTS[0].maxReputation).
// Exact threshold ratios at possible=50:
//   S  ≥ 1.15 → score ≥ 57.5  (58/50=1.16, 57/50=1.14)
//   A  ≥ 0.90 → score ≥ 45    (45/50=0.90, 44/50=0.88)
//   B  ≥ 0.70 → score ≥ 35    (35/50=0.70, 34/50=0.68)
//   C  ≥ 0.50 → score ≥ 25    (25/50=0.50, 24/50=0.48)
//   D  ≥ 0.30 → score ≥ 15    (15/50=0.30)
//   F  < 0.30 → score < 15

describe('calcRunningGrade — S/A/B/C/D/F threshold boundaries', () => {
  // S boundary: ≥1.15
  it('score=58 (58/50=1.16) is rank S — at threshold', () => {
    expect(calcRunningGrade([58], 1).rank).toBe('S');
  });
  it('score=57 (57/50=1.14) is rank A — just below S threshold', () => {
    expect(calcRunningGrade([57], 1).rank).toBe('A');
  });

  // A boundary: ≥0.90
  it('score=45 (45/50=0.90) is rank A — at A threshold', () => {
    expect(calcRunningGrade([45], 1).rank).toBe('A');
  });
  it('score=44 (44/50=0.88) is rank B — just below A threshold', () => {
    expect(calcRunningGrade([44], 1).rank).toBe('B');
  });

  // B boundary: ≥0.70
  it('score=35 (35/50=0.70) is rank B — at threshold', () => {
    expect(calcRunningGrade([35], 1).rank).toBe('B');
  });
  it('score=34 (34/50=0.68) is rank C — just below B threshold', () => {
    expect(calcRunningGrade([34], 1).rank).toBe('C');
  });

  // C boundary: ≥0.50
  it('score=25 (25/50=0.50) is rank C — at threshold', () => {
    expect(calcRunningGrade([25], 1).rank).toBe('C');
  });
  it('score=24 (24/50=0.48) is rank D — just below C threshold', () => {
    expect(calcRunningGrade([24], 1).rank).toBe('D');
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
    expect(result.rank).toBe('C'); // 125/185 ≈ 0.676 — below B (0.70), above C (0.50)
  });

  it('ignores future day scores beyond the completed day', () => {
    const result = calcRunningGrade([45, 999], 1);

    expect(result.cumulativeEarned).toBe(45);
    expect(result.cumulativePossible).toBe(50);
    expect(result.rank).toBe('A'); // 45/50=0.90 — at A threshold, below S (1.15)
  });

  it('matches the S/A/B/C/D/F thresholds used for final rank cutoffs', () => {
    expect(calcRunningGrade([58], 1).rank).toBe('S');
    expect(calcRunningGrade([45], 1).rank).toBe('A');
    expect(calcRunningGrade([35], 1).rank).toBe('B');
    expect(calcRunningGrade([25], 1).rank).toBe('C');
    expect(calcRunningGrade([15], 1).rank).toBe('D');
    expect(calcRunningGrade([14], 1).rank).toBe('F');
  });
});
