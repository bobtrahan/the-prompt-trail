import Phaser from 'phaser';
import { getState } from '../systems/GameState';
import { getTheme } from '../utils/themes';

export interface TerminalConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  terminalTextColor?: string;
  terminalBg?: number;
  cursorChar?: string;
}

const LINE_HEIGHT = 18;

// Hero prompt band dimensions
const HERO_BAND_HEIGHT = 96;
const HERO_BAND_ACCENT_STRIP = 2;   // colored top-border strip height
const HERO_FONT_SIZE = '22px';
const HERO_CURSOR_FONT_SIZE = '22px';
const LOG_FADE_COLOR = '#6e7681';    // dimmed color for log lines to keep them subordinate

/**
 * PromptOS Terminal — scrolling output log (top) + hero typing prompt band (bottom).
 *
 * Layout:
 *   ┌────────────────────────────────┐
 *   │  log lines (subordinate area)  │  ← bg = terminalBg, smaller text, dimmed
 *   │                                │
 *   ├────────────────────────────────┤  ← 2px accent-color strip
 *   │  HERO PROMPT BAND              │  ← dark bg, large font, unmissable cursor
 *   │  > typed█ remaining...         │
 *   │  ↑ type this                   │
 *   └────────────────────────────────┘
 */
export class Terminal {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private heroBandBg: Phaser.GameObjects.Rectangle;
  private heroBandStrip: Phaser.GameObjects.Rectangle;
  private terminalTextColor: string;
  private cursorChar: string;
  private accentColor: number;

  private lines: string[] = [];
  private lineTexts: Phaser.GameObjects.Text[] = [];

  // Hero prompt elements
  private typedText!: Phaser.GameObjects.Text;
  private cursorText!: Phaser.GameObjects.Text;
  private remainingText!: Phaser.GameObjects.Text;
  private hintLabel!: Phaser.GameObjects.Text;

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
  private firstPromptShown = false;
  private maxVisibleLines: number;

  // Log area height is everything above the hero band
  private logAreaHeight: number;

  constructor(config: TerminalConfig) {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);

    this.scene = config.scene;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.terminalTextColor = config.terminalTextColor ?? theme.terminalTextColor;
    this.cursorChar = config.cursorChar ?? theme.cursorChar;
    this.accentColor = theme.accent;

    // Log area is everything above the hero band
    this.logAreaHeight = config.height - HERO_BAND_HEIGHT;
    this.maxVisibleLines = Math.floor((this.logAreaHeight - 12) / LINE_HEIGHT);

    this.container = config.scene.add.container(config.x, config.y);

    // ── Log area background (full terminal bg) ──
    this.bg = config.scene.add.rectangle(0, 0, config.width, config.height, config.terminalBg ?? theme.terminalBg)
      .setOrigin(0);
    this.container.add(this.bg);

    // ── Hero band: accent-color top strip ──
    this.heroBandStrip = config.scene.add.rectangle(
      0, this.logAreaHeight,
      config.width, HERO_BAND_ACCENT_STRIP,
      this.accentColor
    ).setOrigin(0).setAlpha(0.85);
    this.container.add(this.heroBandStrip);

    // ── Hero band: dark high-contrast background ──
    this.heroBandBg = config.scene.add.rectangle(
      0, this.logAreaHeight + HERO_BAND_ACCENT_STRIP,
      config.width, HERO_BAND_HEIGHT - HERO_BAND_ACCENT_STRIP,
      0x070d14
    ).setOrigin(0);
    this.container.add(this.heroBandBg);

    // ── Hero prompt text objects ──
    // Vertically centred within the hero band
    const heroTextY = this.logAreaHeight + HERO_BAND_ACCENT_STRIP + Math.floor((HERO_BAND_HEIGHT - HERO_BAND_ACCENT_STRIP) / 2) - 14;

    this.typedText = config.scene.add.text(14, heroTextY, '', {
      fontFamily: 'monospace',
      fontSize: HERO_FONT_SIZE,
      color: this.terminalTextColor,
    });

    this.cursorText = config.scene.add.text(14, heroTextY, '', {
      fontFamily: 'monospace',
      fontSize: HERO_CURSOR_FONT_SIZE,
      color: '#ffffff',
    });

    this.remainingText = config.scene.add.text(14, heroTextY, '', {
      fontFamily: 'monospace',
      fontSize: HERO_FONT_SIZE,
      color: '#3a4453',
    });

    // Hint label (small, below the prompt text)
    this.hintLabel = config.scene.add.text(
      14, heroTextY + 28,
      '↑ type this prompt',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#484f58',
      }
    ).setVisible(false);

    this.container.add([this.typedText, this.cursorText, this.remainingText, this.hintLabel]);

    // ── Cursor blink ──
    this.cursorBlink = config.scene.time.addEvent({
      delay: 530,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.renderPrompt();
      },
    });
  }

  /** Add a line of output to the log area */
  addLine(text: string, _color = this.terminalTextColor): void {
    this.lines.push(text);
    if (this.lines.length > this.maxVisibleLines) {
      this.lines.shift();
    }
    this.renderLines();
  }

  /** Set the current prompt the player needs to type */
  setPrompt(prompt: string): void {
    if (!this.firstPromptShown && prompt) {
      this.hintLabel.setVisible(true);
    }
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

      if (this.isComplete() && !this.firstPromptShown) {
        this.firstPromptShown = true;
        this.hintLabel.destroy();
      }
    }
  }

  /** Called on incorrect keystroke — flash the hero band red briefly */
  showError(): void {
    const errorColor = '#f85149';
    this.typedText.setColor(errorColor);
    this.cursorText.setColor(errorColor);
    this.remainingText.setColor(errorColor);
    // Flash hero band bg
    this.heroBandBg.setFillStyle(0x2a0a0a);

    this.scene.time.delayedCall(150, () => {
      this.heroBandBg.setFillStyle(0x070d14);
      this.renderPrompt();
    });
  }

  /** Is the current prompt fully typed? */
  isComplete(): boolean {
    return this.typedSoFar.length >= this.currentPrompt.length && this.currentPrompt.length > 0;
  }

  getCurrentPrompt(): string {
    return this.currentPrompt;
  }

  getTypedLength(): number {
    return this.typedSoFar.length;
  }

  getPromptLength(): number {
    return this.currentPrompt.length;
  }

  private renderLines(): void {
    this.lineTexts.forEach(t => t.destroy());
    this.lineTexts = [];

    const startY = 8;
    const visible = this.lines.slice(-this.maxVisibleLines);
    visible.forEach((line, i) => {
      const t = this.scene.add.text(8, startY + i * LINE_HEIGHT, line, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: LOG_FADE_COLOR,   // log lines are visually subordinate (dimmed)
      });
      this.container.add(t);
      this.lineTexts.push(t);
    });
  }

  private renderPrompt(): void {
    const typed = this.promptPrefix + this.typedSoFar;
    const remaining = this.currentPrompt.slice(this.typedSoFar.length);
    const cursor = this.cursorVisible ? this.cursorChar : ' ';

    this.typedText.setText(typed);
    this.typedText.setColor(this.terminalTextColor);

    // Position cursor immediately after typed text
    this.cursorText.setX(this.typedText.x + this.typedText.width);
    this.cursorText.setText(cursor);
    this.cursorText.setColor('#ffffff');

    // Position remaining after cursor
    this.remainingText.setX(this.cursorText.x + this.cursorText.width);
    this.remainingText.setText(remaining);
    this.remainingText.setColor('#3a4453');
  }

  destroy(): void {
    this.cursorBlink.destroy();
    this.lineTexts.forEach(t => t.destroy());
    this.container.destroy();
  }
}
