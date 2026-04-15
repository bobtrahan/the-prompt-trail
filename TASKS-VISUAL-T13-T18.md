# Visual Polish Tasks T13–T18 — Route-Ready Specs

> All tasks are in `~/Developer/gamedevjs-2026/game/`
> Read `~/Developer/gamedevjs-2026/CONTEXT.md` then `~/Developer/gamedevjs-2026/game/src/utils/constants.ts` before writing code.
> Dev server: `cd game && npm run dev` (localhost:5173)
> Every change → `git add . && git commit -m "<description>"`
> Use `runtime: "subagent"` for ALL spawns. forge/patch/chip are SUBAGENTS, not ACP agents.

---

## T13: Window Depth/Shadow
**Agent:** Chip · **File:** `src/ui/Window.ts` · **Effort:** ~20 min

### Current State
Window renders: border rect → background rect → title bar → title text → optional close button. No shadow or depth effect. The `container` holds all elements.

### Spec

Add a shadow rectangle behind every Window instance.

In the constructor, **before** adding the border rect to the container, create a shadow:

```ts
// Shadow — offset dark rect behind everything
const shadow = config.scene.add.rectangle(
  4, 4,  // offset 4px right, 4px down from window origin
  config.width + 2, config.height + 2,
  0x000000
).setOrigin(0).setAlpha(0.3);
this.container.add(shadow);
// Then add border, bg, etc. as before (they'll render on top)
```

The shadow must be the **first** child added to the container so it renders behind everything else.

### Constraints
- Only modify `Window.ts`
- Shadow offset: 4px right, 4px down
- Shadow size: 2px larger than window on each axis
- Alpha: 0.3 (subtle but visible)
- Color: pure black `0x000000`
- Don't change any existing element positions or sizes

### Test
- All windows across all scenes should have a subtle drop shadow
- Shadow should be visible against the dark background (the slight offset creates a 3D feel)

---

## T14: Button Hover/Press States
**Agent:** Chip · **Files:** `src/scenes/BriefingScene.ts`, `src/scenes/NightScene.ts`, `src/scenes/ClassSelectScene.ts`, `src/scenes/PlanningScene.ts` · **Effort:** ~30 min

### Current State
Most buttons have `pointerover`/`pointerout` handlers that change background color or alpha. None have press (pointerdown visual) feedback or tween transitions.

### Spec

Add consistent micro-animation to all interactive buttons across scenes. Create a reusable helper function in a new file:

**A) Create `src/ui/ButtonFx.ts`:**
```ts
import Phaser from 'phaser';

/**
 * Add hover brighten + press darken micro-animations to any interactive game object.
 * Call AFTER setting pointerover/pointerout handlers (this adds additional behavior, doesn't replace).
 */
export function addButtonFx(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject & { setScale: Function; scaleX: number; scaleY: number }
): void {
  target.on('pointerover', () => {
    scene.tweens.add({
      targets: target,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 100,
      ease: 'Power2',
    });
  });

  target.on('pointerout', () => {
    scene.tweens.add({
      targets: target,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Power2',
    });
  });

  target.on('pointerdown', () => {
    scene.tweens.add({
      targets: target,
      scaleX: 0.97,
      scaleY: 0.97,
      duration: 60,
      ease: 'Power2',
      yoyo: true,
    });
  });
}
```

**B) Apply `addButtonFx` to key buttons in these scenes:**

- **BriefingScene.ts** — the `btnBg` ("PLAN YOUR APPROACH" button)
- **NightScene.ts** — `marketBtn`, `bountyBtn`, `sleepBtn`
- **ClassSelectScene.ts** — each class `card` rectangle
- **PlanningScene.ts** — any launch/confirm button (find the main action button)

Import `addButtonFx` and call it after the button is created and has its existing hover handlers. Example:
```ts
import { addButtonFx } from '../ui/ButtonFx';
// ... after creating btnBg and its existing handlers:
addButtonFx(this, btnBg);
```

### Constraints
- Don't remove existing hover handlers — `addButtonFx` adds ADDITIONAL pointerover/out/down listeners
- Scale changes are tiny (1.02 / 0.97) — should feel subtle, not cartoon
- Don't apply to text-only buttons (those without a background rect) — only rect-backed buttons
- If PlanningScene doesn't have an obvious main action button, skip it

### Test
- Hover over any major button → slight scale up
- Click → brief shrink and bounce back
- Existing color changes still work alongside the scale

---

## T15: Scanline Overlay
**Agent:** Chip · **Files:** New `src/ui/Scanlines.ts`, `src/main.ts` · **Effort:** ~25 min

### Current State
No CRT/scanline effect exists. The game renders clean flat rectangles.

### Spec

Add a very subtle scanline overlay across the entire game canvas to enhance the OS/monitor fiction.

**A) Create `src/ui/Scanlines.ts`:**
```ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

/**
 * Draws a full-screen scanline overlay at the highest depth.
 * Call once in any always-active scene or as a global overlay.
 */
export function addScanlines(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  graphics.setDepth(1000); // above everything
  graphics.setAlpha(0.025); // extremely subtle

  // Draw horizontal lines every 2px (alternating)
  graphics.fillStyle(0x000000);
  for (let y = 0; y < GAME_HEIGHT; y += 4) {
    graphics.fillRect(0, y, GAME_WIDTH, 1);
  }
}
```

**B) Apply globally:**

The simplest approach: add scanlines in every scene's `create()` would be wasteful. Instead, add it via a persistent overlay scene.

In `src/main.ts`, after the game is created, add a small overlay scene:

```ts
// After: new Phaser.Game(config);
// Add a persistent scanline overlay scene
class ScanlineScene extends Phaser.Scene {
  constructor() { super({ key: 'Scanlines', active: true }); }
  create() { addScanlines(this); }
}
```

Wait — this requires the scene to be in the scene list. Simpler approach: just add the scanlines call to `BootScene.create()` since it's always the first scene, and create it as a **separate scene that stays active**.

Actually, simplest: Create the ScanlineScene class in `Scanlines.ts`, export it, and add it to the scene array in `main.ts` at the END of the list. Set it to `active: true` in its config so it starts immediately and persists.

```ts
// In Scanlines.ts:
export class ScanlineScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Scanlines', active: true });
  }
  create(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(1000);
    graphics.setAlpha(0.025);
    graphics.fillStyle(0x000000);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      graphics.fillRect(0, y, GAME_WIDTH, 1);
    }
  }
}
```

```ts
// In main.ts, add to the scene array:
import { ScanlineScene } from './ui/Scanlines';
// ... in config.scene array, add at end:
ScanlineScene,
```

### Constraints
- Alpha MUST be 0.025 or lower — this should be barely perceptible
- Lines every 4px (every other pair of pixels)
- Depth 1000 — above all game content including debug menu (depth 999)
- The scene must be `active: true` and never stopped/restarted by other scenes
- Don't use `scene.start('Scanlines')` anywhere — it auto-starts via `active: true`

### Test
- Look very closely at the game → see extremely faint horizontal lines
- Lines should be visible on light-colored elements (buttons, text) but nearly invisible on the dark background
- No performance impact (it's a single static graphics object)

---

## T16: Planning Scene Agent Avatars
**Agent:** Chip · **File:** `src/scenes/PlanningScene.ts` · **Effort:** ~25 min

### Current State
PlanningScene shows agents in the Agent Dashboard as text rows: agent name + description + synergy/clash text. No visual icons or avatars.

### Spec

Add a colored emoji circle before each agent name in the Agent Dashboard panel.

**A) Agent emoji map** (define at top of file or inline):
```ts
const AGENT_EMOJI: Record<string, string> = {
  turbo: '⚡',
  oracle: '🔮',
  gremlin: '👹',
  parrot: '🦜',
  linter: '🔍',
  scope: '🔭',
};
```

**B) For each agent row in the dashboard:**

Find where agent names are rendered (look for a loop over agents). Before each agent name text, add:

1. A small colored circle: `scene.add.circle(x, y, 10, accentColor).setAlpha(0.3)` — using the current class theme accent color
2. The emoji inside the circle: `scene.add.text(x, y, emoji, { fontSize: '14px' }).setOrigin(0.5)`
3. Shift the agent name text 28px to the right to make room

The circle + emoji combo acts as a small avatar. It doesn't need to be pixel-perfect — just add visual anchoring so the agent list isn't pure text.

### Constraints
- Only modify `PlanningScene.ts`
- Use `getTheme(state.playerClass)` for the accent color (should already be imported)
- Don't change agent selection logic or synergy/clash display
- If the agent row layout is too tight, reduce the emoji circle to radius 8
- Add circles and emoji to the same container as the rest of the agent row

### Test
- Planning screen agent dashboard should show colored circles with emoji before each agent name
- Circle color matches the current class theme

---

## T17: Bug Bounty Code Contrast
**Agent:** Patch · **File:** `src/scenes/BugBountyScene.ts` · **Effort:** ~30 min

### Current State
BugBountyScene renders a code grid as the background for the mini-game. The code text is very low contrast against the dark background — nearly unreadable.

### Spec

**A) Increase base code text opacity:**

Find where the code grid text is rendered (look for code-like strings, `fillStyle`, or text objects with very dim colors). Increase the text alpha/color brightness:

- If using alpha: bump from whatever it is to at least `0.15` (from typical `0.05-0.08`)
- If using color hex: change from very dark grays to at least `#2a3040` or `#303846`

**B) Add basic syntax highlighting:**

After the code text is rendered, add colored overlays or replace specific tokens with colored text:

Find the code generation logic and apply these color rules:
- **Keywords** (`const`, `let`, `var`, `function`, `return`, `if`, `else`, `for`, `while`, `import`, `export`, `class`, `new`, `async`, `await`, `try`, `catch`): Use the class accent color at alpha 0.3
- **Strings** (anything in quotes `'...'` or `"..."`): Use `#3fb950` (green) at alpha 0.25
- **Comments** (lines starting with `//`): Use `#484f58` (dim gray) — same as current but slightly brighter than the base code

If the code is rendered as a single text block, this is harder. In that case, just do option A (brightness bump) and add 3-4 small colored "syntax highlight" rectangles at fixed positions in the code grid as decorative accents:
- A green rectangle (4px tall, 60-80px wide) at a random code position — suggests a string
- A blue rectangle (4px tall, 40px wide) at another position — suggests a keyword
- Repeat 2-3 more times at different positions

These are purely decorative — they don't need to align with actual code tokens.

**C) Add subtle grid lines:**

Draw very faint vertical lines every 80px across the code area (like IDE column guides):
- Color: `0x21262d`, alpha `0.3`
- Height: same as the code grid area

### Constraints
- Don't change bug spawn logic, click handling, timer, or scoring
- Don't change the bug chip (IDE error chip) styling — that was done in Phase 5.5 and is working well
- The code contrast increase should make the grid feel like "real code" without being fully readable
- All additions at depth below the bug chips (which need to stay on top)

### Test
- Bug Bounty scene should show noticeably more visible code in the background
- Faint colored syntax hints add visual texture
- Bug chips still clearly visible and clickable on top of the code

---

## T18: Ticker Redesign
**Agent:** Chip · **File:** `src/scenes/BriefingScene.ts` · **Effort:** ~20 min

### Current State
The AI News Ticker in BriefingScene uses a bright white background strip (`0xffffff` or very light) with gold text. The white bar is visually jarring against the dark OS theme.

### Spec

**A) Change ticker band color:**

Find the ticker `band` rectangle (drawn at `bandY` position). Change its fill from the current bright color to a dark semi-transparent style:

```ts
// Was something like:
const band = this.add.rectangle(cx, bandY, ca.width, bandH, 0xffffff).setOrigin(0);
// Change to:
const band = this.add.rectangle(cx, bandY, ca.width, bandH, 0x161b22).setOrigin(0);
band.setStrokeStyle(1, 0x30363d); // subtle border
```

**B) Adjust ticker text color:**

The ticker text color should change from gold-on-white to gold-on-dark:
- Keep the gold color `#d29922` — it reads well on dark backgrounds
- If the text currently uses a dark color (for white bg), switch it to `#d29922`

**C) Add ticker label prefix:**

Before the scrolling text, add a small static "BREAKING:" or "📰" label at the left edge of the ticker band:
```ts
const tickerLabel = this.add.text(
  WIN_X + cx + 4, WIN_Y + bandY + 6,
  '📰',
  { fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0' }
);
win.add(tickerLabel);
```

Adjust the ticker text mask to start after this label (shift the mask's x by ~24px so the scrolling text doesn't overlap the emoji).

### Constraints
- Only modify `BriefingScene.ts`
- Don't change the ticker scroll animation logic (tweens, repeat, speed)
- Don't change headline content or selection
- The ticker band should feel like it belongs to the OS theme, not like a foreign bright strip

### Test
- Ticker should now be dark with gold text — integrated into the OS look
- Small 📰 emoji at the left edge, scrolling text starts after it
- Headlines still scroll smoothly and loop correctly

---

## Dispatch Notes for Route

All tasks are independent — **all 6 can run in parallel**.

| Task | Agent | Runtime | File(s) |
|------|-------|---------|---------|
| T13 | chip | subagent | `src/ui/Window.ts` |
| T14 | chip | subagent | New `src/ui/ButtonFx.ts` + 4 scenes |
| T15 | chip | subagent | New `src/ui/Scanlines.ts` + `src/main.ts` |
| T16 | chip | subagent | `src/scenes/PlanningScene.ts` |
| T17 | patch | subagent | `src/scenes/BugBountyScene.ts` |
| T18 | chip | subagent | `src/scenes/BriefingScene.ts` |

⚠️ T14 and T18 both touch BriefingScene.ts. If dispatching in parallel, T14 adds `addButtonFx(this, btnBg)` near the button, while T18 modifies the ticker band higher up. Low conflict risk but flag it.

**CRITICAL REMINDER FOR ROUTE:** Use `runtime: "subagent"` and `agentId: "chip"` or `agentId: "patch"`. These are NOT ACP agents.
