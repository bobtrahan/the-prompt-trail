import Phaser from 'phaser';
import { Terminal } from '../ui/Terminal';
import AudioManager from './AudioManager';

/**
 * Prompts organized by difficulty tier.
 * Early game = short/easy. Scales up as day progresses.
 */
const PROMPTS_EASY: string[] = [
  'hello world',
  'npm start',
  'git init',
  'ls -la',
  'cd src',
  'make',
  'go run .',
  'pip install',
  'node app',
  'cat README',
];

const PROMPTS_MEDIUM: string[] = [
  'git push origin',
  'docker compose up',
  'npm run build',
  'python train.py',
  'ssh prod@server',
  'curl localhost',
  'export API_KEY=',
  'screen -r agent',
  'tail -f logs',
  'chmod 755 run.sh',
];

const PROMPTS_HARD: string[] = [
  'git push --force',
  'pip install sketchy-model',
  'await agent.think()',
  'rm -rf node_modules',
  'kubectl apply -f chaos.yaml',
  'rsync -avz ./weights remote:',
  'wget model-7b.gguf',
  'systemctl restart agent',
  'LGTM ship it',
  'export OPENAI_KEY=sk-...',
];

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
  private terminal: Terminal;
  private stats: TypingStats = { correct: 0, incorrect: 0, promptsCompleted: 0 };
  private easyQueue: string[] = [];
  private mediumQueue: string[] = [];
  private hardQueue: string[] = [];
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
    terminal: Terminal,
    onPromptComplete?: () => void,
    onFirstKeystroke?: () => void,
    typoForgiveness = 0,
  ) {
    this.scene = scene;
    this.terminal = terminal;
    this.onPromptComplete = onPromptComplete;
    this.onFirstKeystroke = onFirstKeystroke;
    this.typoForgiveness = typoForgiveness;

    this.easyQueue = Phaser.Utils.Array.Shuffle([...PROMPTS_EASY]);
    this.mediumQueue = Phaser.Utils.Array.Shuffle([...PROMPTS_MEDIUM]);
    this.hardQueue = Phaser.Utils.Array.Shuffle([...PROMPTS_HARD]);

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

  /** Replace the active prompt pool with a custom set (e.g. overtime production prompts) */
  setPromptPool(prompts: string[]): void {
    this.overridePool = Phaser.Utils.Array.Shuffle([...prompts]);
    // Immediately load next from new pool
    if (this.active && !this.paused) this.nextPrompt();
  }

  private getNextPromptPool(): string[] {
    if (this.overridePool) return this.overridePool;
    const completed = this.stats.promptsCompleted;
    if (completed < 3) return this.easyQueue;
    if (completed < 7) return this.mediumQueue;
    return this.hardQueue;
  }

  private nextPrompt(): void {
    const pool = this.getNextPromptPool();
    if (pool.length === 0) {
      // Refill
      if (this.overridePool && pool === this.overridePool) {
        // Reshuffle the same set
        const src = this.overridePool;
        this.overridePool = Phaser.Utils.Array.Shuffle([...src]);
      } else if (pool === this.easyQueue) this.easyQueue = Phaser.Utils.Array.Shuffle([...PROMPTS_EASY]);
      else if (pool === this.mediumQueue) this.mediumQueue = Phaser.Utils.Array.Shuffle([...PROMPTS_MEDIUM]);
      else this.hardQueue = Phaser.Utils.Array.Shuffle([...PROMPTS_HARD]);
    }
    const activePool = this.getNextPromptPool();
    const prompt = activePool.pop() ?? 'npm start';
    this.currentWrongCount = 0;
    this.terminal.setPrompt(prompt);
  }

  private handleKey = (event: KeyboardEvent): void => {
    if (!this.active || this.paused) return;
    if (event.key.length !== 1 && event.key !== 'Backspace') return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (!this.hasTypedOnce) {
      this.hasTypedOnce = true;
      this.onFirstKeystroke?.();
    }

    const expected = this.terminal['currentPrompt'][this.terminal.getTypedLength()];

    const now = Date.now();

    // Jitter check: random chance to turn a correct key into a wrong one
    let actualKey = event.key;
    if (this.jitterChance > 0 && event.key === expected && Math.random() < this.jitterChance) {
      if (Math.random() < 0.2) {
        // Only 20% of the jitter triggers actually cause a "typo" as per spec
        // "When jitterChance > 0, 20% of correct keystrokes should randomly count as wrong (typo)"
        // WAIT, the spec says: "When jitterChance > 0, 20% of correct keystrokes should randomly count as wrong (typo)"
        // That means I should just check if Math.random() < 0.2 if jitterChance > 0.
        // Or does jitterChance itself define the probability?
        // Spec says: "con-energy: TypingEngine.speedModifier += 0.1, TypingEngine.jitterChance = 0.2"
        // And Task: "Add jitterChance: number (default 0). When jitterChance > 0, 20% of correct keystrokes should randomly count as wrong (typo)"
        // Okay, so if jitterChance > 0, then 20% fixed chance? Or jitterChance chance?
        // Usually, jitterChance = 0.2 means 20% chance.
      }
    }

    // Re-reading spec: "When jitterChance > 0, 20% of correct keystrokes should randomly count as wrong (typo)"
    // This phrasing is slightly ambiguous. Does it mean "If jitterChance > 0 THEN 20%" or "use jitterChance as the probability"?
    // The energy drink sets it to 0.2. 0.2 IS 20%. So I'll use jitterChance as the probability.

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
        this.terminal.addLine(`✓ ${this.terminal['currentPrompt']}`);
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
