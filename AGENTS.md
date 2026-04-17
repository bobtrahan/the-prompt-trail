# AGENTS.md — The Prompt Trail

AI agent context for the gamedevjs-2026 codebase. Updated 2026-04-16.

## Project Overview

**The Prompt Trail** — Gamedev.js Jam 2026 entry. Oregon Trail meets AI dev sim.
- Stack: Phaser 3 + TypeScript + Vite
- Status: Phase 9.5 — Playtesting + Deploy (deadline Apr 26)
- 13 scenes, 112 Vitest tests, strict TypeScript

## Commands

```bash
cd game
npm run dev     # dev server → http://localhost:5173
npm test        # run 112 Vitest tests
npm run build   # production build → dist/
```

## Project Structure

```
gamedevjs-2026/
├── CONTEXT.md          # authoritative project status — READ FIRST
├── AGENTS.md           # this file — agent-facing codebase reference
├── README.md           # GitHub/jam readme
├── docs/archive/       # completed specs (events, art/audio, balance, etc.)
├── scripts/            # generation scripts (voice, music, SFX)
└── game/
    ├── src/
    │   ├── main.ts             # Phaser game bootstrap
    │   ├── scenes/             # 13 Phaser scenes
    │   ├── systems/            # core game systems
    │   ├── data/               # game data (events, agents, classes, items, projects, prompts, triggers, rolls)
    │   ├── ui/                 # reusable UI components (Window, Terminal, Taskbar, DesktopWallpaper)
    │   └── utils/              # constants, themes, playerClass, devConfig
    ├── test/                   # Vitest test files
    ├── vite.config.ts
    ├── vite-telemetry-plugin.ts
    └── package.json
```

## Key Systems

| System | File | Purpose |
|--------|------|---------|
| GameState | `systems/GameState.ts` | Central state singleton — resources, day, phase, model, agents |
| EventEngine | `systems/EventEngine.ts` | Event selection, trigger evaluation, roll resolution, effect application |
| AgentSystem | `systems/AgentSystem.ts` | Synergy/clash calculation, trait checks (Oracle/Parrot/Gremlin) |
| EconomySystem | `systems/EconomySystem.ts` | Budget, model costs, model quality modifiers |
| ScoringSystem | `systems/ScoringSystem.ts` | Day rep calculation (progress + accuracy + strategy + model bonus) |
| TypingEngine | `systems/TypingEngine.ts` | Day-specific prompt sequences for Execution scene |
| AudioManager | `systems/AudioManager.ts` | Music + SFX + voice playback with ducking. 4 volume channels. |
| ShopSystem | `systems/ShopSystem.ts` | Token Market buy/sell logic, item effect application |
| Telemetry | `systems/Telemetry.ts` | Session + bug hunt event logging |

## Scene Map (13 scenes)

`Boot → Title → ClassSelect → Briefing → Planning → Execution → Results → Night → (loop) → Final`
Plus: `BugBountySelect → BugBounty (Use AI) | BugHunt (Old School) | TokenMarket`

## Game Data

| File | Contents |
|------|----------|
| `data/events.ts` | 55 events with choices, effects, class variants (~2400 lines) |
| `data/projects.ts` | 13 day definitions (names, descriptions, difficulty) |
| `data/prompts.ts` | Day-specific typing prompts + overtime pool |
| `data/eventTriggers.ts` | Prompt-count-triggered event schedule per day |
| `data/classes.ts` | 4 player classes: Tech Bro, Indie Hacker, College Student, Corporate Dev |
| `data/agents.ts` | 6 agents (Turbo, Oracle, Gremlin, Parrot, Linter, Scope) + synergy/clash pairs |
| `data/agentMessages.ts` | Agent idle/trait/event/consumable message pools |
| `data/items.ts` | Token Market items, prices, effects |
| `data/rollResolutions.ts` | 45 gamble flag → RNG outcome table (odds + effects) |
| `data/bugs.ts` | 5 bug types (Syntax, Logic, Race, MemLeak, Heisenbug) with weights/rewards |

## Player Classes (actual values in code)

| Class | Budget | Hardware | Model | Timer | Multiplier |
|-------|--------|----------|-------|-------|------------|
| Tech Bro | $2,000 | 100 HP | standard | 45s | ×0.8 |
| Indie Hacker | $800 | 80 HP | standard | 45s | ×1.8 |
| College Student | $200 | 50 HP | free | 45s | ×3.0 |
| Corporate Dev | $99,999 (∞) | 90 HP | standard | 22s | ×1.2 |

## UI Components

- `Window.ts` — window primitive with title bar, chrome, close button
- `Terminal.ts` — terminal-style text display with cursor
- `Taskbar.ts` — OS-style taskbar with clock, budget, hardware, notifications
- `DesktopWallpaper.ts` — animated per-class desktop backgrounds
- `themes.ts` — per-class color themes (terminal, title bar, taskbar, cursor character)

## Architecture Patterns

- **Singleton systems**: GameState, AudioManager accessed via static `getInstance()`
- **Scene-based flow**: Phaser scenes handle lifecycle; systems are shared globals
- **Strict TypeScript**: `strict: true`, interfaces over type aliases preferred
- **Data-driven**: Events, prompts, triggers, roll resolutions all defined as data, not hardcoded logic
- **Per-class theming**: Terminal text/bg, title bar, taskbar, cursor, boot sequence, wallpaper all vary by class
- `devConfig.ts` — dev/debug flags (skip scenes, fast mode, etc.) — never commit with overrides enabled

## Important Conventions

- **Read CONTEXT.md first** for current phase status before doing any work
- All game logic changes need corresponding test updates
- `npm test` must pass before any commit
- `npm run build` must pass before any commit
- Assets in `game/public/assets/` — audio in `audio/music/`, `audio/sfx/`, `audio/voice/`
- Commit format: `feat: description [Agent - OpenClaw (model)]` or `feat: description [Haze]`

## Current Phase

Phase 9.5: Playtesting + Deploy. Deadline: April 26, 2026.
See CONTEXT.md for full remaining task list.
