import type { DayScore } from './ScoringSystem';

export type PlayerClass = 'techBro' | 'indieHacker' | 'collegeStudent' | 'corporateDev';
export type Strategy = 'planThenBuild' | 'justStart' | 'oneShot' | 'vibeCode';
export type ModelTier = 'free' | 'standard' | 'frontier' | 'local' | 'sketchy' | 'openSource';

export interface AgentDef {
  id: string;
  name: string;
  personality: string;
  speed: number;    // 1-5
  quality: number;  // 1-5
  trait: string;
}

export interface ClassDef {
  id: PlayerClass;
  name: string;
  description: string;
  startingBudget: number;
  hardwareHp: number;
  startingModel: ModelTier;
  scoreMultiplier: number;
  agentSlots?: number;
}

export const CLASS_DEFS: Record<PlayerClass, ClassDef> = {
  techBro: {
    id: 'techBro',
    name: 'Tech Bro',
    description: 'Best hardware, big budget, zero self-awareness.',
    startingBudget: 10000,
    hardwareHp: 100,
    startingModel: 'standard',
    scoreMultiplier: 0.8,
    agentSlots: 2,
  },
  indieHacker: {
    id: 'indieHacker',
    name: 'Indie Hacker',
    description: 'Balanced. Resourceful. Ships fast, breaks things.',
    startingBudget: 2000,
    hardwareHp: 80,
    startingModel: 'standard',
    scoreMultiplier: 1.8,
  },
  collegeStudent: {
    id: 'collegeStudent',
    name: 'College Student',
    description: 'No money, bad hardware, unlimited ambition.',
    startingBudget: 500,
    hardwareHp: 50,
    startingModel: 'free',
    scoreMultiplier: 3.0,
  },
  corporateDev: {
    id: 'corporateDev',
    name: 'Corporate Dev',
    description: 'Company card. Company laptop. Company meetings. No freedom.',
    startingBudget: 99999,
    hardwareHp: 90,
    startingModel: 'standard',
    scoreMultiplier: 1.2,
  },
};

export interface GameState {
  // Run state
  day: number;
  phase: 'title' | 'classSelect' | 'briefing' | 'planning' | 'execution' | 'results' | 'night' | 'bugBounty' | 'final';

  // Player
  playerClass: PlayerClass | null;
  className: string;

  // Resources
  budget: number;
  hardwareHp: number;
  reputation: number;
  timeUnitsRemaining: number;

  // Current day config
  strategy: Strategy | null;
  model: ModelTier;
  activeAgents: string[]; // agent IDs

  // Progression
  unlockedModels: ModelTier[];
  agentSlots: number;
  ownedUpgrades: string[];
  dayScores: number[];

  // Flags for cross-event references
  eventFlags: Record<string, boolean>;

  // Class restrictions & hardware
  lockedStrategies: Strategy[];
  lockedModels: ModelTier[];
  localSlots: number;

  // Last day results snapshot
  lastDayResult?: {
    progress: number;
    accuracy: number;
    score: DayScore;
    budgetSpent: number;
    hardwareDelta: number;
  };
  dayStartBudget: number;
  dayStartHardware: number;
}

function createInitialState(): GameState {
  return {
    day: 1,
    phase: 'title',
    playerClass: null,
    className: '',
    budget: 0,
    hardwareHp: 100,
    reputation: 0,
    timeUnitsRemaining: 10,
    strategy: null,
    model: 'free',
    activeAgents: [],
    unlockedModels: ['free'],
    agentSlots: 1,
    ownedUpgrades: [],
    dayScores: [],
    eventFlags: {},
    lockedStrategies: [],
    lockedModels: [],
    localSlots: 0,
    dayStartBudget: 0,
    dayStartHardware: 100,
  };
}

// Singleton game state
let state: GameState = createInitialState();

export function getState(): GameState {
  return state;
}

export function resetState(): void {
  state = createInitialState();
}

export function initClassState(playerClass: PlayerClass): void {
  const def = CLASS_DEFS[playerClass];
  state.playerClass = playerClass;
  state.className = def.name;
  state.budget = def.startingBudget;
  state.hardwareHp = def.hardwareHp;
  state.model = def.startingModel;
  if (def.agentSlots !== undefined) {
    state.agentSlots = def.agentSlots;
  }
  if (def.startingModel !== 'free') {
    state.unlockedModels.push(def.startingModel);
  }
  if (playerClass === 'techBro') {
    state.unlockedModels.push('local');
    state.localSlots = 1;
  }
  if (playerClass === 'corporateDev') {
    state.lockedStrategies = ['vibeCode'];
    state.lockedModels = ['free', 'sketchy', 'local'];
  }
}
