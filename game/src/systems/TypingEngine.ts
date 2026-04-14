import Phaser from 'phaser';
import { Terminal } from '../ui/Terminal';

/** Prompt definitions — what the player types during execution */
const PROMPTS: string[] = [
  'git push --force',
  'pip install sketchy-model',
  'await agent.think()',
  'rm -rf node_modules',
  'LGTM ship it',
  'npm run build',
  'docker compose up -d',
  'curl -X POST /api/deploy',
  'sudo reboot now',
  'git commit -m "fixes"',
  'ssh prod@server',
  'python train.py --epochs 100',
  'export OPENAI_KEY=sk-...',
  'tail -f /var/log/agent.log',
  'chmod 777 everything.sh',
  'wget model-7b.gguf',
  'systemctl restart agent',
  'screen -r training',
  'rsync -avz ./weights remote:',
  'kubectl apply -f chaos.yaml',
];

export interface TypingStats {
  correct: number;
  incorrect: number;
  promptsCompleted: number;
}

/**
 * Typing Engine — manages the typing mechanic during Execution phase.
 * Listens for keyboard input, advances terminal, tracks accuracy.
 */
export class TypingEngine {
  private scene: Phaser.Scene;
  private terminal: Terminal;
  private stats: TypingStats = { correct: 0, incorrect: 0, promptsCompleted: 0 };
  private promptQueue: string[] = [];
  private active = false;
  private onPromptComplete?: () => void;

  constructor(scene: Phaser.Scene, terminal: Terminal, onPromptComplete?: () => void) {
    this.scene = scene;
    this.terminal = terminal;
    this.onPromptComplete = onPromptComplete;

    // Shuffle and queue prompts
    this.promptQueue = Phaser.Utils.Array.Shuffle([...PROMPTS]);

    // Listen for keyboard
    scene.input.keyboard!.on('keydown', this.handleKey, this);
  }

  start(): void {
    this.active = true;
    this.nextPrompt();
  }

  stop(): void {
    this.active = false;
  }

  getStats(): TypingStats {
    return { ...this.stats };
  }

  getAccuracy(): number {
    const total = this.stats.correct + this.stats.incorrect;
    return total === 0 ? 1 : this.stats.correct / total;
  }

  private nextPrompt(): void {
    if (this.promptQueue.length === 0) {
      this.promptQueue = Phaser.Utils.Array.Shuffle([...PROMPTS]);
    }
    const prompt = this.promptQueue.pop()!;
    this.terminal.addLine(`> ${this.terminal['currentPrompt'] || ''}`.trim());
    this.terminal.setPrompt(prompt);
  }

  private handleKey = (event: KeyboardEvent): void => {
    if (!this.active) return;
    // Ignore modifier keys, function keys, etc.
    if (event.key.length !== 1 && event.key !== 'Backspace') return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const expected = this.terminal['currentPrompt'][this.terminal.getTypedLength()];

    if (event.key === expected) {
      this.stats.correct++;
      this.terminal.advanceChar();

      if (this.terminal.isComplete()) {
        this.stats.promptsCompleted++;
        this.terminal.addLine(`✓ ${this.terminal['currentPrompt']}`);
        this.onPromptComplete?.();

        // Small delay before next prompt
        this.scene.time.delayedCall(300, () => {
          if (this.active) this.nextPrompt();
        });
      }
    } else if (event.key !== 'Backspace') {
      this.stats.incorrect++;
      this.terminal.showError();
    }
  };

  destroy(): void {
    this.scene.input.keyboard!.off('keydown', this.handleKey, this);
  }
}
