# Old School Bug Hunt — Design Spec

## Concept

A top-down hunting minigame directly inspired by the 1985 Oregon Trail hunting screen. Player controls a mouse-cursor character navigating a code-themed landscape. Code blocks (functions, classes, imports) are obstacles with hard collision. The 5 bug types are targets with distinct movement patterns. Available as an alternative to the existing "Use AI" clicker mode.

The difficulty gap is the meta joke — doing it the old-fashioned way is brutal.

## Entry Point

When the player enters Bug Bounty (from NightScene or early-finish), show a **mode select screen** before the minigame starts:

```
┌─ Bug Bounty ── Mode Select ─────────────────────────┐
│                                                       │
│   🤖 [ Use AI ]              🏹 [ Old School ]       │
│   "Let the machines handle    "Hunt bugs the way     │
│    it. Click to squash."      God intended. WASD      │
│                               + aim with mouse."      │
│   Difficulty: ★☆☆             Difficulty: ★★★         │
│   (Current mode)              (1.5× earnings)         │
│                                                       │
└───────────────────────────────────────────────────────┘
```

- **Use AI** → existing `BugBountyScene` (clicker)
- **Old School** → new `BugHuntScene` (top-down shooter)
- Old School gets a **1.5× earnings bonus** applied at end-of-round

## Arena Layout

Top-down view filling the Window content area (~900×520). Code-themed landscape:

```
┌─ Bug Hunt ── Terminal ────────────────────────────────┐
│ [timer bar]                    Bugs: 0 | Earned: $0   │
│                                                        │
│   ┌──────────┐                    ┌─────────┐         │
│   │ class    │    🔴               │ import  │         │
│   │ Server { │         🟡          │ {fetch} │         │
│   │  ...     │                     └─────────┘         │
│   └──────────┘                                         │
│                  ┌────────────┐        🟣              │
│        ▶ - - +   │ function   │                        │
│     player  xhair│ deploy() { │    ┌──────┐           │
│                  │  ...       │    │const │            │
│   🟢             └────────────┘    │arr=[]│    👻     │
│                                    └──────┘            │
│                                                        │
│  Ammo: ████████░░ (8/10)                              │
└────────────────────────────────────────────────────────┘
```

## Player Character

- **Sprite:** Mouse cursor triangle (▶) — fits the PromptOS desktop fiction
- **Size:** ~20×24px, accent-colored with a subtle glow
- **Movement:** WASD / Arrow keys, continuous, ~300px/sec
- **Collision:** Hard collision with code block obstacles. Player bounces off / cannot pass through. Forces pathing around obstacles to reach bugs.
- **Facing:** Triangle rotates to face the mouse pointer position (the aim direction)

## Aiming & Crosshair

- **Crosshair:** Rendered at a fixed ~80-100px distance from the player along the aim vector (player → mouse direction)
- **Style:** Accent-colored `+` with gentle pulse, smaller than the player sprite
- **Purpose:** Shows exactly where bullets will travel. The gap between player and crosshair creates a "dead zone" that makes close-range shots harder (like Oregon Trail — you can't shoot point-blank easily)

## Firing & Bullets

- **Input:** Click or Space to fire
- **Origin:** Bullet spawns at the player's position
- **Direction:** Travels toward the crosshair position at time of fire
- **Speed:** ~600px/sec (fast but not instant — leading targets matters)
- **Visual:** Small bright rectangle with a short trail, styled as `→` glyph (terminal aesthetic)
- **Hit detection:** Circle-circle overlap between bullet and bug hitbox
- **Code block collision:** Bullets that hit obstacles are absorbed with a spark/flash effect
- **Arena exit:** Bullets that leave the arena bounds are destroyed

## Ammunition

- Start with **10 bullets**
- Regenerate: **1 bullet every 3 seconds**
- Max capacity: 10
- Ammo bar displayed at bottom of arena
- Running dry = dead time waiting for regen (punishment for spray-and-pray)

## Obstacles (Code Blocks)

- **Count:** 6-8 randomly placed at scene creation
- **Visual:** Dark rectangles with syntax-highlighted monospace text (function signatures, class declarations, import statements)
- **Player collision:** Hard — player cannot pass through, bounces/stops at edge
- **Bullet collision:** Hard — bullet absorbed with spark effect, ammo wasted
- **Placement:** Random positions, never overlapping each other, with enough gaps for player navigation. Ensure no bug spawn points are fully enclosed.
- **Static:** Don't move during the round

## Bug Types as Targets

| Bug Type | Oregon Trail Analog | Movement | Speed | Points | Shots to Kill | Special |
|----------|-------------------|----------|-------|--------|---------------|---------|
| **Syntax** (🔴) | Bison | Slow straight lines, changes direction at arena edge | Slow | $10 | 1 | Large hitbox. Easy target, low reward. |
| **Logic** (🟡) | Deer | Diagonal zigzag, pauses 0.5s every 2s | Medium | $20 | 1 | Medium hitbox. Predictable pattern. |
| **Race** (🟣) | Rabbit | Extremely fast bursts in random directions, stops 0.5s between bursts | Fast | $30 | 1 | Small hitbox. The frustrating one. |
| **MemLeak** (🟢) | Bear | Slow drift, grows in size over time. Starts small → huge. | Slow | $10-40 | 2 | Reward scales with size at kill. First shot "cracks" it (visual change), second kills. |
| **Heisenbug** (👻) | Squirrel | Slow drift, but turns invisible when a bullet is in flight within 80px | Medium | $50 | 1 | Disappears for 1s when a bullet passes nearby. Must predict, not react. |

## Spawning

- First 3 bugs spawn immediately at random arena edges (Syntax, Logic, Syntax)
- New bug every 3 seconds if fewer than 6 alive
- Weights: Syntax 30%, Logic 25%, Race 15%, MemLeak 15%, Heisenbug 15%
- Spawn at random arena edges, never inside code blocks
- Despawn timer per bug type (same as Use AI mode values)
- Escaped bugs: −$5 each

## Duration & Scoring

- **Timer:** 30 seconds (same as Use AI mode)
- **Combo:** Kills within 2s chain, ×0.25 per chain (same as Use AI)
- **Old School Bonus:** Flat 1.5× multiplier on total earnings, applied at end-of-round
- **No misclick penalty** — ammo spending is the punishment instead

## Visual Style

- Same PromptOS window chrome as existing Bug Bounty
- Arena background: dark terminal green-black (`#0a0f0a`) with faint grid lines
- Code block obstacles: dark panels with syntax-highlighted monospace text
- Player cursor: accent-colored mouse pointer triangle with subtle glow
- Crosshair: accent-colored `+`, pulsing gently, ~80-100px from player
- Bullets: small bright rectangles with short trail
- Bug sprites: reuse existing chip visual style (colored rounded rects with severity dots and labels)
- Hit effects: reuse existing particle burst + camera shake
- Kill text: reuse existing floating `+$N` text

## End Screen

Same overlay structure as Use AI mode, plus:
- "Old School Bonus: ×1.5" line showing the multiplier applied
- "Shots fired: X | Accuracy: Y%" line
- Same HP bonus at 10+ bugs, same combo display

## Technical Plan

### New Files
- `src/scenes/BugHuntScene.ts` — the Old School minigame
- `src/scenes/BugBountySelectScene.ts` — mode select screen
- `src/data/bugs.ts` — shared bug type definitions extracted from BugBountyScene

### Modified Files
- `NightScene.ts` — Bug Bounty button → `BugBountySelectScene`
- `ExecutionScene.ts` — early finish bug hunt → `BugBountySelectScene`
- `BugBountyScene.ts` — import bug defs from `src/data/bugs.ts` instead of inline
- `GameState.ts` — add `bugHuntMode: 'ai' | 'oldschool'`
- `Telemetry.ts` — add `bugHuntMode`, `shotsFired`, `shotsHit` fields
- `main.ts` — register new scenes

### Physics Approach
- No Arcade physics needed — manual movement + overlap checks, consistent with existing BugBountyScene
- Player collision with code blocks: AABB overlap check, resolve by pushing player out of overlap
- Bullet collision with code blocks and bugs: circle-rect and circle-circle checks per frame

### Shared Code Extraction
Extract from `BugBountyScene.ts` into `src/data/bugs.ts`:
- `BugType`, `BugConfig` types
- `BUG_DEFS` record
- `pickBugType()` function
