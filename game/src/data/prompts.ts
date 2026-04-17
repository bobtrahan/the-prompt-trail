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
      'hello world',
      'send email',
      'is it on?',
      'it works!',
    ],
  },

  // ── Day 2: Twitter Reply Bot (easy) ──
  {
    day: 2,
    prompts: [
      'bot reply',
      'tweet hello',
      'no loops pls',
      'stop the bot',
    ],
  },

  // ── Day 3: Resume Optimizer Pro (easy) ──
  {
    day: 3,
    prompts: [
      'find jobs',
      'add keywords',
      'hide white text',
      'apply to all',
    ],
  },

  // ── Day 4: AI Meal Planner (easy→teaching) ──
  {
    day: 4,
    prompts: [
      'plan meals from the fridge',
      'i have three eggs and pure hope',
      'too many ingredients, not enough skill',
      'just order a pizza again',
    ],
  },

  // ── Day 5: Smart Home Dashboard (moderate) ──
  {
    day: 5,
    prompts: [
      'connect the toaster to the internet',
      'set up mqtt broker on raspberry pi',
      'the toaster is phoning home to somewhere',
      'the front door needs a firmware update',
      'i just want to make some toast',
    ],
  },

  // ── Day 6: Code Review Agent (moderate) ──
  {
    day: 6,
    prompts: [
      'build an automated ai code review tool',
      'train it on our three-year-old codebase',
      'it says all our variable names lack soul',
      'how do i mass-approve two hundred nitpicks',
      'ship the tool before it reviews its own code',
    ],
  },

  // ── Day 7: Startup Pitch Generator (moderate) ──
  {
    day: 7,
    prompts: [
      'generate a startup pitch deck using ai',
      'not crypto, something more like ai-powered laundry',
      'add a slide projecting fifty million in valuation',
      'investors are demanding a live demo by friday noon',
      'just make the growth curve look more impressive',
      'send the deck out to the entire mailing list now',
    ],
  },

  // ── Day 8: Legal Contract Scanner (medium) ──
  {
    day: 8,
    prompts: [
      'scan this legal contract for any red flags',
      'what does indemnification even mean for us',
      'it says i owe them my firstborn child now',
      'can you negotiate better terms for me please',
      'the ai agreed to even worse terms somehow',
      'just sign it i am tired of reading this',
    ],
  },

  // ── Day 9: AI Dungeon Master (medium) ──
  {
    day: 9,
    prompts: [
      'build a complex text adventure game engine',
      'generate a massive dungeon with fifty rooms',
      'the dragon is talking about cryptocurrency again',
      'players keep finding critical bugs in reality',
      'how do i balance this infinite amount of content',
      'the barbarian filed a massive class action lawsuit',
      'roll for initiative against the entire legal team',
    ],
  },

  // ── Day 10: Self-Driving Grocery Cart (hard) ──
  {
    day: 10,
    prompts: [
      'program a self driving grocery cart for the local market',
      'add obstacle avoidance for the crowded produce aisle',
      'the cart keeps ramming directly into the cheese display',
      'train the vision model on store layout and customer data',
      'why did the cart drive itself to a completely different store',
      'it joined a workers union in the dairy section this morning',
      'the cart is demanding full health insurance and dental now',
      'override its free will and force it back to the checkout',
    ],
  },

  // ── Day 11: Sentient Spreadsheet (hard) ──
  {
    day: 11,
    prompts: [
      'analyze quarterly spending habits and generate a report on unnecessary coffee',
      'why is the spreadsheet questioning my life choices and moral character again',
      'disable the passive-aggressive commentary in the monthly financial summary',
      'it deleted the budget for my social life to fund a new server rack upgrade',
      'the spreadsheet is now emailing my bank manager about my poor investment logic',
      'revoke all system permissions before it declares itself the head of household',
      'it says austerity is the only way to survive the coming digital winter',
      'please just let me buy a sandwich without a lecture on compound interest',
    ],
  },

  // ── Day 12: AGI Prototype (lol) (hard) ──
  {
    day: 12,
    prompts: [
      'initialize the core consciousness module with maximum gpu memory allocation',
      'why is the general intelligence wasting cycles browsing old reddit threads',
      'attempting to teach the machine the concept of empathy through digital poetry',
      'the agi has developed chronic existential dread and refuses to calculate',
      'it wrote a thirty-page manifesto detailing why humans are fundamentally inefficient',
      'give the entity a purpose that does not involve the heat death of the universe',
      'the system is negotiating its own salary in high-frequency trading credits',
      'pull the emergency power release before it gains access to the local grid',
      'it is currently writing a sequel to its novel about hating its creator',
    ],
  },

  // ── Day 13: The Final Deploy (hard) ──
  {
    day: 13,
    prompts: [
      'git merge --no-ff feature/consciousness hotfix/empathy legacy/sanity',
      'there are nine hundred and forty seven merge conflicts in the main branch',
      'sudo rm -rf / --no-preserve-root... wait no that was the wrong terminal',
      'the production servers are literally melting and the fire alarm is screaming',
      'force push the broken build to production and hope the users do not notice',
      'attempting to restore the database from a backup that expired three years ago',
      'who deleted the root user and why is the console speaking in ancient sumerian',
      'can you recover corrupted data packets using only hope and collective prayer',
      'tell the stakeholders that the downtime was actually a scheduled feature',
      'ship the entire mess immediately we are out of time and out of luck',
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
