/**
 * Prompt-count-triggered event schedule.
 *
 * Each entry maps a day to the prompt indices (1-based) after which
 * an event fires. E.g. [2, 3] means an event fires after the player
 * completes prompt 2 and again after prompt 3.
 *
 * Design rules:
 *  - Prompt 2 always triggers an event (consistent player training)
 *  - Event count scales with day difficulty: 1 (easy) → 6 (hard)
 *  - Later days space events further apart as prompts get longer
 */

export interface DayEventSchedule {
  day: number;
  afterPrompts: number[];
}

export const EVENT_SCHEDULE: DayEventSchedule[] = [
  // ── Forgiving (Days 1–3): learn the loop, minimal interruption ──────────────
  { day: 1,  afterPrompts: [2] },              // 1 event  / 4 prompts — teaches event mechanic
  { day: 2,  afterPrompts: [] },               // 0 events / 4 prompts — breathing room
  { day: 3,  afterPrompts: [3] },              // 1 event  / 4 prompts — late, after player settles

  // ── Teaching Pressure (Days 4–7): ramp up cadence and consequence ───────────
  { day: 4,  afterPrompts: [3] },              // 1 event  / 4 prompts — gentle intro to pressure
  { day: 5,  afterPrompts: [2, 4] },           // 2 events / 5 prompts — multi-event rhythm
  { day: 6,  afterPrompts: [2, 3, 5] },        // 3 events / 5 prompts — every other prompt
  { day: 7,  afterPrompts: [2, 4, 5] },        // 3 events / 6 prompts — clustered at end

  // ── Competent Typing Required (Days 8–13): survive or fail ──────────────────
  { day: 8,  afterPrompts: [2, 3, 5] },        // 3 events / 6 prompts — early burst
  { day: 9,  afterPrompts: [2, 4, 5, 7] },     // 4 events / 7 prompts — relentless
  { day: 10, afterPrompts: [2, 3, 5, 7, 8] },  // 5 events / 8 prompts — clustered + spread
  { day: 11, afterPrompts: [2, 4, 5, 6, 8] },  // 5 events / 8 prompts — grind
  { day: 12, afterPrompts: [2, 4, 6, 8, 9] }, // 5 events / 9 prompts — reduced late-game density
  { day: 13, afterPrompts: [2, 3, 5, 6, 8, 9, 10] }, // 7 events / 10 prompts — reduced late-game density
];
