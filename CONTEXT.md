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
- **Language:** TypeScript (`strict: true`)
- **Build:** Vite
- **Resolution:** 1280×720, scales via Phaser FIT mode
- **Deploy targets:** itch.io, GitHub Pages, Wavedash
- **Tests:** Vitest, 110 tests across 7 suites

## Art Direction: "PromptOS"

The entire game is presented as a **fictional desktop operating system**. No pixel art. Everything is UI — windows, terminals, dialogs, notifications, taskbar. Most "art" is rectangles + text rendered by Phaser. Each of the 4 classes has a different OS color theme.

See `ART-AUDIO.md` for full visual and audio details.

## Core Game Loop

1. **Morning Briefing** — see today's project, resources, news ticker, day intro narration
2. **Planning** — choose Strategy (plan/build/one-shot/vibe), Model tier, Agent assignment
3. **Execution** — typing mechanic (day-specific prompts) + prompt-count-triggered event interrupts
4. **Day Results** — reputation earned, resources spent
5. **Night Phase** — Token Market (shop) + Bug Bounty mini-game (Use AI or Old School mode)
6. Repeat for 13 days → **Final Score** (reputation × class multiplier) with rank narration

## Key Systems

- **4 Classes:** Tech Bro (×1.0), Indie Hacker (×1.5), College Student (×2.5), Corporate Dev (×1.2)
- **6 Agents:** Turbo, Oracle, Gremlin, Parrot, Linter, Scope — with synergy/clash pairs. Live Agent Manager panel shows idle messages, trait triggers, event reactions.
- **55 Events:** With class-specific variants and cross-event chains. Choice buttons show effect hints + live resource preview on hover.
- **Token Market:** Models, hardware upgrades, consumables, joke items
- **Bug Bounty — two modes:**
  - **Use AI** (clicker) — click bugs in a code grid, 5 types with different behaviors
  - **Old School** (top-down shooter) — Oregon Trail hunting homage, WASD + mouse aim, bullets, code block obstacles, 1.5× earnings bonus
- **Typing Engine:** Day-specific prompt sequences (78 prompts across 13 days, 4 early → 10 late). Events trigger after specific prompts, not random timers.
- **Voice Narrator:** 27 TTS clips — class intros, day intros, rare event commentary, rank narration. Music ducking for clarity.

## Design Docs

| File | Contents |
|------|----------|
| `DESIGN.md` | Core loop, phase structure, day arc, class definitions |
| `EVENTS.md` | All 55 events with choices, consequences, class variants |
| `ART-AUDIO.md` | PromptOS visual concept, screen layouts, audio plan, voice narrator |
| `SYSTEMS.md` | Token Market items/prices, agent roster + synergy, balance numbers |
| `docs/archive/` | Completed specs (Bug Hunt, typing rework, visual audit, etc.) |

## Project Structure

```
gamedevjs-2026/
├── CONTEXT.md          ← you are here
├── DESIGN.md           ← game design spec
├── EVENTS.md           ← event catalog (55 events)
├── ART-AUDIO.md        ← art direction + audio plan
├── SYSTEMS.md          ← token market, agents, balance
├── README.md           ← GitHub/jam readme
├── docs/archive/       ← completed spec files
├── scripts/            ← generation scripts (voice, music, SFX)
└── game/               ← the actual game
    ├── src/
    │   ├── main.ts
    │   ├── scenes/     ← 12 Phaser scenes
    │   ├── systems/    ← GameState, EventEngine, TypingEngine, AudioManager, Telemetry
    │   ├── data/       ← events, projects, items, agents, prompts, eventTriggers, bugs, agentMessages
    │   ├── ui/         ← OS chrome components (Window, Terminal, Taskbar, DesktopWallpaper)
    │   └── utils/      ← constants, themes, playerClass
    └── public/assets/  ← fonts, audio (music/sfx/voice)
```

## Current Status (as of April 15, 2026 — evening)

### All Features Complete ✅

**Phase 1-4:** Core game loop, all scenes, economy, scoring, planning, night phase, shop, debug tools, telemetry — all done.

**Phase 5:** Audio (5 music tracks, 16 SFX, volume controls), consumables (5 effects wired), bug bounty polish (IDE chips, animations, combo system) — all done.

**Phase 5.6:** Visual audit (18 tasks across 3 tiers) — all done.

**Phase 6:** Code crusades (arch, test, dead, type) — all done. 110 tests, `strict: true`.

**Phase 6.5: New Features (Apr 15 evening session):**
- [x] **Old School Bug Hunt** — top-down shooter mode, Oregon Trail homage: player cursor triangle, WASD + mouse aim, code block obstacles with hard collision, 5 bug types with distinct movement (Syntax/Logic/Race/MemLeak/Heisenbug), bullets with spark effects, 2-hit MemLeak, invisible Heisenbug dodge, combo system, 1.5× earnings bonus, mode select screen
- [x] **Prompt-based typing rework** — 78 day-specific prompts (4→10 scaling), sequential iteration, prompt-count-triggered events replacing random timers. Data: `src/data/prompts.ts` + `src/data/eventTriggers.ts`
- [x] **Explicit event tradeoffs** — choice buttons show effect hints like `(−$50, +15 rep)`
- [x] **Event choice visual preview** — hover a choice to see projected impact on resource bars/counters (red ↓ for loss, green ↑ for gain), instant snap-back on un-hover
- [x] **Agent Manager panel** — live message rotation (6 agent idle pools), event reactions, trait trigger flashes, synergy/clash announcements at day start, consumable reactions
- [x] **Voice narrator** — 27 MiniMax TTS clips with custom voice, music ducking, wired to ClassSelect, Briefing, Execution (rare events), Bug Bounty (high score), FinalScene (rank)

### Remaining

- [ ] **Visual nits** — screenshot-driven fixes using browser automation. One-by-one audit and fix cycle.
- [ ] **Balance tuning** — play 2-3 runs, review telemetry, adjust difficulty curve, costs, event frequency
- [ ] **Per-class visual differentiation** — terminal themes beyond accent colors (wallpapers already done)
- [ ] **Deploy** — itch.io, GitHub Pages, Wavedash. Vite build + test
- [ ] **README + screenshots** for jam submission

### Build Milestones

| Phase | Status |
|-------|--------|
| 1-4: Core Game | ✅ Complete |
| 5: Audio + Consumables + Bug Bounty Polish | ✅ Complete |
| 5.6: Visual Audit | ✅ Complete |
| 6: Code Crusades | ✅ Complete |
| 6.5: New Features | ✅ Complete (Bug Hunt, typing rework, events, Agent Manager, voice) |
| 7: Balance + Polish | Pending |
| 8: Deploy + Submit | Pending (deadline: Apr 26) |

## Standards

- **Every code change → `git add` + `git commit`.** Uncommitted = unfinished.
- **TypeScript `strict: true`** (noUnusedLocals/Params off for jam speed).
- **Vitest test suite:** 110 tests across 7 files. Run `npm test` in `game/`.
- **Commit format:** `feat: description [Agent - OpenClaw (model)]` or `feat: description [Haze]`
- **Agent matching:**
  - Boris (Codex) → mechanical, clear-spec, single-file tasks
  - Vlad (Claude Code) → reasoning, multi-system, state management
  - One file, one concern per task. Never mega-prompts.

## Agent Workflow

- **Haze** architects, specs, produces task lists, verifies output, updates documentation
- **Boris** (Codex ACP) → `sessions_spawn({ runtime: "acp", agentId: "codex", cwd: ".../game" })`
- **Vlad** (Claude Code ACP) → `sessions_spawn({ runtime: "acp", agentId: "claude", cwd: ".../game" })`
- Tasks reference CONTEXT.md + relevant spec files. Prompts stay under 5KB.
- Both agents run `npm run build` before committing. Tests when touching system files.

## Technical Reference

### Key Data Files
| File | Contents |
|------|----------|
| `src/data/events.ts` | 55 events with choices, effects, class variants (2425 lines) |
| `src/data/projects.ts` | 13 day definitions with names, descriptions, difficulty |
| `src/data/prompts.ts` | 78 day-specific typing prompts + overtime pool |
| `src/data/eventTriggers.ts` | Prompt-count-triggered event schedule per day |
| `src/data/bugs.ts` | Shared bug type definitions (5 types, weights, rewards) |
| `src/data/agents.ts` | 6 agent defs, synergy/clash pairs |
| `src/data/agentMessages.ts` | Agent idle/trait/event/consumable message pools |
| `src/data/items.ts` | Token Market items, prices, effects |

### Key Systems
| System | File | Notes |
|--------|------|-------|
| GameState | `src/systems/GameState.ts` | Singleton, tracks all game state |
| TypingEngine | `src/systems/TypingEngine.ts` | Day prompts (sequential) + overtime (shuffle) |
| AudioManager | `src/systems/AudioManager.ts` | Music, SFX, voice with ducking. Singleton. |
| Telemetry | `src/systems/Telemetry.ts` | DaySnapshot tracking, file output via Vite plugin |
| EventEngine | `src/systems/EventEngine.ts` | Event selection, weighting, cooldowns |

### Scene Map (12 scenes)
`Boot → Title → ClassSelect → Briefing → Planning → Execution → Results → Night → (loop) → Final`
Plus: `BugBountySelect → BugBounty (Use AI) | BugHunt (Old School)`

### Audio Assets
- `public/assets/audio/music/` — 5 tracks (title, execution, execution-late, night, bugbounty)
- `public/assets/audio/sfx/` — 16 procedural SFX
- `public/assets/audio/voice/` — 27 narrator clips (MiniMax TTS, custom voice ID: `ttv-voice-2026041610350026-yuc8Gt1F`)

## Running Locally

```bash
cd game
npm install
npm run dev
# → http://localhost:5173

npm test        # 110 tests
npm run build   # production build
```
