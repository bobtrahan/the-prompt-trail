import { describe, it, expect } from 'vitest';
import { PROJECTS } from './projects';

describe('PROJECTS Data Validation', () => {
  it('has exactly 13 projects', () => {
    expect(PROJECTS.length).toBe(13);
  });

  it('has contiguous days from 1 to 13', () => {
    const days = PROJECTS.map(p => p.day);
    expect(days).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it('has non-decreasing maxReputation', () => {
    for (let i = 1; i < PROJECTS.length; i++) {
      expect(PROJECTS[i].maxReputation).toBeGreaterThanOrEqual(PROJECTS[i - 1].maxReputation);
    }
  });

  it('every project has a non-empty name', () => {
    PROJECTS.forEach(p => {
      expect(p.name).toBeDefined();
      expect(p.name.length).toBeGreaterThan(0);
    });
  });

  it('every project has valid difficulty', () => {
    const validDifficulties = ['easy', 'medium', 'hard'];
    PROJECTS.forEach(p => {
      expect(validDifficulties).toContain(p.difficulty);
    });
  });

  it('every project has valid typingDifficulty', () => {
    const validDifficulties = ['easy', 'medium', 'hard'];
    PROJECTS.forEach(p => {
      expect(validDifficulties).toContain(p.typingDifficulty);
    });
  });
});
