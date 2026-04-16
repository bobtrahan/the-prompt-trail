import Phaser from 'phaser';
import AudioManager from './AudioManager';

export interface TypingTarget {
  setPrompt(prompt: string): void;
  advanceChar(): void;
  isComplete(): boolean;
  showError(): void;
  addLine(text: string): void;
  getTypedLength(): number;
  getCurrentPrompt(): string;
}


export interface TypingStats {
  correct: number;
  incorrect: number;
  promptsCompleted: number;
}

/**
 * Typing Engine — manages the typing mechanic during Execution phase.
 * Listens for keyboard input, advances terminal, tracks accuracy.
 * Difficulty scales: first few prompts are short/easy, then medium, then hard.
 */
export class TypingEngine {
  private scene: Phaser.Scene;
  private terminal: TypingTarget;
  private stats: TypingStats = { correct: 0, incorrect: 0, promptsCompleted: 0 };
  private dayPrompts?: string[];
  private dayPromptIndex = 0;
  private overridePool?: string[];
  private active = false;
  private paused = false;
  private typoForgiveness = 0;
  private currentWrongCount = 0;
  private onPromptComplete?: () => void;
  private onFirstKeystroke?: () => void;
  private hasTypedOnce = false;
  private lastSFXTime = 0;
  public speedModifier = 1.0;
  public jitterChance = 0;

  constructor(
    scene: Phaser.Scene,
    terminal: TypingTarget,
    onPromptComplete?: () => void,
    onFirstKeystroke?: () => void,
    typoForgiveness = 0,
  ) {
    this.scene = scene;
    this.terminal = terminal;
    this.onPromptComplete = onPromptComplete;
    this.onFirstKeystroke = onFirstKeystroke;
    this.typoForgiveness = typoForgiveness;

    scene.input.keyboard!.on('keydown', this.handleKey, this);
  }

  start(): void {
    this.active = true;
    this.paused = false;
    this.nextPrompt();
  }

  stop(): void {
    this.active = false;
  }

  /** Pause typing (e.g. during event modal) */
  pause(): void {
    this.paused = true;
  }

  /** Resume typing after event */
  resume(): void {
    this.paused = false;
    // If a prompt completed while paused (delayed nextPrompt was skipped), load one now
    if (this.active && this.terminal.isComplete()) {
      this.nextPrompt();
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  getStats(): TypingStats {
    return { ...this.stats };
  }

  getAccuracy(): number {
    const total = this.stats.correct + this.stats.incorrect;
    return total === 0 ? 1 : this.stats.correct / total;
  }

  /** Set ordered day-specific prompts. Iterates sequentially, loops when exhausted. */
  setDayPrompts(prompts: string[]): void {
    this.dayPrompts = prompts;
    this.dayPromptIndex = 0;
    if (this.active) this.nextPrompt();
  }

  /** Replace the active prompt pool with a custom set (e.g. overtime production prompts) */
  setPromptPool(prompts: string[]): void {
    this.overridePool = Phaser.Utils.Array.Shuffle([...prompts]);
    // Immediately load next from new pool
    if (this.active && !this.paused) this.nextPrompt();
  }

  private nextPrompt(): void {
    if (this.overridePool) {
      if (this.overridePool.length === 0) {
        this.overridePool = Phaser.Utils.Array.Shuffle([...this.overridePool]);
      }
      const prompt = this.overridePool.pop() ?? 'npm start';
      this.currentWrongCount = 0;
      this.terminal.setPrompt(prompt);
      return;
    }

    if (this.dayPrompts && this.dayPrompts.length > 0) {
      const prompt = this.dayPrompts[this.dayPromptIndex];
      this.dayPromptIndex = (this.dayPromptIndex + 1) % this.dayPrompts.length;
      this.currentWrongCount = 0;
      this.terminal.setPrompt(prompt);
      return;
    }

    this.currentWrongCount = 0;
    this.terminal.setPrompt('npm start');
  }

  private handleKey = (event: KeyboardEvent): void => {
    if (!this.active || this.paused) return;
    if (event.key.length !== 1 && event.key !== 'Backspace') return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (!this.hasTypedOnce) {
      this.hasTypedOnce = true;
      this.onFirstKeystroke?.();
    }

    const expected = this.terminal.getCurrentPrompt()[this.terminal.getTypedLength()];

    const now = Date.now();

    if (event.key === expected) {
      if (this.jitterChance > 0 && Math.random() < this.jitterChance) {
        this.handleIncorrectKey(now);
        return;
      }

      this.stats.correct++;
      this.terminal.advanceChar();

      if (now - this.lastSFXTime >= 80) {
        AudioManager.getInstance().playSFX('key-correct');
        this.lastSFXTime = now;
      }

      if (this.terminal.isComplete()) {
        this.stats.promptsCompleted++;
        this.terminal.addLine(`✓ ${this.terminal.getCurrentPrompt()}`);
        this.onPromptComplete?.();

        this.scene.time.delayedCall(250, () => {
          if (this.active && !this.paused) this.nextPrompt();
        });
      }
    } else if (event.key !== 'Backspace') {
      this.handleIncorrectKey(now);
    }
  };

  private handleIncorrectKey(now: number): void {
    if (this.currentWrongCount < this.typoForgiveness) {
      this.currentWrongCount++;
    } else {
      this.stats.incorrect++;
      this.terminal.showError();
      if (now - this.lastSFXTime >= 80) {
        AudioManager.getInstance().playSFX('key-wrong');
        this.lastSFXTime = now;
      }
    }
  }

  destroy(): void {
    this.scene.input.keyboard!.off('keydown', this.handleKey, this);
  }
}
