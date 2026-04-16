# Balance Audit — The Prompt Trail

_Generated Apr 16, 2026. Design decisions locked._

## How You Gain Rep

Rep is the single scoring axis. Final score = sum of day scores × class multiplier.

### Daily Rep Formula
```
baseRep = (progress / 100) × maxRepForDay
accuracyBonus = accuracy × 0.3 × baseRep
strategyBonus = baseRep × strategyMod
modelBonus = baseRep × modelQualityMod        ← NEW: actually applied now
dayTotal = baseRep + accuracyBonus + strategyBonus + modelBonus + overtimeBonus
```

Progress = prompts completed / total (power curve). Timer = 45s base ± modifiers.

---

## Design Decisions (Locked)

### 1. Model Quality → Direct Rep Multiplier
Model quality mod applies directly to day rep calculation. Free = -15%, Frontier = +15%. Uses existing `modelQualityMod` values in `EconomySystem.getModelQualityMod()`.

**Implementation**: Add `modelBonus = baseRep × modelQualityMod` to `ScoringSystem.calcDayReputation()`. Pass model tier in.

### 2. Speed → Timer Duration
Speed modifiers adjust the 45-second execution timer. +10% speed = +4.5s. Negative speed = less time. This makes every speed event effect meaningful.

**Implementation**: 
- Base timer = 45s
- Collect speed modifiers from: agent speed bonuses, event effects, model/strategy (if any)
- Final timer = `Math.round(45 × (1 + totalSpeedMod))`
- Apply in `ExecutionScene.onFirstKeystroke()` when starting the day timer

### 3. Time Units → Seconds (Direct Replacement)
Kill the `timeUnitsRemaining` system. Replace all references with direct timer seconds:
- Strategy `planThenBuild`: +6 seconds
- Strategy `oneShot`: -6 seconds
- Strategy `vibeCode`: +3 seconds
- Strategy `justStart`: +0 seconds
- Event `time` effects: convert to equivalent seconds (1 time unit ≈ 3 seconds)

### 4. Economy — Tightened

| Class | Budget | Model | Timer | Costs | Feel |
|-------|--------|-------|-------|-------|------|
| Tech Bro | $2,000 | standard | 45s | Normal | Comfortable but not infinite |
| Indie Hacker | $800 | standard | 45s | Normal | Tight, real choices |
| College Student | $200 | free | 45s | Normal | Desperate, survival mode |
| Corporate Dev | $∞ (display "∞") | standard | **22s (half!)** | $0 | Time is the enemy, money is irrelevant |

**Corporate Dev design**: Money is infinite and displayed as such — no budget stress. But timer is halved (22s base). Corporate Dev's constraint is pure time pressure. Events that cost money are meaningless to them; events that cost time are devastating. This creates a unique playstyle where you're always racing the clock while having all the resources in the world.

**Implementation**:
- Corporate Dev budget display: "∞" in taskbar, skip cost deductions (already done)
- Corporate Dev starting budget: set high enough to never run out (keep $99,999)
- Corporate Dev base timer: 22s instead of 45s
- Tech Bro: $2,000 (was $10,000)
- Indie Hacker: $800 (was $2,000)  
- College Student: $200 (was $500)

### 5. Strategy Table (Final)

| Strategy | Rep Mod | Timer Mod | Cost | Identity |
|----------|---------|-----------|------|----------|
| planThenBuild | +15% | +6s | $60 | Safe, expensive, more time |
| justStart | +0% | +0s | $30 | Middle ground |
| oneShot | -10% | -6s | $10 | Risky, cheap, less time |
| vibeCode | -20% to +40% | +3s | $45 | Gambling with slight time bonus |

### 6. Events — Every Decision Must Have Impact

**Rules:**
- Every event choice must have at least one working effect
- No-op effects (old speed/time/agentSpeed) must be replaced with budget/rep/hardware
- Effect hints in UI must highlight (already show on buttons, already preview on hover)
- `modelSwitch` effects should be implemented for real (force model change)

**Replacement strategy for defunct effects:**
- `speed +X%` → convert to meaningful equivalent: `reputation +Y` or `timer +Zs` (stored as event flag, applied in ExecutionScene)
- `time +N` → `timer +N×3 seconds`
- `agentSpeed +X%` → `reputation +small` or `budget +small`
- `modelSwitch` → actually switch the model in GameState

---

## Implementation Order (All Complete — Apr 16)

1. ✅ **Wire model quality into scoring** — `ScoringSystem.calcDayReputation()`
2. ✅ **Wire speed into timer** — `ExecutionScene` timer calculation
3. ✅ **Replace time units with seconds** — strategy table, remove timeUnitsRemaining
4. ✅ **Adjust starting budgets** — `classes.ts`
5. ✅ **Corporate Dev half-timer + infinite money display** — `ExecutionScene` + `Taskbar`
6. ✅ **Audit all 55 events** — replaced no-op effects + RNG roll resolution system
7. ✅ **Audit Token Market items** — hw-gpu and hw-desk wired
8. ✅ **Audit agent synergy/clash + traits** — Oracle/Parrot/Gremlin traits wired
9. ⏳ **Playtesting** — 2-3 full runs per class, verify tension curve, analyze telemetry

## Known Issue: Bug Hunt Collision

Suspected update-order bug: `updateBullets()` runs before `updateBugs()` in the game loop.
Bullet sweep checks backwards along travel path, but bugs have already moved since last frame.
Fast bugs (Race @ 300px/s) can dodge between frames. Fix: swap update order or sweep against bug velocity.
Detailed telemetry added to `/__telemetry/bughunt` endpoint to confirm with real data.

---

## Re-Entry Prompt

> Picking up balance tuning for The Prompt Trail. Read `~/Developer/gamedevjs-2026/CONTEXT.md` for project context, then `~/Developer/gamedevjs-2026/docs/BALANCE-AUDIT.md` for the full balance audit with locked design decisions.
>
> **Summary of what's broken**: When progress was changed to prompt-count-based, three systems disconnected from scoring: speed modifiers (24+ event effects are no-ops), model quality (cosmetic only), and time units (orphaned). ~30-40% of event choices have no real consequence. Economy is too loose for 3 of 4 classes.
>
> **Locked design decisions**: (1) Model quality → direct rep multiplier on day score. (2) Speed → modifies 45s execution timer. (3) Time units → replaced with direct timer seconds (+6s for planThenBuild, -6s for oneShot, etc). (4) Budgets slashed: Tech Bro $2k, Indie $800, Student $200, Corporate $∞ with half timer (22s). (5) Every event choice must have at least one working effect — replace all no-ops.
>
> **Implementation order**: 1. Model quality into scoring, 2. Speed into timer, 3. Time units → seconds, 4. Budgets, 5. Corporate Dev half-timer + ∞ display, 6. Event audit (all 55), 7. Token Market audit, 8. Agent audit, 9. Playtesting.
>
> Start with step 1.
