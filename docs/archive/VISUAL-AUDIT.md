# Visual Audit — The Prompt Trail
> Conducted Apr 15, 2026. All 11 scenes screenshotted via Puppeteer + Phaser scene jumps.
> Screenshots in `audit-screenshots/A01-A10*.png`

---

## Executive Summary

The PromptOS fake-OS concept is **immediately distinctive** — nobody else at this jam will do it. The dark-mode terminal aesthetic is coherent across all scenes. But the visuals currently read as **competent functional UI** rather than **graphics showcase**. For a jam judged on Graphics, we need to push from "clean" to "impressive."

**Three big gaps:**
1. **Too flat / too much dead space** — screens are mostly dark rectangles with small text
2. **Weak class differentiation** — accent color changes but nothing else
3. **Static feel** — little visible motion, feedback, or state change

**The good news:** All fixes are CSS/code-level — no art assets needed. This is a UI game and the improvements are all within our "rectangles + text" wheelhouse.

---

## Screen-by-Screen Findings

### 1. Boot Scene
- Currently just transitions to Title. No visible boot sequence.
- **Missed opportunity:** A fake POST/BIOS boot sequence would instantly sell the OS fiction and score Graphics points.

### 2. Title Screen
- Clean, atmospheric, minimal.
- **Issues:** Start prompt too faint; footer too dim; no OS artifacts (no cursor, no window chrome, no boot residue).
- **Good:** Title typography is strong and memorable.

### 3. Class Select ("User Setup")
- 4 cards, clean layout, functional.
- **Issues:** Cards all look identical structurally; no class-specific color/icon/visual identity; stats text too small and low-contrast; no selection highlight or hover state visible; big empty space above/below cards; no confirm button emphasis.
- **Critical:** This is where class identity should be STRONGEST visually.

### 4. Briefing ("Daily Digest")
- Best OS fiction so far — window chrome, taskbar, news ticker, status bar.
- **Issues:** Huge empty lower half; ticker bar too bright/disconnected; difficulty label barely visible; resource row compressed; project description panel flat.
- **Good:** Window frame + taskbar sell the desktop OS.

### 5. Planning
- Two-column: Strategy Picker + Model/Agent Dashboard. Good information density.
- **Issues:** Right panel visually busy but cramped; locked items understated; bottom prompt too faint; no visual weight on "Launch" action; agent list lacks icons/avatars.
- **Good:** Best layout complexity — feels like a real internal tool.

### 6. Execution
- Core gameplay screen. Terminal + Agent Manager + System Monitor + Taskbar.
- **Issues:** Agent Manager panel looks empty; terminal dead space too large; "START TYPING" prompt not dominant enough; strategy/model state indicators too subtle; no visible typing animation or code generation.
- **Good:** Multi-panel desktop layout is strong; OS fiction at its peak.

### 7. Results
- Centered modal dialog.
- **Issues:** Modal too small for canvas; no performance breakdown (just day-complete text); huge empty background; feels like a transition, not a reward moment; no animation.
- **Missed opportunity:** Should show score breakdown, budget change, reputation gained.

### 8. Night Hub
- Centered dialog with 3 choices (Token Market, Bug Bounty, Sleep).
- **Issues:** Same sparse modal feel; background is featureless void; "sleeping office" fiction is text-only, not visual.
- **Good:** Copy is atmospheric ("Your agents are sleeping. Your hardware hums in the dark.")

### 9. Token Market
- Shop window with tabs + item list + buy buttons.
- **Issues:** Item descriptions too small; tab active state weak; lower half empty; no item detail pane; no affordability indicators; no class-specific pricing cues; items all look the same.
- **Good:** Green buy buttons pop; structure is clear.

### 10. Bug Bounty
- Code grid mini-game with bug targets.
- **Issues:** Code way too low-contrast; gameplay area feels empty; bug chip styles (from the polish pass) may not be visible enough in static screenshot; combo counter/effects not captured in still.
- **Good:** The concept is strong; IDE-within-OS is great fiction.

### 11. Final Scene
- Score report with grade letter.
- **Issues:** Too sparse for a climax; grade letter dominates but nothing else rises to meet it; no animated reveal; stats summary too faint; class identity text-only; no replay hook visual.
- **Good:** Giant grade letter is memorable; breakdown structure is readable.

---

## Prioritized Improvement Plan

### 🔴 Tier 1: High Impact, Low Effort (1-2 hours each)
*These will visibly improve Graphics scores with minimal code.*

| # | Task | Screen(s) | What to do | Agent |
|---|------|-----------|------------|-------|
| T1 | **Boot sequence** | Boot | Add fake POST text, loading bar, PromptOS splash with version number. 3-5 seconds of scrolling system messages before title. | Patch |
| T2 | **Class card visual identity** | ClassSelect | Add class emoji/icon, unique border color per class, subtle gradient or pattern fill per card. Selection state = glow + scale. | Forge |
| T3 | **Increase global text contrast** | All | Bump `textDim` from `0x8b949e` to `0xa0adb8`. Bump description font sizes from 11-12px to 13-14px across all scenes. | Chip |
| T4 | **Title screen cursor blink + OS artifacts** | Title | Add blinking cursor on "press any key" line. Add faint "PromptOS v1.0.13" version text. Subtle fade-in animation on title. | Chip |
| T5 | **Taskbar enrichment** | All (post-Boot) | Add 2-3 fake system tray icons (wifi, battery, clock with real time). Make PromptOS menu icon look clickable. | Patch |
| T6 | **Final scene grade animation** | Final | Glitch/stamp effect on grade reveal. Screen shake for F. Confetti for S/A. Delay grade 1s after score. | Patch |

### 🟡 Tier 2: High Impact, Medium Effort (2-4 hours each)
*Significant visual improvement, touches multiple files.*

| # | Task | Screen(s) | What to do | Agent |
|---|------|-----------|------------|-------|
| T7 | **Desktop wallpaper per class** | All (post-ClassSelect) | Generate or code 4 subtle wallpaper patterns (not images — procedural Phaser graphics). Tech Bro = circuit traces, Indie = mountain silhouette, Student = notebook grid, Corp = gray pinstripe. Visible behind windows. | Forge |
| T8 | **Briefing scene density** | Briefing | Use empty lower half: add project difficulty visualization (risk meter or star rating), expected events preview, "recommended loadout" hint. | Forge |
| T9 | **Execution panels enrichment** | Execution | Agent Manager: show agent name + trait + small activity indicator for each assigned agent. System Monitor: add animated bars for CPU/Memory/API usage. | Forge |
| T10 | **Token Market item detail pane** | TokenMarket | When hovering/clicking an item, show expanded detail panel below the list with full description, stats effect, and class compatibility. Color-code affordability (green/yellow/red). | Forge |
| T11 | **Results scene overhaul** | Results | Replace sparse modal with full window: animated score breakdown (count-up numbers), budget delta, reputation gained, accuracy %, vibe code %, day rating. | Forge |
| T12 | **Night scene atmosphere** | Night | Add faint desktop wallpaper visible behind modal. Subtle animated elements: blinking cursor somewhere, faint monitor glow rectangle, maybe one "process running" indicator. | Patch |

### 🟢 Tier 3: Medium Impact, Polish Details (1-2 hours each)
*Refinements that add texture and professionalism.*

| # | Task | Screen(s) | What to do | Agent |
|---|------|-----------|------------|-------|
| T13 | **Window depth/shadow** | All | Add 2px soft shadow behind all Window instances (dark semi-transparent rect offset 3px down/right). | Chip |
| T14 | **Button hover/press states** | All | All interactive buttons: brighten 10% on hover, darken 5% on press, 100ms tween. | Chip |
| T15 | **Scanline overlay (subtle)** | All | Optional: very faint horizontal scanline pattern overlay (2% opacity) on the game canvas. CRT fiction enhancer. Toggle-able. | Chip |
| T16 | **Planning scene agent avatars** | Planning | Add small colored circle or emoji icon per agent in the Agent Dashboard. Visual anchors for quick identification. | Chip |
| T17 | **Bug Bounty code contrast** | BugBounty | Increase code text opacity/brightness. Add faint syntax highlighting (keywords in accent color, strings in green, comments in dim). | Patch |
| T18 | **Ticker redesign** | Briefing | Make ticker strip semi-transparent dark instead of bright white. Gold text on dark = better integration with OS theme. | Chip |

### ⚪ Tier 4: Stretch / If Time Permits
| # | Task | Notes |
|---|------|-------|
| T19 | **Typing animation in terminal** | Show code appearing character-by-character during execution, not just prompt |
| T20 | **Notification toasts** | Fake OS notifications that slide in from top-right during gameplay |
| T21 | **Window minimize/maximize animation** | Brief scale tween when scenes transition between windows |
| T22 | **Startup sound + boot text sync** | Coordinate boot chime SFX with the POST sequence from T1 |

---

## Vision Framework Reference

Each screen was evaluated on these axes:
- **Layout:** Spacing, alignment, use of space, composition
- **Typography:** Font choices, sizes, readability, hierarchy
- **Color:** Palette coherence, contrast ratios, accent usage
- **Visual Hierarchy:** What draws the eye, information flow
- **OS Fiction:** How well it sells the fake desktop concept
- **Class Theming:** Visual differentiation per player class
- **Polish:** Animations, transitions, hover states, micro-interactions

---

## Recommended Execution Order

**Tonight (Apr 15 early AM):** T1, T3, T4, T6 — quick wins, high visibility
**Tomorrow AM:** T2, T5, T11 — class identity + key scene overhauls
**Tomorrow PM:** T7, T8, T9, T10 — depth and density
**Polish pass:** T13-T18 — refinement layer

Total estimated effort: ~30-40 hours of agent work, parallelizable across 3-4 agents.

---

## Files Modified by This Audit
- `game/src/main.ts` — temporarily modified to expose Phaser game instance for screenshots, **reverted**
- No game code was changed permanently
