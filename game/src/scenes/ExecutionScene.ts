import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, TIME_UNITS_PER_DAY, EVENT_INTERVAL_MS } from '../utils/constants';
import { getState, CLASS_DEFS } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { Terminal } from '../ui/Terminal';
import { TypingEngine } from '../systems/TypingEngine';
import { PROJECTS } from '../data/projects';
import { EventEngine } from '../systems/EventEngine';
import { EconomySystem } from '../systems/EconomySystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { AgentSystem } from '../systems/AgentSystem';
import type { EventDef, EventChoice } from '../data/events';



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
  private currentEvent?: EventDef;

  // Completion / Overtime
  private inOvertime: boolean = false;
  private overtimeBonus: number = 0;
  private completionShown: boolean = false;
  private overtimeText?: Phaser.GameObjects.Text;
  private overtimePrompts: string[] = [
    'kubectl rollout status',
    'tail -f /var/log/prod.log',
    'curl -I https://api.prod',
    'systemctl restart app',
    'grafana alert silence',
    'pg_dump --format=custom',
    'nginx -t && nginx -s reload',
    'ssh bastion -- uptime',
  ];

  // Systems
  private eventEngine!: EventEngine;
  private speedMod: number = 0;
  private traitResults: { agentId: string; trait: string; fired: boolean; description: string }[] = [];

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

    // Initialise systems
    this.eventEngine = new EventEngine(state);
    this.speedMod = AgentSystem.getSpeedModifier(state.activeAgents);
    this.traitResults = AgentSystem.checkTraits(state.activeAgents, state.day);
    EconomySystem.applyDayCosts(state);
    state.dayStartBudget = state.budget;
    state.dayStartHardware = state.hardwareHp;

    // ── Taskbar ──
    this.taskbar = new Taskbar(this, theme.accent);

    // ── Desktop label ──
    this.add.text(12, 8, `PromptOS  ·  Day ${state.day}/13  ·  ${state.className}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#30363d',
    });

    // ── Project header bar ──
    this.add.rectangle(0, 28, GAME_WIDTH, 36, COLORS.titleBar).setOrigin(0);
    const projectName = PROJECTS[state.day - 1]?.name ?? `Day ${state.day} Project`;
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

    const activeAgentIds = state.activeAgents.length > 0 ? state.activeAgents : ['turbo'];
    const agentDefs = AgentSystem.getAgentDefs(activeAgentIds);
    const aArea = this.agentWindow.contentArea;
    agentDefs.forEach((agent, i) => {
      const label = this.add.text(
        852 + aArea.x, 72 + aArea.y + i * 40,
        `🤖 ${agent.name}`,
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

    this.add.text(rX, rY, state.playerClass === 'corporateDev' ? '💳 Company Card' : `💰 Budget: $${state.budget.toLocaleString()}`, rStyle);
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
    this.terminal.addLine(`Agent${agentDefs.length > 1 ? 's' : ''} online: ${agentDefs.map(a => a.name).join(', ')}`);
    if (state.eventFlags['broke']) {
      this.terminal.addLine('⚠️ BUDGET DEPLETED — API credits revoked. Downgraded to Free Tier.');
    }
    this.terminal.addLine('');

    // Apply trait effects
    this.traitResults.forEach(res => {
      if (res.fired) {
        if (res.trait === 'architecture_debates') {
          state.timeUnitsRemaining -= 1;
          this.terminal.addLine("🤖 Linter: 'We need to discuss the architecture first.'");
        } else if (res.trait === 'deploy_unapproved') {
          this.progress = Math.min(100, this.progress + 10);
          state.eventFlags['turbo_deployed'] = true;
          this.terminal.addLine("🤖 Turbo: 'Already deployed. You're welcome.'");
        } else if (res.trait === 'feature_creep') {
          state.timeUnitsRemaining -= 2;
          this.terminal.addLine("🤖 Scope: 'I added dark mode and a settings page! You're welcome!'");
        } else if (res.trait === 'low_hallucination') {
          this.terminal.addLine("🤖 Oracle: 'I have seen the future. It is... mostly fine.'");
        } else if (res.trait === 'agreeable') {
          this.terminal.addLine("🤖 Parrot: 'Exactly what I was thinking!'");
        } else if (res.trait === 'wildcard_shortcut') {
          this.terminal.addLine("🤖 Gremlin: 'I found a shortcut! Don't ask how.'");
        }
      }
    });

    // Update timeUnits in case traits changed it
    this.timeUnits = state.timeUnitsRemaining;
    this.updateProgressBar();

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
    const gain = Math.round((8 + Math.floor(accuracy * 7)) * (1 + this.speedMod));
    this.progress = Math.min(100, this.progress + gain);
    this.updateProgressBar();

    if (this.progress >= 100 && !this.completionShown && !this.inOvertime) {
      this.showCompletionChoice();
    } else if (this.inOvertime) {
      this.overtimeBonus = Math.min(20, this.overtimeBonus + 1);
      if (this.overtimeText) {
        this.overtimeText.setText(`Production ♙: +${this.overtimeBonus}`);
      }
    }
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
      // If completion modal is still open when time runs out, dismiss and end normally
      if (this.completionShown && this.modalGroup) {
        this.modalGroup.destroy();
        this.modalGroup = undefined;
      }
      this.endDay();
    }
  }

  // ── Event modal system ──

  private fireEvent(): void {
    // Don't stack modals
    if (this.modalGroup) return;
    if (this.timeUnits <= 0) return;

    const evt = this.eventEngine.selectEvent();
    if (!evt) return;

    this.currentEvent = evt;
    this.showEventModal(evt);
  }

  private showEventModal(evt: EventDef): void {
    const { title, body, choices } = evt;
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
    let cumulativeY = choiceStartY;
    choices.forEach((choice, i) => {
      const btnTextObj = this.add.text(dx + 32, cumulativeY + 7, `[${i + 1}] ${(choice as EventChoice).text}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#58a6ff',
        wordWrap: { width: dw - 72 },
      });
      const btnH = Math.max(32, btnTextObj.height + 14);
      btnTextObj.setY(cumulativeY + (btnH - btnTextObj.height) / 2);

      const btnBg = this.add.rectangle(dx + 20, cumulativeY, dw - 40, btnH, COLORS.titleBar).setOrigin(0)
        .setInteractive({ useHandCursor: true });
      this.modalGroup!.add(btnBg);
      this.modalGroup!.add(btnTextObj);

      btnBg.on('pointerover', () => btnBg.setFillStyle(COLORS.windowBorder));
      btnBg.on('pointerout', () => btnBg.setFillStyle(COLORS.titleBar));
      btnBg.on('pointerdown', () => this.resolveEvent(i, choice as EventChoice));

      cumulativeY += btnH + 8;
    });

    // Keyboard shortcuts (1/2/3)
    this.input.keyboard!.once('keydown-ONE', () => this.resolveEvent(0, choices[0] as EventChoice));
    this.input.keyboard!.once('keydown-TWO', () => choices.length > 1 && this.resolveEvent(1, choices[1] as EventChoice));
    this.input.keyboard!.once('keydown-THREE', () => choices.length > 2 && this.resolveEvent(2, choices[2] as EventChoice));

    // Slide-in animation
    this.modalGroup.setAlpha(0);
    this.tweens.add({
      targets: this.modalGroup,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });
  }

  private resolveEvent(choiceIndex: number, choice: EventChoice): void {
    if (!this.modalGroup) return;

    this.terminal.addLine(`> Event: chose "${choice.text}"`);

    const state = getState();
    const logs = this.eventEngine.applyEffects(choice, state);
    for (const line of logs) {
      this.terminal.addLine(line);
    }

    if (this.currentEvent) {
      this.eventEngine.markFired(this.currentEvent.id, state.day);
      this.currentEvent = undefined;
    }

    // Sync local timeUnits from state (in case event changed time)
    this.timeUnits = state.timeUnitsRemaining;

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

  // ── Completion Choice modal ──

  private showCompletionChoice(): void {
    this.completionShown = true;
    this.typingEngine.pause();

    const dw = 480;
    const dh = 260;
    const dx = (GAME_WIDTH - dw) / 2;
    const dy = (GAME_HEIGHT - dh) / 2 - 20;

    this.modalGroup = this.add.container(0, 0).setDepth(200);

    // Dim overlay
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive();
    this.modalGroup.add(overlay);

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
    const strip = this.add.rectangle(dx, dy + 28, dw, 2, COLORS.success).setOrigin(0);
    this.modalGroup.add(strip);

    // Title
    const titleObj = this.add.text(dx + 12, dy + 6, '✅ Project Complete!', {
      fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3',
    });
    this.modalGroup.add(titleObj);

    // Body
    const bodyObj = this.add.text(dx + 20, dy + 48, 'You finished early. What now?', {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
      lineSpacing: 6, wordWrap: { width: dw - 40 },
    });
    this.modalGroup.add(bodyObj);

    // Button 1 — Bug Hunt
    const btn1Y = dy + 130;
    const btn1Bg = this.add.rectangle(dx + 20, btn1Y, dw - 40, 40, COLORS.titleBar).setOrigin(0).setInteractive({ useHandCursor: true });
    this.modalGroup.add(btn1Bg);
    const btn1Text = this.add.text(dx + 32, btn1Y + 12, '[ 🐛 Bug Hunt Bonus ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#58a6ff',
    });
    this.modalGroup.add(btn1Text);
    btn1Bg.on('pointerover', () => btn1Bg.setFillStyle(COLORS.windowBorder));
    btn1Bg.on('pointerout', () => btn1Bg.setFillStyle(COLORS.titleBar));
    btn1Bg.on('pointerdown', () => this.chooseBugHunt());

    // Button 2 — Overtime
    const btn2Y = dy + 180;
    const btn2Bg = this.add.rectangle(dx + 20, btn2Y, dw - 40, 40, COLORS.titleBar).setOrigin(0).setInteractive({ useHandCursor: true });
    this.modalGroup.add(btn2Bg);
    const btn2Text = this.add.text(dx + 32, btn2Y + 12, '[ 🚀 Ship to Production ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#58a6ff',
    });
    this.modalGroup.add(btn2Text);
    btn2Bg.on('pointerover', () => btn2Bg.setFillStyle(COLORS.windowBorder));
    btn2Bg.on('pointerout', () => btn2Bg.setFillStyle(COLORS.titleBar));
    btn2Bg.on('pointerdown', () => this.chooseOvertime());

    this.modalGroup.setAlpha(0);
    this.tweens.add({ targets: this.modalGroup, alpha: 1, duration: 200, ease: 'Power2' });
  }

  private chooseBugHunt(): void {
    this.modalGroup?.destroy();
    this.modalGroup = undefined;

    const state = getState();
    state.bugHuntReturnScene = 'Results';
    this.scoreDayAndStore();
    this.scene.start('BugBounty');
  }

  private chooseOvertime(): void {
    this.modalGroup?.destroy();
    this.modalGroup = undefined;

    this.inOvertime = true;
    this.typingEngine.resume();
    this.terminal.addLine('Deploying to production...');

    // Swap prompt pool
    this.typingEngine.setPromptPool(this.overtimePrompts);

    // Show overtime counter overlay in terminal window corner
    const tArea = this.terminalWindow.contentArea;
    this.overtimeText = this.add.text(
      16 + tArea.x + tArea.width - 8,
      72 + tArea.y - 14,
      'Production ♙: +0',
      { fontFamily: 'monospace', fontSize: '11px', color: '#f0883e' }
    ).setOrigin(1, 0).setDepth(100);
  }

  // ── Scoring ──

  private scoreDayAndStore(): void {
    this.typingEngine.stop();
    this.eventTimer?.destroy();

    const state = getState();
    const dayScore = ScoringSystem.calcDayReputation(
      this.progress,
      this.typingEngine.getAccuracy(),
      state.strategy!,
      CLASS_DEFS[state.playerClass!],
      state.day
    );

    // Add overtime bonus to total
    dayScore.total += this.overtimeBonus;

    state.lastDayResult = {
      progress: this.progress,
      accuracy: this.typingEngine.getAccuracy(),
      score: dayScore,
      budgetSpent: state.dayStartBudget - state.budget,
      hardwareDelta: state.hardwareHp - state.dayStartHardware,
    };

    state.overtimeBonus = this.overtimeBonus;
    state.reputation += dayScore.total;
    state.dayScores.push(dayScore.total);
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
    this.scoreDayAndStore();
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
