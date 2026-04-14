import type { GameState } from './GameState';
import type { EventDef, EventChoice } from '../data/events';
import { EVENTS } from '../data/events';

export class EventEngine {
  private state: GameState;
  private firedHistory: Map<string, number[]>; // eventId -> days fired

  constructor(state: GameState) {
    this.state = state;
    this.firedHistory = new Map();
  }

  selectEvent(): EventDef | null {
    const { day, playerClass, localSlots, eventFlags } = this.state;

    const eligible: Array<{ event: EventDef; weight: number }> = [];

    for (const event of EVENTS) {
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

      // Weight adjustment: recently fired in last 3 days → ×0.3
      let weight = event.weight;
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

  applyEffects(choice: EventChoice, state: GameState): string[] {
    const logs: string[] = [];

    for (const effect of choice.effects) {
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
          const amount = effect.value as number;
          state.timeUnitsRemaining += amount;
          if (amount >= 0) {
            logs.push(`> TIME +${amount} units → ${state.timeUnitsRemaining} remaining`);
          } else {
            logs.push(`> TIME -${Math.abs(amount)} units → ${state.timeUnitsRemaining} remaining`);
          }
          break;
        }

        case 'hardware': {
          const amount = effect.value as number;
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
          break;
        }

        case 'agentSpeed': {
          // agentSpeed is a transient modifier — store in eventFlags as numeric string for now
          const amount = effect.value as number;
          const key = `agentSpeedMod_${Date.now()}`;
          state.eventFlags[key] = true;
          logs.push(`> AGENT SPEED ${amount >= 0 ? '+' : ''}${amount}%`);
          break;
        }

        case 'modelSwitch': {
          const model = effect.value as string;
          logs.push(`> MODEL SWITCH → ${model}`);
          // Model switch is advisory — the caller/scene handles actual model assignment
          state.eventFlags[`modelSwitch_${model}`] = true;
          break;
        }

        default: {
          logs.push(`> EFFECT: ${effect.type} = ${effect.value}`);
          break;
        }
      }
    }

    return logs;
  }

  markFired(eventId: string, day: number): void {
    const history = this.firedHistory.get(eventId) ?? [];
    history.push(day);
    this.firedHistory.set(eventId, history);
    this.state.eventFlags[eventId] = true;
  }
}
