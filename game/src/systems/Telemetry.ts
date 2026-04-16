import { DEV_CONFIG } from '../utils/devConfig';
import type { GameState } from './GameState';
import type { FinalScore } from './ScoringSystem';
import type { DayScore } from './ScoringSystem';
import AudioManager from './AudioManager';

// ─── Exported Types ───────────────────────────────────────────────────────────

export interface EventLog {
  id: string;
  choiceIndex: number;
  effects: string[];
}

export interface DaySnapshot {
  timestamp: string; // ISO
  day: number;
  playerClass: string;
  strategy: string;
  model: string;
  bugHuntMode: 'ai' | 'oldschool';
  agents: string[];
  progress: number; // 0-100
  accuracy: number; // 0-1
  timerBonusSeconds: number;
  baseRep: number;
  accuracyBonus: number;
  strategyBonus: number;
  overtimeBonus: number;
  totalRep: number;
  budgetStart: number;
  budgetEnd: number;
  hardwareStart: number;
  hardwareEnd: number;
  events: EventLog[];
  earlyFinishPath: 'bugHunt' | 'overtime' | 'none';
  overtimePromptsCompleted: number;
  bugBountyEarnings: number;
  bugsSquashed: number;
  shotsFired: number;
  shotsHit: number;
  musicTrack: string | null;
  audioMuted: boolean;
  sfxVolume: number;
  musicVolume: number;
  consumablesUsed: string[];
}

export interface RunLog {
  startedAt: string;
  endedAt: string;
  playerClass: string;
  finalScore: number;
  rank: string;
  classMultiplier: number;
  totalPlaytimeMs: number;
  days: DaySnapshot[];
  budgetTrajectory: number[];
  worstDay: { day: number; progress: number };
}

// ─── Private Module State ─────────────────────────────────────────────────────

let currentRun: Partial<RunLog> = {};
let currentDayEvents: EventLog[] = [];
let dayStartBudget = 0;
let dayStartHardware = 0;
let runStartTime = 0;

function createBlankSnapshot(
  state: GameState,
  dayScore: DayScore,
  earlyFinishPath: 'bugHunt' | 'overtime' | 'none',
  overtimeBonus: number,
  overtimePromptsCompleted: number
): DaySnapshot {
  const audio = AudioManager.getInstance();

  return {
    timestamp: new Date().toISOString(),
    day: state.day,
    playerClass: state.playerClass ?? 'unknown',
    strategy: state.strategy ?? 'unknown',
    model: state.model,
    bugHuntMode: 'ai',
    agents: [...state.activeAgents],
    progress: state.lastDayResult?.progress ?? 0,
    accuracy: state.lastDayResult?.accuracy ?? 0,
    timerBonusSeconds: state.timerBonusSeconds,
    baseRep: dayScore.baseRep,
    accuracyBonus: dayScore.accuracyBonus,
    strategyBonus: dayScore.strategyBonus,
    overtimeBonus,
    overtimePromptsCompleted,
    totalRep: dayScore.total,
    budgetStart: dayStartBudget,
    budgetEnd: state.budget,
    hardwareStart: dayStartHardware,
    hardwareEnd: state.hardwareHp,
    events: [...currentDayEvents],
    earlyFinishPath,
    bugBountyEarnings: 0,
    bugsSquashed: 0,
    shotsFired: 0,
    shotsHit: 0,
    musicTrack: audio.currentTrack,
    audioMuted: audio.isMuted,
    sfxVolume: audio.sfxVolume,
    musicVolume: audio.musicVolume,
    consumablesUsed: [...state.consumablesUsedToday],
  };
}

// ─── Telemetry Class ──────────────────────────────────────────────────────────

export class Telemetry {
  /** Initialize a new run. Call at the start of a new game. */
  static logRunStart(state: GameState): void {
    if (!DEV_CONFIG.telemetry) return;

    runStartTime = Date.now();
    currentRun = {
      startedAt: new Date().toISOString(),
      playerClass: state.playerClass ?? 'unknown',
      days: [],
      budgetTrajectory: [],
    };
    currentDayEvents = [];
  }

  /** Snapshot budget/hardware at day start. */
  static logDayStart(state: GameState): void {
    if (!DEV_CONFIG.telemetry) return;

    dayStartBudget = state.budget;
    dayStartHardware = state.hardwareHp;
    currentDayEvents = [];
  }

  /** Record a player event choice. */
  static logEvent(eventId: string, choiceIndex: number, effects: string[]): void {
    if (!DEV_CONFIG.telemetry) return;

    currentDayEvents.push({ id: eventId, choiceIndex, effects });
  }

  /**
   * Finalize the day snapshot and fire-and-forget POST to /__telemetry/day.
   * overtimeBonus defaults to 0 if not in dayScore (not currently part of DayScore type).
   */
  static logDayEnd(
    state: GameState,
    dayScore: DayScore,
    earlyFinishPath: 'bugHunt' | 'overtime' | 'none',
    overtimeBonus: number = 0,
    overtimePromptsCompleted: number = 0
  ): void {
    if (!DEV_CONFIG.telemetry) return;

    const snapshot = createBlankSnapshot(
      state,
      dayScore,
      earlyFinishPath,
      overtimeBonus,
      overtimePromptsCompleted
    );

    (currentRun.days ??= []).push(snapshot);
    (currentRun.budgetTrajectory ??= []).push(state.budget);

    fetch('/__telemetry/day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    }).catch(() => {});
  }

  /** Update the most recent day snapshot with bug bounty results and re-POST. */
  static patchBugBounty(
    earnings: number,
    bugsSquashed: number,
    mode?: 'ai' | 'oldschool',
    shotsFired?: number,
    shotsHit?: number
  ): void {
    if (!DEV_CONFIG.telemetry) return;

    const days = currentRun.days;
    if (!days || days.length === 0) return;

    const last = days[days.length - 1];
    last.bugBountyEarnings = earnings;
    last.bugsSquashed = bugsSquashed;
    if (mode !== undefined) last.bugHuntMode = mode;
    if (shotsFired !== undefined) last.shotsFired = shotsFired;
    if (shotsHit !== undefined) last.shotsHit = shotsHit;

    fetch('/__telemetry/day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(last),
    }).catch(() => {});
  }

  /** Finalize the run, POST to /__telemetry/run, expose on window. */
  static logRunEnd(state: GameState, finalScoreData: FinalScore): void {
    if (!DEV_CONFIG.telemetry) return;

    const endedAt = new Date().toISOString();
    const totalPlaytimeMs = Date.now() - runStartTime;

    const days = currentRun.days ?? [];
    let worstDay = { day: 1, progress: 100 };
    for (const d of days) {
      if (d.progress < worstDay.progress) {
        worstDay = { day: d.day, progress: d.progress };
      }
    }

    const runLog: RunLog = {
      startedAt: currentRun.startedAt ?? endedAt,
      endedAt,
      playerClass: state.playerClass ?? 'unknown',
      finalScore: finalScoreData.finalScore,
      rank: finalScoreData.rank,
      classMultiplier: finalScoreData.multiplier,
      totalPlaytimeMs,
      days,
      budgetTrajectory: currentRun.budgetTrajectory ?? [],
      worstDay,
    };

    window.__TELEMETRY = runLog;

    // Store finalized run
    currentRun = runLog;

    fetch('/__telemetry/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runLog),
    }).catch(() => {});
  }

  /** Return the current (possibly partial) run log. */
  static getRunLog(): Partial<RunLog> | null {
    if (!currentRun.startedAt) return null;
    return currentRun;
  }

  /**
   * Trigger a browser file download of the current RunLog as JSON.
   * Filename: prompt-trail-{class}-{rank}-{date}.json
   */
  static downloadJson(): void {
    if (!DEV_CONFIG.telemetry) return;

    const runLog = Telemetry.getRunLog();
    if (!runLog) return;

    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const rank = runLog.rank ?? 'X';
    const cls = runLog.playerClass ?? 'unknown';
    const filename = `prompt-trail-${cls}-${rank}-${dateStr}.json`;

    const blob = new Blob([JSON.stringify(runLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }
}
