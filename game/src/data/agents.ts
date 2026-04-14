export interface AgentDef {
  id: string;
  name: string;
  personality: string;
  speed: number;       // 1-5
  quality: number;     // 1-5
  trait: string;       // matches trait field in GameState AgentDef
  traitChance: number; // 0-1 probability their special trait fires
  traitEffect: string; // description for UI
}

export interface SynergyPair {
  agents: [string, string] | [string, string, string];
  effect: number; // +0.1 or -0.1 speed multiplier
}

export const AGENT_ROSTER: AgentDef[] = [
  {
    id: 'turbo',
    name: 'Turbo',
    personality: 'Eager, overconfident',
    speed: 5,
    quality: 2,
    trait: 'deploy_unapproved',
    traitChance: 0.2,
    traitEffect: '20% chance: Ships fast, asks questions never. "Deployed before you approved."'
  },
  {
    id: 'oracle',
    name: 'Oracle',
    personality: 'Careful, methodical',
    speed: 2,
    quality: 5,
    trait: 'low_hallucination',
    traitChance: 1.0,
    traitEffect: 'Hallucination rate -50%. Will not be rushed. "I need to think about this."'
  },
  {
    id: 'gremlin',
    name: 'Gremlin',
    personality: 'Chaotic, creative',
    speed: 3,
    quality: 3,
    trait: 'wildcard_shortcut',
    traitChance: 0.5,
    traitEffect: '30% brilliant shortcut, 20% bizarre tangent. You never know what you\'ll get.'
  },
  {
    id: 'parrot',
    name: 'Parrot',
    personality: 'Agreeable, yes-man',
    speed: 4,
    quality: 3,
    trait: 'agreeable',
    traitChance: 1.0,
    traitEffect: 'Fast, reliable. Won\'t catch your mistakes because it thinks everything you do is perfect.'
  },
  {
    id: 'linter',
    name: 'Linter',
    personality: 'Argumentative, pedantic',
    speed: 2,
    quality: 4,
    trait: 'architecture_debates',
    traitChance: 1.0,
    traitEffect: '-1 time unit/day to "architecture debates." But the code is bulletproof.'
  },
  {
    id: 'scope',
    name: 'Scope',
    personality: 'Enthusiastic, feature-obsessed',
    speed: 3,
    quality: 4,
    trait: 'feature_creep',
    traitChance: 0.25,
    traitEffect: '25% chance project takes 20% longer from unrequested features.'
  }
];

export const SYNERGY_PAIRS: SynergyPair[] = [
  {
    agents: ['turbo', 'oracle'],
    effect: 0.1
  },
  {
    agents: ['parrot', 'linter'],
    effect: 0.1
  },
  {
    agents: ['gremlin', 'scope'],
    effect: 0.1
  },
  {
    agents: ['oracle', 'parrot', 'gremlin'],
    effect: 0.1
  }
];

export const CLASH_PAIRS: SynergyPair[] = [
  {
    agents: ['turbo', 'linter'],
    effect: -0.1
  },
  {
    agents: ['oracle', 'gremlin'],
    effect: -0.1
  }
];
