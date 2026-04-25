/**
 * TUNING.ts
 * Centralized game balance constants and onboarding copy.
 */

export const TUNING = {
  // ─── Day & Execution Tuning ───────────────────────────────────────────
  TOTAL_DAYS: 13,
  
  // Base execution timer (seconds) — used as fallback
  BASE_TIMER_SECONDS: 45,
  CORP_TIMER_SECONDS: 22,

  // Per-day base timer (seconds). Difficulty curve:
  //   Days 1-3  → generous (players learn the loop)
  //   Days 4-7  → moderate (teaching pressure)
  //   Days 8-13 → tight   (competent typing required)
  // Corporate Dev always gets ~49% of these values (see CORP_TIMER_RATIO).
  TIMER_BY_DAY: {
    1: 40, 2: 40, 3: 38,           // tutorial — generous
    4: 42,                          // easy — first real prompts
    5: 50, 6: 50,                   // moderate — pressure building
    7: 60, 8: 55,                   // pressure — tight for 60 WPM
    9: 65, 10: 88,                  // hard — need good typing
    11: 110, 12: 120,               // brutal — every second counts
    13: 60,                         // impossible (intentional) — dramatic wall
  } as Record<number, number>,

  // Corporate Dev timer ratio (relative to base-day timer)
  CORP_TIMER_RATIO: 0.49,

  // Typo forgiveness granted by day (0 = no forgiveness).
  // Note: hw-keyboard consumable always grants 1 regardless.
  TYPO_FORGIVENESS_BY_DAY: {
    1: 2, 2: 2, 3: 1,   // forgiving early days
    4: 1, 5: 1, 6: 0, 7: 0,
    8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0,
  } as Record<number, number>,

  // Event read window (seconds) — how long players have to choose before auto-dismiss
  EVENT_READ_WINDOW_SEC: 10,

  // Day-scaled event countdowns (more generous early to teach the system)
  EVENT_READ_WINDOW_BY_DAY: {
    1: 22, 2: 20, 3: 20,           // generous
    4: 15, 5: 14, 6: 13, 7: 12,   // moderate
    8: 10, 9: 9, 10: 8,            // pressure
    11: 7, 12: 6, 13: 6,           // sharp
  } as Record<number, number>,
  
  // How often random events can trigger (ms) — though mostly prompt-triggered now
  EVENT_INTERVAL_MS: 9000,
  
  // Overtime bonus reputation per prompt completed
  OVERTIME_REP_PER_PROMPT: 5,
  
  // Initial typo forgiveness count
  INITIAL_TYPO_FORGIVENESS: 0,

  // ─── Bug Bounty / Hunt Tuning ─────────────────────────────────────────
  BUG_BOUNTY: {
    DURATION_MS: 30000,
    SPAWN_INTERVAL_MS: 1200,
    MAX_BUGS: 8,
    DESPAWN_WARN_MS: 1500,
    ESCAPED_PENALTY_USD: 2,
    COMBO_STEP: 0.2,
  },
  
  BUG_HUNT: {
    DURATION_MS: 30000,
    SPAWN_INTERVAL_MS: 2500,
    MAX_BUGS: 6,
    DESPAWN_WARN_MS: 1500,
    PLAYER_SPEED: 180,
    BULLET_SPEED: 700,
    OLD_SCHOOL_MULTIPLIER: 1.5,
    COMBO_STEP: 0.4,
    AMMO_MAX: 12,
    AMMO_REGEN_MS: 2500,
    
    // Bug speeds (px/sec)
    SPEEDS: {
      syntax: 60,
      logic: 120,
      race: 300,
      memleak: 40,
      heisen: 80,
    }
  },

  // ─── Onboarding & UI Copy ────────────────────────────────────────────
  COPY: {
    START_TYPING_PROMPT: '⌨️  START TYPING TO BUILD  ⌨️',
    PROJECT_COMPLETE_TITLE: '✅ Project Complete!',
    PROJECT_COMPLETE_BODY: 'You finished early. What now?',
    OVERTIME_LABEL: 'Production ♙:',
    TIME_EXPIRED_TITLE: "Time's up!",
  }
};
