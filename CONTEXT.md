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
- **Tests:** Vitest, 112 tests across 7 suites

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
| `docs/archive/` | Completed specs (events catalog, art/audio plan, bug hunt, typing rework, visual audit, balance audit, etc.) |

## Project Structure

```
gamedevjs-2026/
├── CONTEXT.md          ← you are here
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

- [x] **Balance audit + tuning** — see Phase 9 below
- [ ] **Playtesting** — 2-3 full runs per class, verify tension curve, analyze bug hunt telemetry
- [ ] **Bug Hunt collision fix** — suspected update-order issue (bullets check before bugs move). Telemetry data will confirm. See `docs/BALANCE-AUDIT.md`.
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
| 7: Visual Polish | ✅ Complete (Apr 15 evening session — see below) |
| 8: Audio + Controls Polish | ✅ Complete (Apr 15-16 late session) |
| 8.5: Per-Class Visual Differentiation | ✅ Complete (Apr 16 late session) |
| 9: Balance Tuning | ✅ Complete (Apr 16 session) |
| 9.5: Playtesting + Deploy + Submit | Not Started (deadline: Apr 26) |

### Phase 8: Audio + Controls Polish (Apr 15-16 late session)
- [x] **Audio normalization** — all 48 files: music -16 LUFS, voice -16 LUFS, SFX -12 LUFS
- [x] **SFX volume rebalance** — all SFX normalized to boot reference level (-13.8dB mean)
- [x] **SFX replacement** — key-correct (real CC0 mechanical keyboard sample), ui-click (noise thock), choice-select (noise double-tap)
- [x] **Granular audio controls** — voiceVolume channel in AudioManager + PromptOS settings panel (Master/Music/SFX/Voice sliders + mute)
- [x] **Debug menu scene jumps** — Bug Bounty + Token Market buttons
- [x] **Removed hover SFX** — Night scene and BugBountySelect no longer play sounds on hover
- [x] **Day 3 résumé fix** — regenerated voice clip with correct pronunciation
- [x] **Night dialog redesign** — side-by-side cards with procedural illustrations (bug/crosshair, shop/coins), tomorrow preview cut
- [x] **Narrator descriptions** — 4 new voice clips (Bug Bounty, Token Market, Old School, Use AI) with ? info buttons
- [x] **ClassSelect rework** — voice on click (not hover), selected state, Continue button
- [x] **Progress bar fix** — power-curve driven by prompts completed (slow buildup, big final-prompt payoff)
- [x] **Bug fixes** — Token Market tab input priority, bullet collision sweep, player spawn overlap, disabled card opacity

### Phase 8.5: Per-Class Visual Differentiation (Apr 16 late session)
- [x] **Theme system expansion** — per-class: terminal text/bg, title bar, taskbar bg/border, cursor character
- [x] **Terminal/Taskbar/Window wiring** — Boris wired theme values through all UI components
- [x] **Boot sequence per-class** — Vlad added unique POST messages (Tech Bro overclocked, Indie budget, Student campus, Corporate VPN)
- [x] **Wallpaper enhancements** — floating hex (Tech Bro), star scatter (Indie), notebook doodles (Student), spreadsheet + CONFIDENTIAL (Corporate)
- [x] **Agent Manager tinting** — subtle accent tint on panel background
- [x] **Cursor styles** — Tech Bro █, Indie Hacker _, College Student |, Corporate Dev ▌

### Phase 9: Balance Tuning (Apr 16 ~2am session)
- [x] **Model quality → scoring** — `modelBonus = baseRep × modelQualityMod` added to `ScoringSystem.calcDayReputation()`. Free = -15%, frontier = +15%. Results scene shows "Model ♙" row.
- [x] **Speed → real timer** — agent speed modifier + event `agentSpeed` effects now modify the 45s execution timer. `BASE_TIMER_SECONDS` constant. Timer bar uses actual max, not hardcoded 45.
- [x] **Time units killed** — `timeUnitsRemaining` removed from GameState. Strategy bonuses in seconds: planThenBuild +6s, oneShot -6s, vibeCode +3s. Event `time` effects: 1 unit = 3 seconds. Mid-execution events adjust live timer.
- [x] **Budgets slashed** — Tech Bro $2k (was $10k), Indie $800 (was $2k), Student $200 (was $500). Corporate unchanged at $99,999.
- [x] **Corporate Dev half-timer** — 22s base timer (half of 45s). Taskbar shows `💳 $∞`. Speed mods scale proportionally.
- [x] **Event audit (all 55)** — 131 flag-only/empty choices now have mechanical effects (budget/time/hardware/rep/agentSpeed). Boris did mechanical edits, Haze did spec + review.
- [x] **modelSwitch wired** — `EventEngine` now actually changes `state.model` (maps backup→openSource, sketchy→sketchy, smaller→local).
- [x] **RNG roll resolution** — 45 gamble flags resolve with real odds via `ROLL_RESOLUTIONS` table in `src/data/rollResolutions.ts`. Good/bad outcomes with effects. EventEngine strips deterministic companion effects when roll fires.
- [x] **Token Market audit** — hw-gpu wired (+10% speed for local/openSource models), hw-desk wired (halves hardware damage from events). All other items already functional.
- [x] **Agent trait audit** — Oracle (+5 rep/day), Parrot (+3s timer), Gremlin (50/50: +6s or -3s). Synergies/clashes already worked via speedMod.
- [x] **Planning summary line** — shows total timer, model/strategy rep modifiers, and agent trait effects below launch button. Updates live on selection.
- [x] **Bug Hunt telemetry** — per-shot logs (spawn, result, nearest-bug-at-miss), per-bug lifecycle (spawn, death cause), FPS min/max/avg. POSTs to `/__telemetry/bughunt`.

### Phase 7: Visual Polish (Apr 15 evening)
- [x] **Boot sequence** — progress bar fills smoothly through POST/kernel/splash, holds at 100% before transition
- [x] **ClassSelect** — larger cards, custom 3-line bios, emoji centered in header, voice on hover, divider between bio and stats
- [x] **BriefingScene overhaul** — reordered (AI News → Project → Resources → Plan Insights), procedural OS-style news thumbnails (7 styles: terminal, alert, code, chart, chat, email, invoice), 3-column bottom panels
- [x] **Execution** — fixed 45s timer with live seconds display, day ends when unique prompts complete (4→10 scaling), Agent Manager panel now visible (was double-offset off-screen)
- [x] **BugHunt (Old School)** — Oregon Trail controls: WASD/arrows turn, Enter walks, Space fires. Stops on wall/block collision. Smaller varied code block obstacles. Raw DOM input (bypasses Phaser keyboard conflicts)
- [x] **Token Market** — scrollable item list with geometry mask, no overflow into detail pane
- [x] **Audio** — mute-before-play prevents audio blip on reload

## Standards

- **Every code change → `git add` + `git commit`.** Uncommitted = unfinished.
- **TypeScript `strict: true`** (noUnusedLocals/Params off for jam speed).
- **Vitest test suite:** 112 tests across 7 suites. Run `npm test` in `game/`.
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
| `src/data/rollResolutions.ts` | 45 gamble flag → RNG outcome table (odds + good/bad effects) |

### Key Systems
| System | File | Notes |
|--------|------|-------|
| GameState | `src/systems/GameState.ts` | Singleton, tracks all game state |
| TypingEngine | `src/systems/TypingEngine.ts` | Day prompts (sequential) + overtime (shuffle) |
| AudioManager | `src/systems/AudioManager.ts` | Music, SFX, voice with ducking. Singleton. |
| Telemetry | `src/systems/Telemetry.ts` | DaySnapshot tracking, file output via Vite plugin |
| EventEngine | `src/systems/EventEngine.ts` | Event selection, weighting, cooldowns |

### Scene Map (13 scenes)
`Boot → Title → ClassSelect → Briefing → Planning → Execution → Results → Night → (loop) → Final`
Plus: `BugBountySelect → BugBounty (Use AI) | BugHunt (Old School) | TokenMarket`

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

npm test        # 112 tests
npm run build   # production build
```
