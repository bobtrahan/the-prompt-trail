# Prompt-Based Typing Rework — Design Spec

## Problem

The current typing engine uses generic terminal commands (`npm start`, `git push origin`, `kubectl apply -f chaos.yaml`) pulled from difficulty-tiered pools. They're disconnected from the day's project — typing `ls -la` while building an "AI Meal Planner" breaks the fiction.

## Solution

Replace generic command pools with **day-specific prompt sequences** that tell a comedic story of someone trying to use AI to complete each day's project. The sequences scale in length across the game — fewer prompts early to hook the player, more prompts later as difficulty ramps.

## Prompt Count Curve

| Day | Project | Prompts | Difficulty |
|-----|---------|---------|------------|
| 1 | Email Automator v0.1 | 4 | Easy |
| 2 | Twitter Reply Bot | 4 | Easy |
| 3 | Resume Optimizer Pro | 4 | Easy |
| 4 | AI Meal Planner | 4 | Easy |
| 5 | Smart Home Dashboard | 5 | Medium |
| 6 | Code Review Agent | 5 | Medium |
| 7 | Startup Pitch Generator | 6 | Medium |
| 8 | Legal Contract Scanner | 6 | Medium |
| 9 | AI Dungeon Master | 7 | Medium |
| 10 | Self-Driving Grocery Cart | 8 | Hard |
| 11 | Sentient Spreadsheet | 8 | Hard |
| 12 | AGI Prototype (lol) | 9 | Hard |
| 13 | The Final Deploy | 10 | Hard |

**Total: 78 prompts.** Difficulty ramps two ways: more prompts AND longer text per prompt in later days.

## How It Works

Each day has an **ordered sequence** of prompts. The player types them in order. The sequence tells a mini-narrative arc:

1. Naive/optimistic first attempt
2. Getting more specific
3. Dealing with technical problems
4. Frustration/confusion
5. Giving up and asking the AI to do it
6+ (later days) Escalating chaos, resigned acceptance, cleanup

After the player finishes the day's sequence, it **loops back to prompt 1** for that day. The progress bar tracks overall progress regardless of which prompt they're on.

## Example: Day 1 — Email Automator v0.1 (4 prompts)

```
"how do I automate email"
"npm install googleapis nodemailer"
"how does oauth work for gmail"
"ok fine just automate my email"
```

## Example: Day 7 — Startup Pitch Generator (6 prompts)

```
"generate a startup pitch deck"
"no not crypto, something with AI laundry"
"add a slide about our $50M valuation"
"the investors want a demo by friday"
"just make the numbers look good"
"send deck.pdf to the whole mailing list"
```

## Example: Day 13 — The Final Deploy (10 prompts)

```
"merge all 13 branches into main"
"resolve the merge conflicts automatically"
"why are there 847 merge conflicts"
"just force push to production"
"the servers are on fire what do I do"
"roll back no wait roll forward"
"who deleted the database"
"can you recover data from a prayer"
"tell the investors everything is fine"
"ship it we are out of time"
```

## Data Structure

New file: `src/data/prompts.ts`

```typescript
export interface DayPrompts {
  day: number;
  prompts: string[];  // ordered sequence
}

export const DAY_PROMPTS: DayPrompts[] = [
  { day: 1, prompts: [...] },  // 4 prompts
  // ... all 13 days
  { day: 13, prompts: [...] }, // 10 prompts
];

// Overtime prompts stay as a separate flat pool
// (generic deploy/ops commands — context-free during overtime)
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
```

## TypingEngine Changes

The engine currently picks prompts from difficulty-tiered pools (`PROMPTS_EASY`, `PROMPTS_MEDIUM`, `PROMPTS_HARD`) based on how many prompts the player has completed.

### Changes:
1. **Remove** `PROMPTS_EASY`, `PROMPTS_MEDIUM`, `PROMPTS_HARD` from `TypingEngine.ts`
2. **Add** `setDayPrompts(prompts: string[])` method — accepts an ordered sequence, iterates in order, loops when exhausted
3. **Change `nextPrompt()`** — when day prompts are set, use sequential iteration (not shuffle). When override pool is set (overtime), keep existing shuffle behavior.
4. **Keep `setPromptPool()`** working for overtime (existing shuffle-from-pool behavior unchanged)
5. Difficulty scaling is now baked into the content (shorter early-day prompts, longer late-day prompts) — no code-level tier logic needed

## ExecutionScene Changes

- On scene create, look up `DAY_PROMPTS.find(d => d.day === state.currentDay)`
- Call `typingEngine.setDayPrompts(dayPrompts.prompts)` instead of relying on internal pools
- Move overtime prompts to `OVERTIME_PROMPTS` from `src/data/prompts.ts`, use existing `setPromptPool()` path
- Remove the inline `overtimePrompts` array from ExecutionScene

## Writing Guidelines

Each day's prompts should:
- **Read like real prompts** someone would type into ChatGPT/Claude — casual, messy, human
- **Escalate in desperation** — start hopeful, end defeated
- **Reference the specific project** — not generic commands
- **Be funny** — humor from the gap between intent and reality
- **Scale in length** — Day 1 prompts avg ~25 chars, Day 13 prompts avg ~40 chars
- **No special character hell** — avoid excessive punctuation. Apostrophes and basic punctuation fine, but don't make every prompt a regex.

## Event Pacing

Events are now **prompt-count-triggered** instead of random timers. After the player completes specific prompts, an event fires (pausing typing). See `src/data/eventTriggers.ts` for the full schedule.

Key rules:
- Prompt 2 always triggers an event (consistent player training)
- Event count scales: 1 (day 1) → 6 (day 13)
- Later days space events further apart as prompts get longer

The `ExecutionScene` event system needs to switch from timer-based to prompt-completion-triggered. The `TypingEngine.onPromptComplete` callback already fires — `ExecutionScene` tracks `promptsCompleted` and checks against `EVENT_SCHEDULE[day].afterPrompts`.

## Task Breakdown

**Task A (data — DONE):** `src/data/prompts.ts` — all 13 day sequences (78 prompts total) + overtime pool. ✅

**Task A2 (data — DONE):** `src/data/eventTriggers.ts` — prompt-count-triggered event schedule. ✅

**Task B (engine refactor):** Modify `TypingEngine.ts` — add `setDayPrompts()`, remove hardcoded pools, update `nextPrompt()` for sequential iteration with loop. Modify `ExecutionScene.ts` — wire day prompts, move overtime prompts to import, switch event firing from timer-based to prompt-count-triggered using `EVENT_SCHEDULE`.

Task B is the only remaining engineering task.
