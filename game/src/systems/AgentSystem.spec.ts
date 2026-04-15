import { describe, it, expect } from 'vitest';
import { AgentSystem } from './AgentSystem';

describe('AgentSystem', () => {
  describe('getSpeedModifier', () => {
    it('returns 0 for empty agent list', () => {
      expect(AgentSystem.getSpeedModifier([])).toBe(0);
    });

    it('returns 0 for single agent', () => {
      expect(AgentSystem.getSpeedModifier(['turbo'])).toBe(0);
    });

    it('returns +0.1 for turbo+oracle synergy', () => {
      expect(AgentSystem.getSpeedModifier(['turbo', 'oracle'])).toBeCloseTo(0.1);
    });

    it('returns -0.1 for turbo+linter clash', () => {
      expect(AgentSystem.getSpeedModifier(['turbo', 'linter'])).toBeCloseTo(-0.1);
    });

    it('synergy and clash cancel out (turbo+oracle+linter)', () => {
      expect(AgentSystem.getSpeedModifier(['turbo', 'oracle', 'linter'])).toBeCloseTo(0);
    });

    it('three-agent synergy fires when all three present (oracle+parrot+gremlin)', () => {
      // oracle+parrot+gremlin synergy is +0.1
      // oracle+gremlin clash is -0.1
      // Total should be 0
      expect(AgentSystem.getSpeedModifier(['oracle', 'parrot', 'gremlin'])).toBeCloseTo(0);
    });

    it('order of agent IDs does not matter', () => {
      const mod1 = AgentSystem.getSpeedModifier(['oracle', 'turbo']);
      const mod2 = AgentSystem.getSpeedModifier(['turbo', 'oracle']);
      expect(mod1).toEqual(mod2);
    });
  });

  describe('checkTraits', () => {
    it('returns one result per agent', () => {
      const results = AgentSystem.checkTraits(['turbo', 'oracle'], 1);
      expect(results.length).toBe(2);
    });

    it('each result has correct agentId and trait', () => {
      const results = AgentSystem.checkTraits(['turbo', 'oracle'], 1);
      const turboResult = results.find(r => r.agentId === 'turbo');
      const oracleResult = results.find(r => r.agentId === 'oracle');
      expect(turboResult?.trait).toBe('deploy_unapproved');
      expect(oracleResult?.trait).toBe('low_hallucination');
    });

    it('is deterministic', () => {
      const results1 = AgentSystem.checkTraits(['turbo', 'gremlin'], 5);
      const results2 = AgentSystem.checkTraits(['turbo', 'gremlin'], 5);
      expect(results1).toEqual(results2);
    });

    it('oracle trait always fires (traitChance=1.0)', () => {
      for (let day = 1; day <= 13; day++) {
        const results = AgentSystem.checkTraits(['oracle'], day);
        expect(results[0].fired).toBe(true);
      }
    });

    it('unknown agent ID is silently skipped', () => {
      expect(AgentSystem.checkTraits(['nonexistent'], 1)).toEqual([]);
    });
  });

  describe('getAgentDefs', () => {
    it('returns correct AgentDef objects', () => {
      const defs = AgentSystem.getAgentDefs(['turbo', 'oracle']);
      expect(defs.map(a => a.id)).toEqual(['turbo', 'oracle']);
    });

    it('skips unknown IDs', () => {
      const defs = AgentSystem.getAgentDefs(['turbo', 'fakeid']);
      expect(defs.length).toBe(1);
      expect(defs[0].id).toBe('turbo');
    });
  });
});
