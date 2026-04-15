export interface ItemDef {
  id: string;
  name: string;
  category: 'model' | 'hardware' | 'agentSlot' | 'consumable' | 'joke' | 'repair';
  baseCost: number;
  description: string;
  effect: string;           // human-readable for UI
  mechanical?: {            // machine-readable for EconomySystem
    type: string;
    value: number | string;
  };
  jokeResult?: string;      // for joke items — what happens when you buy it
  availableAfterDay?: number;
}

export const SHOP_ITEMS: ItemDef[] = [
  // MODELS
  {
    id: 'model-standard',
    name: 'Standard Model',
    category: 'model',
    baseCost: 100,
    description: 'A reliable workhorse model for everyday tasks.',
    effect: 'Reliable quality and normal speed. Costs $30/day.',
    mechanical: { type: 'unlockModel', value: 'standard' }
  },
  {
    id: 'model-frontier',
    name: 'Frontier Model',
    category: 'model',
    baseCost: 300,
    description: 'The absolute state-of-the-art in neural architecture.',
    effect: 'Maximum quality, normal speed. Costs $100/day.',
    mechanical: { type: 'unlockModel', value: 'frontier' }
  },
  {
    id: 'model-local',
    name: 'Local Model',
    category: 'model',
    baseCost: 200,
    description: 'Run it on your own hardware. No API fees.',
    effect: 'Free to run ($0/day), but slower and higher hallucination.',
    mechanical: { type: 'unlockModel', value: 'local' }
  },
  {
    id: 'model-sketchy',
    name: 'Sketchy Overseas Model',
    category: 'model',
    baseCost: 50, // SYSTEMS.md says $0 unlock in table but "Unlocked via event or market". Putting a low price.
    description: 'A bargain-bin model from an unknown provider.',
    effect: 'Fast and cheap ($5/day), but wildly inconsistent.',
    mechanical: { type: 'unlockModel', value: 'sketchy' }
  },
  {
    id: 'model-opensource',
    name: 'Open Source Model',
    category: 'model',
    baseCost: 150,
    description: 'Community-driven and transparent.',
    effect: 'Reliable, low daily cost ($10/day), but 30% slower than Standard.',
    mechanical: { type: 'unlockModel', value: 'openSource' }
  },

  // HARDWARE UPGRADES
  {
    id: 'hw-ram',
    name: 'RAM Upgrade',
    category: 'hardware',
    baseCost: 100,
    description: 'More memory for your development machine.',
    effect: 'Context window events occur less frequently.',
    mechanical: { type: 'eventWeightMod', value: 'context_window:-0.5' }
  },
  {
    id: 'hw-gpu',
    name: 'GPU Upgrade',
    category: 'hardware',
    baseCost: 300,
    description: 'High-end graphics card for local inference.',
    effect: 'Local models are faster; +10% speed when using local.',
    mechanical: { type: 'localModelSpeed', value: 0.1 }
  },
  {
    id: 'hw-ups',
    name: 'UPS Battery',
    category: 'hardware',
    baseCost: 150,
    description: 'Uninterruptible Power Supply for your rig.',
    effect: 'Immune to power-related events.',
    mechanical: { type: 'immuneTo', value: 'power_outage' }
  },
  {
    id: 'hw-monitor',
    name: 'Extra Monitor',
    category: 'hardware',
    baseCost: 75,
    description: 'Because one screen is never enough.',
    effect: '+5% overall development speed.',
    mechanical: { type: 'globalSpeed', value: 0.05 }
  },
  {
    id: 'hw-keyboard',
    name: 'Mechanical Keyboard',
    category: 'hardware',
    baseCost: 50,
    description: 'Clicky keys for maximum productivity.',
    effect: 'Typing errors forgive 1 wrong keystroke before slowing.',
    mechanical: { type: 'typingForgiveness', value: 1 }
  },
  {
    id: 'hw-desk',
    name: 'Standing Desk',
    category: 'hardware',
    baseCost: 120,
    description: 'The health-conscious developer\'s choice.',
    effect: '-10% chance of hardware overheat events.',
    mechanical: { type: 'eventWeightMod', value: 'overheat:-0.1' }
  },
  {
    id: 'hw-cooling',
    name: 'Cooling Pad',
    category: 'hardware',
    baseCost: 60,
    description: 'Keeps your laptop from melting under load.',
    effect: 'Overheat events are auto-resolved (minor).',
    mechanical: { type: 'autoResolve', value: 'overheat' }
  },

  // AGENT SLOTS
  {
    id: 'slot-2',
    name: 'Agent Slot 2',
    category: 'agentSlot',
    baseCost: 200,
    description: 'Expand your team to two concurrent agents.',
    effect: 'Unlocks the second agent slot in Planning.',
    mechanical: { type: 'unlockSlot', value: 2 }
  },
  {
    id: 'slot-3',
    name: 'Agent Slot 3',
    category: 'agentSlot',
    baseCost: 400,
    description: 'The ultimate team size. Three agents at once.',
    effect: 'Unlocks the third agent slot in Planning.',
    mechanical: { type: 'unlockSlot', value: 3 }
  },

  // CONSUMABLES
  {
    id: 'con-coffee',
    name: 'Coffee',
    category: 'consumable',
    baseCost: 5,
    description: 'The nectar of the gods.',
    effect: '+5% typing speed for the next day.',
    mechanical: { type: 'nextDaySpeed', value: 0.05 }
  },
  {
    id: 'con-energy',
    name: 'Energy Drink',
    category: 'consumable',
    baseCost: 10,
    description: 'Questionable liquid for questionable deadlines.',
    effect: '+10% typing speed tomorrow, but 20% more typos (jitters).',
    mechanical: { type: 'nextDaySpeedJitters', value: 0.1 }
  },
  {
    id: 'con-backup',
    name: 'Cloud Backup',
    category: 'consumable',
    baseCost: 30,
    description: 'Insurance for your digital life.',
    effect: 'Next power or crash event results in no data loss.',
    mechanical: { type: 'oneTimeProtection', value: 'data_loss' }
  },
  {
    id: 'con-api',
    name: 'API Credit Pack',
    category: 'consumable',
    baseCost: 75,
    description: 'Bulk credits for the heavy hitters.',
    effect: 'All model costs -50% for 1 day.',
    mechanical: { type: 'modelCostDiscount', value: 0.5 }
  },
  {
    id: 'con-duck',
    name: 'Rubber Duck',
    category: 'consumable',
    baseCost: 15,
    description: 'A sympathetic listener for your bugs.',
    effect: 'Next "agent stuck" event auto-resolves.',
    mechanical: { type: 'oneTimeAutoResolve', value: 'agent_stuck' }
  },

  // JOKE ITEMS
  {
    id: 'joke-quantum',
    name: 'Quantum GPU',
    category: 'joke',
    baseCost: 50,
    description: 'Uses superposition to calculate all possible code at once.',
    effect: 'Instant deployment (hypothetically).',
    jokeResult: 'Installation failed: quantum state collapsed during observation. Money gone.'
  },
  {
    id: 'joke-egpu',
    name: 'eGPU (USB-C)',
    category: 'joke',
    baseCost: 75,
    description: 'External graphics power for your workstation.',
    effect: 'Vastly improves rendering speed.',
    jokeResult: 'Device connected. Device disconnected. Device connected. Device disconn— Refund $25 (restocking fee).'
  },
  {
    id: 'joke-agi',
    name: 'AGI License (Personal)',
    category: 'joke',
    baseCost: 200,
    description: 'The last piece of software you\'ll ever buy.',
    effect: 'Autocompletes the entire game.',
    jokeResult: 'Thank you for your purchase! Activation key will arrive in 3-5 business centuries. Money gone.'
  },
  {
    id: 'joke-blockchain',
    name: 'Blockchain Accelerator',
    category: 'joke',
    baseCost: 100,
    description: 'Decentralized processing for maximum transparency.',
    effect: 'Immutable progress tracking.',
    jokeResult: 'Decentralizing your workflow... Progress bar fills to 99% then disappears. Money gone.'
  },
  {
    id: 'joke-timemachine',
    name: 'Time Machine (Save/Load)',
    category: 'joke',
    baseCost: 150,
    description: 'Fix your mistakes before you even make them.',
    effect: 'Enables save states in a permadeath world.',
    jokeResult: 'Feature available in PromptOS 2.0. Money gone. Adds a fake "Coming Soon" icon to your desktop.'
  },
  {
    id: 'joke-prompts',
    name: 'Premium Prompt Pack',
    category: 'joke',
    baseCost: 30,
    description: 'Curated tokens for the discerning engineer.',
    effect: 'Fancier typing prompts for 1 day.',
    jokeResult: 'Actually works... kind of. Gives you slightly fancier typing prompts for 1 day. No mechanical benefit.'
  },
  {
    id: 'joke-nft',
    name: 'NFT of Your Code',
    category: 'joke',
    baseCost: 40,
    description: 'Own your bugs on the ledger.',
    effect: 'Permanent digital heritage.',
    jokeResult: 'Mints successfully. Worth $0.003. Appears on your desktop as a tiny framed image.'
  },

  // REPAIRS
  {
    id: 'repair-hw',
    name: 'Hardware Repair',
    category: 'repair',
    baseCost: 100, // Scales in UI logic but base is $100
    description: 'Fixes broken components and restores system health.',
    effect: 'Restores hardware health.',
    mechanical: { type: 'repairHardware', value: 'variable' }
  }
];
