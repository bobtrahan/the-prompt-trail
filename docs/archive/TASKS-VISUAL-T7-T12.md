# Visual Polish Tasks T7–T12 — Route-Ready Specs

> All tasks are in `~/Developer/gamedevjs-2026/game/`
> Read `~/Developer/gamedevjs-2026/CONTEXT.md` then `~/Developer/gamedevjs-2026/game/src/utils/constants.ts` before writing code.
> Dev server: `cd game && npm run dev` (localhost:5173)
> Every change → `git add . && git commit -m "<description>"`

---

## T7: Desktop Wallpaper Per Class
**Agent:** Forge · **Files:** `src/utils/themes.ts` (or new file), `src/ui/Taskbar.ts`, and every scene that sets `setBackgroundColor(COLORS.bg)` · **Effort:** ~2 hrs

### Current State
Every scene sets `this.cameras.main.setBackgroundColor(COLORS.bg)` (solid `0x0f1117`). There is no visible desktop wallpaper. `CLASS_THEMES` in `constants.ts` defines per-class `wallpaper` string keys but they're unused (no image assets exist).

### Spec

Create a **procedural wallpaper** system — no images, just Phaser graphics drawn behind the scene content. Each class gets a unique subtle pattern.

**A) New utility: `src/ui/DesktopWallpaper.ts`**

Export a function:
```ts
export function drawWallpaper(scene: Phaser.Scene, playerClass?: string): void
```

This draws class-specific background patterns at `depth: -10` so they sit behind all other content. The base background color (`COLORS.bg` / `0x0f1117`) stays as the camera background; the wallpaper is drawn ON TOP of it at very low opacity.

**Patterns (all drawn with `scene.add.graphics()` or `scene.add.rectangle()`):**

1. **Tech Bro (`techBro`)** — Circuit trace grid
   - Draw a grid of thin horizontal and vertical lines (`0x00ffcc`, alpha `0.03`) every 40px
   - At ~15 random grid intersections, draw small `4×4` filled squares (`0x00ffcc`, alpha `0.06`) — "nodes"
   - Creates a faint motherboard/PCB feel

2. **Indie Hacker (`indieHacker`)** — Mountain silhouette
   - Draw 2 overlapping mountain range polygons at the bottom 30% of the screen
   - Front range: `0xf0883e` at alpha `0.04`, peaks at varying heights (use 6 points with y between `GAME_HEIGHT * 0.6` and `GAME_HEIGHT * 0.75`)
   - Back range: `0xf0883e` at alpha `0.02`, slightly taller peaks offset horizontally
   - Both fill down to `GAME_HEIGHT`

3. **College Student (`collegeStudent`)** — Notebook grid
   - Draw a grid of thin lines (`0x58a6ff`, alpha `0.025`) — horizontal every 24px, vertical every 24px
   - Add a thicker red "margin" vertical line (`0xf85149`, alpha `0.04`) at x=80
   - Three horizontal "hole punch" circles (just outlines) at x=40, y at 25%/50%/75% of height

4. **Corporate Dev (`corporateDev`)** — Pinstripe
   - Draw thin vertical lines (`0x6e7681`, alpha `0.03`) every 20px across the full width
   - Every 5th line at alpha `0.05` (slightly bolder, like a subtle suit pinstripe)

**B) Integration:**
Call `drawWallpaper(this, state.playerClass)` in the `create()` of these scenes (after `setBackgroundColor`, before window/taskbar creation):
- `BriefingScene`
- `PlanningScene`
- `ExecutionScene`
- `ResultsScene`
- `NightScene`
- `TokenMarketScene`
- `BugBountyScene`
- `FinalScene`

Do NOT add it to `BootScene`, `TitleScene`, or `ClassSelectScene` (those are pre-class or use their own bg).

**C) Seed randomness by day:**
For Tech Bro circuit nodes, use `state.day` as a seed so the pattern is consistent within a day but varies across days. Simple LCG seeded on day is fine.

### Constraints
- All graphics at `depth: -10` so they never overlap game UI
- Total alpha must stay very subtle — these should be visible only on careful inspection, never competing with foreground
- No image assets — everything is Phaser rectangles, lines, and polygons
- Don't modify `CLASS_THEMES` in constants.ts
- The function should gracefully handle `playerClass === undefined` (just skip drawing)

### Test
- Play as each class → see a faintly different background pattern behind the windows
- Pattern should be visible but not distracting
- No z-fighting with windows or taskbar

---

## T8: Briefing Scene Density
**Agent:** Forge · **File:** `src/scenes/BriefingScene.ts` · **Effort:** ~2 hrs

### Current State
BriefingScene has: window with project card (name, difficulty, flavor, base rep), resources row, AI news ticker, and "PLAN YOUR APPROACH" button. The area below the ticker and button is completely empty (the window content area extends much further down).

### Spec

Add 3 new content blocks below the "PLAN YOUR APPROACH" button to fill the dead space and give the player more strategic information.

**A) Risk Assessment Panel (below the button):**
Position: `btnY + btnH + 30`, full content width

```
── RISK ASSESSMENT ──
```

Show a visual risk meter — a horizontal bar (240px wide, 12px tall) that fills based on project difficulty:
- Easy: 33% fill, green (`0x3fb950`)
- Medium: 66% fill, warning (`0xd29922`)
- Hard: 100% fill, red (`0xf85149`)

Label to the right: `"Low Risk"` / `"Moderate Risk"` / `"High Risk"` in matching color.

Below the bar, add a one-line tip based on difficulty:
- Easy: `"💡 A good day to experiment with risky strategies."`
- Medium: `"💡 Balance speed and caution. Watch your budget."`
- Hard: `"💡 Consider Plan Then Build. Every time unit counts."`

Style: `fontSize: '12px', color: '#9da5b0', fontStyle: 'italic'`

**B) Agent Recommendation (below risk panel):**
Position: risk panel + 50px

```
── RECOMMENDED AGENTS ──
```

Show the names of 2 agents that are good for the current project. Determine by:
- Easy projects → recommend fast agents: `"Turbo, Parrot"` + `"Speed matters more than caution."`
- Medium projects → recommend balanced: `"Oracle, Linter"` + `"Reliability over speed today."`
- Hard projects → recommend careful: `"Oracle, Linter"` + `"You need bulletproof code."`

Display as: `"🤖 Turbo  ·  🤖 Parrot"` in white, with the tip below in dim.

**C) Event Forecast (below agent rec):**
Position: agent rec + 50px

```
── EVENT FORECAST ──
```

Show a one-liner hinting at event frequency:
- Days 1-4: `"📡 Light chatter expected. Focus on building."`
- Days 5-9: `"📡 Increased activity. Expect interruptions."`
- Days 10-13: `"📡 Heavy interference. Brace for chaos."`

Style: `fontSize: '13px', color: '#9da5b0'`

### Constraints
- All new content goes inside the existing `win` (Window) container via `win.add()`
- Use the existing `cx`, `ca` (contentArea) variables for positioning
- Don't modify the project card, resources, ticker, or button — only ADD below them
- Section headers use the same style as existing headers: `fontSize: '13px', color: '#9da5b0', letterSpacing: 1`
- Keep total content within the window bounds (window height is `GAME_HEIGHT - 28 - 40` = 652px, starting at y=28)

### Test
- Briefing screen should now show risk bar, agent suggestion, and event forecast below the action button
- Text should be readable and not overflow the window
- Content should update appropriately for different days (test day 1 vs day 12)

---

## T9: Execution Panels Enrichment
**Agent:** Forge · **File:** `src/scenes/ExecutionScene.ts` · **Effort:** ~2.5 hrs

### Current State
- **Agent Manager** (852, 72, 412×200): Shows agent name + "⚡ Working..." with animated dots. Very sparse if only 1 agent.
- **System Monitor** (852, 288, 412×224): Shows budget, hardware, rep, model (static text) + time bar.

### Spec

**A) Agent Manager enrichment:**

For each agent in `agentDefs`, replace the current simple `🤖 Name / ⚡ Working...` with a richer row:

```
🤖 Turbo            ⚡ Working...
   Speed: ████░ (5)  Trait: deploy_unapproved
```

Implementation:
- Line 1 (existing): Agent emoji + name + animated status (keep the dots animation)
- Line 2 (new): Speed bar + trait name
  - Speed bar: Draw 5 small rectangles (8×8 each, 2px gap), filled count = `agent.speed`, filled color = theme accent, empty = `0x21262d`
  - Trait text: `agent.trait` in dim text (`fontSize: '11px', color: '#9da5b0'`)
- Row height: 48px (was 40px) — adjust the loop accordingly
- If only 1 agent: also add a note below: `"💡 Buy agent slots at the Token Market"` in dim text

**B) System Monitor animated bars:**

Replace the static text lines for budget/hardware/rep with text + mini bar combos.

After each stat text line, add a thin horizontal bar (160px wide, 6px tall):

- **Hardware bar:** At `rY + 42` (below hardware text). Width = `(state.hardwareHp / 100) * 160`. Color:
  - Green (`0x3fb950`) if ≥60%
  - Warning (`0xd29922`) if 30-59%
  - Red (`0xf85149`) if <30%

- **Model quality indicator:** After the model text, add a small quality tag:
  - Free: `"[-15%]"` in red
  - Standard: `"[+0%]"` in dim
  - Frontier: `"[+15%]"` in green
  - Use `EconomySystem.getModelQualityMod()` to get the value

**C) Live updating in System Monitor:**

Add an `update()` method to ExecutionScene (or expand the existing one) that refreshes the hardware bar width every frame based on current `state.hardwareHp`. This makes the bar animate when hardware takes damage from events.

Also add a subtle "pulse" effect on the hardware bar when it changes: store `lastHw` and on delta, briefly flash the bar white for 200ms.

### Constraints
- Keep Agent Manager window at 412×200 — content must fit
- Keep System Monitor window at 412×224
- Don't change the typing engine, event system, or scoring — visual only
- Import `AGENT_DEFS` from `src/data/agents.ts` for speed/trait data (use `AgentSystem.getAgentDefs()` which is already imported)
- The speed rectangles should be added to the `agentWindow` container

### Test
- Execution scene should show richer agent rows with speed bars and trait labels
- System Monitor should show hardware health bar that changes color and animates on damage
- Model quality indicator should display next to model name

---

## T10: Token Market Item Detail Pane
**Agent:** Forge · **File:** `src/scenes/TokenMarketScene.ts` · **Effort:** ~2 hrs

### Current State
TokenMarketScene shows items in a flat list with name, description, price, and buy button. No detail/expansion on click. The lower portion of the window is empty when there are few items in a category.

### Spec

**A) Selected item detail pane:**

Add a detail panel at the bottom of the market window (fixed position, always visible) that shows expanded info for the currently hovered item.

Position: Bottom of content area, spanning full width, 100px tall. Draw a dark background rectangle (`0x0d1117`) with a 1px top border (`0x30363d`).

Contents (update on hover):
- **Item name** in 16px white bold
- **Full description** in 13px dim (allows longer text than the list row)
- **Effect text** — what the item does mechanically. Add an `effect` string to each `ItemDef` display (hardcode a local map in the scene):
  ```ts
  const ITEM_EFFECTS: Record<string, string> = {
    'model-standard': 'Base quality. No bonus or penalty to progress.',
    'model-frontier': '+15% progress quality. Premium daily cost.',
    'model-local': '+5% quality, no daily API cost. Requires hardware.',
    'model-open': '+8% quality, no daily cost. Community-maintained.',
    'model-sketchy': '-10% quality, dirt cheap. "It works on my machine."',
    'hw-monitor': '+5% typing speed. More screen real estate.',
    'hw-keyboard': 'Forgives 1 typo per prompt. Mechanical clicky.',
    'hw-ups': 'Immunity to power outage events.',
    'hw-cooling': 'Reduces hardware damage from overheating events.',
    'hw-ram': 'Reduces memory leak event frequency.',
    'agent-slot': 'Assign one more agent during Planning.',
    'con-coffee': '+5% speed for one day. Reliable and mild.',
    'con-energy': '+10% speed but 20% jitter chance. Risky.',
    'con-backup': 'Protects against data loss events for one day.',
    'con-api': 'Halves model daily cost for one day.',
    'con-duck': 'Auto-resolves one stuck/agent_stuck event.',
  };
  ```
- **Affordability indicator:** If player can't afford it: `"⚠️ Insufficient funds"` in red. If already owned: `"✓ Already purchased"` in green.

**B) Hover highlight on item rows:**

When hovering an item row, draw a subtle highlight behind it:
- On `pointerover` of the nameText or row area: set a highlight rectangle to that row's y position (`0x21262d`, alpha `0.5`, full row width)
- On `pointerout`: hide the highlight
- Update the detail pane content to match the hovered item

Implementation: Create a single reusable highlight rectangle and detail pane text objects in `create()`. Move/update them in hover callbacks rather than creating/destroying.

**C) Color-coded prices:**

In the item list, color the price text based on affordability:
- Can afford: `'#c9d1d9'` (current, no change)
- Can't afford: `'#f85149'` (red)
- Already owned: `'#3fb950'` (green, replace price with "OWNED")

### Constraints
- Don't change `ItemDef` type or `items.ts` — the `ITEM_EFFECTS` map lives locally in the scene
- Detail pane must fit within the existing 520px window height
- Keep the existing buy/owned logic unchanged — visual only
- Item list area may need to shrink slightly (reduce available rows by ~2) to make room for the detail pane
- The detail pane should show "Hover over an item for details" as default text when nothing is hovered

### Test
- Hover over items → detail pane updates with name, description, effect, affordability
- Row highlight follows the mouse
- Prices turn red when unaffordable
- Works correctly across all 5 tabs

---

## T11: Results Scene Overhaul
**Agent:** Forge · **File:** `src/scenes/ResultsScene.ts` · **Effort:** ~2 hrs

### Current State
ResultsScene already has a solid structure: Window with project name, status, animated breakdown (progress, accuracy, base rep, accuracy bonus, strategy bonus, overtime bonus, total), budget/hardware deltas, and continue button. Count-up animation over 1000ms with tick SFX.

The scene is actually MUCH better than the audit screenshots suggested (we jumped to it without game state, so it rendered without data). The main issues are:

1. No "Vibe Code percentage" reveal (mentioned in CONTEXT.md as done in Phase 2)
2. Could use a small visual embellishment to make the score reveal feel more rewarding
3. The window is 500×420 — adequate but could use the space better

### Spec (lighter touch since the base is already good)

**A) Vibe Code percentage reveal:**

After the total rep line, if strategy was `'vibeCode'`, add a dramatic vibe code reveal:

```ts
// After total rep reveal (when animation completes):
if (state.strategy === 'vibeCode') {
  const vibePercent = Math.round(Math.random() * 100); // or derive from actual result
  const vibeText = this.add.text(x + width / 2, y + 265 + yShift, '', {
    fontFamily: 'monospace', fontSize: '16px', color: '#d29922', fontStyle: 'bold',
  }).setOrigin(0.5).setAlpha(0);
  this.window.add(vibeText);
  
  // Rapid number cycling animation for 1 second, then land on final
  let vibeCounter = 0;
  const vibeTimer = this.time.addEvent({
    delay: 50,
    repeat: 19, // 1 second of cycling
    callback: () => {
      vibeCounter++;
      vibeText.setText(`✨ Vibe Code: ${Math.floor(Math.random() * 100)}% ✨`);
    },
  });
  
  this.time.delayedCall(1000, () => {
    vibeText.setText(`✨ Vibe Code: ${vibePercent}% ✨`);
  });
  
  this.tweens.add({ targets: vibeText, alpha: 1, duration: 200, delay: 200 });
}
```

Actually — check if `result.score` already has vibe code data. Look at `ScoringSystem.calcDayReputation()` to see if it returns a vibe percentage. If it does, use that value. If not, calculate: `vibePercent = result.progress >= 100 ? Math.floor(50 + Math.random() * 50) : Math.floor(Math.random() * 40)`.

**B) Score total color based on performance:**

Change the total rep text color dynamically:
- `total >= 40`: gold `'#f2cc60'` (current)
- `total >= 20`: green `'#3fb950'`
- `total >= 0`: white `'#e6edf3'`
- `total < 0`: red `'#f85149'`

**C) Flash border on high score:**

When the count-up completes and total >= 40, briefly flash the window border:
- `this.window.container` — find the border rectangle and tween its fillStyle isn't directly tweenble, so instead:
- Add a new accent rectangle (`2px`) around the window edges at depth 50, color = theme accent, alpha 0 → tween alpha to `0.8` then back to `0` over 800ms.

**D) Continue button styling:**

Change the continue button from plain text to a styled button (matching the approach from NightScene):
```ts
this.continueBtn = this.add.text(x + width/2, y + 340 + yShift, btnText, {
  fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
  backgroundColor: '#238636', padding: { x: 14, y: 8 },
}).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

this.continueBtn.on('pointerover', () => this.continueBtn.setBackgroundColor('#2ea043'));
this.continueBtn.on('pointerout', () => this.continueBtn.setBackgroundColor('#238636'));
```

### Constraints
- Keep the existing count-up animation and SFX logic unchanged
- Keep all existing text positions — additions go below existing content
- Don't change the scoring calculation — visual only
- Window size can increase to 500×460 if needed to fit the vibe code reveal (update `winHeight`)

### Test
- Play a day with Vibe Code strategy → see the number cycling animation on results
- High score → golden total + border flash
- Low/negative score → red total
- Continue button has green background with hover state

---

## T12: Night Scene Atmosphere
**Agent:** Patch · **File:** `src/scenes/NightScene.ts` · **Effort:** ~1 hr

### Current State
NightScene renders a centered 600×400 Window over a solid dark background with camera fadeIn. Contains: body text ("office is quiet"), tomorrow preview, and 3 buttons (Token Market, Bug Bounty, Sleep).

### Spec

**A) Ambient background elements:**

After `setBackgroundColor` and before the Window creation, add subtle atmospheric details:

1. **Monitor glow:** Draw a rectangle (200×140) at position `(100, 200)`, filled with the class accent color at alpha `0.015`. This suggests a faint monitor light in the dark office.

2. **Second monitor glow:** Another rectangle (180×120) at `(980, 240)`, same accent color, alpha `0.01`. Slightly dimmer — a secondary screen.

3. **Blinking LED:** A tiny `4×4` circle/rectangle at `(120, 500)`, green (`0x3fb950`), that pulses:
   ```ts
   const led = this.add.rectangle(120, 500, 4, 4, 0x3fb950).setAlpha(0.6);
   this.tweens.add({
     targets: led,
     alpha: 0.1,
     duration: 2000,
     yoyo: true,
     repeat: -1,
     ease: 'Sine.easeInOut',
   });
   ```

4. **Status line at bottom:** Small text above the taskbar:
   ```
   System idle  ·  3 processes sleeping  ·  Hardware: 85%
   ```
   Position: `(GAME_WIDTH / 2, GAME_HEIGHT - 50)`, centered, `fontSize: '11px', color: '#30363d'`
   Use actual `state.hardwareHp` for the hardware value. The "3 processes" is always 3 (flavor text).

**B) Window entrance animation:**

The window currently just appears (the camera fades in, but the window is static). Add a subtle entrance:

After creating `nightWin`, set it to slightly transparent and offset:
```ts
nightWin.container.setAlpha(0);
nightWin.container.y += 10;
this.tweens.add({
  targets: nightWin.container,
  alpha: 1,
  y: nightWin.container.y - 10,
  duration: 400,
  delay: 300, // after camera fade-in starts
  ease: 'Power2.easeOut',
});
```

**C) Button hover sound:**

Add a very subtle UI click on button hover (not click — that already has its own handling):
```ts
marketBtn.on('pointerover', () => {
  // existing color change...
  AudioManager.getInstance().playSFX('ui-click', 0.15); // very quiet
});
```

Apply the same to bountyBtn and sleepBtn hover events. Import `AudioManager` (check if already imported — if not, add the import).

**D) Sleep transition enhancement:**

In the `advance()` method, before the fadeOut, add a brief "powering down" feel:
- Flash the blinking LED to full brightness (alpha 1) for 200ms, then kill its tween
- The existing camera fadeOut handles the rest

### Constraints
- Keep the Window size and position unchanged (600×400, centered)
- All ambient elements at `depth: -5` so they're behind the window
- Don't change button logic or navigation
- AudioManager is already used in other scenes — check import at top of file, add if missing
- The monitor glow rectangles should use `getTheme(state.playerClass).accent` for the color

### Test
- Night scene should show faint glowing rectangles in the background (monitor glow)
- A small green LED blinks slowly
- Window slides in gently after camera fade
- Hovering buttons makes a quiet click
- Clicking Sleep → LED brightens briefly → fade out → Briefing

---

## Dispatch Notes for Route

### Dependencies
- **T7** (wallpaper) is independent — can run immediately
- **T8** (briefing density) is independent — no file conflicts with others
- **T9** (execution panels) is independent — only touches ExecutionScene
- **T10** (market detail) is independent — only touches TokenMarketScene
- **T11** (results overhaul) is independent — only touches ResultsScene
- **T12** (night atmosphere) is independent — only touches NightScene

### All 6 tasks can run in parallel! 🚀

No file conflicts between any of them. Each touches a different scene file.

T7 touches multiple scene files to add the `drawWallpaper()` call, but only adds a single import + function call line to each — unlikely to conflict with the other tasks that modify content WITHIN those scenes. If Route is cautious, dispatch T7 last so it doesn't create merge friction.

### Suggested dispatch:
**Single batch, all 6 parallel:**
- T7 → Forge (wallpaper system, touches many files but minimal per-file change)
- T8 → Forge (briefing density)
- T9 → Forge (execution panels)
- T10 → Forge (market detail)
- T11 → Forge (results overhaul)
- T12 → Patch (night atmosphere)

**If constrained to fewer concurrent agents:**
- Batch A: T8, T9, T10, T11 (4 Forge tasks, all independent)
- Batch B: T7 (wallpaper, after scene modifications land), T12 (Patch)
