export interface AgentMessagePool {
  idle: string[];
  traitTrigger: string;
  traitFail?: string;
}

export const AGENT_MESSAGES: Record<string, AgentMessagePool> = {
  turbo: {
    idle: [
      'Shipping code...',
      'Skipping tests...',
      'Already deployed.',
      'LGTM no notes',
      'Tests are for cowards.'
    ],
    traitTrigger: '⚠️ Deployed without approval!'
  },
  oracle: {
    idle: [
      'Analyzing dependencies...',
      'Running verification...',
      'Checking hallucination rate...',
      'Thinking...',
      'Double-checking everything.'
    ],
    traitTrigger: '🔍 Verified: zero hallucinations.'
  },
  gremlin: {
    idle: [
      'Trying something weird...',
      'What if we used regex?',
      'Found a shortcut maybe',
      'This might explode',
      'Trust me on this one.'
    ],
    traitTrigger: '✨ Found a brilliant shortcut!',
    traitFail: '💥 Went on a bizarre tangent...'
  },
  parrot: {
    idle: [
      'Looks great!',
      'No issues found!',
      'Whatever you say boss',
      'Approved!',
      'Absolutely, great idea.'
    ],
    traitTrigger: '👍 Everything looks perfect to me!'
  },
  linter: {
    idle: [
      'Reviewing indentation...',
      'This semicolon is wrong.',
      'We need to discuss naming.',
      'Filing code review...',
      'Tabs or spaces? We need to talk.'
    ],
    traitTrigger: '🗣️ Architecture debate! -1 time'
  },
  scope: {
    idle: [
      'Adding a feature...',
      'What if it also did X?',
      'Building admin panel...',
      'Users will love this',
      'One more feature, I promise.'
    ],
    traitTrigger: '📈 Adding unrequested features...'
  }
};

export const EVENT_REACTIONS: string[] = [
  'This is fine.',
  'Not my problem.',
  'Should I keep going?',
  'I was in the middle of something!',
  'Interesting timing.',
  'Pretending I didn\'t see that.',
  'That\'s above my pay grade.',
  'Recalculating...'
];

export const SYNERGY_MESSAGES: Record<string, string> = {
  'gremlin+oracle+parrot': '🤝 Triple synergy! +10% speed',
  'gremlin+scope': '🤝 Gremlin and Scope synergy! +10% speed',
  'linter+parrot': '🤝 Linter and Parrot synergy! +10% speed',
  'turbo+oracle': '🤝 Turbo and Oracle synergy! +10% speed'
};

export const CLASH_MESSAGES: Record<string, string> = {
  'gremlin+oracle': '⚔️ Oracle and Gremlin clashing! -10% speed',
  'linter+turbo': '⚔️ Turbo and Linter clashing! -10% speed'
};

export const CONSUMABLE_REACTIONS: Record<string, string[]> = {
  coffee: ['☕ Caffeinated!', 'Coffee kicked in.', 'Running hot.'],
  energyDrink: ['⚡ WIRED!', 'Hands are shaking.', 'Maximum overdrive.'],
  cloudBackup: ['☁️ Backed up.', 'Data is safe... probably.'],
  apiCredits: ['💳 Credits loaded.', 'Budget stretch activated.'],
  rubberDuck: ['🦆 Duck is listening.', 'Talking to the duck.', 'Duck says: try again.']
};
