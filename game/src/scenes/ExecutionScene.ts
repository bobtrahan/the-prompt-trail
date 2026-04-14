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
  private progress = 0; // 0-100
  private timeUnits = TIME_UNITS_PER_DAY;
  private timeBar!: Phaser.GameObjects.Rectangle;
  private timeBg!: Phaser.GameObjects.Rectangle;

  // Timer
  private dayTimer!: Phaser.Time.TimerEvent;
  private eventTimer!: Phaser.Time.TimerEvent;

  // Header
  private projectTitle!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Execution' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.progress = 0;
    this.timeUnits = state.timeUnitsRemaining;

    // ── Taskbar ──
    this.taskbar = new Taskbar(this, theme.accent);

    // ── Desktop wallpaper text ──
    this.add.text(12, 8, `PromptOS  ·  Day ${state.day}/13  ·  ${state.className}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#30363d',
    });

    // ── Project header bar ──
    const headerBg = this.add.rectangle(0, 28, GAME_WIDTH, 36, COLORS.titleBar).setOrigin(0);
    const projectName = DAY_PROJECTS[(state.day - 1) % DAY_PROJECTS.length];
    this.projectTitle = this.add.text(16, 34, `📋 Building: ${projectName}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
    });

    // Strategy badge
    const stratLabel = state.strategy ?? 'unknown';
    this.add.text(GAME_WIDTH - 200, 34, `Strategy: ${stratLabel}`, {
      fontFamily: 'monospace', fontSize: '12px',
      color: Phaser.Display.Color.IntegerToColor(theme.accent).rgba,
    });

    // ── Terminal Window (main area) ──
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

    // ── Progress bar (inside terminal window, near top) ──
    const pBarY = 72 + tArea.y + tArea.height + 6;
    // Actually put it ABOVE terminal content, inside the window
    // Let's place progress bar at bottom of the terminal window area
    this.progressBg = this.add.rectangle(16 + tArea.x, 72 + tArea.y - 2, tArea.width, 12, 0x21262d).setOrigin(0);
    this.progressBar = this.add.rectangle(16 + tArea.x, 72 + tArea.y - 2, 0, 12, theme.accent).setOrigin(0);
    this.progressText = this.add.text(16 + tArea.x + tArea.width / 2, 72 + tArea.y - 1, '0%', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e6edf3',
    }).setOrigin(0.5, 0);

    // ── Agent Panel (right side) ──
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

      // Animated dots
      let dots = 0;
      this.time.addEvent({
        delay: 600 + i * 200,
        loop: true,
        callback: () => {
          dots = (dots + 1) % 4;
          status.setText('⚡ Working' + '.'.repeat(dots));
        },
      });
    });

    // ── Resource Panel (right side, below agents) ──
    this.resourceWindow = new Window({
      scene: this, x: 852, y: 288,
      width: 412, height: 224,
      title: 'System Monitor',
      titleIcon: '📊',
      accentColor: theme.accent,
    });

    const rArea = this.resourceWindow.contentArea;
    const rStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
    };
    const rX = 852 + rArea.x;
    const rY = 288 + rArea.y;

    this.add.text(rX, rY, `💰 Budget: $${state.budget.toLocaleString()}`, rStyle);
    this.add.text(rX, rY + 28, `🖥️ Hardware: ${state.hardwareHp}%`, rStyle);
    this.add.text(rX, rY + 56, `⭐ Reputation: ${state.reputation}`, rStyle);
    this.add.text(rX, rY + 84, `📡 Model: ${state.model}`, rStyle);

    // Time bar
    this.add.text(rX, rY + 120, '⏱️ Time Remaining:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
    });
    this.timeBg = this.add.rectangle(rX, rY + 140, rArea.width - 16, 14, 0x21262d).setOrigin(0);
    this.timeBar = this.add.rectangle(rX, rY + 140, rArea.width - 16, 14, COLORS.warning).setOrigin(0);

    // ── Typing engine ──
    this.terminal.addLine('PromptOS Terminal v1.3.7');
    this.terminal.addLine(`Loading project: ${projectName}...`);
    this.terminal.addLine(`Agent${agents.length > 1 ? 's' : ''} online: ${agents.join(', ')}`);
    this.terminal.addLine('Ready. Start typing to build.');
    this.terminal.addLine('');

    this.typingEngine = new TypingEngine(this, this.terminal, () => {
      this.onPromptComplete();
    });
    this.typingEngine.start();

    // ── Day timer (ticks down time units) ──
    const tickMs = 4500; // each time unit is ~4.5 sec → 45 sec total per day
    this.dayTimer = this.time.addEvent({
      delay: tickMs,
      repeat: this.timeUnits - 1,
      callback: () => this.tickTime(),
    });

    // ── Event timer placeholder (fires every ~9 sec) ──
    // TODO: wire to EventEngine once events are built
    this.eventTimer = this.time.addEvent({
      delay: EVENT_INTERVAL_MS,
      loop: true,
      callback: () => this.fireEvent(),
    });
  }

  private onPromptComplete(): void {
    // Each completed prompt adds progress based on accuracy
    const accuracy = this.typingEngine.getAccuracy();
    const gain = 8 + Math.floor(accuracy * 7); // 8-15% per prompt
    this.progress = Math.min(100, this.progress + gain);
    this.updateProgressBar();
  }

  private tickTime(): void {
    this.timeUnits--;
    const state = getState();
    state.timeUnitsRemaining = this.timeUnits;

    // Update time bar
    const frac = this.timeUnits / TIME_UNITS_PER_DAY;
    this.timeBar.width = this.timeBg.width * frac;
    if (frac <= 0.3) this.timeBar.setFillStyle(COLORS.error);

    this.taskbar.refresh();

    if (this.timeUnits <= 0) {
      this.endDay();
    }
  }

  private fireEvent(): void {
    // Placeholder — will hook into EventEngine
    // For now, just show a notification-style message in terminal
    const events = [
      '⚠️ API rate limit hit — switching to backup...',
      '📡 Model latency spike detected.',
      '🔥 Agent entered an infinite loop. Restarting...',
      '💸 Token usage exceeded estimate by 40%.',
      '🐛 Build failed: missing semicolon on line 42.',
      '⚡ Power flickered. Context window lost.',
    ];
    const msg = Phaser.Utils.Array.GetRandom(events);
    this.terminal.addLine(msg);
  }

  private updateProgressBar(): void {
    const theme = getTheme(getState().playerClass ?? undefined);
    const frac = this.progress / 100;
    this.progressBar.width = this.progressBg.width * frac;
    this.progressText.setText(`${this.progress}%`);
    if (this.progress >= 100) {
      this.progressBar.setFillStyle(COLORS.success);
    }
  }

  private endDay(): void {
    this.typingEngine.stop();
    this.eventTimer.destroy();

    const state = getState();
    const stats = this.typingEngine.getStats();

    // Calculate reputation earned
    const baseRep = Math.floor(this.progress * 0.5);
    const accuracyBonus = Math.floor(this.typingEngine.getAccuracy() * 20);
    const totalRep = baseRep + accuracyBonus;
    state.reputation += totalRep;

    // Store for results screen
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
  }
}
