import Phaser from 'phaser';
import { COLORS } from '../utils/constants';

export interface TerminalConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
}

const LINE_HEIGHT = 18;
const MAX_VISIBLE_LINES = 20;

/**
 * PromptOS Terminal — renders scrolling output lines + an active typing prompt.
 * All text is monospace. Dark terminal background. Green text for output, white for prompt.
 */
export class Terminal {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private lines: string[] = [];
  private lineTexts: Phaser.GameObjects.Text[] = [];
  private promptText!: Phaser.GameObjects.Text;
  private cursorBlink!: Phaser.Time.TimerEvent;
  private cursorVisible = true;

  private x: number;
  private y: number;
  private width: number;
  private height: number;

  // Current typing state
  private currentPrompt = '';
  private typedSoFar = '';
  private promptPrefix = '> ';

  constructor(config: TerminalConfig) {
    this.scene = config.scene;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;

    this.container = config.scene.add.container(config.x, config.y);

    // Terminal background
    this.bg = config.scene.add.rectangle(0, 0, config.width, config.height, COLORS.terminal)
      .setOrigin(0);
    this.container.add(this.bg);

    // Prompt line (at bottom of terminal area)
    this.promptText = config.scene.add.text(8, config.height - LINE_HEIGHT - 8, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e6edf3',
    });
    this.container.add(this.promptText);

    // Cursor blink
    this.cursorBlink = config.scene.time.addEvent({
      delay: 530,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.renderPrompt();
      },
    });
  }

  /** Add a line of output above the prompt */
  addLine(text: string, color = '#39d353'): void {
    this.lines.push(text);
    // Keep only visible lines
    if (this.lines.length > MAX_VISIBLE_LINES) {
      this.lines.shift();
    }
    this.renderLines();
  }

  /** Set the current prompt the player needs to type */
  setPrompt(prompt: string): void {
    this.currentPrompt = prompt;
    this.typedSoFar = '';
    this.renderPrompt();
  }

  /** Called on each correct keystroke */
  advanceChar(): void {
    if (this.typedSoFar.length < this.currentPrompt.length) {
      this.typedSoFar += this.currentPrompt[this.typedSoFar.length];
      this.cursorVisible = true;
      this.renderPrompt();
    }
  }

  /** Called on incorrect keystroke — flash red briefly */
  showError(): void {
    this.promptText.setColor('#f85149');
    this.scene.time.delayedCall(150, () => {
      this.renderPrompt();
    });
  }

  /** Is the current prompt fully typed? */
  isComplete(): boolean {
    return this.typedSoFar.length >= this.currentPrompt.length && this.currentPrompt.length > 0;
  }

  getTypedLength(): number {
    return this.typedSoFar.length;
  }

  getPromptLength(): number {
    return this.currentPrompt.length;
  }

  private renderLines(): void {
    // Clear old text objects
    this.lineTexts.forEach(t => t.destroy());
    this.lineTexts = [];

    const startY = 8;
    const visible = this.lines.slice(-MAX_VISIBLE_LINES);
    visible.forEach((line, i) => {
      const t = this.scene.add.text(8, startY + i * LINE_HEIGHT, line, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#39d353',
      });
      this.container.add(t);
      this.lineTexts.push(t);
    });
  }

  private renderPrompt(): void {
    const typed = this.typedSoFar;
    const remaining = this.currentPrompt.slice(typed.length);
    const cursor = this.cursorVisible ? '█' : ' ';
    this.promptText.setText(this.promptPrefix + typed + cursor + remaining);
    this.promptText.setColor('#e6edf3');
  }

  destroy(): void {
    this.cursorBlink.destroy();
    this.lineTexts.forEach(t => t.destroy());
    this.container.destroy();
  }
}
