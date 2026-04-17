import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TypingEngine, type TypingTarget } from './TypingEngine';

// Mock AudioManager to avoid Phaser/Audio issues in headless test
vi.mock('./AudioManager', () => ({
  default: {
    getInstance: () => ({
      playSFX: vi.fn(),
    }),
  },
}));

// Mock Phaser Utils to avoid Canvas/Device initialization issues
vi.mock('phaser', () => ({
  default: {
    Utils: {
      Array: {
        Shuffle: (arr: any[]) => arr,
      },
    },
  },
}));

// Mock TypingTarget
class MockTerminal implements TypingTarget {
  private prompt = '';
  private typedLength = 0;
  private complete = false;

  setPrompt(prompt: string) {
    this.prompt = prompt;
    this.typedLength = 0;
    this.complete = false;
  }

  advanceChar() {
    this.typedLength++;
    if (this.typedLength >= this.prompt.length) {
      this.complete = true;
    }
  }

  isComplete() {
    return this.complete;
  }

  showError() {}
  addLine() {}
  getTypedLength() {
    return this.typedLength;
  }
  getCurrentPrompt() {
    return this.prompt;
  }
}

describe('TypingEngine Telemetry', () => {
  let scene: any;
  let terminal: MockTerminal;
  let engine: TypingEngine;

  beforeEach(() => {
    // Basic phaser mock
    scene = {
      input: {
        keyboard: {
          on: vi.fn(),
          off: vi.fn(),
        },
      },
      time: {
        delayedCall: vi.fn(),
      },
    };
    terminal = new MockTerminal();
    engine = new TypingEngine(scene, terminal);
  });

  it('tracks streak correctly', () => {
    engine.start();
    terminal.setPrompt('abc');

    const handleKey = (engine as any).handleKey;

    // Correct key
    handleKey({ key: 'a' });
    expect(engine.getTelemetry().streak).toBe(1);

    // Correct key
    handleKey({ key: 'b' });
    expect(engine.getTelemetry().streak).toBe(2);

    // Incorrect key
    handleKey({ key: 'x' });
    expect(engine.getTelemetry().streak).toBe(0);

    // Correct key again
    handleKey({ key: 'c' });
    expect(engine.getTelemetry().streak).toBe(1);
  });

  it('tracks perfect-prompt flag', () => {
    engine.start();
    terminal.setPrompt('abc');
    const handleKey = (engine as any).handleKey;

    expect(engine.getTelemetry().isPerfectPrompt).toBe(true);

    handleKey({ key: 'a' });
    expect(engine.getTelemetry().isPerfectPrompt).toBe(true);

    handleKey({ key: 'x' });
    expect(engine.getTelemetry().isPerfectPrompt).toBe(false);

    handleKey({ key: 'b' });
    expect(engine.getTelemetry().isPerfectPrompt).toBe(false);
  });

  it('resets perfect-prompt flag on next prompt', () => {
    engine.start();
    terminal.setPrompt('a');
    const handleKey = (engine as any).handleKey;

    handleKey({ key: 'x' });
    expect(engine.getTelemetry().isPerfectPrompt).toBe(false);

    // Complete the prompt to trigger nextPrompt (or call it directly since we are testing)
    handleKey({ key: 'a' });
    // In our mock, nextPrompt is called by handleKey if it's not paused, but it uses delayedCall
    // Let's call nextPrompt manually to verify reset
    (engine as any).nextPrompt();
    expect(engine.getTelemetry().isPerfectPrompt).toBe(true);
  });

  it('calculates recent accuracy over a window of prompts', () => {
    engine.start();
    const handleKey = (engine as any).handleKey;

    // Helper to simulate a prompt with or without errors
    const simulatePrompt = (perfect: boolean) => {
      terminal.setPrompt('a');
      if (!perfect) {
        handleKey({ key: 'x' });
      }
      handleKey({ key: 'a' });
      (engine as any).nextPrompt();
    };

    // First prompt perfect
    simulatePrompt(true);
    expect(engine.getTelemetry().recentAccuracy).toBe(1.0);

    // Second prompt with error
    simulatePrompt(false);
    expect(engine.getTelemetry().recentAccuracy).toBe(0.5);

    // Eight more perfect prompts (Total 10, 9 perfect, 1 error)
    for (let i = 0; i < 8; i++) simulatePrompt(true);
    expect(engine.getTelemetry().recentAccuracy).toBe(0.9);

    // One more perfect prompt (The error should still be in window of 10 if we have 10 results now)
    // Wait, recentPromptResults stores results of PREVIOUS prompts.
    // At this point we have called nextPrompt 10 times.
    // The first call to nextPrompt doesn't push anything (typedLength is 0).
    // Subsequent calls do.
    // simulatePrompt(true) calls nextPrompt at the end.
    // So after 10 simulatePrompt calls, we have 10 entries in recentPromptResults.
    expect((engine as any).recentPromptResults.length).toBe(10);
    expect(engine.getTelemetry().recentAccuracy).toBe(0.9);

    // One more perfect prompt perfect
    simulatePrompt(true);
    expect((engine as any).recentPromptResults.length).toBe(10);
    // After 11 simulatePrompt calls:
    // nextPrompt was called 11 times.
    // 1st: length 0 (skipped)
    // 2nd: length 1 (1 perfect)
    // 3rd: length 2 (1 perfect, 1 failed)
    // ...
    // 11th: length 10 (1 perfect, 1 failed, 8 perfect) -> wait, this is 10.
    // If we call simulatePrompt one more time:
    simulatePrompt(true);
    expect(engine.getTelemetry().recentAccuracy).toBe(1.0);
  });

  it('calculates approximate WPM', () => {
    vi.useFakeTimers();
    engine.start();
    const handleKey = (engine as any).handleKey;

    // Type 50 correct characters in 1 minute
    terminal.setPrompt('a'.repeat(50));
    for (let i = 0; i < 50; i++) {
      handleKey({ key: 'a' });
      (terminal as any).typedLength = i + 1; // manually advance for simplicity in this loop
    }

    vi.advanceTimersByTime(60000); // 1 minute

    // WPM = (50 / 5) / 1 = 10
    expect(engine.getTelemetry().wpm).toBe(10);

    vi.useRealTimers();
  });
});
