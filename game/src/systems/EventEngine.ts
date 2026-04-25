import type { GameState } from './GameState';
import type { EventDef, EventChoice, EventEffect } from '../data/events';
import { EVENTS } from '../data/events';
import { BASE_TIMER_SECONDS } from '../utils/constants';
import { ROLL_RESOLUTIONS } from '../data/rollResolutions';

export class EventEngine {
  private state: GameState;
  private firedHistory: Map<string, number[]>; // eventId -> days fired

  constructor(state: GameState) {
    this.state = state;
    this.firedHistory = new Map();
  }

  /**
   * Select the next event to fire, respecting queued chain events, day range, class filters, cooldowns, and suppression flags.
   * @returns The selected EventDef (with class variant applied if applicable), or null if no eligible events exist.
   */
  selectEvent(): EventDef | null {
    // Queued chain event takes priority over all normal selection logic
    if (this.state.queuedEvent) {
      const queued = EVENTS.find(e => e.id === this.state.queuedEvent);
      this.state.queuedEvent = null;
      if (queued) return queued;
    }

    const { day, playerClass, localSlots, eventFlags } = this.state;

    const eligible: Array<{ event: EventDef; weight: number }> = [];

    for (const event of EVENTS) {
      // Duck protection: if an event with 'agent_stuck' or 'stuck' is about to fire and we have duck
      // wait, selectEvent just returns the event. The auto-resolve happens in ExecutionScene when fireEvent is called?
      // No, spec says: "When an event with id containing 'agent_stuck' or 'stuck' fires: if GameState.hasDuckProtection === true, auto-select the first choice, show notification '🦆 Rubber Duck resolved the issue!', and set hasDuckProtection = false"
      // This logic should probably be in ExecutionScene.ts where showEventModal is called, 
      // OR I can handle it here by returning a modified event or something.
      // Better to handle in ExecutionScene.ts to manage the UI/notification.

      // chain-queued events only fire via queuedEvent, never via normal weighting
      if (event.tags.includes('chain-queued')) continue;

      // dayRange filter
      if (day < event.dayRange[0] || day > event.dayRange[1]) continue;

      // classFilter — tags may include class names to restrict the event
      const classTags = ['techBro', 'indieHacker', 'collegeStudent', 'corporateDev'];
      const classRestrictions = event.tags.filter(t => classTags.includes(t));
      if (classRestrictions.length > 0 && playerClass && !classRestrictions.includes(playerClass)) continue;

      // tagFilter — requiresCloud / requiresLocal
      const cloudFrozen = !!eventFlags['cloud-access-frozen'];
      if (event.tags.includes('requiresCloud') && cloudFrozen) continue;
      if (event.tags.includes('requiresLocal') && localSlots <= 0) continue;
      // requiresCloud events don't make sense without internet; if exclusively local setup skip
      // (local-only check: if player has localSlots but no cloud — we don't block cloud events
      // by default since most players have cloud access unless frozen)

      // chainFilter
      if (event.chainFrom && !eventFlags[event.chainFrom]) continue;

      // cooldownFilter
      const fired = this.firedHistory.get(event.id) ?? [];
      if (event.cooldown) {
        const lastFired = fired.length > 0 ? Math.max(...fired) : -Infinity;
        if (day - lastFired < event.cooldown) continue;
      }

      // Flag-based event blocks
      if (eventFlags['liquid-nitrogen'] && event.id === 'hardware-overheating') continue;
      if (eventFlags['ups-installed'] && event.id === 'power-flickered') continue;

      // Hardware immunity/reduction
      const owned = this.state.ownedUpgrades;
      if (owned.includes('hw-ups') && event.id.includes('power')) continue;
      if (owned.includes('hw-cooling') && event.id.includes('overheat')) continue;

      // Weight adjustment: recently fired in last 3 days → ×0.3
      let weight = event.weight;

      if (owned.includes('hw-ram') && event.id.includes('context')) {
        weight *= 0.5;
      }

      const recentlyFired = fired.some(d => day - d <= 3 && day - d > 0);
      if (recentlyFired) weight *= 0.3;

      eligible.push({ event, weight });
    }

    if (eligible.length === 0) return null;

    // Weighted random pick
    const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let picked: EventDef | null = null;
    for (const { event, weight } of eligible) {
      roll -= weight;
      if (roll <= 0) {
        picked = event;
        break;
      }
    }
    // Fallback (floating point edge case)
    if (!picked) picked = eligible[eligible.length - 1].event;

    // Apply class variant if one exists for playerClass
    if (playerClass && picked.classVariants?.[playerClass]) {
      const variant = picked.classVariants[playerClass]!;
      picked = { ...picked, ...variant };
    }

    return picked;
  }

  /**
   * Apply all effects from a player's event choice to game state, handling rolls, backup protection, and chain queuing.
   * @param choice The choice the player made, including its effects array.
   * @param state Mutable game state modified in place (budget, hardware, reputation, flags, etc.).
   * @returns Array of human-readable log lines describing what happened.
   */
  applyEffects(choice: EventChoice, state: GameState): string[] {
    const logs: string[] = [];

    // Check for roll flags — if present, resolve the gamble and replace
    // the deterministic companion effects with the roll outcome
    let effects: EventEffect[] = [...choice.effects];
    const rollFlags = effects.filter(e => e.type === 'flag' && ROLL_RESOLUTIONS[e.value as string]);
    if (rollFlags.length > 0) {
      // Take the first roll flag (one gamble per choice)
      const rollFlag = rollFlags[0];
      const resolution = ROLL_RESOLUTIONS[rollFlag.value as string];
      const won = Math.random() < resolution.chance;
      const outcome = won ? resolution.good : resolution.bad;

      // Strip all non-flag effects (the deterministic ones Boris added)
      // Keep only flags + replace with roll outcome effects
      effects = effects.filter(e => e.type === 'flag');
      effects.push(...outcome.effects);
      if (outcome.log) logs.push(outcome.log);
    }

    // Backup protection
    const causesLoss = effects.some(e =>
      (e.type === 'budget' && (e.value as number) < 0) ||
      (e.type === 'hardware' && (e.value as number) < 0) ||
      (e.type === 'reputation' && (e.value as number) < 0) ||
      (e.type === 'time' && (e.value as number) < 0) ||
      (e.type === 'flag' && (e.value === 'lose-progress-all' || e.value === 'lose-progress-chunk'))
    );

    if (causesLoss && state.hasBackupProtection) {
      state.hasBackupProtection = false;
      logs.push('☁️ Cloud Backup protected your progress! (Consequences skipped)');
      return logs;
    }

    for (const effect of effects) {
      switch (effect.type) {
        case 'budget': {
          const amount = effect.value as number;
          state.budget += amount;
          if (amount >= 0) {
            logs.push(`> BUDGET +$${amount} → $${state.budget}`);
          } else {
            logs.push(`> BUDGET -$${Math.abs(amount)} → $${state.budget}`);
          }
          break;
        }

        case 'time': {
          // 1 time unit ≈ 3 seconds
          const units = effect.value as number;
          const seconds = units * 3;
          state.timerBonusSeconds += seconds;
          logs.push(`> TIMER ${seconds >= 0 ? '+' : ''}${seconds}s`);
          break;
        }

        case 'hardware': {
          let amount = effect.value as number;
          // Standing desk halves hardware damage
          if (amount < 0 && state.ownedUpgrades.includes('hw-desk')) {
            amount = Math.ceil(amount / 2);
          }
          state.hardwareHp = Math.max(0, Math.min(100, state.hardwareHp + amount));
          logs.push(`> HARDWARE ${amount >= 0 ? '+' : ''}${amount} HP → ${state.hardwareHp} HP`);
          break;
        }

        case 'reputation': {
          const amount = effect.value as number;
          state.reputation += amount;
          logs.push(`> REPUTATION ${amount >= 0 ? '+' : ''}${amount} → ${state.reputation}`);
          break;
        }

        case 'flag': {
          const flagName = effect.value as string;
          state.eventFlags[flagName] = true;
          logs.push(`> FLAG SET: ${flagName}`);

          // Chain event queuing — each flag queues a specific follow-up event
          const CHAIN_FLAG_MAP: Record<string, string> = {
            'email-nuke-let-ride': 'the-replies-keep-coming',
            'crypto-investigate':  'what-the-logs-revealed',
            'check-logs-reveal':   'logs-dont-lie',
            'cto-remembers':       'cto-reaches-out',
            'consulting-client':   'client-wants-more',
          };
          if (CHAIN_FLAG_MAP[flagName]) {
            state.queuedEvent = CHAIN_FLAG_MAP[flagName];
            logs.push(`> CHAIN QUEUED: ${CHAIN_FLAG_MAP[flagName]}`);
          }

          if (flagName === 'cloud-autosave') {
            state.hasBackupProtection = true;
            logs.push('> ☁️ Cloud Autosave enabled — progress protected');
          } else if (flagName === 'agent-reset') {
            state.model = 'free';
            logs.push('> 🔄 Agent reset — model reverted to free tier');
          } else if (flagName === 'lose-progress-all') {
            state.loseProgressSignal = 'all';
            logs.push('> ⚠️ Progress lost — all work wiped!');
          } else if (flagName === 'lose-progress-chunk') {
            state.loseProgressSignal = 0.25;
            logs.push('> ⚠️ Progress chunk lost (-25%)');
          }
          break;
        }

        case 'loseProgress': {
          const val = effect.value as 'all' | number;
          state.loseProgressSignal = val;
          if (val === 'all') {
            logs.push('> ⚠️ Progress lost — all work wiped!');
          } else {
            logs.push(`> ⚠️ Progress chunk lost (-${Math.round((val as number) * 100)}%)`);
          }
          break;
        }

        case 'agentSpeed': {
          // Convert speed % to timer seconds: +10% speed ≈ +4.5s on 45s base → round to nearest
          const pct = effect.value as number;
          const seconds = Math.round(BASE_TIMER_SECONDS * (pct / 100));
          state.timerBonusSeconds += seconds;
          logs.push(`> SPEED ${pct >= 0 ? '+' : ''}${pct}% → ${seconds >= 0 ? '+' : ''}${seconds}s on timer`);
          break;
        }

        case 'tomorrowTimer': {
          const seconds = effect.value as number;
          state.tomorrowTimerBonus += seconds;
          logs.push(`> TOMORROW TIMER ${seconds >= 0 ? '+' : ''}${seconds}s`);
          break;
        }

        case 'nightBonus': {
          const amount = effect.value as number;
          state.nightBonusBudget += amount;
          logs.push(`> NIGHT BONUS +$${amount}`);
          break;
        }

        case 'modelSwitch': {
          const raw = effect.value as string;
          // Map descriptive names to actual ModelTier values
          const modelMap: Record<string, string> = { backup: 'openSource', sketchy: 'sketchy', smaller: 'local' };
          const tier = (modelMap[raw] ?? 'openSource') as import('./GameState').ModelTier;
          state.model = tier;
          state.eventFlags[`modelSwitch_${raw}`] = true;
          logs.push(`> MODEL SWITCH → ${tier}`);
          break;
        }

        default: {
          const _exhaustive: never = effect.type;
          throw new Error(`Unhandled effect type: ${String(_exhaustive)}`);
        }
      }
    }

    return logs;
  }

  /**
   * Record that an event fired on a given day, updating cooldown history and setting the event's flag.
   * @param eventId The id of the event that fired.
   * @param day The current day number.
   */
  markFired(eventId: string, day: number): void {
    const history = this.firedHistory.get(eventId) ?? [];
    history.push(day);
    this.firedHistory.set(eventId, history);
    this.state.eventFlags[eventId] = true;
  }
}
