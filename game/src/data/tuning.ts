/**
 * TUNING.ts
 * Centralized game balance constants and onboarding copy.
 */

export const TUNING = {
  // ─── Day & Execution Tuning ───────────────────────────────────────────
  TOTAL_DAYS: 13,
  
  // Base execution timer (seconds)
  BASE_TIMER_SECONDS: 45,
  CORP_TIMER_SECONDS: 22,
  
  // Event read window (seconds) — how long players have to choose before auto-dismiss
  EVENT_READ_WINDOW_SEC: 10,
  
  // How often random events can trigger (ms) — though mostly prompt-triggered now
  EVENT_INTERVAL_MS: 9000,
  
  // Overtime bonus reputation per prompt completed
  OVERTIME_REP_PER_PROMPT: 3,
  
  // Initial typo forgiveness count
  INITIAL_TYPO_FORGIVENESS: 0,

  // ─── Bug Bounty / Hunt Tuning ─────────────────────────────────────────
  BUG_BOUNTY: {
    DURATION_MS: 30000,
    SPAWN_INTERVAL_MS: 1500,
    MAX_BUGS: 5,
    DESPAWN_WARN_MS: 1500,
    ESCAPED_PENALTY_USD: 5,
    COMBO_STEP: 0.25,
  },
  
  BUG_HUNT: {
    DURATION_MS: 30000,
    SPAWN_INTERVAL_MS: 3000,
    MAX_BUGS: 6,
    DESPAWN_WARN_MS: 1500,
    PLAYER_SPEED: 150,
    BULLET_SPEED: 600,
    OLD_SCHOOL_MULTIPLIER: 1.5,
    AMMO_MAX: 10,
    AMMO_REGEN_MS: 3000,
    
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
