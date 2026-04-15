import type { PlayerClass, Strategy, ModelTier } from '../utils/playerClass';

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
