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
  { day: 1,  afterPrompts: [2] },             // 1 event  / 4 prompts (Intro training)
  { day: 2,  afterPrompts: [] },              // 0 events / 4 prompts (Let player breathe)
  { day: 3,  afterPrompts: [2] },             // 1 event  / 4 prompts (Reduced interruption)
  { day: 4,  afterPrompts: [2, 3] },          // 2 events / 4 prompts
  { day: 5,  afterPrompts: [2, 3] },          // 2 events / 5 prompts
  { day: 6,  afterPrompts: [2, 3, 4] },       // 3 events / 5 prompts
  { day: 7,  afterPrompts: [2, 3, 4] },       // 3 events / 6 prompts
  { day: 8,  afterPrompts: [2, 4, 6] },       // 3 events / 6 prompts (Meaningful pressure)
  { day: 9,  afterPrompts: [2, 4, 6] },       // 3 events / 7 prompts
  { day: 10, afterPrompts: [2, 4, 6, 8] },    // 4 events / 8 prompts (Increased pressure)
  { day: 11, afterPrompts: [2, 4, 6, 7, 8] }, // 5 events / 8 prompts
  { day: 12, afterPrompts: [2, 4, 6, 7, 8, 9] }, // 6 events / 9 prompts
  { day: 13, afterPrompts: [2, 3, 5, 6, 7, 8, 9, 10] }, // 8 events / 10 prompts (Max pressure)
];
