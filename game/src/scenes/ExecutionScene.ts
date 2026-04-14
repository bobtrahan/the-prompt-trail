import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, TIME_UNITS_PER_DAY, EVENT_INTERVAL_MS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { Terminal } from '../ui/Terminal';
import { TypingEngine } from '../systems/TypingEngine';

// Placeholder project names per day
const DAY_PROJECTS: string[] = [
  'Email Automator v0.1',
  'Twitter Reply Bot',
  'Resume Optimizer Pro',
  'AI Meal Planner',
  'Smart Home Dashboard',
  'Code Review Agent',
  'Startup Pitch Generator',
  'Legal Contract Scanner',
  'AI Dungeon Master',
  'Self-Driving Grocery Cart',
  'Sentient Spreadsheet',
  'AGI Prototype (lol)',
  'The Final Deploy',
];

// Placeholder events (will be replaced by EventEngine)
const PLACEHOLDER_EVENTS = [
  {
    title: '⚠️ API Rate Limit',
    body: 'You hit the rate limit on your model provider.\nTokens are being throttled.',
    choices: ['Wait it out (lose 1 time)', 'Switch to backup model ($200)', 'Rage tweet about it'],
  },
  {
    title: '🔥 Agent Loop Detected',
    body: 'Your agent has been generating the same\nfunction for the last 47 iterations.',
    choices: ['Restart agent (lose progress)', 'Let it cook', 'Add more agents ($300)'],
  },
  {
    title: '💸 Surprise Invoice',
    body: 'Your model provider sent an unexpected bill.\n"Premium context window surcharge: $150"',
    choices: ['Pay it ($150)', 'Dispute it (lose 1 time)', 'Switch to free tier'],
  },
  {
    title: '📡 Model Update Available',
    body: 'A new model version just dropped mid-project.\n"30% faster, 60% more hallucinations"',
    choices: ['Upgrade now (risky)', 'Stay on current', 'Read the changelog (lose 1 time)'],
  },
  {
    title: '🐛 Bug Report',
    body: 'Your agent committed code that passes all tests\nbut does the opposite of what was asked.',
    choices: ['Revert and redo ($100)', 'Ship it anyway', 'Write more tests (lose 1 time)'],
  },
  {
    title: '⚡ Power Flicker',
    body: 'The lights flickered. Your local model\nlost its entire context window.',
    choices: ['Reload context ($50)', 'Switch to cloud model ($100)', 'Work from memory'],
  },
];

export class ExecutionScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private terminalWindow!: Window;
  private terminal!: Terminal;
  private typingEngine!: TypingEngine;
  private agentWindow!: Window;
  private resourceWindow!: Window;

  // Progress
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;
  private progressText!: Phaser.GameObjects.Text;
  private progress = 0;
  private timeUnits = TIME_UNITS_PER_DAY;
  private timeBar!: Phaser.GameObjects.Rectangle;
  private timeBg!: Phaser.GameObjects.Rectangle;

  // Timers
  private dayTimer!: Phaser.Time.TimerEvent;
  private eventTimer!: Phaser.Time.TimerEvent;

  // "Start typing" affordance
  private typeHint!: Phaser.GameObjects.Text;
  private typeHintTween?: Phaser.Tweens.Tween;
  private startedTyping = false;

  // Event modal
  private modalGroup?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'Execution' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.progress = 0;
    this.timeUnits = state.timeUnitsRemaining;
    this.startedTyping = false;

    // ── Taskbar ──
    this.taskbar = new Taskbar(this, theme.accent);

    // ── Desktop label ──
    this.add.text(12, 8, `PromptOS  ·  Day ${state.day}/13  ·  ${state.className}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#30363d',
    });

    // ── Project header bar ──
    this.add.rectangle(0, 28, GAME_WIDTH, 36, COLORS.titleBar).setOrigin(0);
    const projectName = DAY_PROJECTS[(state.day - 1) % DAY_PROJECTS.length];
    this.add.text(16, 34, `📋 Building: ${projectName}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
    });

    const stratLabel = state.strategy ?? 'unknown';
    this.add.text(GAME_WIDTH - 200, 34, `Strategy: ${stratLabel}`, {
      fontFamily: 'monospace', fontSize: '12px',
      color: Phaser.Display.Color.IntegerToColor(theme.accent).rgba,
    });

    // ── Terminal Window ──
    this.terminalWindow = new Window({
      scene: this, x: 16, y: 72,
      width: 820, height: 440,
      title: 'Terminal — ' + projectName,
      titleIcon: '⬛',
      accentColor: theme.accent,
    });

    const tArea = this.terminalWindow.contentArea;
    this.terminal = new Terminal({
      scene: this,
      x: 16 + tArea.x,
      y: 72 + tArea.y,
      width: tArea.width,
      height: tArea.height,
    });

    // ── Progress bar (top of terminal window content) ──
    this.progressBg = this.add.rectangle(16 + tArea.x, 72 + tArea.y - 2, tArea.width, 12, 0x21262d).setOrigin(0);
    this.progressBar = this.add.rectangle(16 + tArea.x, 72 + tArea.y - 2, 0, 12, theme.accent).setOrigin(0);
    this.progressText = this.add.text(16 + tArea.x + tArea.width / 2, 72 + tArea.y - 1, '0%', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e6edf3',
    }).setOrigin(0.5, 0);

    // ── Agent Panel ──
    this.agentWindow = new Window({
      scene: this, x: 852, y: 72,
      width: 412, height: 200,
      title: 'Agent Manager',
      titleIcon: '🤖',
      accentColor: theme.accent,
    });

    const agents = state.activeAgents.length > 0 ? state.activeAgents : ['turbo'];
    const aArea = this.agentWindow.contentArea;
    agents.forEach((agentId, i) => {
      const label = this.add.text(
        852 + aArea.x, 72 + aArea.y + i * 40,
        `🤖 ${agentId.charAt(0).toUpperCase() + agentId.slice(1)}`,
        { fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3' }
      );
      this.agentWindow.add(label);

      const status = this.add.text(
        852 + aArea.x + 140, 72 + aArea.y + i * 40,
        '⚡ Working...',
        { fontFamily: 'monospace', fontSize: '12px', color: '#39d353' }
      );
      this.agentWindow.add(status);

      let dots = 0;
      this.time.addEvent({
        delay: 600 + i * 200, loop: true,
        callback: () => { dots = (dots + 1) % 4; status.setText('⚡ Working' + '.'.repeat(dots)); },
      });
    });

    // ── Resource Panel ──
    this.resourceWindow = new Window({
      scene: this, x: 852, y: 288,
      width: 412, height: 224,
      title: 'System Monitor',
      titleIcon: '📊',
      accentColor: theme.accent,
    });

    const rArea = this.resourceWindow.contentArea;
    const rStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3' };
    const rX = 852 + rArea.x;
    const rY = 288 + rArea.y;

    this.add.text(rX, rY, `💰 Budget: $${state.budget.toLocaleString()}`, rStyle);
    this.add.text(rX, rY + 28, `🖥️ Hardware: ${state.hardwareHp}%`, rStyle);
    this.add.text(rX, rY + 56, `⭐ Reputation: ${state.reputation}`, rStyle);
    this.add.text(rX, rY + 84, `📡 Model: ${state.model}`, rStyle);

    this.add.text(rX, rY + 120, '⏱️ Time Remaining:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
    });
    this.timeBg = this.add.rectangle(rX, rY + 140, rArea.width - 16, 14, 0x21262d).setOrigin(0);
    this.timeBar = this.add.rectangle(rX, rY + 140, rArea.width - 16, 14, COLORS.warning).setOrigin(0);

    // ── Terminal boot text ──
    this.terminal.addLine('PromptOS Terminal v1.3.7');
    this.terminal.addLine(`Loading project: ${projectName}...`);
    this.terminal.addLine(`Agent${agents.length > 1 ? 's' : ''} online: ${agents.join(', ')}`);
    this.terminal.addLine('');

    // ── "START TYPING" hint ──
    this.typeHint = this.add.text(
      16 + tArea.x + tArea.width / 2,
      72 + tArea.y + tArea.height / 2 - 20,
      '⌨️  START TYPING TO BUILD  ⌨️',
      { fontFamily: 'monospace', fontSize: '20px', color: '#58a6ff', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(50);

    this.typeHintTween = this.tweens.add({
      targets: this.typeHint,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // ── Typing engine — timers start on first keystroke ──
    this.typingEngine = new TypingEngine(this, this.terminal, () => {
      this.onPromptComplete();
    }, () => {
      this.onFirstKeystroke();
    });
    this.typingEngine.start();
  }

  /** Called once on the very first keystroke */
  private onFirstKeystroke(): void {
    if (this.startedTyping) return;
    this.startedTyping = true;

    // Kill the hint
    this.typeHintTween?.destroy();
    this.tweens.add({
      targets: this.typeHint,
      alpha: 0, y: this.typeHint.y - 30,
      duration: 400, ease: 'Power2',
      onComplete: () => this.typeHint.destroy(),
    });

    // NOW start the day timer and event timer
    const tickMs = 4500;
    this.dayTimer = this.time.addEvent({
      delay: tickMs,
      repeat: this.timeUnits - 1,
      callback: () => this.tickTime(),
    });

    // First event fires quickly so the player learns the rhythm
    this.time.delayedCall(5000, () => {
      if (this.timeUnits > 0) this.fireEvent();
    });

    // Subsequent events on interval
    this.eventTimer = this.time.addEvent({
      delay: EVENT_INTERVAL_MS,
      loop: true,
      startAt: EVENT_INTERVAL_MS - 5000, // offset so first interval accounts for the early fire
      callback: () => this.fireEvent(),
    });

    this.terminal.addLine('Ready. Building...');
  }

  private onPromptComplete(): void {
    const accuracy = this.typingEngine.getAccuracy();
    const gain = 8 + Math.floor(accuracy * 7);
    this.progress = Math.min(100, this.progress + gain);
    this.updateProgressBar();
  }

  private tickTime(): void {
    this.timeUnits--;
    const state = getState();
    state.timeUnitsRemaining = this.timeUnits;

    const frac = this.timeUnits / TIME_UNITS_PER_DAY;
    this.timeBar.width = this.timeBg.width * frac;
    if (frac <= 0.3) this.timeBar.setFillStyle(COLORS.error);

    this.taskbar.refresh();

    if (this.timeUnits <= 0) {
      this.endDay();
    }
  }

  // ── Event modal system ──

  private fireEvent(): void {
    // Don't stack modals
    if (this.modalGroup) return;
    if (this.timeUnits <= 0) return;

    const evt = Phaser.Utils.Array.GetRandom(PLACEHOLDER_EVENTS);
    this.showEventModal(evt.title, evt.body, evt.choices);
  }

  private showEventModal(title: string, body: string, choices: string[]): void {
    this.typingEngine.pause();

    this.modalGroup = this.add.container(0, 0).setDepth(200);

    // Dim overlay
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0)
      .setInteractive(); // blocks clicks through
    this.modalGroup.add(overlay);

    // Dialog box
    const dw = 480;
    const dh = 260 + choices.length * 40;
    const dx = (GAME_WIDTH - dw) / 2;
    const dy = (GAME_HEIGHT - dh) / 2 - 20;

    // Border
    const border = this.add.rectangle(dx - 1, dy - 1, dw + 2, dh + 2, COLORS.windowBorder).setOrigin(0);
    this.modalGroup.add(border);

    // Background
    const bg = this.add.rectangle(dx, dy, dw, dh, COLORS.windowBg).setOrigin(0);
    this.modalGroup.add(bg);

    // Title bar
    const tb = this.add.rectangle(dx, dy, dw, 28, COLORS.titleBar).setOrigin(0);
    this.modalGroup.add(tb);

    // Accent strip
    const strip = this.add.rectangle(dx, dy + 28, dw, 2, COLORS.error).setOrigin(0);
    this.modalGroup.add(strip);

    // Title
    const titleObj = this.add.text(dx + 12, dy + 6, title, {
      fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3',
    });
    this.modalGroup.add(titleObj);

    // Body
    const bodyObj = this.add.text(dx + 20, dy + 48, body, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
      lineSpacing: 6, wordWrap: { width: dw - 40 },
    });
    this.modalGroup.add(bodyObj);

    // Choice buttons
    const choiceStartY = dy + 48 + 60 + 20;
    choices.forEach((choice, i) => {
      const btnY = choiceStartY + i * 40;

      const btnBg = this.add.rectangle(dx + 20, btnY, dw - 40, 32, COLORS.titleBar).setOrigin(0)
        .setInteractive({ useHandCursor: true });
      this.modalGroup!.add(btnBg);

      const btnText = this.add.text(dx + 32, btnY + 7, `[${i + 1}] ${choice}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#58a6ff',
      });
      this.modalGroup!.add(btnText);

      btnBg.on('pointerover', () => btnBg.setFillStyle(COLORS.windowBorder));
      btnBg.on('pointerout', () => btnBg.setFillStyle(COLORS.titleBar));
      btnBg.on('pointerdown', () => this.resolveEvent(i, choice));
    });

    // Keyboard shortcuts (1/2/3)
    this.input.keyboard!.once('keydown-ONE', () => this.resolveEvent(0, choices[0]));
    this.input.keyboard!.once('keydown-TWO', () => choices.length > 1 && this.resolveEvent(1, choices[1]));
    this.input.keyboard!.once('keydown-THREE', () => choices.length > 2 && this.resolveEvent(2, choices[2]));

    // Slide-in animation
    this.modalGroup.setAlpha(0);
    this.tweens.add({
      targets: this.modalGroup,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });
  }

  private resolveEvent(choiceIndex: number, choiceText: string): void {
    if (!this.modalGroup) return;

    this.terminal.addLine(`> Event: chose "${choiceText}"`);

    // TODO: apply actual event consequences from EventEngine
    // For now, minor placeholder effects
    const state = getState();
    if (choiceText.includes('$')) {
      const match = choiceText.match(/\$(\d+)/);
      if (match) state.budget -= parseInt(match[1], 10);
    }
    if (choiceText.includes('lose 1 time') && this.timeUnits > 1) {
      this.timeUnits--;
      state.timeUnitsRemaining = this.timeUnits;
    }

    // Close modal
    this.tweens.add({
      targets: this.modalGroup,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.modalGroup?.destroy();
        this.modalGroup = undefined;
        this.typingEngine.resume();
        this.taskbar.refresh();
      },
    });
  }

  private updateProgressBar(): void {
    const frac = this.progress / 100;
    this.progressBar.width = this.progressBg.width * frac;
    this.progressText.setText(`${this.progress}%`);
    if (this.progress >= 100) {
      this.progressBar.setFillStyle(COLORS.success);
    }
  }

  private endDay(): void {
    this.typingEngine.stop();
    this.eventTimer?.destroy();

    const state = getState();
    const baseRep = Math.floor(this.progress * 0.5);
    const accuracyBonus = Math.floor(this.typingEngine.getAccuracy() * 20);
    const totalRep = baseRep + accuracyBonus;
    state.reputation += totalRep;
    state.dayScores.push(totalRep);

    this.scene.start('Results');
  }

  shutdown(): void {
    this.typingEngine?.destroy();
    this.taskbar?.destroy();
    this.terminal?.destroy();
    this.terminalWindow?.destroy();
    this.agentWindow?.destroy();
    this.resourceWindow?.destroy();
    this.modalGroup?.destroy();
  }
}
