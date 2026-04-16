export type BugType = 'syntax' | 'logic' | 'race' | 'memleak' | 'heisen';

export interface BugConfig {
  emoji: string;
  label: string;
  reward: number;
  despawnMs: number;
  weight: number;
  color: number;
  dotColor: number;
}

export const BUG_DEFS: Record<BugType, BugConfig> = {
  syntax: { emoji: '🔴', label: 'SyntaxError', reward: 10, despawnMs: 6000, weight: 35, color: 0xda3633, dotColor: 0xff6b6b },
  logic: { emoji: '🟡', label: 'LogicBug', reward: 15, despawnMs: 8000, weight: 25, color: 0xd29922, dotColor: 0xffd166 },
  race: { emoji: '🟣', label: 'RaceCondition', reward: 20, despawnMs: 6000, weight: 15, color: 0x8957e5, dotColor: 0xb89af7 },
  memleak: { emoji: '🟢', label: 'MemoryLeak', reward: 10, despawnMs: 8000, weight: 15, color: 0x238636, dotColor: 0x3fb950 },
  heisen: { emoji: '👻', label: 'Heisenbug', reward: 30, despawnMs: 5000, weight: 10, color: 0x6e7681, dotColor: 0x9aa6b2 },
};

export function pickBugType(): BugType {
  const total = Object.values(BUG_DEFS).reduce((sum, def) => sum + def.weight, 0);
  let roll = Math.random() * total;
  for (const [type, def] of Object.entries(BUG_DEFS) as [BugType, BugConfig][]) {
    roll -= def.weight;
    if (roll <= 0) return type;
  }
  return 'syntax';
}
