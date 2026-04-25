import { describe, it, expect, beforeEach } from 'vitest';
import { EventEngine } from './EventEngine';
import { createInitialState } from './GameState';
import type { GameState } from './GameState';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides };
}

// ── Chain event queuing ────────────────────────────────────────────────────────

describe('EventEngine.selectEvent — chain event queuing', () => {
  it('returns the queued event and clears queuedEvent when id is valid', () => {
    const state = makeState({ queuedEvent: 'the-replies-keep-coming', day: 1 });
    const engine = new EventEngine(state);

    const result = engine.selectEvent();

    expect(result).not.toBeNull();
    expect(result!.id).toBe('the-replies-keep-coming');
    expect(state.queuedEvent).toBeNull();
  });

  it('clears queuedEvent and falls back to normal selection when id is unknown', () => {
    // day=1 ensures there are eligible non-chain events to fall back to
    const state = makeState({ queuedEvent: 'this-event-does-not-exist-xyz', day: 1 });
    const engine = new EventEngine(state);

    // Should not throw; queuedEvent gets cleared regardless
    expect(() => engine.selectEvent()).not.toThrow();
    expect(state.queuedEvent).toBeNull();
  });
});

// ── Suppression flags ─────────────────────────────────────────────────────────

describe('EventEngine.selectEvent — suppression flags', () => {
  let state: GameState;

  beforeEach(() => {
    state = makeState({
      day: 5,         // hardware-overheating requires day >= 5
      localSlots: 1,  // hardware-overheating requires requiresLocal
    });
  });

  it('never returns hardware-overheating when liquid-nitrogen flag is set (20 runs)', () => {
    state.eventFlags['liquid-nitrogen'] = true;
    const engine = new EventEngine(state);

    for (let i = 0; i < 20; i++) {
      const result = engine.selectEvent();
      if (result !== null) {
        expect(result.id).not.toBe('hardware-overheating');
      }
    }
  });

  it('never returns power-flickered when ups-installed flag is set (20 runs)', () => {
    state = makeState({ day: 1 });
    state.eventFlags['ups-installed'] = true;
    const engine = new EventEngine(state);

    for (let i = 0; i < 20; i++) {
      const result = engine.selectEvent();
      if (result !== null) {
        expect(result.id).not.toBe('power-flickered');
      }
    }
  });
});
