# Balance Audit — The Prompt Trail

_Generated Apr 16, 2026. Pre-tuning assessment._

## How You Gain Rep (the only thing that matters)

Rep is the single scoring axis. Final score = sum of day scores × class multiplier.

### Daily Rep Formula
```
baseRep = (progress / 100) × maxRepForDay
accuracyBonus = accuracy × 0.3 × baseRep
strategyBonus = baseRep × strategyMod
dayTotal = baseRep + accuracyBonus + strategyBonus + overtimeBonus
```

### Progress
- Now driven purely by **prompts completed / total** (power curve)
- Completing all prompts = 100% progress, always
- Timer (45s) runs independently — if it expires before all prompts, day ends with partial progress
- **Problem**: A decent typist will always complete all prompts within 45s, making progress almost always 100%. The timer is rarely a real threat on early days (4 prompts).

### What Factors Are Supposed to Matter But DON'T

| Factor | Status | Why It's Broken |
|--------|--------|----------------|
| **Speed modifiers** (events, agents, models) | ❌ NO-OP | `speedModifier` was used in the old progress formula. Now progress = prompts/total. Speed changes nothing. 24 event effects reference speed. |
| **Model quality** | ❌ NO-OP | `modelQualityMod` was used in old progress formula. Now cosmetic only — displays in terminal but doesn't affect scoring. |
| **Time unit bonuses** (strategy `timeBonus`, events) | ❌ NO-OP | `timeUnitsRemaining` is set but progress is prompt-driven. Extra time units do nothing. Strategy `planThenBuild` gives +2 time units that mean nothing. |
| **agentSpeed effects** | ❌ NO-OP | Stores a flag but nothing reads it. |
| **modelSwitch effects** | ⚠️ ADVISORY ONLY | Sets a flag but no scene code reads it to actually switch the model. |

### What Actually Works

| Factor | Status | Impact |
|--------|--------|--------|
| **Strategy choice** | ✅ Works | planThenBuild +15% rep, justStart 0%, oneShot -10%, vibeCode random(-20% to +40%). But the *cost* of strategies is almost irrelevant (see economy below). |
| **Typing accuracy** | ✅ Works | Up to +30% bonus rep based on accuracy. Real impact. |
| **Event budget/rep/hardware effects** | ✅ Works | Direct budget/rep/hardware changes apply correctly. |
| **Overtime prompts** | ✅ Works | +3 rep per overtime prompt after completing all required prompts. Minor. |
| **Bug Bounty earnings** | ✅ Works | Adds budget (not rep). |

## Economy Assessment

### Starting Budgets vs Costs
| Class | Budget | Daily Cost (standard model + planThenBuild) | Days Before Broke |
|-------|--------|----------------------------------------------|-------------------|
| Tech Bro | $10,000 | $90/day | 111 days (never) |
| Corporate Dev | $99,999 | $0 (costs skipped!) | ∞ |
| Indie Hacker | $2,000 | $90/day | 22 days (never) |
| College Student | $500 | $0 (free model) + $60 strategy = $60/day | 8 days |

**Verdict**: Tech Bro and Corporate Dev have effectively infinite money. Indie Hacker is comfortable. Only College Student faces real budget pressure. The economy is meaningless for 3 of 4 classes.

### Model Tiers — Why Bother?
| Model | Daily Cost | Quality Mod | Actual Effect |
|-------|-----------|-------------|---------------|
| Free | $0 | -15% | NO-OP (cosmetic) |
| Sketchy | $5 | -10% | NO-OP |
| Local | $0 | -5% | NO-OP |
| Open Source | $10 | 0% | NO-OP |
| Standard | $30 | +5% | NO-OP |
| Frontier | $100 | +15% | NO-OP |

**Verdict**: Model selection is completely meaningless. It costs money but provides zero benefit. Optimal play = always use Free model.

### Token Market Items
Need separate audit — many items likely reference defunct systems (speed boosts, etc.)

## Event Audit Summary

55 events with choices. Effect types used:
- **budget**: 67 references — WORKS
- **reputation**: 53 references — WORKS
- **hardware**: referenced via hardwareHp — WORKS
- **speed/agentSpeed**: 24+ references — ALL NO-OPS
- **time**: referenced via timeUnitsRemaining — NO-OP
- **modelSwitch**: 9 references — ADVISORY ONLY (no code reads the flags)

**Estimated**: ~30-40% of event choice consequences are no-ops that do nothing. Players picking between "lose $50" and "+10% speed" are picking between a real consequence and nothing.

## Recommendations (Priority Order)

### 1. Make speed matter again
Speed should affect the 45-second timer or typing difficulty. Options:
- **Speed modifies timer duration**: base 45s ± speed modifier (e.g. +10% speed = 49.5s)
- **Speed modifies typo forgiveness**: faster = more forgiving input
- **Speed modifies prompt count**: fewer prompts needed to hit 100%

### 2. Make model quality matter
Options:
- **Model quality → accuracy bonus multiplier**: higher quality model = bigger accuracy bonus
- **Model quality → event probability**: better models trigger fewer negative events
- **Model quality → direct rep multiplier**: simplest — model quality directly scales day rep

### 3. Tighten the economy
- Cut starting budgets significantly (Tech Bro: $3000, Indie: $1000)
- Increase model/strategy costs
- Corporate Dev should still pay *something* (maybe 50% discount instead of free)
- Make going broke have real consequences beyond model downgrade

### 4. Audit all 55 events individually
Categorize each event choice as:
- **Real impact**: budget/rep/hardware effects that work
- **No-op**: speed/time/agentSpeed effects that do nothing
- **Mixed**: some choices real, some no-op

Fix no-op choices by replacing defunct effects with working ones.

### 5. Audit Token Market items
Same analysis — which items actually do something vs reference broken systems.

### 6. Strategy picker
`planThenBuild` is strictly dominant — +15% rep, +2 time (no-op), costs $60 which is irrelevant. No reason to ever pick anything else except vibeCode for gambling.

---

## Next Steps

Full event-by-event audit needed to produce the sorted impact list. This doc is the framework.
