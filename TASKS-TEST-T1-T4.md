# Test Crusade Tasks T1–T4 — Route-Ready Specs

> All tasks are in `~/Developer/gamedevjs-2026/game/`
> Read `~/Developer/gamedevjs-2026/CONTEXT.md` then `~/Developer/gamedevjs-2026/game/src/utils/constants.ts` before writing code.
> Dev server: `cd game && npm run dev` (localhost:5173)
> Every change → `git add . && git commit -m "<description>"`

---

## T1: Test Infrastructure Setup
**Agent:** Patch · **File:** `vite.config.ts`, `tsconfig.json`, `package.json`, `src/test/setup.ts` (new), `src/systems/GameState.ts` · **Effort:** ~15 min

### Goal
Install vitest, configure it, and export `createInitialState()` from GameState so tests can create isolated state without touching the global singleton.

### Steps

**Step 1: Install dependencies**

```bash
cd ~/Developer/gamedevjs-2026/game
npm install -D vitest jsdom
```

Do NOT install `@vitest/ui` or `@vitest/coverage-v8` — unnecessary for a jam.

**Step 2: Update `vite.config.ts`**

Add the vitest reference type and a `test` block. Final file should look like:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { telemetryPlugin } from './vite-telemetry-plugin';

export default defineConfig({
  plugins: [
    telemetryPlugin()
  ],
  server: {
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
```

**Step 3: Update `tsconfig.json`**

Add `"vitest/globals"` to the `types` array in `compilerOptions`:

```json
"types": ["vite/client", "vitest/globals"]
```

**Step 4: Update `package.json`**

Add these scripts (merge with existing scripts, don't replace):

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Create `src/test/setup.ts`**

Create a minimal Phaser mock so system tests can import files that reference Phaser without crashing:

```ts
// Minimal Phaser mock for unit tests — only stubs what systems actually touch
(globalThis as any).Phaser = {
  Math: {
    Between: (min: number, max: number) => Math.floor((min + max) / 2),
  },
};
```

**Step 6: Export `createInitialState` from `src/systems/GameState.ts`**

Change the function declaration from:

```ts
function createInitialState(): GameState {
```

to:

```ts
export function createInitialState(): GameState {
```

This is a one-word change. Do NOT refactor anything else in GameState. Do NOT add a `withClassState()` function. The existing `resetState()` is sufficient for test isolation.

**Step 7: Verify**

```bash
npx tsc --noEmit        # should be zero errors
npx vitest run           # should report "no test files found" (that's correct — T2 adds tests)
```

Both commands must succeed before committing.

### Constraints
- Do NOT install coverage tools
- Do NOT add a `vitest.config.ts` — use the `test` block inside `vite.config.ts`
- Do NOT modify any system logic — this task is infrastructure only
- The `telemetryPlugin()` in vite.config.ts must remain untouched

### Commit
```
feat: add vitest test infrastructure + export createInitialState
```

---

## T2: Core System Test Suites (ShopSystem, EconomySystem, ScoringSystem)
**Agent:** Forge · **Files:** `src/systems/ShopSystem.spec.ts` (new), `src/systems/EconomySystem.spec.ts` (new), `src/systems/ScoringSystem.spec.ts` (new) · **Effort:** ~45 min

### Prerequisite
T1 must be committed first (vitest installed, `createInitialState` exported).

### Goal
Write test suites for the three core economy/scoring systems. These are pure TypeScript with no Phaser dependency — they're the most testable and the most dangerous if silently broken.

All tests use `createInitialState()` for isolated state. Call `resetState()` in `beforeEach` as a safety net.

---

### File 1: `src/systems/ShopSystem.spec.ts`

Test the `ShopSystem` static class. Import from:
- `import { ShopSystem } from './ShopSystem';`
- `import { createInitialState, resetState, initClassState, getState } from './GameState';`
- `import type { ItemDef } from '../data/items';`
- `import { SHOP_ITEMS } from '../data/items';`

Helper — create a minimal test item factory:
```ts
function makeItem(overrides: Partial<ItemDef> = {}): ItemDef {
  return {
    id: 'test-item',
    name: 'Test Item',
    category: 'consumable',
    baseCost: 100,
    description: 'A test item',
    effect: 'Test effect',
    ...overrides,
  };
}
```

**`canBuy` tests (9 tests):**

1. `returns ok:true when budget is sufficient` — state.budget = 500, item baseCost 100, price 100 → `{ ok: true }`
2. `returns insufficient funds when budget < price` — state.budget = 50, price 100 → `{ ok: false, reason: 'Insufficient funds' }`
3. `returns already unlocked for owned model` — state.unlockedModels includes 'standard', item = model item with `mechanical: { type: 'unlockModel', value: 'standard' }`, category 'model' → `{ ok: false, reason: 'Model already unlocked' }`
4. `allows buying a model not yet unlocked` — state.unlockedModels = ['free'], item is model with value 'standard' → `{ ok: true }`
5. `returns already installed for owned hardware` — state.ownedUpgrades includes 'hw-monitor', item has id 'hw-monitor', category 'hardware' → `{ ok: false, reason: 'Upgrade already installed' }`
6. `returns already unlocked for agent slot at or above current` — state.agentSlots = 2, item category 'agentSlot' with `mechanical: { type: 'unlockSlot', value: 2 }` → `{ ok: false, reason: 'Slot already unlocked' }`
7. `allows buying agent slot above current` — state.agentSlots = 1, item agentSlot with value 2 → `{ ok: true }`
8. `returns already purchased for owned joke` — state.purchasedJokes includes 'joke-quantum', item id 'joke-quantum', category 'joke' → `{ ok: false, reason: 'Already purchased' }`
9. `blocks repair when hardware is 100` — state.hardwareHp = 100, item category 'repair' → `{ ok: false, reason: 'Hardware at maximum health' }`

**`buyItem` tests (14 tests):**

1. `deducts budget on successful purchase` — state.budget = 500, buy consumable at price 100 → state.budget === 400
2. `returns success:false if canBuy fails` — state.budget = 0 → `{ success: false }`
3. `unlocks model on model purchase` — buy model item with `mechanical: { type: 'unlockModel', value: 'frontier' }` → `state.unlockedModels` includes 'frontier'
4. `unlocks agent slot (sets agentSlots to max)` — state.agentSlots = 1, buy agentSlot with value 2 → state.agentSlots === 2
5. `adds hardware upgrade to ownedUpgrades` — buy hardware item id 'hw-monitor' → `state.ownedUpgrades` includes 'hw-monitor'
6. `adds consumable to activeConsumables` — buy consumable with `mechanical: { type: 'nextDaySpeed', value: 0.05 }` → `state.activeConsumables` includes the item id
7. `repairs hardware (capped at 100)` — state.hardwareHp = 80, buy repair item → state.hardwareHp === 100 (not 110)
8. `repairs hardware (partial heal)` — state.hardwareHp = 50, buy repair → state.hardwareHp === 80 (+30)
9. `joke item adds to purchasedJokes` — buy joke item → `state.purchasedJokes` includes it
10. `joke item returns jokeResult as message` — buy joke-quantum → result.message === the jokeResult string from the item
11. `joke-egpu refunds $25` — state.budget = 500, buy joke-egpu at price 75 → state.budget === 450 (500 - 75 + 25)
12. `cannot buy same joke twice` — buy joke-quantum, then try again → second buy returns `{ success: false }`
13. `cannot buy same hardware twice` — buy hw-monitor, then try again → second buy returns `{ success: false }`
14. `consumables can be bought multiple times` — buy con-coffee, buy con-coffee again → both succeed, activeConsumables has two entries

**`getDealOfTheDay` tests (4 tests):**

1. `returns an item id from the filtered list` — `getDealOfTheDay(SHOP_ITEMS, 1)` returns a string that exists in SHOP_ITEMS and is not a joke or repair
2. `different days return different deals` — `getDealOfTheDay(SHOP_ITEMS, 1)` !== `getDealOfTheDay(SHOP_ITEMS, 2)` (may not always hold for all seeds but test days 1 vs 2)
3. `returns empty string for empty list` — `getDealOfTheDay([], 1)` returns `''`
4. `never returns a joke or repair item` — iterate days 1–13, every result should be an item with category not 'joke' and not 'repair'

---

### File 2: `src/systems/EconomySystem.spec.ts`

Test the `EconomySystem` static class. Import from:
- `import { EconomySystem } from './EconomySystem';`
- `import { createInitialState, resetState } from './GameState';`
- `import type { GameState, ModelTier, Strategy } from './GameState';`
- `import { SHOP_ITEMS } from '../data/items';`

**`getModelQualityMod` tests (7 tests):**

Test each tier returns the correct value. These are the exact numbers from the source:
- `free` → `-0.15`
- `sketchy` → `-0.10`
- `local` → `-0.05`
- `openSource` → `0`
- `standard` → `0.05`
- `frontier` → `0.15`
- unknown/default → `0`

**`getModelDayCost` tests (7 tests):**

Test each tier returns the correct daily cost:
- `free` → `0`
- `sketchy` → `5`
- `local` → `0`
- `openSource` → `10`
- `standard` → `30`
- `frontier` → `100`
- unknown/default → `0`

**`getStrategyModifier` tests (5 tests):**

Test each strategy returns an object with the correct fields. Check `strategyCost` and `qualityMult` for each:
- `planThenBuild` → strategyCost 60, qualityMult 1.2, timeBonus 2
- `justStart` → strategyCost 30, qualityMult 1.0, timeBonus 0
- `oneShot` → strategyCost 10, qualityMult 0.7, timeBonus -2
- `vibeCode` → strategyCost 45, qualityMult is between 0.5 and 1.5 (random component: `0.5 + Math.random()`, so range is [0.5, 1.5))
- unknown/default → strategyCost 0

For the `vibeCode` test: run it 10 times, assert qualityMult >= 0.5 and < 1.5 every time.

**`applyDayCosts` tests (8 tests):**

1. `deducts model + strategy cost from budget` — state with budget 500, model 'standard' ($30/day), strategy 'justStart' ($30) → after applyDayCosts, budget === 440
2. `skips cost deduction for corporateDev` — state.playerClass = 'corporateDev', budget 500, model 'frontier', strategy 'planThenBuild' → budget still 500
3. `sets broke flag and force-downgrades on negative budget` — state.budget = 50, model 'frontier' ($100), strategy 'planThenBuild' ($60) → total cost 160 > 50, so state.eventFlags['broke'] === true, state.model === 'free', state.budget === 0
4. `applies modelCostDiscount` — state.budget = 500, model 'frontier' ($100), strategy 'justStart' ($30), modelCostDiscount = 0.5 → model cost becomes 50, total deduction = 80, budget === 420
5. `zero cost when using free model and oneShot strategy` — free ($0) + oneShot ($10) → budget decreases by exactly 10
6. `broke flag not set when budget exactly covers costs` — budget = 40, model 'standard' ($30) + strategy 'oneShot' ($10) → budget === 0, broke flag NOT set
7. `broke flag set when budget is 1 less than needed` — budget = 39, same costs → broke, free, budget 0
8. `no strategy cost when strategy is null` — state.strategy = null → only model cost deducted

**`getShopPrices` tests (4 tests):**

1. `returns a price for every item` — `getShopPrices(SHOP_ITEMS, 1).size` === `SHOP_ITEMS.length`
2. `prices fluctuate within ±20% of baseCost` — for each item, price should be >= `baseCost * 0.8` and <= `baseCost * 1.2`
3. `different days produce different price maps` — prices for day 1 !== prices for day 2 (check at least one item differs)
4. `same day always produces same prices` — call twice with same day → identical results

---

### File 3: `src/systems/ScoringSystem.spec.ts`

Test the `ScoringSystem` static class. Import from:
- `import { ScoringSystem } from './ScoringSystem';`
- `import { PROJECTS } from '../data/projects';`
- `import type { ClassDef } from '../data/classes';`
- `import { CLASS_DEFS } from '../data/classes';`

Use a dummy ClassDef for most tests (scoreMultiplier 1.0). The `_classDef` param is unused in calcDayReputation (it's kept for API consistency) but still must be passed.

```ts
const dummyClass: ClassDef = CLASS_DEFS.indieHacker;
```

**`calcDayReputation` tests (11 tests):**

1. `0% progress yields 0 total` — progress=0, accuracy=0.9, strategy='justStart', day=1 → total === 0, baseRep === 0
2. `100% progress yields maxReputation as baseRep` — progress=100, accuracy=0, strategy='justStart', day=1 → baseRep === PROJECTS[0].maxReputation (50)
3. `50% progress yields half maxReputation` — progress=50, day=1 → baseRep === 25
4. `accuracy bonus is 30% of baseRep times accuracy` — progress=100, accuracy=1.0, strategy='justStart', day=1 → accuracyBonus === floor(1.0 * 0.3 * 50) === 15
5. `accuracy=0 yields 0 accuracy bonus` — progress=100, accuracy=0, strategy='justStart', day=1 → accuracyBonus === 0
6. `planThenBuild gives +15% strategy bonus` — progress=100, accuracy=0, strategy='planThenBuild', day=1 → strategyBonus === floor(50 * 0.15) === 7
7. `justStart gives 0 strategy bonus` — progress=100, accuracy=0, strategy='justStart', day=1 → strategyBonus === 0
8. `oneShot gives -10% strategy bonus` — progress=100, accuracy=0, strategy='oneShot', day=1 → strategyBonus === floor(50 * -0.10) === -5
9. `vibeCode strategy bonus is bounded [-20%, +40%]` — run 20 times with progress=100, accuracy=0, strategy='vibeCode', day=1 → every strategyBonus should be >= floor(baseRep * -0.2) and <= floor(baseRep * 0.4)
10. `total = baseRep + accuracyBonus + strategyBonus` — check the sum identity for a known input: progress=80, accuracy=0.75, strategy='planThenBuild', day=5 (maxRep=120) → baseRep=96, accuracyBonus=floor(0.75*0.3*96)=21, strategyBonus=floor(96*0.15)=14, total=131
11. `day 13 uses correct maxReputation (500)` — progress=100, accuracy=0, strategy='justStart', day=13 → baseRep === 500

**`calcFinalScore` tests (8 tests):**

1. `rawTotal is sum of dayScores` — dayScores = [10, 20, 30] → rawTotal === 60
2. `finalScore applies class multiplier` — rawTotal 100, multiplier 2.0 → finalScore === 200
3. `finalScore floors fractional results` — rawTotal 33, multiplier 1.5 → finalScore === 49 (floor of 49.5)
4. `rank S for >= 90% of maxPossibleRaw` — maxPossibleRaw = sum of all PROJECTS maxReputation = 50+60+75+100+120+150+175+200+250+300+350+400+500 = 2730. dayScores summing to >= 2457 (90%) → rank 'S'
5. `rank A for >= 75% but < 90%` — dayScores summing to 2048 (75.1%) → rank 'A'
6. `rank F for < 30%` — dayScores = [10] → rank 'F'
7. `empty dayScores yields 0 rawTotal and rank F` — dayScores = [] → rawTotal 0, rank 'F'
8. `multiplier does not affect rank calculation` — rank is based on rawTotal/maxPossibleRaw, not finalScore. dayScores summing to rawTotal of 2500 should give 'S' regardless of multiplier being 0.1 or 10.0

### Run Verification
After writing all three files:

```bash
npx vitest run
```

All tests must pass. If any test fails because of a bug in the game logic (not the test), note the failure in the commit message but do NOT fix game logic — that's a separate task.

### Constraints
- Do NOT modify any system source files (ShopSystem.ts, EconomySystem.ts, ScoringSystem.ts)
- Do NOT import Phaser in any test file
- Use `beforeEach(() => resetState())` in every describe block that touches global state
- Every `describe` block should have a comment explaining what it tests
- No snapshot tests — use explicit assertions

### Commit
```
test: add ShopSystem, EconomySystem, ScoringSystem test suites (~50 tests)
```

---

## T3: Data Validation + Agent System Tests
**Agent:** Patch · **Files:** `src/data/projects.spec.ts` (new), `src/data/agents.spec.ts` (new), `src/data/items.spec.ts` (new), `src/systems/AgentSystem.spec.ts` (new) · **Effort:** ~30 min

### Prerequisite
T1 must be committed first.

### Goal
Write validation tests for the static data files and the AgentSystem. These are "prove the data is sane" tests — they catch typos, missing entries, broken references, and broken invariants in the game's configuration data.

---

### File 1: `src/data/projects.spec.ts`

Import: `import { PROJECTS } from './projects';`

**Tests (6):**

1. `exactly 13 projects` — `PROJECTS.length === 13`
2. `days are contiguous 1 through 13` — `PROJECTS.map(p => p.day)` deep equals `[1,2,3,4,5,6,7,8,9,10,11,12,13]`
3. `maxReputation is non-decreasing` — for each consecutive pair, `PROJECTS[i+1].maxReputation >= PROJECTS[i].maxReputation`
4. `every project has a non-empty name` — all `p.name.length > 0`
5. `every project has a valid difficulty` — all `p.difficulty` is one of `'easy' | 'medium' | 'hard'`
6. `every project has a valid typingDifficulty` — all `p.typingDifficulty` is one of `'easy' | 'medium' | 'hard'`

---

### File 2: `src/data/agents.spec.ts`

Import:
- `import { AGENT_ROSTER, SYNERGY_PAIRS, CLASH_PAIRS } from './agents';`

**Agent roster tests (5):**

1. `exactly 6 agents` — `AGENT_ROSTER.length === 6`
2. `all agent IDs are unique` — `new Set(AGENT_ROSTER.map(a => a.id)).size === 6`
3. `all agents have speed 1-5 and quality 1-5` — every agent: `speed >= 1 && speed <= 5 && quality >= 1 && quality <= 5`
4. `all agents have traitChance between 0 and 1` — every agent: `traitChance >= 0 && traitChance <= 1`
5. `all agents have non-empty trait and traitEffect` — every agent: `trait.length > 0 && traitEffect.length > 0`

**Synergy/clash reference tests (4):**

6. `all synergy pair agent IDs exist in roster` — for every pair in SYNERGY_PAIRS, every id in `pair.agents` exists in `AGENT_ROSTER.map(a => a.id)`
7. `all clash pair agent IDs exist in roster` — same check for CLASH_PAIRS
8. `synergy effects are positive` — every SYNERGY_PAIRS entry has `effect > 0`
9. `clash effects are negative` — every CLASH_PAIRS entry has `effect < 0`

---

### File 3: `src/data/items.spec.ts`

Import: `import { SHOP_ITEMS } from './items';`

**Tests (7):**

1. `all item IDs are unique` — `new Set(SHOP_ITEMS.map(i => i.id)).size === SHOP_ITEMS.length`
2. `all items have a valid category` — every item's category is one of `'model' | 'hardware' | 'agentSlot' | 'consumable' | 'joke' | 'repair'`
3. `all items have baseCost > 0` — every `item.baseCost > 0`
4. `all non-joke items have a mechanical effect` — every item where `category !== 'joke'` has `item.mechanical` defined (note: repair items have mechanical too)
5. `all joke items have a jokeResult` — every item where `category === 'joke'` has `item.jokeResult` defined and non-empty
6. `model items reference valid ModelTier values` — model items' `mechanical.value` is one of `'free' | 'sketchy' | 'local' | 'openSource' | 'standard' | 'frontier'`
7. `availableAfterDay values are within game range` — items with `availableAfterDay` defined have value between 1 and 13

---

### File 4: `src/systems/AgentSystem.spec.ts`

Import:
- `import { AgentSystem } from './AgentSystem';`
- `import { AGENT_ROSTER, SYNERGY_PAIRS, CLASH_PAIRS } from '../data/agents';`

**`getSpeedModifier` tests (7):**

1. `returns 0 for empty agent list` — `getSpeedModifier([])` === 0
2. `returns 0 for single agent` — `getSpeedModifier(['turbo'])` === 0
3. `returns +0.1 for turbo+oracle synergy` — `getSpeedModifier(['turbo', 'oracle'])` === 0.1
4. `returns -0.1 for turbo+linter clash` — `getSpeedModifier(['turbo', 'linter'])` === -0.1
5. `synergy and clash can cancel out` — `getSpeedModifier(['turbo', 'oracle', 'linter'])` → turbo+oracle synergy (+0.1) + turbo+linter clash (-0.1) === 0
6. `three-agent synergy fires when all three present` — `getSpeedModifier(['oracle', 'parrot', 'gremlin'])` includes the +0.1 from the triple synergy. Also includes oracle+gremlin clash (-0.1). Total: 0.
7. `order of agent IDs does not matter` — `getSpeedModifier(['oracle', 'turbo'])` === `getSpeedModifier(['turbo', 'oracle'])`

**`checkTraits` tests (5):**

8. `returns one result per agent` — `checkTraits(['turbo', 'oracle'], 1).length` === 2
9. `each result has correct agentId and trait` — check that turbo's result has `trait === 'deploy_unapproved'` and oracle's has `trait === 'low_hallucination'`
10. `deterministic — same inputs produce same outputs` — `checkTraits(['turbo'], 5)` called twice yields identical `fired` values
11. `oracle trait always fires (traitChance = 1.0)` — for days 1-13, `checkTraits(['oracle'], day)` always has `fired === true`
12. `unknown agent ID is silently skipped` — `checkTraits(['nonexistent'], 1)` returns empty array

**`getAgentDefs` tests (2):**

13. `returns correct AgentDef objects` — `getAgentDefs(['turbo', 'oracle']).map(a => a.id)` deep equals `['turbo', 'oracle']`
14. `skips unknown IDs` — `getAgentDefs(['turbo', 'fakeid']).length` === 1

### Run Verification
```bash
npx vitest run
```

All tests must pass.

### Constraints
- Do NOT modify any source data or system files
- No Phaser imports
- No snapshot tests

### Commit
```
test: add data validation + AgentSystem test suites (~40 tests)
```

---

## T4: Fix Bugs Found by Tests
**Agent:** Patch · **Files:** varies based on failures · **Effort:** ~20 min

### Prerequisite
T2 and T3 must be committed first.

### Goal
Run the full test suite. For every failing test, determine whether the bug is in the test or the game logic:

- If the test expectation is wrong (e.g., a rounding difference, or the test misunderstands the API), fix the test.
- If the game logic has a real bug (e.g., wrong price calculation, missing boundary check, broken invariant), fix the game logic.

### Steps

1. Run the full suite:
   ```bash
   cd ~/Developer/gamedevjs-2026/game
   npx vitest run 2>&1
   ```

2. For each failure, read the error message carefully. Check the source code. Decide: test bug or game bug.

3. Fix it. Keep each fix minimal — don't refactor, don't "improve" working code.

4. Re-run until all tests pass:
   ```bash
   npx vitest run
   ```

5. Then verify the game still builds:
   ```bash
   npx tsc --noEmit
   ```

### Common things that might fail
- **Math.random() in vibeCode/ScoringSystem** — the tests for vibeCode and vibeCode strategy use range checks (not exact values) specifically to handle this. If a test asserts an exact value for something with Math.random(), the test is wrong — fix the test to use a range.
- **Floating point rounding** — `Math.floor` and `Math.round` are used inconsistently. If a test expects `Math.floor` but the source uses `Math.round` (or vice versa), match the test to the source.
- **`openSource` vs `opensource` ModelTier** — the item data uses `'opensource'` (lowercase) but the ModelTier type and EconomySystem switch cases may use `'openSource'` (camelCase). If there's a mismatch, this is a real game bug — the item data should match the ModelTier type. Check `src/utils/playerClass.ts` for the canonical spelling.

### Constraints
- Minimal fixes only — no refactoring
- If you find a game logic bug, fix ONLY that bug, not surrounding code
- Do NOT delete or skip tests to make them pass

### Commit
One commit per category:
```
fix: <description of game logic bug>    # if game bugs found
test: fix test expectations for <X>     # if test assertions were wrong
```

If everything passes on first run (unlikely but possible):
```
chore: verify all test suites pass (no fixes needed)
```
