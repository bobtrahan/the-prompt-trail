import type { DayScore } from './ScoringSystem';
import type { ClassDef } from '../data/classes';
import { CLASS_DEFS } from '../data/classes';

import type { PlayerClass, Strategy, ModelTier } from '../utils/playerClass';
export type { PlayerClass, Strategy, ModelTier } from '../utils/playerClass';


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

  // Night phase state
  activeConsumables: string[];
  purchasedJokes: string[];
  bountyPlayedTonight: boolean;
  bugHuntMode: 'ai' | 'oldschool';

  // Class restrictions & hardware
  lockedStrategies: Strategy[];
  lockedModels: ModelTier[];
  localSlots: number;

  // Final stats tracking
  totalBugsSquashed: number;

  // Consumable effects
  hasBackupProtection: boolean;
  hasDuckProtection: boolean;
  modelCostDiscount: number;
  consumablesUsedToday: string[];

  // Last day results snapshot
  lastDayResult?: {
    progress: number;
    accuracy: number;
    score: DayScore;
    budgetSpent: number;
    hardwareDelta: number;
  };
  overtimeBonus: number;
  bugHuntReturnScene: string;
  dayStartBudget: number;
  dayStartHardware: number;
}

export function createInitialState(): GameState {
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
    activeConsumables: [],
    purchasedJokes: [],
    bountyPlayedTonight: false,
    bugHuntMode: 'ai',
    lockedStrategies: [],
    lockedModels: [],
    localSlots: 0,
    totalBugsSquashed: 0,
    hasBackupProtection: false,
    hasDuckProtection: false,
    modelCostDiscount: 0,
    consumablesUsedToday: [],
    overtimeBonus: 0,
    bugHuntReturnScene: 'Night',
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
