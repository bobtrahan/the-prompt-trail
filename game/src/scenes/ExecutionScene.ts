import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, TIME_UNITS_PER_DAY, EVENT_INTERVAL_MS } from '../utils/constants';
import { getState, type GameState } from '../systems/GameState';
import { CLASS_DEFS } from '../data/classes';
import { Telemetry } from '../systems/Telemetry';
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
import AudioManager from '../systems/AudioManager';
import type { EventDef, EventChoice } from '../data/events';
import { drawWallpaper } from '../ui/DesktopWallpaper';



export class ExecutionScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private terminalWindow!: Window;
  private terminal!: Terminal;
  private typingEngine!: TypingEngine;
  private agentWindow!: Window;
  private resourceWindow!: Window;
  private typoForgiveness = 0;

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
  private eventCountdownTimer?: Phaser.Time.TimerEvent;
  private eventCountdownText?: Phaser.GameObjects.Text;

  // Completion / Overtime
  private inOvertime: boolean = false;
  private overtimeBonus: number = 0;
  private overtimePromptsCompleted: number = 0;
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

  // Resource display refs (for flash feedback)
  private budgetText!: Phaser.GameObjects.Text;
  private hardwareText!: Phaser.GameObjects.Text;
  private repText!: Phaser.GameObjects.Text;

  // Hardware bar (live update)
  private hwBar!: Phaser.GameObjects.Rectangle;
  private hwBarBg!: Phaser.GameObjects.Rectangle;
  private lastHw: number = -1;
  private hwBarFlashing: boolean = false;

  // Systems
  private eventEngine!: EventEngine;
  private speedMod: number = 0;
  private modelQualityMod: number = 0;
  private traitResults: { agentId: string; trait: string; fired: boolean; description: string }[] = [];

  private processConsumables(): void {
    const state = getState();
    if (!state.activeConsumables || state.activeConsumables.length === 0) return;

    // We need to copy and clear to avoid concurrent modification issues if any
    const toProcess = [...state.activeConsumables];
    
    toProcess.forEach(id => {
      let msg = "";

      switch (id) {
        case 'con-coffee':
          this.typingEngine.speedModifier += 0.05;
          msg = "";
          break;
        case 'con-energy':
          this.typingEngine.speedModifier += 0.1;
          this.typingEngine.jitterChance = 0.2;
          msg = "";
          break;
        case 'con-backup':
          state.hasBackupProtection = true;
          msg = "";
          break;
        case 'con-api':
          state.modelCostDiscount = 0.5;
          msg = "";
          break;
        case 'con-duck':
          state.hasDuckProtection = true;
          msg = "";
          break;
      }

      // Just track which consumables were used; UI notifications are shown separately
      state.consumablesUsedToday.push(id);
    });

    state.activeConsumables = [];
  }

  /** Show sequential UI notifications for each activated consumable. Returns a promise that resolves when all are done. */
  private async showConsumableNotifications(): Promise<void> {
    const state = getState();
    if (!state.consumablesUsedToday || state.consumablesUsedToday.length === 0) {
      return Promise.resolve();
    }

    // Map consumable IDs to their display text
    const consumableTexts: Record<string, string> = {
      'con-coffee': '☕ Coffee Boost — +5% Speed',
      'con-energy': '⚡ Energy Drink — +10% Speed, Jitters Active',
      'con-backup': '☁️ Cloud Backup — Protection Active',
      'con-api': '💳 API Credits — Model Costs -50%',
      'con-duck': '🦆 Rubber Duck — Auto-Resolve Ready',
    };

    // Show each notification sequentially (1.5 seconds per notification: 0.3s fade in, 0.9s hold, 0.3s fade out)
    for (const consumableId of state.consumablesUsedToday) {
      const text = consumableTexts[consumableId];
      if (!text) continue;

      await this.showSingleConsumableNotification(text);
    }
  }

  /** Show a single consumable notification with fade in/hold/fade out (1.5 seconds total). Returns a promise. */
  private showSingleConsumableNotification(text: string): Promise<void> {
    return new Promise(resolve => {
      // Play SFX
      AudioManager.getInstance().playSFX('notification');

      // Create centered text notification
      const notificationText = this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        text,
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#58a6ff',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center',
        }
      ).setOrigin(0.5).setDepth(500).setAlpha(0);

      // Fade in (0.3s)
      this.tweens.add({
        targets: notificationText,
        alpha: 1,
        duration: 300,
        ease: 'Power2.out',
        onComplete: () => {
          // Hold (0.9s)
          this.time.delayedCall(900, () => {
            // Fade out (0.3s)
            this.tweens.add({
              targets: notificationText,
              alpha: 0,
              duration: 300,
              ease: 'Power2.in',
              onComplete: () => {
                notificationText.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }

  private showFlashMessage(text: string): void {
    const flash = this.add.text(GAME_WIDTH / 2, 120, text, {
      fontFamily: 'monospace', fontSize: '24px', color: '#58a6ff',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(500);

    this.tweens.add({
      targets: flash,
      y: flash.y - 40,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }

  constructor() {
    super({ key: 'Execution' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);

    if (state.day >= 11) {
      AudioManager.getInstance().playMusic('execution-late');
    } else {
      AudioManager.getInstance().playMusic('execution');
    }

    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);
    this.progress = 0;
    this.timeUnits = state.timeUnitsRemaining;
    this.startedTyping = false;

    // Initialise systems
    this.eventEngine = new EventEngine(state);
    this.speedMod = AgentSystem.getSpeedModifier(state.activeAgents);
    this.modelQualityMod = EconomySystem.getModelQualityMod(state.model);

    // Apply hardware upgrades
    if (state.ownedUpgrades.includes('hw-monitor')) {
      this.speedMod += 0.05;
    }
    if (state.ownedUpgrades.includes('hw-keyboard')) {
      this.typoForgiveness = 1;
    }

    this.traitResults = AgentSystem.checkTraits(state.activeAgents, state.day);
    EconomySystem.applyDayCosts(state);
    state.dayStartBudget = state.budget;
    Telemetry.logDayStart(state);
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

    // ── Progress bar (bottom of terminal window content, above prompt) ──
    const pbY = 72 + tArea.y + tArea.height - 56;
    this.progressBg = this.add.rectangle(16 + tArea.x, pbY, tArea.width, 12, 0x21262d).setOrigin(0).setDepth(150);
    this.progressBar = this.add.rectangle(16 + tArea.x, pbY, 0, 12, theme.accent).setOrigin(0).setDepth(151);
    this.progressText = this.add.text(16 + tArea.x + tArea.width / 2, pbY + 1, '0%', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e6edf3',
    }).setOrigin(0.5, 0).setDepth(152);

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
      const rowBaseY = 72 + aArea.y + i * 48;

      const label = this.add.text(
        852 + aArea.x, rowBaseY,
        `🤖 ${agent.name}`,
        { fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3' }
      );
      this.agentWindow.add(label);

      const status = this.add.text(
        852 + aArea.x + 140, rowBaseY,
        '⚡ Working...',
        { fontFamily: 'monospace', fontSize: '12px', color: '#39d353' }
      );
      this.agentWindow.add(status);

      let dots = 0;
      this.time.addEvent({
        delay: 600 + i * 200, loop: true,
        callback: () => { dots = (dots + 1) % 4; status.setText('⚡ Working' + '.'.repeat(dots)); },
      });

      // Speed bar: 5 × 8×8 rectangles, 2px gap
      for (let s = 0; s < 5; s++) {
        const filled = s < agent.speed;
        const speedRect = this.add.rectangle(
          852 + aArea.x + s * 10,
          rowBaseY + 22,
          8, 8,
          filled ? theme.accent : 0x21262d
        ).setOrigin(0);
        this.agentWindow.add(speedRect);
      }

      // Trait label
      const traitLabel = this.add.text(
        852 + aArea.x + 58,
        rowBaseY + 21,
        agent.trait,
        { fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0' }
      );
      this.agentWindow.add(traitLabel);
    });

    // Hint if only 1 agent
    if (agentDefs.length === 1) {
      const hintY = 72 + aArea.y + 1 * 48 + 8;
      const slotHint = this.add.text(
        852 + aArea.x,
        hintY,
        '💡 Buy agent slots at Token Market',
        { fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0', fontStyle: 'italic' }
      );
      this.agentWindow.add(slotHint);
    }

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

    this.budgetText = this.add.text(rX, rY, state.playerClass === 'corporateDev' ? '💳 Company Card' : `💰 Budget: $${state.budget.toLocaleString()}`, rStyle);
    this.hardwareText = this.add.text(rX, rY + 28, `🖥️ Hardware: ${state.hardwareHp}%`, rStyle);

    // Hardware health bar
    const hwPct = state.hardwareHp / 100;
    const hwBarColor = state.hardwareHp >= 60 ? 0x3fb950 : state.hardwareHp >= 30 ? 0xd29922 : 0xf85149;
    this.hwBarBg = this.add.rectangle(rX, rY + 42, 160, 6, 0x21262d).setOrigin(0);
    this.hwBar = this.add.rectangle(rX, rY + 42, Math.round(hwPct * 160), 6, hwBarColor).setOrigin(0);
    this.lastHw = state.hardwareHp;

    this.repText = this.add.text(rX, rY + 56, `⭐ Reputation: ${state.reputation}`, rStyle);

    // Model text + quality indicator tag
    this.add.text(rX, rY + 84, `📡 Model: ${state.model}`, rStyle);
    const qualityMod = EconomySystem.getModelQualityMod(state.model);
    const qualityPct = Math.round(qualityMod * 100);
    const qualityTag = qualityPct > 0 ? `[+${qualityPct}%]` : qualityPct < 0 ? `[${qualityPct}%]` : '[+0%]';
    const qualityColor = qualityPct > 0 ? '#3fb950' : qualityPct < 0 ? '#f85149' : '#9da5b0';
    this.add.text(rX + 170, rY + 84, qualityTag, {
      fontFamily: 'monospace', fontSize: '12px', color: qualityColor,
    });

    this.add.text(rX, rY + 106, '⏱️ Time Remaining:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
    });
    this.timeBg = this.add.rectangle(rX, rY + 120, rArea.width - 16, 14, 0x21262d).setOrigin(0);
    this.timeBar = this.add.rectangle(rX, rY + 120, rArea.width - 16, 14, COLORS.warning).setOrigin(0);

    // ── Terminal boot text ──
    this.terminal.addLine('PromptOS Terminal v1.3.7');
    this.terminal.addLine(`Loading project: ${projectName}...`);
    this.terminal.addLine(`Agent${agentDefs.length > 1 ? 's' : ''} online: ${agentDefs.map(a => a.name).join(', ')}`);
    
    const modPct = Math.round(this.modelQualityMod * 100);
    const modSign = modPct >= 0 ? '+' : '';
    let modText = `📡 Model: ${state.model} (${modSign}${modPct}% quality)`;
    if (state.model === 'free') {
      modText += ' — upgrade at Token Market';
    }
    this.terminal.addLine(modText);

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

    // ── Typing engine — timers start on first keystroke ──
    this.typingEngine = new TypingEngine(this, this.terminal, () => {
      this.onPromptComplete();
    }, () => {
      this.onFirstKeystroke();
    }, this.typoForgiveness);

    // ── Process consumables and show notification sequence before typing begins ──
    this.processConsumables();
    
    // Show consumable notifications, then show typing hint
    this.showConsumableNotifications().then(() => {
      // After notifications complete, show the "START TYPING" hint
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

      this.typingEngine.start();
    });
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
    const baseGain = 8 + Math.floor(accuracy * 7);
    const speedModFactor = this.typingEngine.speedModifier + this.speedMod;
    const gain = Math.round(baseGain * speedModFactor * (1 + this.modelQualityMod));
    this.progress = Math.min(100, this.progress + gain);
    this.updateProgressBar();

    if (this.progress >= 100 && !this.completionShown && !this.inOvertime) {
      this.showCompletionChoice();
    } else if (this.inOvertime) {
      this.overtimePromptsCompleted++;
      this.overtimeBonus += 3;
      if (this.overtimeText) {
        this.overtimeText.setText(`Production ♙: +${this.overtimeBonus}`);
      }
    }
  }

  private tickTime(): void {
    if (window.__GOD_MODE) return;
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

    const state = getState();
    const isStuckEvent = evt.id.includes('agent_stuck') || evt.id.includes('stuck');
    
    if (isStuckEvent && state.hasDuckProtection) {
      state.hasDuckProtection = false;
      this.terminal.addLine("🦆 Rubber Duck resolved the issue!");
      this.showFlashMessage("🦆 Rubber Duck resolved the issue!");
      AudioManager.getInstance().playSFX('notification');
      this.resolveEvent(0, evt.choices[0], true);
      return;
    }

    this.currentEvent = evt;
    this.showEventModal(evt);
  }

  private showEventModal(evt: EventDef): void {
    const { title, body, choices } = evt;
    this.typingEngine.pause();

    const am = AudioManager.getInstance();
    if (evt.tags.includes('rare')) {
      am.playSFX('critical');
    } else if (evt.category === 'technical' || evt.category === 'hardware') {
      am.playSFX('error');
    } else {
      am.playSFX('notification');
    }

    // Pause day timer while event modal is open
    if (this.dayTimer) this.dayTimer.paused = true;

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
      const btnTextObj = this.add.text(dx + 32, cumulativeY + 7, `[${i + 1}] ${choice.text}`, {
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
      btnBg.on('pointerdown', () => {
        AudioManager.getInstance().playSFX('choice-select');
        this.resolveEvent(i, choice);
      });

      cumulativeY += btnH + 8;
    });

    // Keyboard shortcuts (1/2/3)
    this.input.keyboard!.once('keydown-ONE', () => this.resolveEvent(0, choices[0]));
    this.input.keyboard!.once('keydown-TWO', () => choices.length > 1 && this.resolveEvent(1, choices[1]));
    this.input.keyboard!.once('keydown-THREE', () => choices.length > 2 && this.resolveEvent(2, choices[2]));

    // ── Countdown overlay (top-right corner of modal) ──
    const COUNTDOWN_SEC = 10;
    let remaining = COUNTDOWN_SEC;
    this.eventCountdownText = this.add.text(
      dx + dw - 12, dy + 8,
      `⏳ Day timer resumes in ${remaining}s`,
      { fontFamily: 'monospace', fontSize: '11px', color: '#f0883e' }
    ).setOrigin(1, 0).setDepth(210);
    this.modalGroup!.add(this.eventCountdownText);

    this.eventCountdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: COUNTDOWN_SEC - 1,
      callback: () => {
        remaining--;
        if (this.eventCountdownText) {
          if (remaining > 0) {
            this.eventCountdownText.setText(`⏳ Day timer resumes in ${remaining}s`);
          } else {
            // Auto-dismiss: no choice made — just close modal with no effect
            this.eventCountdownText.setText('⏳ Resuming...');
            this.time.delayedCall(300, () => this.dismissEventNoEffect());
          }
        }
      },
    });

    // Slide-in animation
    this.modalGroup.setAlpha(0);
    this.tweens.add({
      targets: this.modalGroup,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });
  }

  /** Auto-dismiss event modal with no effect (countdown expired, no choice made) */
  private dismissEventNoEffect(): void {
    if (!this.modalGroup) return;
    this.eventCountdownTimer?.destroy();
    this.eventCountdownTimer = undefined;
    this.eventCountdownText = undefined;
    // Remove keyboard listeners
    this.input.keyboard!.removeAllListeners('keydown-ONE');
    this.input.keyboard!.removeAllListeners('keydown-TWO');
    this.input.keyboard!.removeAllListeners('keydown-THREE');
    if (this.currentEvent) {
      this.eventEngine.markFired(this.currentEvent.id, getState().day);
      this.currentEvent = undefined;
    }
    this.tweens.add({
      targets: this.modalGroup,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.modalGroup?.destroy();
        this.modalGroup = undefined;
        if (this.dayTimer) this.dayTimer.paused = false;
        this.typingEngine.resume();
        this.taskbar.refresh();
      },
    });
  }

  private resolveEvent(choiceIndex: number, choice: EventChoice, autoResolved = false): void {
    if (!this.modalGroup && !autoResolved) return;

    // Cancel countdown
    this.eventCountdownTimer?.destroy();
    this.eventCountdownTimer = undefined;
    this.eventCountdownText = undefined;

    this.terminal.addLine(`> Event: ${autoResolved ? 'auto-resolved' : 'chose "' + choice.text + '"'}`);

    const state = getState();
    const logs = this.eventEngine.applyEffects(choice, state);
    Telemetry.logEvent(this.currentEvent?.id ?? 'auto-resolve', choiceIndex, logs);
    for (const line of logs) {
      this.terminal.addLine(line);
    }

    if (this.currentEvent) {
      this.eventEngine.markFired(this.currentEvent.id, state.day);
      this.currentEvent = undefined;
    }

    // Sync local timeUnits from state (in case event changed time)
    this.timeUnits = state.timeUnitsRemaining;

    // ── Parse logs for impact feedback ──
    this.applyImpactFeedback(logs, state);

    // Close modal
    if (this.modalGroup) {
      this.tweens.add({
        targets: this.modalGroup,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          this.modalGroup?.destroy();
          this.modalGroup = undefined;
          if (this.dayTimer) this.dayTimer.paused = false;
          this.typingEngine.resume();
          this.taskbar.refresh();
        },
      });
    } else {
      // If it was an auto-resolve, we might need to refresh UI anyway
      this.taskbar.refresh();
    }
  }

  /** Flash UI elements and show floating summary based on effect logs */
  private applyImpactFeedback(logs: string[], state: ReturnType<typeof getState>): void {
    const summaryParts: string[] = [];

    for (const log of logs) {
      if (log.startsWith('> BUDGET')) {
        // Parse delta: "> BUDGET +$50" or "> BUDGET -$50"
        const m = log.match(/BUDGET ([+-]\$\d+)/);
        const label = m ? m[1] : '';
        const isGain = log.includes('+$');
        summaryParts.push(`${label} 💰`);
        // Green bounce for gain, red bounce for loss
        const color = isGain ? '#39d353' : '#f85149';
        this.budgetText.setColor(color);
        this.budgetText.setText(state.playerClass === 'corporateDev' ? '💳 Company Card' : `💰 Budget: $${state.budget.toLocaleString()}`);
        this.tweens.add({
          targets: this.budgetText,
          scaleX: { from: 1.2, to: 1 },
          scaleY: { from: 1.2, to: 1 },
          duration: 300,
          ease: 'Back.Out',
          onComplete: () => this.budgetText.setColor('#e6edf3'),
        });
      } else if (log.startsWith('> TIME')) {
        const m = log.match(/TIME ([+-]\d+)/);
        const label = m ? `${m[1]} ⏱️` : '⏱️';
        summaryParts.push(label);
        // Color pulse on time bar
        const origColor = this.timeUnits / 10 <= 0.3 ? COLORS.error : COLORS.warning;
        this.timeBar.setFillStyle(0xffffff);
        this.time.delayedCall(200, () => this.timeBar.setFillStyle(origColor));
      } else if (log.startsWith('> HARDWARE')) {
        const m = log.match(/HARDWARE ([+-]\d+)/);
        const label = m ? `${m[1]} 🖥️` : '🖥️';
        summaryParts.push(label);
        const isLoss = log.includes('-');
        if (isLoss) {
          AudioManager.getInstance().playSFX('hw-damage');
        }
        this.hardwareText.setColor('#f0883e');
        this.hardwareText.setText(`🖥️ Hardware: ${state.hardwareHp}%`);
        this.time.delayedCall(600, () => this.hardwareText.setColor('#e6edf3'));
      } else if (log.startsWith('> REPUTATION')) {
        const m = log.match(/REPUTATION ([+-]\d+)/);
        const label = m ? `${m[1]} ⭐` : '⭐';
        summaryParts.push(label);
        this.repText.setColor('#d29922');
        this.repText.setText(`⭐ Reputation: ${state.reputation}`);
        this.time.delayedCall(600, () => this.repText.setColor('#e6edf3'));
      }
    }

    // ── Floating summary near modal center ──
    if (summaryParts.length > 0) {
      const summaryStr = summaryParts.join('  ');
      const floatText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, summaryStr, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e6edf3',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(300).setAlpha(1);

      this.tweens.add({
        targets: floatText,
        y: floatText.y - 60,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => floatText.destroy(),
      });
    }
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

    Telemetry.logDayEnd(
      state,
      dayScore,
      state.bugHuntReturnScene === 'Results' ? 'bugHunt' : this.inOvertime ? 'overtime' : 'none',
      this.overtimeBonus,
      this.overtimePromptsCompleted
    );
    state.reputation += dayScore.total;
    state.dayScores.push(dayScore.total);
  }

  update(): void {
    const state = getState();
    const hw = state.hardwareHp;
    if (this.hwBar && hw !== this.lastHw) {
      const hwPct = hw / 100;
      const hwBarColor = hw >= 60 ? 0x3fb950 : hw >= 30 ? 0xd29922 : 0xf85149;
      this.hwBar.width = Math.round(hwPct * 160);
      if (hw < this.lastHw && !this.hwBarFlashing) {
        // Flash white for 200ms on damage
        this.hwBarFlashing = true;
        this.hwBar.setFillStyle(0xffffff);
        this.time.delayedCall(200, () => {
          if (this.hwBar) this.hwBar.setFillStyle(hwBarColor);
          this.hwBarFlashing = false;
        });
      } else if (!this.hwBarFlashing) {
        this.hwBar.setFillStyle(hwBarColor);
      }
      this.lastHw = hw;
    }
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
