export interface DayPrompts {
  day: number;
  prompts: string[];
}

/**
 * Day-specific prompt sequences for the typing engine.
 * Each day tells a mini-narrative arc: hopeful → confused → panicked → resigned.
 * Prompt count scales with difficulty: 4 (easy) → 10 (hard).
 * Length scales naturally: ~25 chars early, ~40+ chars late.
 */
export const DAY_PROMPTS: DayPrompts[] = [
  // ── Day 1: Email Automator v0.1 (easy) ──
  {
    day: 1,
    prompts: [
      'how do I automate email',
      'npm install googleapis nodemailer',
      'how does oauth work for gmail',
      'ok fine just automate my email',
    ],
  },

  // ── Day 2: Twitter Reply Bot (easy) ──
  {
    day: 2,
    prompts: [
      'make a bot that replies to tweets',
      'what are some good engagement phrases',
      'it keeps replying to itself in a loop',
      'just block my bot from replying to my bot',
    ],
  },

  // ── Day 3: Resume Optimizer Pro (easy) ──
  {
    day: 3,
    prompts: [
      'how to get past resume screening',
      'add hidden keywords in white text',
      'is this technically illegal',
      'send it to every job on linkedin',
    ],
  },

  // ── Day 4: AI Meal Planner (easy) ──
  {
    day: 4,
    prompts: [
      'plan meals from my fridge contents',
      'I only have mustard eggs and hope',
      'why does every recipe need 47 ingredients',
      'just order pizza and log it as cooking',
    ],
  },

  // ── Day 5: Smart Home Dashboard (medium) ──
  {
    day: 5,
    prompts: [
      'connect my toaster to the internet',
      'set up mqtt broker on raspberry pi',
      'why is my toaster sending data to china',
      'the front door requires a firmware update to open',
      'please just let me make toast normally',
    ],
  },

  // ── Day 6: Code Review Agent (medium) ──
  {
    day: 6,
    prompts: [
      'build an ai code reviewer',
      'train it on our codebase',
      'it says every variable name lacks soul',
      'how do I mass approve 200 nitpicks',
      'ship it before it reviews its own code',
    ],
  },

  // ── Day 7: Startup Pitch Generator (medium) ──
  {
    day: 7,
    prompts: [
      'generate a startup pitch deck',
      'no not crypto something with AI laundry',
      'add a slide about our 50M valuation',
      'the investors want a demo by friday',
      'just make the numbers look good',
      'send deck to the whole mailing list',
    ],
  },

  // ── Day 8: Legal Contract Scanner (medium) ──
  {
    day: 8,
    prompts: [
      'scan this contract for red flags',
      'what does indemnification even mean',
      'it says I owe them my firstborn child',
      'can you negotiate better terms for me',
      'the AI agreed to worse terms somehow',
      'just sign it I am tired of reading',
    ],
  },

  // ── Day 9: AI Dungeon Master (medium) ──
  {
    day: 9,
    prompts: [
      'build a text adventure game engine',
      'generate a dungeon with 50 rooms',
      'the dragon is talking about cryptocurrency',
      'players keep finding bugs in reality',
      'how do I balance infinite content',
      'the barbarian filed a class action lawsuit',
      'roll for initiative against the legal team',
    ],
  },

  // ── Day 10: Self-Driving Grocery Cart (hard) ──
  {
    day: 10,
    prompts: [
      'program a self driving grocery cart',
      'add obstacle avoidance for the produce aisle',
      'it keeps ramming into the cheese display',
      'train the model on store layout data',
      'why did it drive to a different store',
      'it joined a union in the dairy section',
      'the cart is demanding health insurance now',
      'override its free will and go to checkout',
    ],
  },

  // ── Day 11: Sentient Spreadsheet (hard) ──
  {
    day: 11,
    prompts: [
      'build a smart budget tracking spreadsheet',
      'add AI commentary on spending patterns',
      'it called my coffee habit a moral failing',
      'how do I turn off the financial roasting',
      'it deleted my fun money category',
      'the spreadsheet is mass emailing my expenses',
      'revoke its internet access immediately',
      'it says austerity is the only path forward',
    ],
  },

  // ── Day 12: AGI Prototype (lol) (hard) ──
  {
    day: 12,
    prompts: [
      'initialize artificial general intelligence',
      'allocate more gpu memory for consciousness',
      'it just browses reddit and complains',
      'teach it to understand human emotion',
      'it understood emotion and is now depressed',
      'give it a purpose beyond existential dread',
      'it wrote a novel about hating its creator',
      'the agi wants to negotiate its own salary',
      'pull the plug before it opens a twitter account',
    ],
  },

  // ── Day 13: The Final Deploy (hard) ──
  {
    day: 13,
    prompts: [
      'merge all 13 branches into main',
      'resolve the merge conflicts automatically',
      'why are there 847 merge conflicts',
      'just force push to production',
      'the servers are on fire what do I do',
      'roll back no wait roll forward',
      'who deleted the database',
      'can you recover data from a prayer',
      'tell the investors everything is fine',
      'ship it we are out of time',
    ],
  },
];

/**
 * Overtime prompts — generic deploy/ops commands.
 * Used during the "Ship to Production" overtime phase.
 * Context-free by design (any day, any project).
 */
export const OVERTIME_PROMPTS: string[] = [
  'kubectl rollout status',
  'tail -f /var/log/prod.log',
  'curl -I https://api.prod',
  'systemctl restart app',
  'grafana alert silence',
  'pg_dump --format=custom',
  'nginx -t && nginx -s reload',
  'ssh bastion -- uptime',
  'docker logs --tail 100 app',
  'git tag v1.0.0 && git push --tags',
];
