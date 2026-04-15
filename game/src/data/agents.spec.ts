import { describe, it, expect } from 'vitest';
import { AGENT_ROSTER, SYNERGY_PAIRS, CLASH_PAIRS } from './agents';

describe('AGENTS Data Validation', () => {
  it('has exactly 6 agents', () => {
    expect(AGENT_ROSTER.length).toBe(6);
  });

  it('all agent IDs are unique', () => {
    const ids = AGENT_ROSTER.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all agents have speed 1-5 and quality 1-5', () => {
    AGENT_ROSTER.forEach(a => {
      expect(a.speed).toBeGreaterThanOrEqual(1);
      expect(a.speed).toBeLessThanOrEqual(5);
      expect(a.quality).toBeGreaterThanOrEqual(1);
      expect(a.quality).toBeLessThanOrEqual(5);
    });
  });

  it('all agents have traitChance between 0 and 1', () => {
    AGENT_ROSTER.forEach(a => {
      expect(a.traitChance).toBeGreaterThanOrEqual(0);
      expect(a.traitChance).toBeLessThanOrEqual(1);
    });
  });

  it('all agents have non-empty trait and traitEffect', () => {
    AGENT_ROSTER.forEach(a => {
      expect(a.trait).toBeDefined();
      expect(a.trait.length).toBeGreaterThan(0);
      expect(a.traitEffect).toBeDefined();
      expect(a.traitEffect.length).toBeGreaterThan(0);
    });
  });

  it('all synergy pair agent IDs exist in roster', () => {
    const validIds = AGENT_ROSTER.map(a => a.id);
    SYNERGY_PAIRS.forEach(pair => {
      pair.agents.forEach(id => {
        expect(validIds).toContain(id);
      });
    });
  });

  it('all clash pair agent IDs exist in roster', () => {
    const validIds = AGENT_ROSTER.map(a => a.id);
    CLASH_PAIRS.forEach(pair => {
      pair.agents.forEach(id => {
        expect(validIds).toContain(id);
      });
    });
  });

  it('synergy effects are positive', () => {
    SYNERGY_PAIRS.forEach(pair => {
      expect(pair.effect).toBeGreaterThan(0);
    });
  });

  it('clash effects are negative', () => {
    CLASH_PAIRS.forEach(pair => {
      expect(pair.effect).toBeLessThan(0);
    });
  });
});
