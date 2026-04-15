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

**Phase 1: Skeleton**
- Project scaffolded (Vite + Phaser 3 + TypeScript)
- Scene flow: Boot → Title → ClassSelect → Briefing → Planning → Execution → Results → Night → loop → Final
- GameState singleton, class defs, resource tracking, event flags
- OS chrome UI: `Window`, `Taskbar`, `Terminal` components
- Title screen with PromptOS boot animation
- Class select with 4 cards, difficulty badges, multiplier labels

**Phase 2: Core Loop**
- Terminal typing engine — three-segment prompt, accuracy tracking, difficulty scaling (easy→medium→hard)
- Execution scene — full PromptOS desktop: terminal, agent manager, system monitor, progress bar
- Event modal system — 55 events, modal dialogs pause typing + day timer (10s countdown), 3 choices (click or keyboard)
- Event impact feedback — resource changes flash with color bounce + floating summary text
- Planning scene — strategy picker (4 cards), interactive model selector (unlock/switch), interactive agent picker (6 agents, synergy/clash indicators), must fill all slots + pick strategy before launch
- Economy system — model daily costs, strategy costs, Corp Dev exemption, bankruptcy → forced Free Tier downgrade
- Scoring system — day rep = (progress% × maxRep) + accuracy bonus + strategy modifier + overtime bonus. Final = raw × class multiplier. Ranks: S/A/B/C/D/F
- Model quality effects — free (-15%) through frontier (+15%) applied to progress gain
- Agent system — speed modifiers from synergy/clash pairs, trait effects (Linter debates, Turbo auto-deploy, Scope feature creep)
- Early finish system — at 100% progress: choose Bug Hunt Bonus (bonus BugBounty → Results) or Ship to Production (overtime typing, +3 rep/prompt, uncapped)
- Briefing scene — project card, difficulty stars, resource summary, satirical AI news ticker
- Results scene — animated count-up breakdown with overtime line, Vibe Code % reveal

**Phase 3: Night Phase**
- Token Market shop — category tabs, item cards, buy buttons, deal-of-the-day, joke item modals, budget updates live
- ShopSystem — purchase logic, model unlocks, hardware upgrades, consumable tracking, joke results
- Bug Bounty mini-game — code grid, 5 bug types (Syntax/Logic/Race Condition/Memory Leak/Heisenbug), 30s timer, earnings added to budget, +5 HP bonus at 10+ bugs
- NightScene hub — Token Market, Bug Bounty (once/night + bonus from early finish), Sleep

**Phase 4: Systems + Polish**
- Per-class accent themes applied to all scenes (Window + Taskbar)
- Hardware upgrade effects wired — Extra Monitor (+5% speed), Mechanical Keyboard (typo forgiveness), UPS/Cooling/RAM (event immunity/weight reduction in EventEngine)
- FinalScene — animated score reveal, rank (S-F) with flavor text, stats summary, Play Again
- Progress bar repositioned near typing prompt for tighter feedback loop
- Terminal dynamically caps visible lines to prevent overlap

**Phase 4.5: Developer Tools**
- Telemetry system — DaySnapshot + RunLog written to `game/telemetry/` via Vite plugin. Tracks all game variables per day: strategy, model, agents, events + choices, progress, accuracy, overtime, bug bounty, budget trajectory
- Debug menu — PromptOS system menu: Reboot (always), Skip Day, +$500, +50 Rep, Unlock All, → Final, God Mode, Export Telemetry (behind DEV_CONFIG flags)
- DevConfig feature flags (`telemetry: true`, `debugMenu: true`) — flip to false for submission

**Phase 5: Audio** ✅ (Apr 14)
- [x] AudioManager singleton — crossfade music, fire-and-forget SFX, localStorage volume persistence
- [x] 5 music tracks generated (MiniMax 2.6) — title, execution, execution-late (cover), night, bugbounty
- [x] 16 SFX generated (procedural ffmpeg) — keystrokes, events, UI, bug bounty, economy, boot chime
- [x] Music triggers wired to all 9 scenes (execution-late auto-swaps on day ≥ 11)
- [x] SFX triggers wired throughout (typing, events, choices, purchases, results, bug bounty)
- [x] Volume mute toggle in PromptOS menu (moved from Taskbar — was overlapping day indicator)
- [x] Audio telemetry fields in DaySnapshot (musicTrack, audioMuted, sfxVolume, musicVolume)
- [x] Music candidate tracks preserved in `public/assets/audio/music/candidates/` for A/B comparison
- [x] Generation scripts: `scripts/gen-exec.mjs` (MiniMax 2.6 + cover), `scripts/gen-music-batch2.mjs` (batch), `scripts/gen-sfx.sh` (procedural)

**Phase 5.5: Consumables** ✅ (Apr 14)
- [x] All 5 consumable effects wired — coffee (+5% speed), energy drink (+10% speed / 20% jitter), cloud backup (data loss protection), API credits (-50% model cost), rubber duck (auto-resolve stuck events)
- [x] Consumable activation UI — sequential notifications at day start with fade in/hold/fade out
- [x] Consumable telemetry — consumablesUsed tracked in DaySnapshot

**Phase 5.5: Bug Bounty Polish** ✅ (Apr 14)
- [x] IDE error chip visuals replacing emoji — styled containers with colored backgrounds, severity dots, labels per bug type (SyntaxError/LogicBug/RaceCondition/MemoryLeak/Heisenbug)
- [x] Per-type idle animations — pulse (syntax), wobble (logic), teleport spin (race), grow (memleak), float + text scramble (heisen)
- [x] Spawn animation (Back.easeOut scale) + despawn warning (border flash at <1.5s)
- [x] Glow rectangles with slow alpha pulse on each chip
- [x] Miss penalties — misclick costs 1s (200ms cooldown), escaped bugs cost $5, both with visual feedback
- [x] Catch effects — camera shake (stronger for heisenbug + white flash), 6-particle color burst
- [x] Bug death animation — scale 2x + spin + fade; escaped bugs get ghost trail drift
- [x] Combo counter — 2s window, ×0.25 multiplier per chain, "COMBO ×N" UI, shake scales with combo
- [x] End screen shows misclicks (red), escaped bugs (red), HP bonus (green), best combo (green) with dynamic height

**Phase 5.6: Visual Audit** ✅ (Apr 15)
- [x] Screenshot all 14 screens, vision model analysis
- [x] 18 prioritized UI improvement tasks across 3 tiers — all landed and verified
- [x] Tier 1 (T1-T6): BIOS POST boot, class card identity, text contrast, title polish, system tray, grade slam
- [x] Tier 2 (T7-T12): procedural wallpapers, briefing density, execution panels, token market detail, results overhaul, night atmosphere
- [x] Tier 3 (T13-T18): window drop shadows, button FX, scanline overlay, ticker redesign, bug bounty contrast, grid lines
- [x] Specs in VISUAL-AUDIT.md, TASKS-VISUAL-T1-T6.md, T7-T12.md, T13-T18.md. Screenshots in audit-screenshots/

**Phase 6: Code Crusades** ✅ (Apr 15)
- [x] **arch-crusade** — Tasks A-E: extract TypingTarget interface, move PlayerClass/Strategy/ModelTier to playerClass.ts, remove duplicate AgentDef, move ClassDef to classes.ts, add AgentSystem/ProjectSystem thin accessors
- [x] **test-crusade** — vitest installed, 110 tests across 7 suites (ShopSystem, EconomySystem, ScoringSystem, AgentSystem, projects, agents, items). Caught real bug: `openSource` vs `opensource` ModelTier casing mismatch in item data.
- [x] **dead-crusade** — removed PlaceholderEvent/EventTag dead exports, orphaned ProjectSystem.ts, 4 unguarded console.logs. 23 lines buried.
- [x] **type-crusade** — `strict: true` in tsconfig, exhaustive `never` switches in all system files, eliminated 5 `any` types and 12 `as` casts, added `isModelTier()` type guard, `global.d.ts` for window extensions
- [x] size/naming crusades skipped (low ROI for jam pace)
- [x] TS build: zero errors. Test suite: 110 passing.

### Remaining
- [ ] Balance tuning — play 2-3 runs, review telemetry, adjust difficulty curve, costs, event frequency
- [ ] Per-class visual differentiation — terminal themes beyond accent colors (wallpapers already done in T7)
- [ ] Deploy — itch.io, GitHub Pages, Wavedash. Vite build + test
- [ ] README + screenshots for jam submission
- [ ] Voice narrator (stretch goal) — TTS for class intros, day intros, rare events

### Build Milestones (from TECHPLAN.md)
| Phase | Target Date | Status |
|-------|------------|--------|
| 1: Skeleton | Apr 14-15 | ✅ Complete |
| 2: Core Loop | Apr 16-18 | ✅ Complete |
| 3: Night Phase | Apr 18-19 | ✅ Complete |
| 4: Polish | Apr 20-22 | ✅ Complete (phases 4 + 4.5) |
| 5: Audio + Consumables | Apr 14 | ✅ Complete (ahead of schedule) |
| 5.5: Bug Bounty Polish | Apr 14 | ✅ Complete |
| 5.6: Visual Audit | Apr 15 | ✅ Complete (18 tasks, 3 tiers) |
| 6: Code Crusades | Apr 15 | ✅ Complete (arch, test, dead, type) |
| 6.5: Balance + Visuals | Apr 16+ | Pending |
| 7: Deploy + Submit | Apr 25-26 | Pending |

## Standards

- Every code change → `git add` + `git commit`. Uncommitted = unfinished.
- TypeScript `strict: true` (noUnusedLocals/Params off for jam speed).
- Vitest test suite: 110 tests across 7 files. Run `npm test` in game/.
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
