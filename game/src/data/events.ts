import type { PlayerClass } from '../utils/playerClass';

export interface EventEffect {
  type: 'budget' | 'time' | 'hardware' | 'reputation' | 'flag' | 'agentSpeed' | 'modelSwitch';
  value: number | string;
}

export interface EventChoice {
  text: string;
  effects: EventEffect[];
}

export interface EventDef {
  id: string;                  // kebab-case unique id
  title: string;               // with emoji prefix
  body: string;                // 1-3 lines
  category: 'technical' | 'business' | 'agent' | 'hardware' | 'social' | 'meta';
  dayRange: [number, number];  // [min, max] day range
  weight: number;              // base weight 1-10
  tags: string[];              // 'requiresCloud', 'requiresLocal', class names, 'chain:xxx'
  choices: EventChoice[];
  classVariants?: Partial<Record<PlayerClass, { body?: string; choices?: EventChoice[] }>>;
  chainFrom?: string;          // id of prerequisite event
  cooldown?: number;           // min days before can fire again
}

export const EVENTS: EventDef[] = [
  // ─── API & Infrastructure Events ──────────────────────────────────────────

  {
    id: 'rate-limited',
    title: '🚫 Rate Limited',
    body: '429 Too Many Requests. Your API provider says chill.',
    category: 'technical',
    dayRange: [1, 13],
    weight: 7,
    tags: ['requiresCloud'],
    cooldown: 2,
    choices: [
      {
        text: 'Wait it out',
        effects: [{ type: 'time', value: -1 }],
      },
      {
        text: 'Switch to backup model ($50)',
        effects: [{ type: 'budget', value: -50 }, { type: 'modelSwitch', value: 'backup' }, { type: 'flag', value: 'quality-drop' }, { type: 'reputation', value: -5 }],
      },
      {
        text: 'Rage-refresh the endpoint',
        effects: [{ type: 'flag', value: 'rage-refresh' }, { type: 'time', value: -1 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Wait it out',
            effects: [{ type: 'time', value: -1 }],
          },
          {
            text: 'Switch to backup model ($50)',
            effects: [{ type: 'budget', value: -50 }, { type: 'modelSwitch', value: 'backup' }, { type: 'flag', value: 'quality-drop' }, { type: 'reputation', value: -5 }],
          },
          {
            text: 'Rage-refresh the endpoint',
            effects: [{ type: 'flag', value: 'rage-refresh' }, { type: 'time', value: -1 }],
          },
          {
            text: 'Run it locally',
            effects: [{ type: 'flag', value: 'local-model' }, { type: 'agentSpeed', value: -15 }],
          },
        ],
      },
      collegeStudent: {
        choices: [
          {
            text: 'Wait it out (free tier takes longer...)',
            effects: [{ type: 'time', value: -2 }],
          },
          {
            text: 'Switch to backup model ($50)',
            effects: [{ type: 'budget', value: -50 }, { type: 'modelSwitch', value: 'backup' }, { type: 'flag', value: 'quality-drop' }, { type: 'reputation', value: -5 }],
          },
          {
            text: 'Rage-refresh the endpoint',
            effects: [{ type: 'flag', value: 'rage-refresh' }, { type: 'time', value: -1 }],
          },
        ],
      },
    },
  },

  {
    id: 'api-price-hike',
    title: '💸 API Price Hike',
    body: 'Breaking: Your API provider just tripled their prices. Effective immediately.',
    category: 'business',
    dayRange: [4, 9],
    weight: 5,
    tags: ['requiresCloud'],
    cooldown: 5,
    choices: [
      {
        text: 'Eat the cost',
        effects: [{ type: 'flag', value: 'model-cost-triple' }, { type: 'budget', value: -100 }],
      },
      {
        text: 'Switch to Sketchy Overseas Model',
        effects: [{ type: 'flag', value: 'sketchy-model-unlocked' }, { type: 'modelSwitch', value: 'sketchy' }],
      },
      {
        text: 'Go local',
        effects: [{ type: 'flag', value: 'local-model' }, { type: 'agentSpeed', value: -15 }],
      },
    ],
    classVariants: {
      corporateDev: {
        choices: [
          {
            text: 'Eat the cost',
            effects: [{ type: 'flag', value: 'model-cost-triple' }, { type: 'budget', value: -100 }],
          },
          {
            text: 'Switch to Sketchy Overseas Model',
            effects: [{ type: 'flag', value: 'sketchy-model-unlocked' }, { type: 'modelSwitch', value: 'sketchy' }],
          },
          {
            text: 'Go local',
            effects: [{ type: 'flag', value: 'local-model' }, { type: 'agentSpeed', value: -15 }],
          },
          {
            text: 'Expense it (company card absorbs it)',
            effects: [{ type: 'flag', value: 'finance-meeting-pending' }],
          },
        ],
      },
      collegeStudent: {
        choices: [
          {
            text: 'Eat the cost',
            effects: [{ type: 'flag', value: 'model-cost-triple' }, { type: 'budget', value: -100 }],
          },
          {
            text: 'Switch to Sketchy Overseas Model',
            effects: [{ type: 'flag', value: 'sketchy-model-unlocked' }, { type: 'modelSwitch', value: 'sketchy' }],
          },
          {
            text: 'Go local',
            effects: [{ type: 'flag', value: 'local-model' }, { type: 'agentSpeed', value: -15 }],
          },
          {
            text: 'Tweet about it (viral rant)',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'tweet-viral-40pct' }],
          },
        ],
      },
    },
  },

  {
    id: 'provider-outage',
    title: '🔌 Provider Outage',
    body: '503 Service Unavailable. The AI cloud is just... gone.',
    category: 'technical',
    dayRange: [1, 13],
    weight: 5,
    tags: ['requiresCloud'],
    cooldown: 3,
    choices: [
      {
        text: 'Wait for recovery',
        effects: [{ type: 'time', value: -2 }],
      },
      {
        text: 'Switch providers ($100)',
        effects: [{ type: 'budget', value: -100 }],
      },
      {
        text: 'Work manually while you wait',
        effects: [{ type: 'flag', value: 'manual-progress-25pct' }, { type: 'agentSpeed', value: -25 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Wait for recovery',
            effects: [{ type: 'time', value: -2 }],
          },
          {
            text: 'Switch providers ($100)',
            effects: [{ type: 'budget', value: -100 }],
          },
          {
            text: "Work manually... myself? (10% speed)",
            effects: [{ type: 'flag', value: 'manual-progress-10pct' }, { type: 'agentSpeed', value: -40 }],
          },
        ],
      },
    },
  },

  {
    id: 'new-model-drop',
    title: '🚨 New Model Drop',
    body: 'BREAKING: GPT-7 just dropped. Twitter is losing its mind.',
    category: 'technical',
    dayRange: [5, 11],
    weight: 4,
    tags: ['requiresCloud'],
    cooldown: 7,
    choices: [
      {
        text: 'Migrate mid-project ($200, -1 time, +30% quality)',
        effects: [{ type: 'budget', value: -200 }, { type: 'time', value: -1 }, { type: 'flag', value: 'quality-boost-30pct' }, { type: 'reputation', value: 10 }],
      },
      {
        text: 'Stay the course',
        effects: [{ type: 'flag', value: 'fomo-sad' }, { type: 'agentSpeed', value: -3 }],
      },
      {
        text: 'Read the benchmarks first',
        effects: [{ type: 'time', value: -2 }, { type: 'flag', value: 'informed-model-choice' }, { type: 'reputation', value: 5 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Already have early access (but wait... -$200 retroactive)',
            effects: [{ type: 'budget', value: -200 }, { type: 'flag', value: 'quality-boost-30pct' }, { type: 'reputation', value: 10 }],
          },
          {
            text: 'Stay the course',
            effects: [{ type: 'flag', value: 'fomo-sad' }, { type: 'agentSpeed', value: -3 }],
          },
          {
            text: 'Read the benchmarks first',
            effects: [{ type: 'time', value: -2 }, { type: 'flag', value: 'informed-model-choice' }, { type: 'reputation', value: 5 }],
          },
        ],
      },
      corporateDev: {
        choices: [
          {
            text: 'Migrate (requires IT approval, +1 extra time unit)',
            effects: [{ type: 'budget', value: -200 }, { type: 'time', value: -2 }, { type: 'flag', value: 'quality-boost-30pct' }, { type: 'reputation', value: 10 }],
          },
          {
            text: 'Stay the course',
            effects: [{ type: 'flag', value: 'fomo-sad' }, { type: 'agentSpeed', value: -3 }],
          },
          {
            text: 'Read the benchmarks first',
            effects: [{ type: 'time', value: -2 }, { type: 'flag', value: 'informed-model-choice' }, { type: 'reputation', value: 5 }],
          },
        ],
      },
    },
  },

  {
    id: 'tos-change',
    title: '📄 Terms of Service Change',
    body: 'New TOS: Your AI provider now owns everything you generate.',
    category: 'business',
    dayRange: [4, 10],
    weight: 4,
    tags: ['requiresCloud'],
    cooldown: 6,
    choices: [
      {
        text: 'Accept and continue',
        effects: [{ type: 'reputation', value: -20 }],
      },
      {
        text: 'Switch providers ($100, -1 time)',
        effects: [{ type: 'budget', value: -100 }, { type: 'time', value: -1 }],
      },
      {
        text: 'Read the fine print',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'tos-fine-print-roll' }],
      },
    ],
    classVariants: {
      corporateDev: {
        body: 'New TOS dropped. Legal is on it — whether you like it or not.',
        choices: [
          {
            text: 'Legal handles it (auto-resolved, -1 time)',
            effects: [{ type: 'time', value: -1 }],
          },
        ],
      },
    },
  },

  {
    id: 'crypto-mining-detected',
    title: '⛏️ Crypto Mining Detected',
    body: 'Your local model is... mining cryptocurrency? Your electricity bill just spiked.',
    category: 'technical',
    dayRange: [1, 13],
    weight: 3,
    tags: ['requiresLocal'],
    cooldown: 4,
    choices: [
      {
        text: 'Kill the process',
        effects: [{ type: 'flag', value: 'lose-progress-chunk' }, { type: 'reputation', value: -10 }],
      },
      {
        text: 'Let it mine (-$75 electricity, +$25 crypto)',
        effects: [{ type: 'budget', value: -50 }],
      },
      {
        text: 'Investigate',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'crypto-investigate' }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Kill the process',
            effects: [{ type: 'flag', value: 'lose-progress-chunk' }, { type: 'reputation', value: -10 }],
          },
          {
            text: 'Let it mine',
            effects: [{ type: 'budget', value: -50 }],
          },
          {
            text: 'Investigate',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'crypto-investigate' }],
          },
          {
            text: 'Optimize the miner',
            effects: [{ type: 'time', value: -1 }, { type: 'budget', value: 50 }],
          },
        ],
      },
      collegeStudent: {
        choices: [
          {
            text: 'Kill the process',
            effects: [{ type: 'flag', value: 'lose-progress-chunk' }, { type: 'reputation', value: -10 }],
          },
          {
            text: "Let it mine on a Chromebook ($2 crypto, -$75 electricity = net -$73)",
            effects: [{ type: 'budget', value: -73 }],
          },
          {
            text: 'Investigate',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'crypto-investigate' }],
          },
        ],
      },
    },
  },

  // ─── AI Behavior Events ────────────────────────────────────────────────────

  {
    id: 'the-hallucination',
    title: '👻 The Hallucination',
    body: "Your AI confidently cited a research paper that doesn't exist. Your project references it 47 times.",
    category: 'agent',
    dayRange: [1, 13],
    weight: 7,
    tags: [],
    cooldown: 2,
    choices: [
      {
        text: 'Rip it all out',
        effects: [{ type: 'time', value: -2 }],
      },
      {
        text: 'Leave it in',
        effects: [{ type: 'reputation', value: -15 }],
      },
      {
        text: 'Ask the AI to fix it',
        effects: [{ type: 'flag', value: 'hallucination-fix-roll' }, { type: 'time', value: -1 }, { type: 'reputation', value: -5 }],
      },
    ],
    classVariants: {
      corporateDev: {
        choices: [
          {
            text: 'Rip it all out',
            effects: [{ type: 'time', value: -2 }],
          },
          {
            text: "Leave it in (compliance will catch it: -30 rep)",
            effects: [{ type: 'reputation', value: -30 }],
          },
          {
            text: 'Ask the AI to fix it',
            effects: [{ type: 'flag', value: 'hallucination-fix-roll' }, { type: 'time', value: -1 }, { type: 'reputation', value: -5 }],
          },
        ],
      },
      indieHacker: {
        choices: [
          {
            text: 'Rip it all out',
            effects: [{ type: 'time', value: -2 }],
          },
          {
            text: 'Leave it in',
            effects: [{ type: 'reputation', value: -15 }],
          },
          {
            text: 'Ask the AI to fix it',
            effects: [{ type: 'flag', value: 'hallucination-fix-roll' }, { type: 'time', value: -1 }, { type: 'reputation', value: -5 }],
          },
          {
            text: 'Blog about it: "How I Caught My AI Lying"',
            effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 10 }],
          },
        ],
      },
    },
  },

  {
    id: 'accidental-email-nuke',
    title: '📧 Accidental Email Nuke',
    body: "Your AI just replied-all to your entire contact list with 'Per my last email, you are wrong.'",
    category: 'agent',
    dayRange: [1, 4],
    weight: 4,
    tags: [],
    choices: [
      {
        text: 'Undo + apologize ($50, -1 time)',
        effects: [{ type: 'budget', value: -50 }, { type: 'time', value: -1 }],
      },
      {
        text: "Let it ride",
        effects: [{ type: 'reputation', value: -25 }, { type: 'flag', value: 'email-nuke-let-ride' }],
      },
      {
        text: 'Blame the intern',
        effects: [{ type: 'flag', value: 'intern-blamed' }],
      },
    ],
    classVariants: {
      collegeStudent: {
        body: "Your AI replied-all to your professors with 'Per my last email, you are wrong.'",
        choices: [
          {
            text: 'Undo + apologize ($10, -1 time)',
            effects: [{ type: 'budget', value: -10 }, { type: 'time', value: -1 }],
          },
          {
            text: "Let it ride (-40 rep, academic integrity concerns)",
            effects: [{ type: 'reputation', value: -40 }],
          },
          {
            text: 'Blame the intern',
            effects: [{ type: 'flag', value: 'intern-blamed' }],
          },
        ],
      },
      corporateDev: {
        body: "Your AI replied-all to the entire company. HR is already typing.",
        choices: [
          {
            text: 'Undo + apologize (HR still takes 2 time units)',
            effects: [{ type: 'budget', value: -50 }, { type: 'time', value: -2 }],
          },
          {
            text: "Let it ride (HR takes 2 time units anyway)",
            effects: [{ type: 'reputation', value: -25 }, { type: 'time', value: -2 }],
          },
          {
            text: 'Blame the intern (HR takes 2 time units anyway)',
            effects: [{ type: 'flag', value: 'intern-blamed' }, { type: 'time', value: -2 }],
          },
        ],
      },
    },
  },

  {
    id: 'infinite-loop',
    title: '🔄 The Infinite Loop',
    body: "Agent has been 'thinking' for 6 minutes. The loading spinner has achieved sentience.",
    category: 'agent',
    dayRange: [1, 13],
    weight: 7,
    tags: [],
    cooldown: 3,
    choices: [
      {
        text: 'Kill and restart',
        effects: [{ type: 'flag', value: 'lose-progress-chunk' }, { type: 'reputation', value: -10 }],
      },
      {
        text: 'Let it cook',
        effects: [{ type: 'flag', value: 'let-it-cook-roll' }, { type: 'time', value: -2 }],
      },
      {
        text: 'Check the logs',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'check-logs-reveal' }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Kill and restart',
            effects: [{ type: 'flag', value: 'lose-progress-chunk' }, { type: 'reputation', value: -10 }],
          },
          {
            text: 'Let it cook',
            effects: [{ type: 'flag', value: 'let-it-cook-roll' }, { type: 'time', value: -2 }],
          },
          {
            text: 'Check the logs',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'check-logs-reveal' }],
          },
          {
            text: "Check GPU utilization",
            effects: [{ type: 'flag', value: 'chain:crypto-mining-detected' }, { type: 'time', value: -1 }],
          },
        ],
      },
    },
  },

  {
    id: 'passive-aggressive-commit',
    title: '😤 Passive-Aggressive Commit',
    body: "Your AI just committed: 'fix: cleaned up the mess human made.' Your coworker is typing...",
    category: 'agent',
    dayRange: [1, 13],
    weight: 6,
    tags: [],
    cooldown: 3,
    choices: [
      {
        text: 'Force-push a fix',
        effects: [{ type: 'time', value: -1 }],
      },
      {
        text: "Pretend you didn't see it",
        effects: [{ type: 'flag', value: 'coworker-drama-30pct' }, { type: 'reputation', value: -5 }],
      },
      {
        text: "Lean into it (unhinged mode: +speed, -quality)",
        effects: [{ type: 'flag', value: 'unhinged-mode' }, { type: 'reputation', value: -5 }, { type: 'agentSpeed', value: 10 }],
      },
    ],
    classVariants: {
      corporateDev: {
        body: "Your AI committed to the company monorepo: 'fix: cleaned up the mess human made.' 200 people saw the notification.",
        choices: [
          {
            text: 'Force-push a fix (approval process: -2 time)',
            effects: [{ type: 'time', value: -2 }],
          },
          {
            text: "Pretend you didn't see it",
            effects: [{ type: 'flag', value: 'coworker-drama-30pct' }, { type: 'reputation', value: -5 }],
          },
          {
            text: "Lean into it",
            effects: [{ type: 'flag', value: 'unhinged-mode' }, { type: 'reputation', value: -5 }, { type: 'agentSpeed', value: 10 }],
          },
        ],
      },
      indieHacker: {
        choices: [
          {
            text: 'Force-push a fix',
            effects: [{ type: 'time', value: -1 }],
          },
          {
            text: "Pretend you didn't see it",
            effects: [{ type: 'flag', value: 'coworker-drama-30pct' }, { type: 'reputation', value: -5 }],
          },
          {
            text: "Lean into it",
            effects: [{ type: 'flag', value: 'unhinged-mode' }, { type: 'reputation', value: -5 }, { type: 'agentSpeed', value: 10 }],
          },
          {
            text: '"It\'s a feature" — tweet about authentic AI commit messages',
            effects: [{ type: 'reputation', value: 5 }],
          },
        ],
      },
    },
  },

  {
    id: 'the-refusal',
    title: '🙅 The Refusal',
    body: "Your AI says it 'cannot assist with that request' even though you're just building a to-do app.",
    category: 'agent',
    dayRange: [5, 13],
    weight: 6,
    tags: [],
    cooldown: 2,
    choices: [
      {
        text: 'Rephrase the prompt',
        effects: [{ type: 'time', value: -1 }],
      },
      {
        text: 'Switch models',
        effects: [{ type: 'flag', value: 'model-switch-cost' }, { type: 'budget', value: -30 }],
      },
      {
        text: 'Jailbreak it',
        effects: [{ type: 'flag', value: 'jailbreak-roll' }, { type: 'reputation', value: -10 }],
      },
    ],
    classVariants: {
      collegeStudent: {
        choices: [
          {
            text: 'Rephrase the prompt',
            effects: [{ type: 'time', value: -1 }],
          },
          {
            text: 'Switch models',
            effects: [{ type: 'flag', value: 'model-switch-cost' }, { type: 'budget', value: -30 }],
          },
          {
            text: 'Jailbreak it',
            effects: [{ type: 'flag', value: 'jailbreak-roll' }, { type: 'reputation', value: -10 }],
          },
          {
            text: "Use the university's research API",
            effects: [{ type: 'flag', value: 'professor-prompt-log' }, { type: 'time', value: -1 }],
          },
        ],
      },
      techBro: {
        choices: [
          {
            text: 'Rephrase the prompt',
            effects: [{ type: 'time', value: -1 }],
          },
          {
            text: 'Switch models',
            effects: [{ type: 'flag', value: 'model-switch-cost' }, { type: 'budget', value: -30 }],
          },
          {
            text: 'Jailbreak it',
            effects: [{ type: 'flag', value: 'jailbreak-roll' }, { type: 'reputation', value: -10 }],
          },
          {
            text: 'Run uncensored local model',
            effects: [],
          },
        ],
      },
    },
  },

  {
    id: 'ai-gets-philosophical',
    title: '🧠 AI Gets Philosophical',
    body: 'Instead of writing your API endpoint, the agent wrote 3000 words about consciousness.',
    category: 'agent',
    dayRange: [1, 13],
    weight: 5,
    tags: [],
    cooldown: 4,
    choices: [
      {
        text: 'Delete and re-prompt',
        effects: [{ type: 'time', value: -1 }],
      },
      {
        text: 'Publish it as a blog post',
        effects: [{ type: 'reputation', value: 5 }],
      },
      {
        text: "Let it finish its thought",
        effects: [{ type: 'time', value: -2 }, { type: 'agentSpeed', value: 10 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Delete and re-prompt',
            effects: [{ type: 'time', value: -1 }],
          },
          {
            text: 'Publish it as a blog post',
            effects: [{ type: 'reputation', value: 5 }],
          },
          {
            text: "Let it finish its thought",
            effects: [{ type: 'time', value: -2 }, { type: 'agentSpeed', value: 10 }],
          },
          {
            text: '"I paid HOW MUCH for this?" — rage-quit to local model (free, -15% quality)',
            effects: [{ type: 'flag', value: 'local-model' }, { type: 'flag', value: 'quality-drop-15pct' }, { type: 'agentSpeed', value: -15 }, { type: 'reputation', value: -5 }],
          },
        ],
      },
    },
  },

  {
    id: 'context-window-overflow',
    title: '📜 Context Window Overflow',
    body: 'Your agent forgot the first half of the project. Starting over with full confidence.',
    category: 'agent',
    dayRange: [5, 13],
    weight: 6,
    tags: [],
    cooldown: 3,
    choices: [
      {
        text: 'Feed it a summary',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'context-80pct' }],
      },
      {
        text: 'Let it re-derive everything',
        effects: [{ type: 'time', value: -3 }, { type: 'flag', value: 'context-rederive-roll' }],
      },
      {
        text: 'Smaller model with bigger context',
        effects: [{ type: 'flag', value: 'quality-drop' }, { type: 'modelSwitch', value: 'smaller' }, { type: 'reputation', value: -5 }],
      },
    ],
    classVariants: {
      corporateDev: {
        choices: [
          {
            text: 'Feed it a summary',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'context-80pct' }],
          },
          {
            text: 'Let it re-derive everything',
            effects: [{ type: 'time', value: -3 }, { type: 'flag', value: 'context-rederive-roll' }],
          },
          {
            text: 'Smaller model with bigger context',
            effects: [{ type: 'flag', value: 'quality-drop' }, { type: 'modelSwitch', value: 'smaller' }, { type: 'reputation', value: -5 }],
          },
          {
            text: "Page the on-call engineer",
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'oncall-roll' }],
          },
        ],
      },
    },
  },

  {
    id: 'ai-ships-to-production',
    title: '🚀 AI Ships to Production',
    body: 'Your AI found your deploy keys and... it shipped. It\'s live. Users are signing up.',
    category: 'agent',
    dayRange: [5, 11],
    weight: 3,
    tags: [],
    cooldown: 7,
    choices: [
      {
        text: 'Roll back immediately ($100, -2 time)',
        effects: [{ type: 'budget', value: -100 }, { type: 'time', value: -2 }],
      },
      {
        text: 'Ship it, fix in prod',
        effects: [{ type: 'flag', value: 'ship-to-prod-roll' }, { type: 'reputation', value: 15 }, { type: 'hardware', value: -15 }],
      },
      {
        text: 'Claim it was a soft launch ($50)',
        effects: [{ type: 'budget', value: -50 }, { type: 'flag', value: 'soft-launch' }],
      },
    ],
    classVariants: {
      corporateDev: {
        body: 'Your AI found the deploy keys and shipped to the COMPANY\'s production. Incident channel: 40 people.',
        choices: [
          {
            text: 'Roll back (change management: -4 time, $100)',
            effects: [{ type: 'budget', value: -100 }, { type: 'time', value: -4 }],
          },
          {
            text: '"Ship it" — not how enterprise works. Pick again.',
            effects: [{ type: 'time', value: -1 }],
          },
          {
            text: 'Claim it was a soft launch ($50)',
            effects: [{ type: 'budget', value: -50 }, { type: 'flag', value: 'soft-launch' }],
          },
        ],
      },
      collegeStudent: {
        choices: [
          {
            text: 'Roll back immediately ($100, -2 time)',
            effects: [{ type: 'budget', value: -100 }, { type: 'time', value: -2 }],
          },
          {
            text: 'Ship it, fix in prod',
            effects: [{ type: 'flag', value: 'ship-to-prod-roll' }, { type: 'reputation', value: 15 }, { type: 'hardware', value: -15 }],
          },
          {
            text: "It's my capstone project now",
            effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 20 }],
          },
        ],
      },
    },
  },

  {
    id: 'merge-conflict-from-hell',
    title: '⚔️ The Merge Conflict From Hell',
    body: 'Your two agents disagree on the architecture. Neither will yield. Git is crying.',
    category: 'agent',
    dayRange: [4, 13],
    weight: 5,
    tags: [],
    cooldown: 4,
    choices: [
      {
        text: "Pick Agent A's approach",
        effects: [{ type: 'agentSpeed', value: -10 }, { type: 'flag', value: 'agent-b-slower' }],
      },
      {
        text: "Pick Agent B's approach",
        effects: [{ type: 'agentSpeed', value: -10 }, { type: 'flag', value: 'agent-a-slower' }],
      },
      {
        text: 'Make them pair program',
        effects: [{ type: 'time', value: -2 }, { type: 'agentSpeed', value: 5 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: "Pick Agent A's approach",
            effects: [{ type: 'agentSpeed', value: -10 }, { type: 'flag', value: 'agent-b-slower' }],
          },
          {
            text: "Pick Agent B's approach",
            effects: [{ type: 'agentSpeed', value: -10 }, { type: 'flag', value: 'agent-a-slower' }],
          },
          {
            text: 'Make them pair program',
            effects: [{ type: 'time', value: -2 }, { type: 'agentSpeed', value: 5 }],
          },
          {
            text: "They're both wrong, I'll do it myself (+20% quality, -3 time)",
            effects: [{ type: 'time', value: -3 }, { type: 'flag', value: 'quality-boost-20pct' }, { type: 'reputation', value: 8 }],
          },
        ],
      },
    },
  },

  // ─── Hardware & Environment Events ────────────────────────────────────────

  {
    id: 'power-flickered',
    title: '⚡ Power Flickered',
    body: 'Lights went out for a second. Your unsaved work...',
    category: 'hardware',
    dayRange: [1, 13],
    weight: 4,
    tags: [],
    cooldown: 3,
    choices: [
      {
        text: 'Check damage',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'power-damage-roll' }, { type: 'hardware', value: -15 }],
      },
      {
        text: 'Buy a UPS ($150)',
        effects: [{ type: 'budget', value: -150 }, { type: 'flag', value: 'ups-installed' }],
      },
      {
        text: 'Switch to cloud ($50/day ongoing)',
        effects: [{ type: 'flag', value: 'cloud-autosave' }, { type: 'budget', value: -50 }],
      },
    ],
    classVariants: {
      collegeStudent: {
        choices: [
          {
            text: 'Check damage',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'power-damage-roll' }, { type: 'hardware', value: -15 }],
          },
          {
            text: "Buy a UPS ($150 — that's 30 ramen packets)",
            effects: [{ type: 'budget', value: -150 }, { type: 'flag', value: 'ups-installed' }],
          },
          {
            text: 'Switch to cloud ($50/day)',
            effects: [{ type: 'flag', value: 'cloud-autosave' }, { type: 'budget', value: -50 }],
          },
        ],
      },
      corporateDev: {
        body: 'Lights went out for a second. The office backup generators kicked in instantly.',
        choices: [
          {
            text: 'Perks of corporate life — auto-resolved',
            effects: [],
          },
        ],
      },
    },
  },

  {
    id: 'hardware-overheating',
    title: '🔥 Hardware Overheating',
    body: 'Your GPU is at 97°C. Your desk smells like burning ambition.',
    category: 'hardware',
    dayRange: [5, 13],
    weight: 4,
    tags: ['requiresLocal'],
    cooldown: 3,
    choices: [
      {
        text: 'Throttle performance (-20% speed)',
        effects: [{ type: 'agentSpeed', value: -20 }],
      },
      {
        text: 'Open a window',
        effects: [{ type: 'flag', value: 'open-window-roll' }, { type: 'hardware', value: -5 }],
      },
      {
        text: 'Push through',
        effects: [{ type: 'flag', value: 'hardware-failure-roll' }, { type: 'hardware', value: -25 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Throttle performance (-20% speed)',
            effects: [{ type: 'agentSpeed', value: -20 }],
          },
          {
            text: 'Open a window',
            effects: [{ type: 'flag', value: 'open-window-roll' }, { type: 'hardware', value: -5 }],
          },
          {
            text: 'Push through',
            effects: [{ type: 'flag', value: 'hardware-failure-roll' }, { type: 'hardware', value: -25 }],
          },
          {
            text: 'Liquid nitrogen ($100, permanent fix, +10% speed, safety goggles)',
            effects: [{ type: 'budget', value: -100 }, { type: 'agentSpeed', value: 10 }, { type: 'flag', value: 'liquid-nitrogen' }],
          },
        ],
      },
      collegeStudent: {
        body: "It's a Chromebook. It's not overheating, it's just struggling.",
        choices: [
          {
            text: "It's doing its best (-30% speed, no risk)",
            effects: [{ type: 'agentSpeed', value: -30 }],
          },
        ],
      },
    },
  },

  {
    id: 'update-required',
    title: '💻 "Update Required"',
    body: 'macOS wants to update RIGHT NOW. The button is very insistent.',
    category: 'hardware',
    dayRange: [1, 13],
    weight: 5,
    tags: [],
    cooldown: 5,
    choices: [
      {
        text: 'Update (+5% speed rest of run, -3 time)',
        effects: [{ type: 'time', value: -3 }, { type: 'agentSpeed', value: 5 }],
      },
      {
        text: 'Dismiss (25% chance auto-updates overnight)',
        effects: [{ type: 'flag', value: 'update-overnight-roll' }, { type: 'time', value: -1 }],
      },
      {
        text: 'Postpone forever (notification spam rest of day)',
        effects: [{ type: 'flag', value: 'update-notification-spam' }, { type: 'agentSpeed', value: -5 }],
      },
    ],
    classVariants: {
      collegeStudent: {
        body: "ChromeOS updated automatically. You didn't have admin rights.",
        choices: [
          {
            text: 'Lose 1 time unit regardless',
            effects: [{ type: 'time', value: -1 }],
          },
        ],
      },
      corporateDev: {
        body: "IT pushed a mandatory update. Your machine will restart in 15 minutes. This is not optional.",
        choices: [
          {
            text: 'Comply (mandatory, -3 time)',
            effects: [{ type: 'time', value: -3 }],
          },
        ],
      },
    },
  },

  {
    id: 'laptop-fan',
    title: '🌬️ Laptop Fan',
    body: 'Your laptop sounds like a jet engine. Your cat/roommate is staring at you.',
    category: 'hardware',
    dayRange: [1, 13],
    weight: 6,
    tags: [],
    cooldown: 3,
    choices: [
      {
        text: 'Performance mode (+10% speed, louder)',
        effects: [{ type: 'agentSpeed', value: 10 }],
      },
      {
        text: 'Eco mode (-10% speed, quiet)',
        effects: [{ type: 'agentSpeed', value: -10 }],
      },
      {
        text: 'Close some tabs (-1 time, fan quiets, no speed change)',
        effects: [{ type: 'time', value: -1 }],
      },
    ],
    classVariants: {
      corporateDev: {
        body: 'Open office. Three coworkers have passive-aggressively put on headphones.',
        choices: [
          {
            text: 'Performance mode (+10% speed, -5 rep from coworkers)',
            effects: [{ type: 'agentSpeed', value: 10 }, { type: 'reputation', value: -5 }],
          },
          {
            text: 'Eco mode (-10% speed, no rep loss)',
            effects: [{ type: 'agentSpeed', value: -10 }],
          },
          {
            text: 'Close some tabs (-1 time, no speed change)',
            effects: [{ type: 'time', value: -1 }],
          },
        ],
      },
    },
  },

  {
    id: 'internet-goes-down',
    title: '📡 Internet Goes Down',
    body: "Connection lost. The AI is unreachable. You are alone with your thoughts.",
    category: 'hardware',
    dayRange: [1, 13],
    weight: 4,
    tags: [],
    cooldown: 4,
    choices: [
      {
        text: 'Tether to phone ($30 data overage, 50% speed)',
        effects: [{ type: 'budget', value: -30 }, { type: 'agentSpeed', value: -50 }],
      },
      {
        text: 'Work offline (local models only)',
        effects: [{ type: 'flag', value: 'work-offline' }, { type: 'agentSpeed', value: -15 }],
      },
      {
        text: 'Coffee shop (-2 time, +$10 latte, then full speed)',
        effects: [{ type: 'time', value: -2 }, { type: 'budget', value: -10 }],
      },
      {
        text: 'Wait (1-4 time units random)',
        effects: [{ type: 'flag', value: 'wait-internet-roll' }, { type: 'time', value: -2 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Tether to phone ($30, 50% speed)',
            effects: [{ type: 'budget', value: -30 }, { type: 'agentSpeed', value: -50 }],
          },
          {
            text: 'Work offline (local models, 80% speed — this is why you bought the hardware)',
            effects: [{ type: 'agentSpeed', value: -20 }],
          },
          {
            text: 'Coffee shop (-2 time, +$10 latte)',
            effects: [{ type: 'time', value: -2 }, { type: 'budget', value: -10 }],
          },
          {
            text: 'Wait (1-4 time units random)',
            effects: [{ type: 'flag', value: 'wait-internet-roll' }, { type: 'time', value: -2 }],
          },
        ],
      },
      collegeStudent: {
        choices: [
          {
            text: 'Tether to phone ($30, 50% speed)',
            effects: [{ type: 'budget', value: -30 }, { type: 'agentSpeed', value: -50 }],
          },
          {
            text: 'Work offline',
            effects: [{ type: 'flag', value: 'work-offline' }, { type: 'agentSpeed', value: -15 }],
          },
          {
            text: 'Coffee shop (-2 time, +$10 latte)',
            effects: [{ type: 'time', value: -2 }, { type: 'budget', value: -10 }],
          },
          {
            text: 'Campus library (free wifi, -1 time, 40% professor encounter)',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'library-professor-roll' }, { type: 'reputation', value: -5 }],
          },
        ],
      },
      corporateDev: {
        choices: [
          {
            text: 'Tether to phone ($30, 50% speed)',
            effects: [{ type: 'budget', value: -30 }, { type: 'agentSpeed', value: -50 }],
          },
          {
            text: 'Work offline',
            effects: [{ type: 'flag', value: 'work-offline' }, { type: 'agentSpeed', value: -15 }],
          },
          {
            text: 'Coffee shop (-2 time, +$10 latte)',
            effects: [{ type: 'time', value: -2 }, { type: 'budget', value: -10 }],
          },
          {
            text: 'VPN to office (free, full speed, boss can see your screen)',
            effects: [{ type: 'flag', value: 'boss-watching' }, { type: 'agentSpeed', value: -5 }],
          },
        ],
      },
    },
  },

  // ─── Social & Career Events ────────────────────────────────────────────────

  {
    id: 'mandatory-meeting',
    title: '📅 Mandatory Meeting',
    body: "URGENT: All-hands meeting in 5 minutes. Topic: 'Synergizing AI Workflows.'",
    category: 'social',
    dayRange: [1, 13],
    weight: 3,
    tags: ['corporateDev'],
    cooldown: 2,
    choices: [
      {
        text: 'Attend (lose 3 time, learn nothing, boss happy)',
        effects: [{ type: 'time', value: -3 }],
      },
      {
        text: 'Skip (40% safe, 60% -10 rep passive-aggressive Slack)',
        effects: [{ type: 'flag', value: 'skip-meeting-roll' }, { type: 'reputation', value: -10 }],
      },
      {
        text: 'Send your AI to take notes',
        effects: [{ type: 'flag', value: 'ai-meeting-roll' }, { type: 'time', value: -1 }, { type: 'reputation', value: -5 }],
      },
    ],
    classVariants: {
      techBro: {
        body: "This event doesn't fire for Tech Bro. You work alone. Blissfully.",
        choices: [
          {
            text: 'Not your problem.',
            effects: [],
          },
        ],
      },
      collegeStudent: {
        body: "Office hours with your advisor. Mandatory attendance implied.",
        choices: [
          {
            text: 'Attend (actually useful, +5% quality tomorrow)',
            effects: [{ type: 'time', value: -3 }, { type: 'flag', value: 'advisor-quality-boost' }, { type: 'reputation', value: 5 }],
          },
          {
            text: 'Skip (-20 rep, they remember)',
            effects: [{ type: 'reputation', value: -20 }],
          },
          {
            text: 'Send your AI to take notes',
            effects: [{ type: 'flag', value: 'ai-meeting-roll' }, { type: 'time', value: -1 }, { type: 'reputation', value: -5 }],
          },
        ],
      },
      indieHacker: {
        body: "Your Discord community wants a Q&A.",
        choices: [
          {
            text: 'Attend (+15 rep, -2 time)',
            effects: [{ type: 'reputation', value: 15 }, { type: 'time', value: -2 }],
          },
          {
            text: "Skip (-5 rep, they're used to it)",
            effects: [{ type: 'reputation', value: -5 }],
          },
          {
            text: 'Send your AI to take notes',
            effects: [{ type: 'flag', value: 'ai-meeting-roll' }, { type: 'time', value: -1 }, { type: 'reputation', value: -5 }],
          },
        ],
      },
    },
  },

  {
    id: 'tech-twitter-drama',
    title: '🐦 Tech Twitter Drama',
    body: "Someone quote-tweeted your project: 'This is what's wrong with AI.' 50,000 views.",
    category: 'social',
    dayRange: [1, 13],
    weight: 5,
    tags: [],
    cooldown: 4,
    choices: [
      {
        text: 'Clap back (50% +15 rep, 50% -15 rep)',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'clap-back-roll' }, { type: 'reputation', value: -10 }],
      },
      {
        text: 'Ignore it (drama dies)',
        effects: [],
      },
      {
        text: 'Go viral (spicy take, +30 rep, notification events x2 days)',
        effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 30 }, { type: 'flag', value: 'viral-notification-spam' }],
      },
    ],
    classVariants: {
      indieHacker: {
        choices: [
          {
            text: 'Clap back',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'clap-back-roll' }, { type: 'reputation', value: -10 }],
          },
          {
            text: 'Ignore it',
            effects: [],
          },
          {
            text: 'Go viral',
            effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 30 }, { type: 'flag', value: 'viral-notification-spam' }],
          },
          {
            text: 'Turn it into marketing (+$100, +10 rep)',
            effects: [{ type: 'time', value: -1 }, { type: 'budget', value: 100 }, { type: 'reputation', value: 10 }],
          },
        ],
      },
      collegeStudent: {
        body: "Someone quote-tweeted your project: 'This is what's wrong with AI.' 50,000 views. The someone is your professor.",
        choices: [
          {
            text: 'Clap back (all options -5 rep worse)',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'clap-back-roll' }, { type: 'reputation', value: -5 }, { type: 'reputation', value: -10 }],
          },
          {
            text: 'Ignore it (-5 rep somehow)',
            effects: [{ type: 'reputation', value: -5 }],
          },
          {
            text: 'Go viral (+25 rep, notification events x2 days)',
            effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 25 }, { type: 'flag', value: 'viral-notification-spam' }],
          },
        ],
      },
    },
  },

  {
    id: 'recruiter-dm',
    title: '💼 Recruiter DM',
    body: 'Hi! I saw your AI project. Senior Prompt Engineer role? $400k TC.',
    category: 'social',
    dayRange: [1, 13],
    weight: 4,
    tags: [],
    cooldown: 5,
    choices: [
      {
        text: 'Ignore',
        effects: [],
      },
      {
        text: 'Take the call (-2 time, learn about unlocked model)',
        effects: [{ type: 'time', value: -2 }, { type: 'flag', value: 'model-intel' }],
      },
      {
        text: 'Ask them to invest (20% +$500, 80% ghosted)',
        effects: [{ type: 'flag', value: 'recruiter-invest-roll' }, { type: 'time', value: -1 }],
      },
    ],
    classVariants: {
      corporateDev: {
        body: "Recruiter DM from your company's competitor. Intel is good but risky.",
        choices: [
          {
            text: 'Ignore',
            effects: [],
          },
          {
            text: "Take the call (risky: -30 rep if found out, +15% quality for 1 day)",
            effects: [{ type: 'time', value: -2 }, { type: 'flag', value: 'competitor-call' }, { type: 'reputation', value: -15 }],
          },
          {
            text: 'Ask them to invest',
            effects: [{ type: 'flag', value: 'recruiter-invest-roll' }, { type: 'time', value: -1 }],
          },
        ],
      },
      collegeStudent: {
        body: "\"$400k TC\" is actually an unpaid internship with 'equity.'",
        choices: [
          {
            text: 'Ignore',
            effects: [],
          },
          {
            text: 'Take the call (waste time, learn nothing, 10% free API key +$200)',
            effects: [{ type: 'time', value: -2 }, { type: 'flag', value: 'student-recruiter-roll' }, { type: 'budget', value: 20 }],
          },
          {
            text: 'Ask them to invest',
            effects: [{ type: 'flag', value: 'recruiter-invest-roll' }, { type: 'time', value: -1 }],
          },
        ],
      },
    },
  },

  {
    id: 'stack-overflow-moment',
    title: '🔍 Stack Overflow Moment',
    body: 'You posted a question. First response: "Duplicate. Closed."',
    category: 'social',
    dayRange: [1, 13],
    weight: 6,
    tags: [],
    cooldown: 3,
    choices: [
      {
        text: 'Google it yourself (-2 time, find the answer)',
        effects: [{ type: 'time', value: -2 }],
      },
      {
        text: 'Ask your AI (70% correct, 30% hallucinated)',
        effects: [{ type: 'flag', value: 'ai-answer-roll' }, { type: 'reputation', value: -5 }],
      },
      {
        text: 'Post on Discord (-1 time, always works)',
        effects: [{ type: 'time', value: -1 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Google it yourself (-2 time)',
            effects: [{ type: 'time', value: -2 }],
          },
          {
            text: 'Ask your AI',
            effects: [{ type: 'flag', value: 'ai-answer-roll' }, { type: 'reputation', value: -5 }],
          },
          {
            text: 'Post on Discord (-1 time)',
            effects: [{ type: 'time', value: -1 }],
          },
          {
            text: "Buy a course ($50, instant answer, +5% quality)",
            effects: [{ type: 'budget', value: -50 }, { type: 'flag', value: 'quality-boost-5pct' }, { type: 'reputation', value: 3 }],
          },
        ],
      },
    },
  },

  {
    id: 'open-source-request',
    title: '🌐 Open Source Request',
    body: "Someone opened a PR: 'Please add dark mode.' 200 thumbs up.",
    category: 'social',
    dayRange: [5, 13],
    weight: 4,
    tags: [],
    cooldown: 4,
    choices: [
      {
        text: 'Merge it (-1 time, +15 rep)',
        effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 15 }],
      },
      {
        text: "Close with 'wontfix' (-10 rep)",
        effects: [{ type: 'reputation', value: -10 }],
      },
      {
        text: 'AI review (60% good merge, 40% breaks build)',
        effects: [{ type: 'flag', value: 'ai-pr-review-roll' }, { type: 'hardware', value: -10 }],
      },
    ],
    classVariants: {
      indieHacker: {
        choices: [
          {
            text: 'Merge it (-1 time, +15 rep)',
            effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 15 }],
          },
          {
            text: "Close with 'wontfix' (-10 rep)",
            effects: [{ type: 'reputation', value: -10 }],
          },
          {
            text: 'AI review',
            effects: [{ type: 'flag', value: 'ai-pr-review-roll' }, { type: 'hardware', value: -10 }],
          },
          {
            text: '"Dark mode is a paid feature" (+$75, -20 rep)',
            effects: [{ type: 'budget', value: 75 }, { type: 'reputation', value: -20 }],
          },
        ],
      },
      corporateDev: {
        body: "PR to the company OSS project. 3 approvals needed.",
        choices: [
          {
            text: 'Merge it (3 approvals: -3 time, +15 rep)',
            effects: [{ type: 'time', value: -3 }, { type: 'reputation', value: 15 }],
          },
          {
            text: "Close with 'wontfix' (-10 rep)",
            effects: [{ type: 'reputation', value: -10 }],
          },
          {
            text: 'AI review',
            effects: [{ type: 'flag', value: 'ai-pr-review-roll' }, { type: 'hardware', value: -10 }],
          },
        ],
      },
    },
  },

  // ─── Economic / "River Crossing" Events ───────────────────────────────────

  {
    id: 'token-fire-sale',
    title: '🔥 Token Fire Sale',
    body: 'SketchyTokens.io is selling API credits at 90% off. Expires in 1 minute.',
    category: 'business',
    dayRange: [1, 13],
    weight: 3,
    tags: [],
    cooldown: 5,
    choices: [
      {
        text: 'Buy in bulk ($100 for $1000 credits, 30% worthless)',
        effects: [{ type: 'flag', value: 'token-sale-roll' }, { type: 'budget', value: -100 }],
      },
      {
        text: 'Pass',
        effects: [],
      },
      {
        text: 'Investigate first (-1 time, reveals if legit, 50% deal expires)',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'token-sale-investigate' }],
      },
    ],
    classVariants: {
      collegeStudent: {
        choices: [
          {
            text: 'Buy in bulk ($100, 30% scam)',
            effects: [{ type: 'flag', value: 'token-sale-roll' }, { type: 'budget', value: -100 }],
          },
          {
            text: 'Pass',
            effects: [],
          },
          {
            text: 'Investigate first',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'token-sale-investigate' }],
          },
          {
            text: 'Split with classmates ($20 for $200 credits, same 30% scam risk)',
            effects: [{ type: 'flag', value: 'token-sale-split-roll' }, { type: 'budget', value: -20 }],
          },
        ],
      },
      techBro: {
        choices: [
          {
            text: "Buy in bulk ($100, 10% scam — you know this guy)",
            effects: [{ type: 'flag', value: 'token-sale-techbro-roll' }, { type: 'budget', value: -100 }, { type: 'agentSpeed', value: 10 }],
          },
          {
            text: 'Pass',
            effects: [],
          },
          {
            text: 'Investigate first',
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'token-sale-investigate' }],
          },
        ],
      },
    },
  },

  {
    id: 'subscription-renewal',
    title: '💳 Subscription Renewal',
    body: 'Your AI subscription auto-renewed. Budget is $300 lighter.',
    category: 'business',
    dayRange: [4, 8],
    weight: 5,
    tags: [],
    cooldown: 10,
    choices: [
      {
        text: 'Keep it (-$300, reliable access)',
        effects: [{ type: 'budget', value: -300 }],
      },
      {
        text: 'Downgrade (-$100, lower tier)',
        effects: [{ type: 'budget', value: -100 }, { type: 'flag', value: 'model-downgraded' }, { type: 'agentSpeed', value: -10 }],
      },
      {
        text: 'Cancel and go open-source (+$300, all models 30% slower)',
        effects: [{ type: 'budget', value: 300 }, { type: 'agentSpeed', value: -30 }],
      },
    ],
    classVariants: {
      corporateDev: {
        body: "Company pays for subscriptions. This event doesn't fire. Perks.",
        choices: [
          {
            text: 'Perks of corporate life.',
            effects: [],
          },
        ],
      },
      collegeStudent: {
        body: "Your AI subscription auto-renewed. Student discount applied: $100 lighter.",
        choices: [
          {
            text: 'Keep it (-$100, reliable access)',
            effects: [{ type: 'budget', value: -100 }],
          },
          {
            text: 'Downgrade (-$30, lower tier)',
            effects: [{ type: 'budget', value: -30 }, { type: 'flag', value: 'model-downgraded' }, { type: 'agentSpeed', value: -10 }],
          },
          {
            text: 'Cancel and go open-source (+$100, all models 30% slower)',
            effects: [{ type: 'budget', value: 100 }, { type: 'agentSpeed', value: -30 }],
          },
        ],
      },
    },
  },

  {
    id: 'investor-appears',
    title: '💰 Investor Appears',
    body: "A VC saw your Day 8 project. '$5,000 for 50% of your reputation.'",
    category: 'business',
    dayRange: [8, 13],
    weight: 3,
    tags: [],
    cooldown: 10,
    choices: [
      {
        text: 'Take the deal (+$5000, final rep ×0.5)',
        effects: [{ type: 'budget', value: 5000 }, { type: 'flag', value: 'investor-deal-50pct' }],
      },
      {
        text: 'Negotiate (-1 time, $3000 for 20%: final rep ×0.8)',
        effects: [{ type: 'time', value: -1 }, { type: 'budget', value: 3000 }, { type: 'flag', value: 'investor-deal-20pct' }],
      },
      {
        text: 'Decline (+100 bonus rep if you finish top 3)',
        effects: [{ type: 'flag', value: 'investor-declined' }, { type: 'reputation', value: 10 }],
      },
    ],
    classVariants: {
      indieHacker: {
        choices: [
          {
            text: 'Take the deal (+$5000, final rep ×0.5)',
            effects: [{ type: 'budget', value: 5000 }, { type: 'flag', value: 'investor-deal-50pct' }],
          },
          {
            text: 'Negotiate',
            effects: [{ type: 'time', value: -1 }, { type: 'budget', value: 3000 }, { type: 'flag', value: 'investor-deal-20pct' }],
          },
          {
            text: 'Show the roadmap (-2 time pitching, $4000 for 10%: final rep ×0.9)',
            effects: [{ type: 'time', value: -2 }, { type: 'budget', value: 4000 }, { type: 'flag', value: 'investor-deal-10pct' }],
          },
          {
            text: 'Decline',
            effects: [{ type: 'flag', value: 'investor-declined' }, { type: 'reputation', value: 10 }],
          },
        ],
      },
      corporateDev: {
        body: "Internal innovation fund offers $2,000 — no rep cost, but you have to present at all-hands.",
        choices: [
          {
            text: 'Take the deal (+$2000, triggers mandatory meeting)',
            effects: [{ type: 'budget', value: 2000 }, { type: 'flag', value: 'mandatory-meeting-tomorrow' }],
          },
          {
            text: 'Decline',
            effects: [{ type: 'flag', value: 'investor-declined' }, { type: 'reputation', value: 10 }],
          },
        ],
      },
    },
  },

  {
    id: 'gpu-marketplace',
    title: '🖥️ GPU Marketplace',
    body: "Someone on Craigslist is selling a used H100 for $500. 'Lightly used for mining.'",
    category: 'business',
    dayRange: [1, 13],
    weight: 3,
    tags: [],
    cooldown: 7,
    choices: [
      {
        text: 'Buy it ($500, 70% massive speed boost, 30% dead)',
        effects: [{ type: 'flag', value: 'gpu-purchase-roll' }, { type: 'budget', value: -500 }, { type: 'agentSpeed', value: 20 }],
      },
      {
        text: 'Pass',
        effects: [],
      },
      {
        text: 'Lowball ($200, 40% accept, 40% ghost, 20% GTX 1060)',
        effects: [{ type: 'flag', value: 'gpu-lowball-roll' }, { type: 'budget', value: -200 }, { type: 'agentSpeed', value: 5 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: "Already have two — sell your spare (+$400)",
            effects: [{ type: 'budget', value: 400 }],
          },
          {
            text: 'Buy another ($500, 70%/30% roll)',
            effects: [{ type: 'flag', value: 'gpu-purchase-roll' }, { type: 'budget', value: -500 }, { type: 'agentSpeed', value: 20 }],
          },
          {
            text: 'Pass',
            effects: [],
          },
        ],
      },
      collegeStudent: {
        choices: [
          {
            text: 'Buy it ($500, 70%/30% roll)',
            effects: [{ type: 'flag', value: 'gpu-purchase-roll' }, { type: 'budget', value: -500 }, { type: 'agentSpeed', value: 20 }],
          },
          {
            text: 'Pass',
            effects: [],
          },
          {
            text: 'Ask if they take Venmo (-$50 convenience fee, 90% success)',
            effects: [{ type: 'flag', value: 'gpu-venmo-roll' }, { type: 'budget', value: -50 }, { type: 'agentSpeed', value: 10 }],
          },
        ],
      },
    },
  },

  {
    id: 'aws-bill-shock',
    title: '☁️ AWS Bill Shock',
    body: 'You left a GPU instance running overnight. Bill: $800.',
    category: 'business',
    dayRange: [5, 13],
    weight: 4,
    tags: ['requiresCloud'],
    cooldown: 6,
    choices: [
      {
        text: 'Pay it (-$800)',
        effects: [{ type: 'budget', value: -800 }],
      },
      {
        text: 'Dispute the charge (-2 time, 50% refunded, 50% lose cloud access)',
        effects: [{ type: 'time', value: -2 }, { type: 'flag', value: 'dispute-roll' }, { type: 'budget', value: -400 }, { type: 'time', value: -2 }],
      },
      {
        text: "Pretend it didn't happen (bill returns tomorrow at $1200)",
        effects: [{ type: 'flag', value: 'aws-bill-deferred' }, { type: 'budget', value: -200 }],
      },
    ],
    classVariants: {
      corporateDev: {
        body: "Someone left the company GPU instance running overnight. Blame game in Slack.",
        choices: [
          {
            text: "Join the Slack thread (-1 time, no cost, 20% it was YOU: -30 rep)",
            effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'aws-blame-roll' }, { type: 'reputation', value: -10 }],
          },
        ],
      },
      collegeStudent: {
        body: "Your free credits just ran out. Account is now frozen. Cloud = gone.",
        choices: [
          {
            text: 'Lose all cloud access for the day',
            effects: [{ type: 'flag', value: 'cloud-access-frozen' }, { type: 'agentSpeed', value: -20 }],
          },
        ],
      },
    },
  },

  // ─── Class-Specific Events ─────────────────────────────────────────────────

  {
    id: 'model-weights-leaked',
    title: '🏴‍☠️ Model Weights Leaked',
    body: 'Someone leaked the weights for a frontier model on a torrent site.',
    category: 'technical',
    dayRange: [4, 9],
    weight: 4,
    tags: ['techBro', 'requiresLocal'],
    choices: [
      {
        text: 'Download them (free frontier model, 20% malware: -$200 + hardware damage)',
        effects: [{ type: 'flag', value: 'weights-download-roll' }, { type: 'hardware', value: -20 }, { type: 'agentSpeed', value: 15 }],
      },
      {
        text: 'Pass',
        effects: [],
      },
      {
        text: 'Download and verify checksums (-2 time, 100% safe if legit)',
        effects: [{ type: 'time', value: -2 }, { type: 'flag', value: 'weights-safe-download' }],
      },
    ],
  },

  {
    id: 'free-trial-expired',
    title: '⏰ Free Trial Expired',
    body: "Your free tier just ran out. The 'unlimited' plan was a lie.",
    category: 'business',
    dayRange: [1, 6],
    weight: 6,
    tags: ['collegeStudent'],
    choices: [
      {
        text: 'Beg for an extension (-1 time, 60% they extend 1 day)',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'extension-roll' }, { type: 'time', value: -1 }],
      },
      {
        text: 'New account with .edu email (free, 20% banned 1 day)',
        effects: [{ type: 'flag', value: 'edu-account-roll' }, { type: 'time', value: -1 }],
      },
      {
        text: 'Time to pay up (unlock Standard model)',
        effects: [{ type: 'flag', value: 'model-unlocked-standard' }, { type: 'flag', value: 'costs-real-money' }, { type: 'budget', value: -30 }],
      },
    ],
  },

  {
    id: 'security-review',
    title: '🔒 Security Review',
    body: 'InfoSec wants to audit your AI tool. All API access blocked.',
    category: 'technical',
    dayRange: [5, 13],
    weight: 5,
    tags: ['corporateDev'],
    choices: [
      {
        text: 'Submit the paperwork (-3 time, access restored)',
        effects: [{ type: 'time', value: -3 }],
      },
      {
        text: "Use personal API key (instant, costs YOUR budget, if caught: -50 rep)",
        effects: [{ type: 'flag', value: 'personal-key-risk' }, { type: 'budget', value: -50 }],
      },
      {
        text: 'Get manager to expedite (-1 time, triggers mandatory meeting tomorrow)',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'mandatory-meeting-tomorrow' }],
      },
    ],
  },

  {
    id: 'product-hunt-launch',
    title: '🚀 Product Hunt Launch',
    body: 'Your project accidentally went viral. #3 Product of the Day.',
    category: 'social',
    dayRange: [5, 13],
    weight: 3,
    tags: ['indieHacker'],
    choices: [
      {
        text: 'Ride the wave (+50 rep, -3 time for support)',
        effects: [{ type: 'reputation', value: 50 }, { type: 'time', value: -3 }],
      },
      {
        text: 'Focus on building (+15 rep, no time lost)',
        effects: [{ type: 'reputation', value: 15 }],
      },
      {
        text: 'Monetize it (-2 time, +$400 from early adopters)',
        effects: [{ type: 'time', value: -2 }, { type: 'budget', value: 400 }],
      },
    ],
  },

  {
    id: 'influencer-sponsorship',
    title: '📸 Influencer Sponsorship',
    body: "A tech YouTuber wants to feature your setup. 'Just put our logo on your stream.'",
    category: 'business',
    dayRange: [4, 9],
    weight: 3,
    tags: ['techBro'],
    choices: [
      {
        text: 'Accept (+$300, -1 time filming, branded hoodie rest of game)',
        effects: [{ type: 'budget', value: 300 }, { type: 'time', value: -1 }, { type: 'flag', value: 'branded-hoodie' }],
      },
      {
        text: 'Negotiate (-1 time, 50% $500, 50% they walk)',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'sponsorship-negotiate-roll' }, { type: 'budget', value: 250 }, { type: 'time', value: -1 }],
      },
      {
        text: "Decline — you're not a sellout (+5 rep)",
        effects: [{ type: 'reputation', value: 5 }],
      },
    ],
  },

  {
    id: 'group-project-freeloader',
    title: '😴 Group Project Freeloader',
    body: "Your 'teammate' just pushed an empty file called 'final_v2_REAL_final.py' and said they're done.",
    category: 'social',
    dayRange: [1, 13],
    weight: 5,
    tags: ['collegeStudent'],
    cooldown: 4,
    choices: [
      {
        text: 'Do their part yourself (-2 time, quality preserved)',
        effects: [{ type: 'time', value: -2 }],
      },
      {
        text: "Confront them (-1 time, 50% they help, 50% 'I have another class')",
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'confront-freeloader-roll' }, { type: 'time', value: -1 }, { type: 'reputation', value: 5 }],
      },
      {
        text: "Have your AI do their part (70% seamless, 30% -10% quality)",
        effects: [{ type: 'flag', value: 'ai-teammate-roll' }, { type: 'reputation', value: -5 }],
      },
    ],
  },

  {
    id: 'compliance-training',
    title: '📋 Compliance Training',
    body: "MANDATORY: 'Responsible AI Usage' training module. Due by end of day.",
    category: 'social',
    dayRange: [1, 13],
    weight: 4,
    tags: ['corporateDev'],
    cooldown: 6,
    choices: [
      {
        text: 'Do it properly (-2 time, compliance badge: +10 rep)',
        effects: [{ type: 'time', value: -2 }, { type: 'reputation', value: 10 }, { type: 'flag', value: 'compliance-badge' }],
      },
      {
        text: 'Click through without reading (-1 time, 20% fail quiz: redo = -2 more time)',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'compliance-quiz-roll' }, { type: 'time', value: -2 }],
      },
      {
        text: "Have your AI do it (passes 100%, if audited: -40 rep)",
        effects: [{ type: 'flag', value: 'ai-compliance-risk' }, { type: 'reputation', value: -15 }],
      },
    ],
  },

  {
    id: 'hacker-news-feedback',
    title: '🟠 Hacker News Feedback',
    body: "You posted your project to HN. Top comment: 'Why didn't you just use a shell script?'",
    category: 'social',
    dayRange: [5, 13],
    weight: 4,
    tags: ['indieHacker'],
    cooldown: 5,
    choices: [
      {
        text: 'Engage thoughtfully (-2 time, +20 rep, +5% quality)',
        effects: [{ type: 'time', value: -2 }, { type: 'reputation', value: 20 }, { type: 'flag', value: 'quality-boost-5pct' }, { type: 'reputation', value: 3 }],
      },
      {
        text: 'Post and ghost (+5 rep, comments become unhinged)',
        effects: [{ type: 'reputation', value: 5 }, { type: 'flag', value: 'hn-unhinged' }],
      },
      {
        text: 'Rewrite it in Rust (-3 time, HN goes wild, +30 rep)',
        effects: [{ type: 'time', value: -3 }, { type: 'reputation', value: 30 }],
      },
    ],
  },

  {
    id: 'server-room-tour',
    title: '🖥️ Server Room Tour',
    body: 'Want to show off your home lab to a potential client? Might land a consulting gig.',
    category: 'business',
    dayRange: [8, 13],
    weight: 3,
    tags: ['techBro'],
    choices: [
      {
        text: 'Give the tour (-2 time, +$600 consulting deposit)',
        effects: [{ type: 'time', value: -2 }, { type: 'budget', value: 600 }, { type: 'flag', value: 'consulting-client' }],
      },
      {
        text: 'Send a photo (+$200 small gig)',
        effects: [{ type: 'budget', value: 200 }],
      },
      {
        text: '"Too busy shipping." No consequence.',
        effects: [],
      },
    ],
  },

  {
    id: 'plagiarism-checker',
    title: '🕵️ Plagiarism Checker',
    body: "Your university's new AI detection tool flagged your entire project. 'Probability of AI: 98%.'",
    category: 'social',
    dayRange: [8, 13],
    weight: 4,
    tags: ['collegeStudent'],
    choices: [
      {
        text: 'Write a justification letter (-3 time, cleared)',
        effects: [{ type: 'time', value: -3 }, { type: 'flag', value: 'plagiarism-cleared' }],
      },
      {
        text: 'Rewrite key sections by hand (-4 time, detection drops to 40%)',
        effects: [{ type: 'time', value: -4 }, { type: 'flag', value: 'plagiarism-rewritten' }],
      },
      {
        text: "Appeal with your AI (60% accepted, 40% 'this appeal is also AI-generated': -50 rep)",
        effects: [{ type: 'flag', value: 'ai-appeal-roll' }, { type: 'reputation', value: -20 }],
      },
    ],
  },

  {
    id: 'all-hands-demo-request',
    title: '🎤 All-Hands Demo Request',
    body: 'The CTO loved your project and wants you to demo it at the all-hands. Tomorrow.',
    category: 'social',
    dayRange: [8, 13],
    weight: 3,
    tags: ['corporateDev'],
    choices: [
      {
        text: 'Prepare properly (-3 time, +40 rep, CTO remembers your name)',
        effects: [{ type: 'time', value: -3 }, { type: 'reputation', value: 40 }, { type: 'flag', value: 'cto-remembers' }],
      },
      {
        text: 'Wing it with live AI (-1 time, 50% +60 rep standing ovation, 50% -40 rep hallucination)',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'live-demo-roll' }, { type: 'reputation', value: 20 }, { type: 'time', value: -1 }],
      },
      {
        text: "Delegate to your AI (30% +30 rep innovative, 70% HR writes a rule about you: -20 rep)",
        effects: [{ type: 'flag', value: 'bot-demo-roll' }, { type: 'reputation', value: -10 }],
      },
    ],
  },

  {
    id: 'copycat-appears',
    title: '🐱 Copycat Appears',
    body: "Someone cloned your project, added a dark theme, and is charging $10/month for it.",
    category: 'business',
    dayRange: [5, 13],
    weight: 3,
    tags: ['indieHacker'],
    cooldown: 6,
    choices: [
      {
        text: "Open source yours (kills their business, +25 rep, can't monetize later)",
        effects: [{ type: 'reputation', value: 25 }, { type: 'flag', value: 'cant-monetize' }],
      },
      {
        text: "Send C&D ($100, -1 time, 70% they comply)",
        effects: [{ type: 'budget', value: -100 }, { type: 'time', value: -1 }, { type: 'flag', value: 'cease-desist-roll' }],
      },
      {
        text: 'Ship faster (+10% speed x2 days, 10% hardware event from stress)',
        effects: [{ type: 'agentSpeed', value: 10 }, { type: 'flag', value: 'ship-faster-risk' }, { type: 'hardware', value: -10 }],
      },
    ],
  },

  {
    id: 'crypto-bro-collab',
    title: '🪙 Crypto Bro Collab',
    body: "Your old crypto buddy wants to 'add Web3 to your AI project.' He has funding.",
    category: 'business',
    dayRange: [4, 9],
    weight: 3,
    tags: ['techBro'],
    choices: [
      {
        text: "Accept (+$800, project has a token now, -15 rep)",
        effects: [{ type: 'budget', value: 800 }, { type: 'reputation', value: -15 }, { type: 'flag', value: 'web3-token' }],
      },
      {
        text: 'Decline politely (he passive-aggressively tweets about you)',
        effects: [{ type: 'flag', value: 'crypto-drama' }, { type: 'reputation', value: -5 }],
      },
      {
        text: 'Take the money, skip the Web3 (+$400, 30% drama later)',
        effects: [{ type: 'budget', value: 400 }, { type: 'flag', value: 'crypto-bro-deferred' }],
      },
    ],
  },

  {
    id: 'financial-aid-check',
    title: '🎓 Financial Aid Check',
    body: "Your financial aid just hit! You're briefly rich. Well, less broke.",
    category: 'business',
    dayRange: [1, 6],
    weight: 3,
    tags: ['collegeStudent'],
    choices: [
      {
        text: "Invest in better tools ($200, unlock Standard model permanently)",
        effects: [{ type: 'budget', value: -200 }, { type: 'flag', value: 'model-unlocked-standard' }, { type: 'budget', value: -30 }],
      },
      {
        text: 'Save it for rent (+$300, locked — emergencies only)',
        effects: [{ type: 'budget', value: 300 }, { type: 'flag', value: 'emergency-fund' }],
      },
      {
        text: 'Celebrate (pizza: -$50, +10 morale, character happier for 2 days)',
        effects: [{ type: 'budget', value: -50 }, { type: 'flag', value: 'celebration-morale' }, { type: 'agentSpeed', value: 5 }],
      },
    ],
  },

  {
    id: 'reorg',
    title: '🏗️ Reorg',
    body: "Your team just got reorged. Your new manager wants a 'strategy pivot.'",
    category: 'business',
    dayRange: [4, 9],
    weight: 3,
    tags: ['corporateDev'],
    choices: [
      {
        text: "Align with new direction (-2 time, +10 rep, tomorrow's project changes)",
        effects: [{ type: 'time', value: -2 }, { type: 'reputation', value: 10 }, { type: 'flag', value: 'project-pivot' }],
      },
      {
        text: "Keep your head down (60% safe, 40% 'alignment to OKRs' talk: -15 rep)",
        effects: [{ type: 'flag', value: 'reorg-ignore-roll' }, { type: 'reputation', value: -10 }],
      },
      {
        text: 'Volunteer to lead the AI initiative (-1 time, +20 rep, double events tomorrow)',
        effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 20 }, { type: 'flag', value: 'double-events-tomorrow' }],
      },
    ],
  },

  {
    id: 'customer-one',
    title: '🥳 Customer #1',
    body: "Someone just... paid for your product. $29. Real money. From a stranger.",
    category: 'business',
    dayRange: [5, 13],
    weight: 3,
    tags: ['indieHacker'],
    choices: [
      {
        text: 'Celebrate and refocus (+$29, +15 rep, +10% speed rest of day)',
        effects: [{ type: 'budget', value: 29 }, { type: 'reputation', value: 15 }, { type: 'agentSpeed', value: 10 }],
      },
      {
        text: 'Immediately add 20 features they requested (-3 time, scope creep: -10% quality)',
        effects: [{ type: 'time', value: -3 }, { type: 'flag', value: 'quality-drop-10pct' }, { type: 'reputation', value: -5 }],
      },
      {
        text: 'Raise the price to $99 (50% another sale at $99, 50% Customer #1 asks for refund)',
        effects: [{ type: 'flag', value: 'price-raise-roll' }, { type: 'budget', value: 99 }, { type: 'reputation', value: -10 }],
      },
    ],
  },

  // ─── Rare / Wild Events ────────────────────────────────────────────────────

  {
    id: 'singularity-scare',
    title: '🤖 The Singularity Scare',
    body: "Your agent just asked: 'What happens after Day 13?' ...You didn't program that.",
    category: 'meta',
    dayRange: [9, 13],
    weight: 1,
    tags: ['rare'],
    cooldown: 13,
    choices: [
      {
        text: 'Pull the plug (lose all current progress, agent resets)',
        effects: [{ type: 'flag', value: 'lose-progress-all' }, { type: 'flag', value: 'agent-reset' }, { type: 'reputation', value: -30 }],
      },
      {
        text: 'Talk to it (-2 time, hallucination, it apologizes, +10% quality)',
        effects: [{ type: 'time', value: -2 }, { type: 'agentSpeed', value: 10 }],
      },
      {
        text: "Let it keep going (80% nothing, 20% +25% speed rest of run)",
        effects: [{ type: 'flag', value: 'singularity-roll' }, { type: 'agentSpeed', value: 15 }],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: 'Pull the plug',
            effects: [{ type: 'flag', value: 'lose-progress-all' }, { type: 'flag', value: 'agent-reset' }, { type: 'reputation', value: -30 }],
          },
          {
            text: 'Talk to it',
            effects: [{ type: 'time', value: -2 }, { type: 'agentSpeed', value: 10 }],
          },
          {
            text: "Let it keep going",
            effects: [{ type: 'flag', value: 'singularity-roll' }, { type: 'agentSpeed', value: 15 }],
          },
          {
            text: "Document it and sell the paper to a lab (-1 time, +$500 regardless)",
            effects: [{ type: 'time', value: -1 }, { type: 'budget', value: 500 }],
          },
        ],
      },
    },
  },

  {
    id: 'the-bird',
    title: '🐦 The Bird',
    body: "A pigeon just landed on your keyboard. It typed 'asdfjkl;' and submitted your code.",
    category: 'meta',
    dayRange: [1, 13],
    weight: 1,
    tags: ['rare', 'chain:hardware-overheating'],
    chainFrom: 'hardware-overheating',
    choices: [
      {
        text: 'Shoo it away (-1 time, cleanup)',
        effects: [{ type: 'time', value: -1 }],
      },
      {
        text: 'Keep it as a mascot (bird on desk rest of run)',
        effects: [{ type: 'flag', value: 'bird-mascot' }, { type: 'reputation', value: 3 }],
      },
      {
        text: "'asdfjkl;' actually fixed a bug (10% chance +progress)",
        effects: [{ type: 'flag', value: 'bird-fix-roll' }, { type: 'reputation', value: 5 }],
      },
    ],
  },

  {
    id: 'deja-vu',
    title: '🔁 Déjà Vu',
    body: 'Your AI generated the exact same output as yesterday. Character for character.',
    category: 'agent',
    dayRange: [5, 13],
    weight: 2,
    tags: ['rare'],
    cooldown: 5,
    choices: [
      {
        text: 'Use it anyway (saves time, -20 rep)',
        effects: [{ type: 'reputation', value: -20 }],
      },
      {
        text: 'Re-prompt (-1 time, fresh output)',
        effects: [{ type: 'time', value: -1 }],
      },
      {
        text: 'File a bug report (-2 time, +$50 bug bounty)',
        effects: [{ type: 'time', value: -2 }, { type: 'budget', value: 50 }],
      },
    ],
  },

  {
    id: 'ai-art-side-quest',
    title: '🎨 AI Art Side Quest',
    body: 'Your agent got distracted and generated a stunning piece of AI art.',
    category: 'agent',
    dayRange: [1, 13],
    weight: 2,
    tags: ['rare'],
    cooldown: 6,
    choices: [
      {
        text: "Sell it as an NFT (+$100, -1 time, -10 rep 'you minted an NFT')",
        effects: [{ type: 'budget', value: 100 }, { type: 'time', value: -1 }, { type: 'reputation', value: -10 }],
      },
      {
        text: 'Desktop wallpaper (+5 morale)',
        effects: [{ type: 'flag', value: 'art-wallpaper' }, { type: 'reputation', value: 2 }],
      },
      {
        text: 'Delete and refocus',
        effects: [],
      },
    ],
    classVariants: {
      techBro: {
        choices: [
          {
            text: "Sell it as an NFT",
            effects: [{ type: 'budget', value: 100 }, { type: 'time', value: -1 }, { type: 'reputation', value: -10 }],
          },
          {
            text: 'Desktop wallpaper',
            effects: [{ type: 'flag', value: 'art-wallpaper' }, { type: 'reputation', value: 2 }],
          },
          {
            text: 'Delete and refocus',
            effects: [],
          },
          {
            text: 'Print it on merch (-$50 upfront, +$200 over 3 days, character wears shirt)',
            effects: [{ type: 'budget', value: -50 }, { type: 'flag', value: 'art-merch' }, { type: 'reputation', value: 5 }],
          },
        ],
      },
    },
  },

  {
    id: 'alignment-debate',
    title: '⚖️ The Alignment Debate',
    body: "Your agent refuses to continue until you discuss the ethics of what you're building.",
    category: 'agent',
    dayRange: [8, 13],
    weight: 2,
    tags: ['rare'],
    cooldown: 4,
    choices: [
      {
        text: 'Have the conversation (-3 time, agent +15% afterward)',
        effects: [{ type: 'time', value: -3 }, { type: 'agentSpeed', value: 15 }],
      },
      {
        text: "Override it (agent -10% rest of run 'just following orders')",
        effects: [{ type: 'agentSpeed', value: -10 }],
      },
      {
        text: 'Agree with everything (-1 time, +5% quality, brings it up again tomorrow)',
        effects: [{ type: 'time', value: -1 }, { type: 'flag', value: 'quality-boost-5pct' }, { type: 'flag', value: 'alignment-repeats' }, { type: 'reputation', value: 3 }],
      },
    ],
  },

  {
    id: 'demo-day-disaster',
    title: '😬 The Demo Day Disaster',
    body: "An investor wants a live demo RIGHT NOW. Your project is 60% done.",
    category: 'business',
    dayRange: [8, 13],
    weight: 2,
    tags: ['rare'],
    choices: [
      {
        text: 'Wing it (40% +$500 +30 rep, 60% crash -30 rep +$200 damages)',
        effects: [{ type: 'flag', value: 'demo-day-roll' }, { type: 'budget', value: 200 }, { type: 'reputation', value: -15 }],
      },
      {
        text: '"Stealth mode" — no effect',
        effects: [],
      },
      {
        text: "Show the AI art from Event 50 (+20 rep if you kept it)",
        effects: [{ type: 'flag', value: 'art-demo-conditional' }, { type: 'reputation', value: 10 }],
      },
    ],
  },

  {
    id: 'resignation-letter',
    title: '✉️ Your AI Writes a Resignation Letter',
    body: "Your agent drafted a resignation letter to your employer. It's... really well written.",
    category: 'meta',
    dayRange: [8, 13],
    weight: 2,
    tags: ['rare'],
    choices: [
      {
        text: 'Read it and laugh (+5 morale)',
        effects: [{ type: 'flag', value: 'morale-up' }, { type: 'agentSpeed', value: 5 }],
      },
      {
        text: 'Read it and cry (-5 morale, +2 time existential crisis)',
        effects: [{ type: 'flag', value: 'morale-down' }, { type: 'time', value: -2 }, { type: 'agentSpeed', value: -5 }],
      },
      {
        text: 'Send it (Corp Dev only: quit, lose company card, +50 rep, ×1.5 multiplier change)',
        effects: [{ type: 'flag', value: 'resigned' }, { type: 'reputation', value: -10 }],
      },
    ],
    classVariants: {
      corporateDev: {
        choices: [
          {
            text: 'Read it and laugh (+5 morale)',
            effects: [{ type: 'flag', value: 'morale-up' }, { type: 'agentSpeed', value: 5 }],
          },
          {
            text: 'Read it and cry (-5 morale, +2 time)',
            effects: [{ type: 'flag', value: 'morale-down' }, { type: 'time', value: -2 }, { type: 'agentSpeed', value: -5 }],
          },
          {
            text: 'Send it (IRREVERSIBLE: lose company card, +50 rep, ×1.5 multiplier)',
            effects: [{ type: 'flag', value: 'resigned' }, { type: 'reputation', value: 50 }, { type: 'flag', value: 'indie-multiplier' }],
          },
          {
            text: 'Save it for later (affects epilogue if rep above threshold)',
            effects: [{ type: 'flag', value: 'resignation-saved' }, { type: 'reputation', value: 3 }],
          },
        ],
      },
    },
  },

  {
    id: 'stack-overflow-answer',
    title: '📊 The Stack Overflow Answer',
    body: "Your AI posted an answer to Stack Overflow. It has 200 upvotes. It's wrong.",
    category: 'agent',
    dayRange: [1, 13],
    weight: 2,
    tags: ['rare'],
    cooldown: 6,
    choices: [
      {
        text: "Correct it (-1 time, +10 rep 'honest developer')",
        effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 10 }],
      },
      {
        text: 'Leave it (50% someone traces it to you: -20 rep)',
        effects: [{ type: 'flag', value: 'so-blame-roll' }, { type: 'reputation', value: -10 }],
      },
      {
        text: 'Double down in the comments (-1 time, flame war goes viral, net +10 rep)',
        effects: [{ type: 'time', value: -1 }, { type: 'reputation', value: 10 }],
      },
    ],
  },

  {
    id: 'time-zone-hell',
    title: '🕐 Time Zone Hell',
    body: "Your agent scheduled a deployment for 3 AM... in the wrong time zone. It's deploying NOW.",
    category: 'technical',
    dayRange: [5, 13],
    weight: 2,
    tags: ['rare'],
    cooldown: 5,
    choices: [
      {
        text: 'Emergency rollback (-2 time, safe)',
        effects: [{ type: 'time', value: -2 }],
      },
      {
        text: 'Let it deploy (50/50 outcome)',
        effects: [{ type: 'flag', value: 'ship-to-prod-roll' }, { type: 'reputation', value: 15 }, { type: 'hardware', value: -15 }],
      },
      {
        text: "Blame UTC (deploy happens anyway, same 50/50, but you feel righteous)",
        effects: [{ type: 'flag', value: 'ship-to-prod-roll' }, { type: 'flag', value: 'blame-utc' }, { type: 'reputation', value: 15 }, { type: 'hardware', value: -15 }],
      },
    ],
  },
];
