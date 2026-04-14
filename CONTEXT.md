# The Prompt Trail — Project Context

> Read this file first when picking up work on this project.

## What Is This?

**The Prompt Trail** is an HTML5 browser game for the [Gamedev.js Jam 2026](https://itch.io/jam/gamedevjs-2026). Oregon Trail meets AI development — a survival simulator where you manage budget, hardware, and AI agents across 13 increasingly absurd days of projects.

- **Theme:** Machines
- **Deadline:** April 26, 2026 (submissions close)
- **Voting:** April 26 – May 9 (peer voting by other submitters)
- **Repo:** github.com/bobtrahan/the-prompt-trail (currently private, will go public before submission)

## Jam Strategy

Entering 3 challenges simultaneously:
1. **Open Source (GitHub)** — repo goes public before submission
2. **Build it with Phaser** — Phaser 3 is the engine
3. **Deploy to Wavedash** — cash prizes ($1k/$750/$500/$250)

Judged on: **Innovation, Theme, Gameplay, Graphics, Audio** (Overall = sum)

## Tech Stack

- **Engine:** Phaser 3 (latest)
- **Language:** TypeScript
- **Build:** Vite
- **Resolution:** 1280×720, scales via Phaser FIT mode
- **Deploy targets:** itch.io, GitHub Pages, Wavedash

## Art Direction: "PromptOS"

The entire game is presented as a **fictional desktop operating system**. No pixel art. Everything is UI — windows, terminals, dialogs, notifications, taskbar. Most "art" is rectangles + text rendered by Phaser. Each of the 4 classes has a different OS color theme.

See `ART-AUDIO.md` for full details.

## Core Game Loop

1. **Morning Briefing** — see today's project, resources, news ticker
2. **Planning** — choose Strategy (plan/build/one-shot/vibe), Model tier, Agent assignment
3. **Execution** — typing mechanic (type commands to progress) + event interrupts every ~8-12 sec
4. **Day Results** — reputation earned, resources spent
5. **Night Phase** — Token Market (shop) + optional Bug Bounty mini-game
6. Repeat for 13 days → **Final Score** (reputation × class multiplier)

## Key Systems

- **4 Classes:** Tech Bro (×1.0), Indie Hacker (×1.5), College Student (×2.5), Corporate Dev (×1.2)
- **6 Agents:** Turbo, Oracle, Gremlin, Parrot, Linter, Scope — with synergy/clash pairs
- **55 Events:** With class-specific variants and cross-event chains. See `EVENTS.md`.
- **Token Market:** Models, hardware upgrades, consumables, joke items
- **Bug Bounty:** Mini-game — click bugs in a code grid, 5 bug types with different behaviors
- **Typing Engine:** Player types code/command prompts. Accuracy affects progress speed.

## Design Docs (in project root)

| File | Contents |
|------|----------|
| `DESIGN.md` | Core loop, phase structure, day arc, class definitions |
| `EVENTS.md` | All 55 events with choices, consequences, class variants |
| `ART-AUDIO.md` | PromptOS visual concept, screen layouts, audio plan (5 tracks + SFX) |
| `SYSTEMS.md` | Token Market items/prices, agent roster + synergy, balance numbers |
| `TECHPLAN.md` | Stack decisions, project structure, build milestones, challenge plan |

## Project Structure

```
gamedevjs-2026/
├── CONTEXT.md          ← you are here
├── DESIGN.md           ← game design spec
├── EVENTS.md           ← event catalog (55 events)
├── ART-AUDIO.md        ← art direction + audio plan
├── SYSTEMS.md          ← token market, agents, balance
├── TECHPLAN.md         ← tech stack, milestones, architecture
├── README.md           ← GitHub/jam readme
└── game/               ← the actual game
    ├── src/
    │   ├── main.ts
    │   ├── scenes/     ← Phaser scenes (10 scenes, most are stubs)
    │   ├── systems/    ← GameState, EventEngine, etc.
    │   ├── data/       ← event defs, projects, items, agents
    │   ├── ui/         ← OS chrome components (window, terminal, dialog)
    │   └── utils/      ← constants, themes
    └── public/assets/  ← fonts, audio, images (mostly empty)
```

## Current Status (as of April 14, 2026 — end of day)

### Done ✅
- Full game design spec (loop, events, systems, art, audio, balance)
- Project scaffolded (Vite + Phaser 3 + TypeScript)
- Scene flow wired: Boot → Title → ClassSelect → Briefing → Planning → Execution → Results → Night → loop → Final
- GameState singleton with class defs, resource tracking, event flags
- Class select screen with 4 clickable class cards, reordered by difficulty (easy→brutal), with difficulty badges and multiplier labels
- Title screen with PromptOS boot animation
- GitHub repo created (private)
- Color/theme system ready for per-class theming
- **OS chrome UI components** — `Window` (title bar, accent strip, close button, content area), `Taskbar` (budget/hw/rep/day), `Terminal` (scrolling output, cursor blink)
- **Terminal typing** — three-segment colored prompt (typed=green, cursor=white blink, remaining=dim gray ghost text). `↑ type this` hint on first prompt. Difficulty scaling: easy→medium→hard prompts as you progress.
- **Typing engine** — keyboard input, accuracy tracking, shuffled prompt queues per difficulty tier
- **Execution scene** — full PromptOS desktop: terminal window (typing), agent manager panel (animated status), system monitor (budget/hw/rep/model + time bar), progress bar. Pulsing "START TYPING" affordance that fades on first keystroke. Day timer + events don't start until player types.
- **Event modal system** — events fire as modal dialogs that pause typing, dim background, offer 3 choices (clickable or keyboard 1/2/3). First event fires at 5 sec to teach rhythm. Placeholder events with basic consequence logic (budget cost, time loss).
- **Planning scene** — strategy picker with 4 cards (Plan Then Build / Just Start / One-Shot / Vibe Code) showing risk labels. Model + agent info panels. Must pick strategy before launching.
- **Class rebalance** — Tech Bro ×0.8 (easy, 2 agent slots), Corp Dev ×1.2, Indie ×1.8, Student ×3.0 (brutal)
- **Corporate Dev restrictions** — `lockedStrategies: ['vibeCode']`, `lockedModels: ['free', 'sketchy', 'local']`. Grayed-out cards with 🔒 label. Budget displays as "💳 Company Card" everywhere.
- **Local hardware system** — `localSlots` in GameState. Tech Bro starts with 1. Events tagged `requiresCloud`/`requiresLocal` with filtering. Local-specific events: GPU Overheating, Local Model Hallucination.

### Next Up (Phase 2: Core Loop)
- [ ] Event engine — load all 55 events from data files, weight by day/class, replace placeholder events
- [ ] Economy system — budget tracking, model costs per time unit, strategy cost modifiers
- [ ] Reputation scoring — base rep from progress + accuracy bonus + strategy modifier + class multiplier
- [ ] 13 project definitions with difficulty curves (data file)
- [ ] Briefing scene upgrade — project reveal "Daily Digest" app, resource summary, AI news ticker
- [ ] Results scene upgrade — day stats (accuracy, prompts completed, rep earned, budget spent)
- [ ] Night scene — transition to Token Market / Bug Bounty choice

### Phase 3+ (after core loop works)
- [ ] Token Market shop (item data, purchase UI, upgrade effects)
- [ ] Bug Bounty mini-game (click bugs in code grid)
- [ ] All 55 events with class-specific variants and cross-event chains
- [ ] Per-class OS color themes applied everywhere
- [ ] Audio (5 tracks + SFX)
- [ ] Agent synergy/clash system
- [ ] Polish, juice, balance, deploy

### Build Milestones (from TECHPLAN.md)
| Phase | Target Date | Focus |
|-------|------------|-------|
| 1: Skeleton | Apr 14-15 | Scaffolding, scene flow, OS chrome, typing engine |
| 2: Core Loop | Apr 16-18 | Execution scene, events, planning, economy, scoring |
| 3: Night Phase | Apr 18-19 | Token Market shop, Bug Bounty mini-game |
| 4: Polish | Apr 20-22 | All 55 events, class themes, audio, agent synergy |
| 5: Juice + Deploy | Apr 23-25 | Effects, balance, voice (stretch), deploy to all platforms |
| Buffer | Apr 26 | Bug fixes, submission |

## Standards

- Every code change → `git add` + `git commit`. Uncommitted = unfinished.
- TypeScript strict (but noUnusedLocals/Params off for jam speed).
- No unit tests (jam pace). Manual playtesting after each phase.
- Agents handle implementation: Forge (complex/multi-file), Patch (clear-spec single-file), Chip (trivial). Route dispatches.

## Workflow

- **Haze** architects and specs, produces task lists
- **Route** dispatches tasks to agents (Forge/Patch/Chip) via `route-dispatch` prompt template in haze-control
- **Bob** reviews Route's dispatch plan, approves spawns, playtests results
- **Haze** verifies agent output, updates documentation
- Loop: architect → spec → dispatch → verify → document → next phase

## Running Locally

```bash
cd game
npm install
npm run dev
# → http://localhost:5173
```
