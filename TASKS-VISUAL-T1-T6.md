# Visual Polish Tasks T1–T6 — Route-Ready Specs

> All tasks are in `~/Developer/gamedevjs-2026/game/`
> Read `~/Developer/gamedevjs-2026/CONTEXT.md` then `~/Developer/gamedevjs-2026/game/src/utils/constants.ts` before writing code.
> Dev server: `cd game && npm run dev` (localhost:5173)
> Every change → `git add . && git commit -m "<description>"`

---

## T1: Boot Sequence — Fake POST Screen
**Agent:** Patch · **File:** `src/scenes/BootScene.ts` · **Effort:** ~45 min

### Current State
BootScene shows "PromptOS v1.0.0" + "Booting..." for 1.5 seconds, then jumps to Title. It also handles `preload()` (AudioManager + loading bar).

### Spec
Replace the `create()` method's visual content (keep preload and AudioManager.init as-is). Build a fake BIOS/POST boot sequence:

1. **Phase 1 (0–1.5s): POST text** — Left-aligned monospace text appearing line-by-line (staggered ~200ms each) at y=80, x=60. Lines:
   ```
   PromptOS BIOS v4.2.0
   Copyright (c) 2026 PromptOS Foundation
   
   CPU: Neural Processing Unit (8 cores) .......... OK
   RAM: 64GB Tensor Memory ........................ OK
   GPU: RTX 9090 Vision Accelerator ............... OK
   DISK: 2TB Model Weight Storage ................. OK
   NET: API Gateway ............................... CONNECTED
   
   Loading kernel modules...
   ```
   Use `color: '#39d353'` (terminal green) for text, `'#3fb950'` for "OK"/"CONNECTED".

2. **Phase 2 (1.5–2.5s): Kernel boot** — Append additional lines:
   ```
   [  OK  ] Started Agent Runtime Service
   [  OK  ] Started Token Economy Daemon
   [  OK  ] Mounted /dev/models
   Initializing PromptOS v1.0.13...
   ```
   The `[  OK  ]` prefix should be green (`#3fb950`), rest in dim (`#8b949e`).

3. **Phase 3 (2.5–3.5s): PromptOS splash** — Fade out all POST text over 300ms. Display centered:
   - `PromptOS` in 36px bold white
   - `v1.0.13` in 14px dim below it
   - The existing loading bar (if assets still loading) or a brief filled bar
   - Play `boot` SFX at the start of this phase

4. **Phase 4 (3.5–4s):** Fade entire screen to black over 300ms → `this.scene.start('Title')`

### Constraints
- Keep `preload()` exactly as-is (AudioManager.preload + loading bar logic)
- `AudioManager.getInstance().init(this.game)` must still be called in `create()`
- Total boot time: ~4 seconds (not longer — don't bore players on replays)
- All text is Phaser text objects, no images needed
- Boot SFX timing: play at phase 3 start (the splash), not phase 1

### Test
- Load game from scratch → see POST lines appear one by one → splash → title
- Reload → same sequence plays again

---

## T2: Class Card Visual Identity
**Agent:** Forge · **Files:** `src/scenes/ClassSelectScene.ts`, `src/utils/constants.ts` · **Effort:** ~1.5 hrs

### Current State
ClassSelectScene renders 4 cards with identical styling. Cards are `260×380` rectangles with `COLORS.windowBg` fill, `COLORS.windowBorder` stroke. Hover changes stroke to `COLORS.accent`. Click calls `selectClass()`.

`CLASS_THEMES` in constants.ts already defines per-class accent colors:
```ts
techBro: { accent: 0x00ffcc }
indieHacker: { accent: 0xf0883e }
collegeStudent: { accent: 0x58a6ff }
corporateDev: { accent: 0x6e7681 }
```

### Spec

**A) Per-card accent color:**
- Each card's border stroke should use its class's `CLASS_THEMES[id].accent` color (not the global `COLORS.accent`)
- Hover: brighten stroke to accent + add a faint glow rectangle behind the card (same accent color, 0.08 alpha, 4px larger on each side)
- The difficulty badge text color should also use the class accent

**B) Class emoji/icon:**
- Add a large emoji at top of each card, above the class name, `fontSize: '36px'`:
  - Tech Bro: `🤑`
  - Corporate Dev: `🏢`
  - Indie Hacker: `🔧`
  - College Student: `📚`
- These are already defined in the lore — use them as visual anchors

**C) Gradient hint per card:**
- Add a subtle vertical gradient at the top of each card: a rectangle `260×60` at the top of the card, filled with the class accent color at `alpha: 0.06`, fading to 0. (Use a Phaser rectangle with the accent fill and setAlpha(0.06) — exact gradient not needed, the flat tinted header is enough.)

**D) Selection animation:**
- On `pointerdown`, before calling `selectClass()`:
  - Tween the clicked card: `scaleX: 1.03, scaleY: 1.03` over 120ms, then immediately transition
  - Flash the card border to white (`0xffffff`) for 100ms
  - Add a 200ms delay before `scene.start('Briefing')` so the player sees the selection feedback

**E) Selected state (while hovering):**
- Show a small text badge below the stats: `"▶ SELECT"` in the class accent color, only visible on hover. Disappears on pointerout.

### Constraints
- Card positions and sizes stay the same (260×380, same spacing)
- Don't modify `CLASS_DEFS` — only use `CLASS_THEMES` for visual data
- If you need to add emoji data, add it as a local const in ClassSelectScene (not in constants.ts or GameState)
- Keep `selectClass()` logic unchanged (initClassState + Telemetry + scene.start)

### Test
- Each card should have visibly different border color and top tint
- Hovering a card shows glow + "▶ SELECT" badge
- Clicking a card shows brief scale + flash, then transitions

---

## T3: Global Text Contrast Bump
**Agent:** Chip · **Files:** `src/utils/constants.ts` + multiple scenes · **Effort:** ~30 min

### Spec

**A) In `src/utils/constants.ts`:**
- Change `textDim: 0x8b949e` → `textDim: 0x9da5b0`
  (This is the dim gray used across all scenes for secondary text. Bumping it improves readability without breaking the dark theme.)

**B) Scene-by-scene font size bumps:**
All changes are `fontSize` increases on `Phaser.GameObjects.Text` objects. Search for these exact values and bump them:

| File | What to find | Change |
|------|-------------|--------|
| `ClassSelectScene.ts` | Description text `fontSize: '11px'` | → `'13px'` |
| `ClassSelectScene.ts` | Difficulty badge `fontSize: '12px'` | → `'13px'` |
| `BriefingScene.ts` | Any body text at `fontSize: '11px'` | → `'13px'` |
| `TokenMarketScene.ts` | Item description text at `fontSize: '11px'` or `'12px'` | → `'13px'` |
| `FinalScene.ts` | Stats summary text `fontSize: '12px'` | → `'13px'` |
| `FinalScene.ts` | Flavor text `fontSize: '13px'` | → `'14px'` |

**C) Footer text on TitleScene:**
- Change footer ("Gamedev.js Jam 2026") color from `'#484f58'` → `'#6e7681'`

### Constraints
- Only change `fontSize` and `color` values. Do not restructure layouts, positions, or word wraps.
- The `textDim` constant is used via `COLORS.textDim` in multiple places — changing it in constants.ts propagates automatically. But some scenes hardcode `'#8b949e'` as a string literal. Find those too and replace with `'#9da5b0'`.
  - Run `grep -rn "8b949e" src/` to find all instances. Replace them all.

### Test
- All dim text across the game should be noticeably more readable
- No text should overflow its container (word wraps may need adjusting — check ClassSelectScene descriptions since they went from 11px to 13px with `wordWrap: { width: cardWidth - 30 }`)

---

## T4: Title Screen Polish
**Agent:** Chip · **File:** `src/scenes/TitleScene.ts` · **Effort:** ~30 min

### Current State
Title has: title text (48px bold), subtitle (18px), blinking start prompt, footer. All created instantly in `create()`.

### Spec

**A) Fade-in animation:**
- Set title, subtitle, and start prompt to `alpha: 0` on creation
- Tween title alpha to 1 over 600ms (delay 200ms)
- Tween subtitle alpha to 1 over 500ms (delay 600ms)
- Tween start prompt alpha to 1 over 400ms (delay 1000ms) — then start the existing blink tween
- Footer fades in with alpha tween over 300ms (delay 1200ms)

**B) Version string:**
- Add `'v1.0.13'` text below the subtitle:
  - Position: `cx, cy + 10` (between subtitle and start prompt)
  - Style: `fontSize: '12px', color: '#484f58'` (very subtle)
  - Fades in with subtitle (same delay)

**C) Blinking cursor on start prompt:**
- Change start prompt text to: `'[ Press any key or click to start ]▌'`
- The existing alpha blink tween is fine — the cursor character adds texture

**D) Subtle "desktop" hint:**
- Add a very faint horizontal line across the screen at `y = GAME_HEIGHT - 50` (above the footer):
  - `this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT - 50, GAME_WIDTH - 100, 1, 0x21262d).setAlpha(0.5)`
  - This hints at a taskbar area / OS structure without being heavy

### Constraints
- Don't change the existing blink tween parameters (alpha 0.3, duration 800, yoyo)
- Start prompt blink should begin AFTER the fade-in completes (chain them: onComplete callback)
- Keep `startGame()` and input handlers exactly as-is

### Test
- Game loads → title elements fade in sequentially → prompt starts blinking → click works → ClassSelect

---

## T5: Taskbar Enrichment
**Agent:** Patch · **File:** `src/ui/Taskbar.ts` · **Effort:** ~1 hr

### Current State
Taskbar renders: `◆ PromptOS` button (left), budget/HW/rep/day indicators (right). Height: 32px. Depth 100.

### Spec

**A) System tray icons (right side, before the day indicator):**
Add 3 small fake system tray indicators between repText and clockText. Each is a Phaser text at `fontSize: '12px'`:

- **Wi-Fi icon:** `📡` with tooltip-style label — just show `📡` static
- **Battery icon:** `🔋` — static
- **Live clock:** Show actual current time in `HH:MM` format (12hr), updating every 60 seconds via `scene.time.addEvent({ delay: 60000, loop: true, callback })`. Use `new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })`.

Position these between repText and clockText. Adjust spacing:
- `repText` at `GAME_WIDTH - 210` (was -180)
- Tray icons at `GAME_WIDTH - 145`, `GAME_WIDTH - 120`, `GAME_WIDTH - 95`
- `clockText` (Day X/13) at `GAME_WIDTH - 70` stays

**B) PromptOS button visual:**
- Add a small `▾` after "PromptOS" text to indicate it's a menu: `'◆ PromptOS ▾'`
- On hover: change color to white (`#e6edf3`), revert on out

**C) Subtle separator lines:**
- Add thin vertical separator lines (`1px wide, height 16px, color 0x30363d, alpha 0.5`) between each taskbar section:
  - After PromptOS button (at x=120)
  - Before the tray icons (at x=GAME_WIDTH-155)

### Constraints
- Taskbar height stays 32px
- Don't break the DebugMenu integration — `_openMenu()` must still work
- The `refresh()` method updates budget/HW/rep/day — don't change its logic
- Keep all existing text positions functional (just shift x values as specified)

### Test
- Taskbar should show PromptOS▾ | ... budget HW rep | 📡🔋 12:26 | Day 1/13
- Clock should update live
- PromptOS button hover → white text, click → debug menu opens

---

## T6: Final Scene Grade Animation
**Agent:** Patch · **File:** `src/scenes/FinalScene.ts` · **Effort:** ~1 hr

### Current State
FinalScene has: count-up animation for raw rep + final score (1.5s), then rank/flavor/stats/button fade in sequentially. Rank uses `72px` text with color from `RANK_COLORS`.

### Spec

**A) Grade reveal with impact:**
Replace the simple `alpha: 1` tween on `rankText` with a dramatic entrance:

1. Set rankText initial state: `alpha: 0, scaleX: 3, scaleY: 3`
2. When count-up finishes, tween rankText:
   - `alpha: 1, scaleX: 1, scaleY: 1` over 400ms, ease `'Back.easeOut'`
3. On tween complete, play `rep-gain` SFX (for ranks S/A/B) or `rep-loss` SFX (for ranks D/F). Rank C: play `day-complete`.

**B) Camera shake on bad grades:**
- For ranks D and F: after rank reveals, add `this.cameras.main.shake(300, 0.008)`
- For rank F specifically: also flash camera briefly — `this.cameras.main.flash(200, 248, 81, 73)` (the error red from RANK_COLORS.F = #f85149 → rgb 248,81,73)

**C) Celebration for good grades:**
- For ranks S and A: spawn 30 simple particle rectangles that shoot upward from bottom of window and fall with gravity:
  ```ts
  // After rank reveal tween completes:
  for (let i = 0; i < 30; i++) {
    const px = x + Math.random() * width;
    const py = y + height;
    const colors = [0xf2cc60, 0x3fb950, 0x58a6ff, 0xe6edf3]; // gold, green, blue, white
    const particle = this.add.rectangle(px, py, 4, 8, colors[Math.floor(Math.random() * colors.length)]);
    this.window.add(particle);
    this.tweens.add({
      targets: particle,
      y: py - 200 - Math.random() * 200,
      x: px + (Math.random() - 0.5) * 120,
      angle: Math.random() * 360,
      alpha: 0,
      duration: 1200 + Math.random() * 600,
      ease: 'Cubic.easeOut',
    });
  }
  ```

**D) Score count-up sound:**
- During the count-up animation (in `update()`), play a subtle tick sound every ~300ms:
  - Add a `lastTickTime` property, initialized to 0 in `create()`
  - In `update()`, while `isAnimating` is true: if `animProgress - lastTickTime > 300`, play `score-tick` SFX and update `lastTickTime`

### Constraints
- Keep the existing count-up animation timing (1500ms) unchanged
- Keep all text positions and styles unchanged — only add animation properties
- The `Back.easeOut` ease on rank reveal should overshoot slightly then settle (Phaser has this built in)
- Particles should be added to the window container so they clip to the window area

### Test
- Play through to final → score counts up with tick sounds → rank slams in with Back.easeOut
- F rank: shake + red flash
- S/A rank: confetti particles
- B/C rank: normal reveal, no extra effects

---

## Dispatch Notes for Route

- **T1 and T4** can run in parallel (different files, no overlap)
- **T3** should run FIRST or be aware that T2 modifies ClassSelectScene — if running in parallel, T3's ClassSelect changes may conflict with T2's. **Recommendation: run T3 first, then T2.**
- **T5 and T6** can run in parallel (different files)
- **T2** depends on knowing the final `textDim` color from T3. If dispatching together, tell T2 to use `0x9da5b0` for dim text (the new value from T3).

### Suggested dispatch order:
1. **Batch 1:** T3 (Chip), T1 (Patch), T4 (Chip) — T3 first since it's fastest, then T1+T4 parallel
2. **Batch 2:** T2 (Forge), T5 (Patch), T6 (Patch) — all parallel after batch 1 lands

Or if Route can handle it: T3 → then T1+T2+T4+T5+T6 all parallel (T2 just needs to know `textDim` will be `0x9da5b0`).
