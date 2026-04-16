# Tech Plan

## Stack Decision

### Phaser 3 vs Phaser 4

Phaser 4 dropped 4 days ago. The question:

| | Phaser 3 | Phaser 4 |
|--|---------|---------|
| Stability | Battle-tested, massive ecosystem | 4 days old. Zero community examples. |
| Docs/examples | Thousands | Sparse — mostly migration guides |
| Jam risk | Low | High — unknown bugs, no Stack Overflow answers |
| Phaser challenge judges | Fine | Richard Davey might appreciate it |
| Our game's needs | Text, UI panels, basic sprites | Same — we don't need GPU layers or new renderer |

**Decision: Phaser 3.** Our game is UI-heavy text and panels. We gain nothing from Phaser 4's renderer overhaul, and we can't afford to debug framework issues during a jam. If we have time at the end, we can port — the API is similar.

### Full Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Engine | Phaser 3 (latest) | Stable, great for UI-heavy games, enters Phaser challenge |
| Language | TypeScript | Type safety, better tooling, we know it |
| Build | Vite | Fast HMR, trivial Phaser setup, clean builds |
| State | Zustand or plain TS classes | Lightweight. Game state is simple enough to not need Redux-scale tooling. |
| Audio | Phaser built-in + Howler.js if needed | Phaser handles most audio. Howler as fallback for edge cases. |
| Fonts | Google Fonts (monospace for terminal) | JetBrains Mono or Fira Code for the terminal. System-style font for OS chrome. |
| Deploy targets | itch.io, GitHub Pages, Wavedash | All just static file hosting |
| Repo | GitHub (public) | Enters Open Source challenge |

### Project Structure

```
gamedevjs-2026/
├── docs/                    # Design specs (what we have now)
│   ├── DESIGN.md
│   ├── EVENTS.md
│   ├── ART-AUDIO.md
│   ├── SYSTEMS.md
│   └── TECHPLAN.md
├── src/
│   ├── main.ts              # Phaser game config, boot
│   ├── scenes/
│   │   ├── BootScene.ts     # Asset loading
│   │   ├── TitleScene.ts    # Title screen
│   │   ├── ClassSelectScene.ts
│   │   ├── BriefingScene.ts # Morning briefing
│   │   ├── PlanningScene.ts # Strategy/model/agent selection
│   │   ├── ExecutionScene.ts # Main gameplay (typing + events)
│   │   ├── ResultsScene.ts  # Day results
│   │   ├── NightScene.ts    # Token market + bug bounty choice
│   │   ├── BugBountyScene.ts # Mini-game
│   │   └── FinalScene.ts    # End-game score/epilogue
│   ├── systems/
│   │   ├── GameState.ts     # Central state (budget, rep, hardware, day, class)
│   │   ├── EventEngine.ts   # Event selection, weighting, cross-references
│   │   ├── TypingEngine.ts  # Typing mechanic (prompts, accuracy, speed)
│   │   ├── AgentSystem.ts   # Agent roster, synergy, assignment
│   │   ├── EconomySystem.ts # Budget, costs, market prices
│   │   └── ScoringSystem.ts # Reputation calc, multipliers, final score
│   ├── data/
│   │   ├── events.ts        # Event definitions (from EVENTS.md)
│   │   ├── projects.ts      # 13 day projects
│   │   ├── items.ts         # Shop items + joke items
│   │   ├── agents.ts        # Agent roster definitions
│   │   ├── typing-prompts.ts # Typing prompt catalog
│   │   └── classes.ts       # Class definitions + starting stats
│   ├── ui/
│   │   ├── OSChrome.ts      # Window frames, title bars, taskbar
│   │   ├── Terminal.ts      # Terminal window component
│   │   ├── DialogBox.ts     # Event popup (minor notification + major modal)
│   │   ├── ProgressBar.ts   # Progress bar component
│   │   ├── ResourcePanel.ts # Resource display widget
│   │   └── AgentPanel.ts    # Agent status sidebar
│   └── utils/
│       ├── themes.ts        # Color themes per class
│       └── constants.ts     # Magic numbers, timing, etc.
├── public/
│   ├── index.html
│   └── assets/
│       ├── fonts/
│       ├── audio/
│       │   ├── music/
│       │   └── sfx/
│       └── images/          # Minimal — icons, wallpapers, portraits
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md                # For GitHub / Open Source challenge
```

## Challenge Submissions

| Challenge | Requirements | Effort | Status |
|-----------|-------------|--------|--------|
| **Open Source (GitHub)** | Public repo, open source license | Trivial — already planned | ✅ Ready |
| **Phaser** | Built with Phaser | Trivial — it's our engine | ✅ Ready |
| **Wavedash** | Deploy to wavedash.com | Low — static web game, sign up + deploy | TODO: create account, check deploy process |
| **YouTube Playables** | Channel onboarding, SDK, certification | High — skip | ❌ Not worth it |
| **Ethereum** | Blockchain integration | Irrelevant | ❌ Skip |

## Build Milestones

### Phase 1: Skeleton (Days 1-2, Apr 14-15) ← WE ARE HERE
- [ ] Project scaffolding (Vite + Phaser + TS)
- [ ] Scene flow (title → class select → briefing → planning → execution → results → night → loop)
- [ ] GameState system
- [ ] Basic OS chrome UI (window frames, taskbar, panels)
- [ ] Typing engine prototype (just works, no polish)

### Phase 2: Core Loop (Days 3-5, Apr 16-18)
- [ ] Execution scene fully playable (typing + progress bar + events)
- [ ] Event engine (load events, weight by day/class, display as dialogs)
- [ ] Planning scene (strategy + model + agent pickers)
- [ ] Economy system (budget tracking, costs applied)
- [ ] Reputation scoring
- [ ] 13 projects defined with difficulty curves

### Phase 3: Night Phase + Bug Bounty (Days 5-6, Apr 18-19)
- [ ] Token Market (shop UI, buy/sell items, joke items)
- [ ] Bug Bounty mini-game (code grid, bug types, clicking, scoring)
- [ ] Night-to-morning transition

### Phase 4: Polish (Days 7-9, Apr 20-22)
- [ ] All 55 events implemented with consequences
- [ ] Class-specific theming (4 color themes, desk/wallpaper variants)
- [ ] Agent synergy system
- [ ] Audio: music tracks (generate), SFX (source/generate)
- [ ] Morning briefing news ticker
- [ ] Class select with character descriptions

### Phase 5.5: Bug Bounty Polish ✅ (Apr 14)
- [x] IDE error chip visuals, per-type animations, combo counter, miss penalties, catch effects

### Phase 5.6: Visual Audit ✅ (Apr 15)
- [x] 18 UI improvement tasks across 3 tiers — all landed and verified

### Phase 6: Code Crusades ✅ (Apr 15)
- [x] arch → test → dead → type (size/naming skipped — low ROI)
- [x] vitest: 110 tests, `strict: true`, zero TS errors
- [x] Caught `openSource` casing bug in item data

### Phase 6.5: Balance + Remaining Visual Polish (Apr 16+)
- [ ] Balance pass (playtesting, telemetry review, tuning)
- [ ] Per-class terminal themes
- [ ] Voice narration (stretch goal)

### Phase 7: Deploy + Submit (Apr 25-26)
- [ ] Vite production build + test
- [ ] Deploy to itch.io, GitHub Pages, Wavedash
- [ ] README, screenshots, jam page description
- [ ] Submit to all 3 challenges

### Day 13 (Apr 26) — Buffer
- Bug fixes, last-minute polish, submission

## Dev Workflow

- **Repo:** `gamedevjs-2026` on GitHub (create when scaffolding)
- **Branching:** Main branch, feature branches for big systems
- **Testing:** Manual playtesting. No unit tests (jam pace).
- **Sub-agents:** Boris/Vlad for mechanical scene implementation once patterns are established
- **Art generation:** Use image gen for concept art, wallpapers, character portraits
- **Music generation:** Use music gen tools for the 5 tracks
- **Playtest:** After each phase, do a full run-through

## Immediate Next Steps

1. Scaffold the project (Vite + Phaser 3 + TypeScript)
2. Get a window rendering with OS chrome
3. Implement the typing engine
4. Wire up scene transitions
5. We're building.
