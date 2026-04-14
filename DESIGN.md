# The Prompt Trail — Game Design Spec

> Gamedev.js Jam 2026 entry.
> Theme: **Machines** | Deadline: **April 26, 2026** | Days remaining: **12**

## Concept

Oregon Trail meets AI development. You play through 13 days as a developer working with AI agents, managing budget, time, and hardware while completing increasingly absurd projects. Resource management + typing skill + strategic decisions + humor.

## Jam Strategy

- **Engine:** Phaser (enters Phaser challenge)
- **Open source on GitHub** (enters Open Source challenge)
- **Deploy to Wavedash** (cash prizes: $1k/$750/$500/$250)
- **Judging criteria:** Innovation, Theme, Gameplay, Graphics, Audio

## Class Selection (Pre-Game)

| Class | Starting Budget | Hardware | Token Rate | Score Multiplier | Special |
|-------|----------------|----------|------------|-----------------|---------|
| Tech Bro | $10,000 | RTX 9090 | Cheap (local models) | ×1.0 | Can run local models, but they hallucinate more |
| Indie Hacker | $2,000 | MacBook | Standard | ×1.5 | Balanced, no special perks |
| College Student | $500 | Chromebook | Expensive | ×2.5 | Free tier API only, constant rate limits |
| Corporate Dev | $5,000 | Company laptop | Free (company card) | ×1.2 | Random "mandatory meeting" events eat your time |

Higher multiplier = harder start = higher potential score. Same tension as Oregon Trail's banker vs. carpenter.

## Day Structure

```
[CLASS SELECT] → [DAY 1] → [NIGHT 1] → [DAY 2] → ... → [DAY 13] → [FINAL SCORE]

Each Day:
  ┌─ Morning Briefing (project reveal, news ticker, resource check)
  ├─ Planning (strategy + model + agent config)
  ├─ Execution (typing + events, progress bar fills)
  └─ Day Results (reputation earned, money spent, hardware status)

Each Night:
  ┌─ Bug Bounty? (optional mini-game, earn cash)
  ├─ Token Market (buy/sell models, repair hardware, hire agents)
  └─ News Feed (funny AI news, foreshadowing tomorrow's project)
```

## Phase 1: Morning Briefing (~10 sec)

- Today's project revealed (e.g., "Day 3: Automate Your Email Inbox")
- Current resources displayed: Budget, Time, Hardware Health, Reputation
- Funny AI news ticker scrolls across the bottom

## Phase 2: Planning (~20 sec)

Three configuration choices:

### A) Strategy (pick one)
- 🎯 **Plan Then Build** — slower, more time, higher success rate, fewer hallucinations
- 🚀 **Just Start Building** — medium speed, medium risk
- 🎲 **One-Shot It** — fast, cheap on time, high hallucination/failure chance
- 🧠 **Vibe Code** — wildcard. Could be brilliant or catastrophic. High variance.

### B) Model Selection (pick one)
- **Free Tier** — slow, rate limited, bad at complex tasks, $0
- **Standard Model** — reliable, moderate cost
- **Frontier Model** — expensive, powerful, overkill for simple tasks
- **Local Model** — Tech Bro only. Free but unreliable. Sometimes outputs Chinese.
- **Sketchy Overseas Model** — unlocked mid-game. Dirt cheap. Makes stuff up.

### C) Agent Config
- 1-3 agent slots depending on progression
- Agents have personalities affecting outcomes (fast/sloppy, slow/thorough, argumentative)
- Lighter decision — more flavor than deep strategy

## Phase 3: Execution (~30-45 sec)

### Typing Mechanic
The game IS the OS ("PromptOS"). Player sees a terminal window where they type commands and code snippets:
- `git push --force`
- `pip install sketchy-model`
- `await agent.think()`
- `rm -rf node_modules`
- `LGTM ship it`

Correct typing keeps progress bar moving. Mistakes cause visible "typos" and slow progress. Hands are always busy. Agent status, resources, and project info are all "windows" and "widgets" on the OS desktop.

### Event Interrupts
Events fire every ~8-12 seconds as OS notification banners (minor) or modal system dialogs (major). All events appear ON the screen — part of the OS, not game overlays.

**Rhythm:** type type type → notification! → decide → type type type

### Minor Events (quick choice, ~5 sec):
- "Your AI just mass-replied to all your contacts. Undo ($50 + 1hr) or let it ride?"
- "API rate limit hit. Wait (lose time) or switch to backup model (costs more)?"
- "Agent is stuck in a loop. Restart (lose progress) or let it cook?"
- "Your AI wrote a passive-aggressive commit message. Your coworker saw it."
- "Power flickered. Your local model lost its context window."

### Major Events ("river crossing" moments):
- "Your API provider just raised prices 3×. Switch to sketchy model / eat the cost / go local?"
- "A new frontier model just dropped. Migrate mid-project ($200 + risk) or stay the course?"
- "Your AI accidentally pushed to production. Roll back (lose a day) or ship it?"
- "You're out of API credits. Sell your GPU / beg on Twitter / switch to free tier?"

## Reputation Scoring

Each day has a **max reputation pool** (Day 1 ≈ 100, Day 13 ≈ 500). A meter fills during execution:

- Project completion % → base reputation earned
- Event choices → protect meter or sacrifice rep for resources
- Typing accuracy → small bonus/penalty (±10%)
- Strategy choice → affects quality ceiling (one-shotting complex projects caps lower)
- Class multiplier applied to final total score

Meter is additive/building — player feels like earning, not losing.

## Bug Bounty (Mini-Game)

The "hunting" equivalent. Top-down grid representing a codebase. Bugs (literal cartoon insects) crawl through code. Click to squash them.

### Bug Types:
- 🪲 **Regular bugs** — easy to hit, small bounty
- 🦟 **Heisenbugs** — disappear when cursor gets near
- 🕷️ **Race conditions** — two bugs appear simultaneously, must click both fast
- 🐛 **Regressions** — come back unless you also squash root cause nearby
- 🦠 **Zero-days** — rare, fast, huge bounty, 1-second window

### Rules:
- Clicking clean code introduces a NEW bug (penalty for friendly fire)
- 30-45 seconds per session
- Codebase grid is alive — functions light up, data flows visually

### Availability:
- Between days as optional night activity
- Emergency mid-day option (costs project time)
- Special events: "Zero-day discovered! Bug bounty pays 3× tonight!"

## 13-Day Arc

| Days | Vibe | Example Projects |
|------|------|-----------------|
| 1-3 | Silly/tutorial | "Write your dating profile," "Automate your email" (it deletes everything), "Generate a logo" (it's hideous) |
| 4-7 | Getting real | "Build a chatbot for your startup," "Automate code review," "Create a data pipeline" |
| 8-10 | Ambitious | "Ship a full app," "Fine-tune a model," "Build an agent swarm" |
| 11-13 | Absurd endgame | "Replace yourself at work," "Build AGI (on a budget)," "Build a game for a game jam" (meta!) |

Day 13's project is literally the game the player is playing. The in-game screen shows a tiny version of itself.

## Open Design Questions

- [ ] Full event catalog (~30-40 events needed)
- [ ] Numerical balance (costs, earnings, difficulty curve)
- [ ] Agent personality system depth
- [ ] Art direction (pixel art? resolution? character design?)
- [ ] Audio plan (chiptune BGM, typing SFX, event chimes, bug squash sounds)
- [x] Game title — **The Prompt Trail**
- [ ] Token Market item/price list
- [ ] How hardware degradation works mechanically
- [ ] Exact typing prompt list and difficulty scaling
- [ ] Wavedash / YouTube Playables technical requirements

## Tech Stack

- **Engine:** Phaser 3 (or 4 if stable)
- **Language:** TypeScript
- **Build:** Vite
- **Deploy:** itch.io + Wavedash + GitHub Pages
- **Repo:** GitHub (public, for Open Source challenge)
