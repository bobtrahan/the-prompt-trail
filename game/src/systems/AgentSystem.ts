import { AGENT_ROSTER, SYNERGY_PAIRS, CLASH_PAIRS } from '../data/agents';
import type { AgentDef } from '../data/agents';

export class AgentSystem {

  /**
   * For each entry in SYNERGY_PAIRS and CLASH_PAIRS:
   * if all agents in pair.agents are present in agentIds, add pair.effect to the sum.
   * Return total sum (e.g. +0.1 for synergy, -0.1 for clash, 0 if none).
   */
  static getSpeedModifier(agentIds: string[]): number {
    let modifier = 0;

    // Check synergies
    for (const pair of SYNERGY_PAIRS) {
      if (pair.agents.every(id => agentIds.includes(id))) {
        modifier += pair.effect;
      }
    }

    // Check clashes
    for (const pair of CLASH_PAIRS) {
      if (pair.agents.every(id => agentIds.includes(id))) {
        modifier += pair.effect;
      }
    }

    return modifier;
  }

  /**
   * Return 0 for now (future expansion placeholder)
   */
  static getQualityModifier(agentIds: string[]): number {
    return 0;
  }

  /**
   * For each agent in agentIds, find their AgentDef in AGENT_ROSTER.
   * For each trait on that agent, roll against traitChance using deterministic seed:
   * seed = (day * agentId.charCodeAt(0)) % 100 / 100
   * fired = seed < traitChance
   * Return array of { agentId, trait, fired, description }
   */
  static checkTraits(agentIds: string[], day: number): { agentId: string; trait: string; fired: boolean; description: string }[] {
    const results: { agentId: string; trait: string; fired: boolean; description: string }[] = [];

    for (const id of agentIds) {
      const agentDef = AGENT_ROSTER.find(a => a.id === id);
      if (!agentDef) continue;

      // Deterministic roll
      const seed = (day * id.charCodeAt(0)) % 100 / 100;
      const fired = seed < agentDef.traitChance;

      results.push({
        agentId: id,
        trait: agentDef.trait,
        fired: fired,
        description: agentDef.traitEffect
      });
    }

    return results;
  }

  /**
   * Convenience: return AgentDef[] for the given agentIds from AGENT_ROSTER
   */
  static getAgentDefs(agentIds: string[]): AgentDef[] {
    return agentIds
      .map(id => AGENT_ROSTER.find(a => a.id === id))
      .filter((a): a is AgentDef => !!a);
  }

  getAllAgents(): AgentDef[] { return AGENT_ROSTER; }
  getAgentById(id: string): AgentDef | undefined { return AGENT_ROSTER.find(a => a.id === id); }
}
