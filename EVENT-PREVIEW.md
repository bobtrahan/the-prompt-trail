# Event Choice Visual Preview — Design Spec

## Context

Event choice buttons now show text hints like `(−$50, +15 rep)` (landed in commit `809cb16`). This follow-up adds a **live visual preview** — hovering a choice animates the actual resource bars/counters to show projected impact before the player commits.

## Behavior

When the player **hovers** a choice button in the event modal:

1. **Resource counters** flash to projected values:
   - Budget: `$450` → shows `$400` with the delta in red (`−$50`)
   - Reputation: `120` → shows `135` with the delta in green (`+15`)
   - Use the existing text objects (`budgetText`, `repText`, etc.)

2. **HP bar** animates to projected value:
   - Loss: bar shrinks, the lost segment is red overlay
   - Gain: bar grows, the gained segment is green overlay
   - Use the existing `hwBar` / `hwBarBg` rectangles

3. **Time bar** (if `time` effect):
   - Show projected loss as a red segment at the end of the timer bar

4. **All previews are non-destructive** — state is NOT modified. Only visuals change.

When the player **un-hovers** (pointerout):
- All counters/bars snap back to current actual values
- No animation on restore (instant snap-back to avoid jank)

When the player **clicks** a choice:
- Normal event resolution applies (state is modified for real)
- Preview visuals become the new actual state

## Visual Treatment

- **Negative effects:** Red tint (`#f85149`)
  - Counters: show projected value in red, with `↓` indicator
  - Bars: red overlay on the lost segment
- **Positive effects:** Green tint (`#3fb950`)
  - Counters: show projected value in green, with `↑` indicator  
  - Bars: green overlay on the gained segment
- **Neutral/flag effects:** No visual change (same as current — hidden)

## Example

Player has $500, 80 HP, 100 rep. Hovers "[2] Emergency server migration (−$100, −10 HP, +20 rep)":

- Budget text: `$500` → `$400 ↓` (red)
- HP bar: shrinks 10%, lost segment shown in red
- Rep text: `100` → `120 ↑` (green)

Mouse leaves the button → everything snaps back to $500 / 80 HP / 100 rep.

## Technical Approach

In `ExecutionScene.showEventModal()`:

1. Store current resource values at modal open time (snapshot for restore)
2. On each choice button `pointerover`:
   - Parse the choice's `effects` array
   - For each visible effect, update the corresponding display element to preview state
   - Apply color treatment (red/green)
3. On `pointerout`:
   - Restore all display elements to snapshot values
   - Reset colors to default
4. On choice selection (existing `resolveEvent`):
   - Normal flow applies, state mutates, displays update naturally

### Key constraint:
- The resource text objects and bar rectangles are already class fields on `ExecutionScene` (`budgetText`, `hardwareText`, `repText`, `hwBar`). The preview just temporarily changes their `.text` and `.style.color` / fill.
- Must handle the case where the modal is dismissed by countdown auto-resolve (restore to actual values).

## Files Modified
- `src/scenes/ExecutionScene.ts` — hover handlers on choice buttons, snapshot/restore logic

## Task Sizing
- **Agent:** Vlad (state management, multiple display elements, hover lifecycle)
- **Effort:** Medium
- **Dependencies:** None (text hints already landed)
