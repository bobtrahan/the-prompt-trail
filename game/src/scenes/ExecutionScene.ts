import Phaser from 'phaser';
import { TUNING } from '../data/tuning';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { DAY_PROMPTS, OVERTIME_PROMPTS } from '../data/prompts';
import { EVENT_SCHEDULE } from '../data/eventTriggers';
import { getState } from '../systems/GameState';
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
import type { EventDef, EventChoice, EventEffect } from '../data/events';
import { buildOutcomeLine, outcomeLineColor } from '../utils/outcomeFormatting';
import { drawWallpaper } from '../ui/DesktopWallpaper';
import { AGENT_MESSAGES, EVENT_REACTIONS, SYNERGY_MESSAGES, CLASH_MESSAGES, CONSUMABLE_REACTIONS } from '../data/agentMessages';
import { SYNERGY_PAIRS, CLASH_PAIRS } from '../data/agents';

const VIBE_LINES_GOOD = [
  '🧠 The vibes are immaculate. Something beautiful is happening.',
  '🧠 Flow state achieved. The code writes itself.',
  '🧠 This is going suspiciously well.',
  '🧠 The AI is vibing. You are vibing. We are all vibing.',
  '🧠 Vibe check: passed. Surprisingly.',
];

const VIBE_LINES_BAD = [
  '🧠 The vibes are... concerning. This might not end well.',
  '🧠 Something feels wrong. Probably fine. Probably.',
  '🧠 The AI just sighed. Can AIs sigh? This one did.',
  '🧠 Vibe check: failed. Rescheduling for Thursday.',
  '🧠 The energy in this codebase is chaotic neutral at best.',
];

interface AgentPanelState {
  id: string;
  statusText: Phaser.GameObjects.Text;
  nextMessageAt: number;
  rowBg?: Phaser.GameObjects.Rectangle;
}

export class ExecutionScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private terminalWindow!: Window;
  private terminal!: Terminal;
  private typingEngine!: TypingEngine;
  private agentWindow!: Window;
  private resourceWindow!: Window;
  private typoForgiveness = 0;
  private agentPanelStates: AgentPanelState[] = [];

  // Layout state for focus-on-typing hero mode
  private typeHintSubtitle?: Phaser.GameObjects.Text;
  private typeHintGlow?: Phaser.GameObjects.Rectangle;
  private typeHintGlowTween?: Phaser.Tweens.Tween;
  private terminalFocusBorder?: Phaser.GameObjects.Rectangle;

  // Progress
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;
  private progressText!: Phaser.GameObjects.Text;
  private progress = 0;
  private timeSeconds = 45; // audit-ok — set from tuning in create()
  private maxTimeSeconds = 45; // audit-ok — set from tuning in create()
  private timeBar!: Phaser.GameObjects.Rectangle;
  private timeBg!: Phaser.GameObjects.Rectangle;
  private timeText!: Phaser.GameObjects.Text;

  // Timers
  private dayTimer!: Phaser.Time.TimerEvent;

  // "Start typing" affordance
  private typeHint!: Phaser.GameObjects.Text;
  private typeHintTween?: Phaser.Tweens.Tween;
  private startedTyping = false;

  // Event modal
  private modalGroup?: Phaser.GameObjects.Container;
  private currentEvent?: EventDef;
  private eventCountdownTimer?: Phaser.Time.TimerEvent;
  private eventCountdownText?: Phaser.GameObjects.Text;

  // Juice / telemetry feedback
  private lastStreakMilestone = 0;

  // Completion / Overtime
  private inOvertime: boolean = false;
  private overtimeBonus: number = 0;
  private overtimePromptsCompleted: number = 0;
  private completionShown: boolean = false;
  private overtimeText?: Phaser.GameObjects.Text;

  // Resource display refs (for flash feedback)
  private budgetText!: Phaser.GameObjects.Text;
  private hardwareText!: Phaser.GameObjects.Text;
  private repText!: Phaser.GameObjects.Text;

  // Hardware bar (live update)
  private hwBar!: Phaser.GameObjects.Rectangle;
  private hwBarBg!: Phaser.GameObjects.Rectangle;
  private lastHw: number = -1;
  private hwBarFlashing: boolean = false;
  private previewSnapshot?: { budget: number; hardwareHp: number; reputation: number };

  // Systems
  private eventEngine!: EventEngine;
  private speedMod: number = 0;
  private modelQualityMod: number = 0;
  private traitResults: { agentId: string; trait: string; fired: boolean; description: string }[] = [];

  // Voice narrator state
  private clashActive = false;
  private clashVoicedToday = false;
  private dayFirstEvent = true;

  private processConsumables(): void {
    const state = getState();
    if (!state.activeConsumables || state.activeConsumables.length === 0) return;

    // We need to copy and clear to avoid concurrent modification issues if any
    const toProcess = [...state.activeConsumables];
    
    toProcess.forEach(id => {
      switch (id) {
        case 'con-coffee':
          this.typingEngine.speedModifier += 0.05;
          break;
        case 'con-energy':
          this.typingEngine.speedModifier += 0.1;
          this.typingEngine.jitterChance = 0.2;
          break;
        case 'con-backup':
          state.hasBackupProtection = true;
          break;
        case 'con-api':
          state.modelCostDiscount = 0.5;
          break;
        case 'con-duck':
          state.hasDuckProtection = true;
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

  /** Floating streak combo flash anchored near the progress bar */
  private showStreakFlash(streak: number): void {
    const label = streak >= 20 ? `🔥 ULTRA COMBO ×${streak}!` :
                  streak >= 15 ? `⚡ MEGA COMBO ×${streak}` :
                  streak >= 10 ? `🎯 COMBO ×${streak}` :
                                 `✨ Streak ×${streak}`;
    const color = streak >= 20 ? '#f0883e' : streak >= 10 ? '#d29922' : '#58a6ff';
    const size   = streak >= 20 ? '28px' : streak >= 10 ? '22px' : '18px';

    // Flash the progress bar briefly
    const origColor = this.progress >= 100 ? COLORS.success : getTheme(getState().playerClass ?? undefined).accent;
    this.progressBar.setFillStyle(0xffffff);
    this.time.delayedCall(150, () => {
      if (this.progressBar) this.progressBar.setFillStyle(origColor);
    });

    const flash = this.add.text(GAME_WIDTH / 2, 380, label, {
      fontFamily: 'monospace', fontSize: size, color,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(500).setAlpha(0);

    this.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 1 },
      y: flash.y - 10,
      duration: 180,
      ease: 'Power2.Out',
      onComplete: () => {
        this.tweens.add({
          targets: flash,
          alpha: 0,
          y: flash.y - 30,
          duration: 900,
          delay: 500,
          ease: 'Power2.In',
          onComplete: () => flash.destroy(),
        });
      },
    });

    AudioManager.getInstance().playSFX('notification');
  }

  /** Floating "✓ Perfect!" badge on clean prompt completion */
  private showPerfectFlash(): void {
    const badge = this.add.text(GAME_WIDTH / 2, 360, '✓  Perfect!', {
      fontFamily: 'monospace', fontSize: '16px', color: '#3fb950',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(500).setAlpha(0);

    this.tweens.add({
      targets: badge,
      alpha: { from: 0, to: 1 },
      y: badge.y - 8,
      duration: 150,
      ease: 'Power2.Out',
      onComplete: () => {
        this.tweens.add({
          targets: badge,
          alpha: 0,
          y: badge.y - 24,
          duration: 700,
          delay: 400,
          ease: 'Power2.In',
          onComplete: () => badge.destroy(),
        });
      },
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
    this.startedTyping = false;
    this.agentPanelStates = [];
    this.completionShown = false;
    this.inOvertime = false;
    this.overtimeBonus = 0;
    this.overtimePromptsCompleted = 0;
    this.lastStreakMilestone = 0;
    this.hwBarFlashing = false;
    this.clashVoicedToday = false;
    this.dayFirstEvent = true;

    // Initialise systems
    this.eventEngine = new EventEngine(state);
    this.speedMod = AgentSystem.getSpeedModifier(state.activeAgents);
    this.modelQualityMod = EconomySystem.getModelQualityMod(state.model);

    // Apply hardware upgrades
    if (state.ownedUpgrades.includes('hw-monitor')) {
      this.speedMod += 0.05;
    }
    if (state.ownedUpgrades.includes('hw-gpu') && ['local', 'openSource'].includes(state.model)) {
      this.speedMod += 0.1; // GPU upgrade boosts local/open-source models
    }
    // Base typo forgiveness from day difficulty curve
    this.typoForgiveness = (TUNING.TYPO_FORGIVENESS_BY_DAY as Record<number, number>)[state.day] ?? 0;
    if (state.ownedUpgrades.includes('hw-keyboard')) {
      this.typoForgiveness = Math.max(1, this.typoForgiveness);
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
      width: 820, height: 400,
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
      terminalTextColor: theme.terminalTextColor,
      terminalBg: theme.terminalBg,
      cursorChar: theme.cursorChar,
    });

    // ── Progress bar (bottom of terminal window content, above prompt) ──
    // Progress bar sits just above the hero prompt band (which is 96px tall at the bottom)
    const pbY = 72 + tArea.y + tArea.height - 96 - 18;
    this.progressBg = this.add.rectangle(16 + tArea.x, pbY, tArea.width, 12, 0x21262d).setOrigin(0).setDepth(150);
    this.progressBar = this.add.rectangle(16 + tArea.x, pbY, 0, 12, theme.accent).setOrigin(0).setDepth(151);
    this.progressText = this.add.text(16 + tArea.x + tArea.width / 2, pbY + 1, '0%', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e6edf3',
    }).setOrigin(0.5, 0).setDepth(152);

    // ── Agent Panel ──
    this.agentWindow = new Window({
      scene: this, x: 852, y: 72,
      width: 412, height: 180,
      title: 'Agent Manager',
      titleIcon: '🤖',
      accentColor: theme.accent,
    });

    // Subtle accent tint on Agent Manager content area
    const agentTint = this.add.rectangle(
      this.agentWindow.contentArea.x, this.agentWindow.contentArea.y,
      this.agentWindow.contentArea.width, this.agentWindow.contentArea.height,
      theme.accent,
    ).setOrigin(0).setAlpha(0.03);
    this.agentWindow.add(agentTint);

    const activeAgentIds = state.activeAgents.length > 0 ? state.activeAgents : ['turbo'];
    const agentDefs = AgentSystem.getAgentDefs(activeAgentIds);
    const aArea = this.agentWindow.contentArea;
    agentDefs.forEach((agent, i) => {
      const rowBaseY = aArea.y + i * 44;

      const label = this.add.text(
        aArea.x, rowBaseY,
        `🤖 ${agent.name}`,
        { fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3' }
      );
      this.agentWindow.add(label);

      const idleMessages = AGENT_MESSAGES[agent.id]?.idle ?? ['⚡ Working...'];
      const initialMsg = idleMessages[Math.floor(Math.random() * idleMessages.length)];
      const status = this.add.text(
        aArea.x + 130, rowBaseY,
        initialMsg,
        { fontFamily: 'monospace', fontSize: '12px', color: '#39d353' }
      );
      this.agentWindow.add(status);

      const rowBg = this.add.rectangle(
        aArea.x, rowBaseY - 4,
        aArea.width, 40,
        theme.accent
      ).setOrigin(0).setAlpha(0);
      this.agentWindow.add(rowBg);

      this.agentPanelStates.push({
        id: agent.id,
        statusText: status,
        nextMessageAt: this.time.now + i * 1500 + 2000 + Math.random() * 2000,
        rowBg,
      });

      // Speed bar: 5 × 7×7 rectangles, 2px gap
      for (let s = 0; s < 5; s++) {
        const filled = s < agent.speed;
        const speedRect = this.add.rectangle(
          aArea.x + s * 9,
          rowBaseY + 20,
          7, 7,
          filled ? theme.accent : 0x21262d
        ).setOrigin(0);
        this.agentWindow.add(speedRect);
      }

      // Trait label
      const traitLabel = this.add.text(
        aArea.x + 54,
        rowBaseY + 19,
        agent.trait,
        { fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0' }
      );
      this.agentWindow.add(traitLabel);
    });

    // Hint if only 1 agent
    if (agentDefs.length === 1) {
      const hintY = aArea.y + 1 * 48 + 8;
      const slotHint = this.add.text(
        aArea.x,
        hintY,
        '💡 Buy agent slots at Token Market',
        { fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0', fontStyle: 'italic' }
      );
      this.agentWindow.add(slotHint);
    }

    // ── Synergy / clash announcements ──
    const holdUntil = this.time.now + 4000;
    for (const pair of SYNERGY_PAIRS) {
      if (pair.agents.every(id => activeAgentIds.includes(id))) {
        const sortedKey = [...pair.agents].sort().join('+');
        const originalKey = [...pair.agents].join('+');
        const message = SYNERGY_MESSAGES[sortedKey] ?? SYNERGY_MESSAGES[originalKey];
        if (message) {
          for (const agentId of pair.agents) {
            const agentState = this.agentPanelStates.find(a => a.id === agentId);
            if (agentState) {
              agentState.statusText.setColor('#3fb950').setText(message);
              agentState.nextMessageAt = holdUntil;
            }
          }
        }
      }
    }
    for (const pair of CLASH_PAIRS) {
      if (pair.agents.every(id => activeAgentIds.includes(id))) {
        this.clashActive = true;
        const sortedKey = [...pair.agents].sort().join('+');
        const originalKey = [...pair.agents].join('+');
        const message = CLASH_MESSAGES[sortedKey] ?? CLASH_MESSAGES[originalKey];
        if (message) {
          for (const agentId of pair.agents) {
            const agentState = this.agentPanelStates.find(a => a.id === agentId);
            if (agentState) {
              agentState.statusText.setColor('#f85149').setText(message);
              agentState.nextMessageAt = holdUntil;
            }
          }
        }
      }
    }

    // ── Resource Panel ──
    this.resourceWindow = new Window({
      scene: this, x: 852, y: 260,
      width: 412, height: 212,
      title: 'System Monitor',
      titleIcon: '📊',
      accentColor: theme.accent,
    });

    const rArea = this.resourceWindow.contentArea;
    const rStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3' };
    const rX = 852 + rArea.x;
    const rY = 260 + rArea.y;

    this.budgetText = this.add.text(rX, rY, state.playerClass === 'corporateDev' ? '💳 Company Card' : `💰 Budget: $${state.budget.toLocaleString()}`, rStyle);
    this.hardwareText = this.add.text(rX, rY + 26, `🖥️ Hardware: ${state.hardwareHp}%`, rStyle);

    // Hardware health bar
    const hwPct = state.hardwareHp / 100;
    const hwBarColor = state.hardwareHp >= 60 ? 0x3fb950 : state.hardwareHp >= 30 ? 0xd29922 : 0xf85149;
    this.hwBarBg = this.add.rectangle(rX, rY + 44, 160, 6, 0x21262d).setOrigin(0);
    this.hwBar = this.add.rectangle(rX, rY + 44, Math.round(hwPct * 160), 6, hwBarColor).setOrigin(0);
    this.lastHw = state.hardwareHp;

    this.repText = this.add.text(rX, rY + 54, `⭐ Reputation: ${state.reputation}`, rStyle);

    // Model text + quality indicator tag
    this.add.text(rX, rY + 80, `📡 Model: ${state.model}`, rStyle);
    const qualityMod = EconomySystem.getModelQualityMod(state.model);
    const qualityPct = Math.round(qualityMod * 100);
    const qualityTag = qualityPct > 0 ? `[+${qualityPct}%]` : qualityPct < 0 ? `[${qualityPct}%]` : '[+0%]';
    const qualityColor = qualityPct > 0 ? '#3fb950' : qualityPct < 0 ? '#f85149' : '#9da5b0';
    this.add.text(rX + 170, rY + 80, qualityTag, {
      fontFamily: 'monospace', fontSize: '12px', color: qualityColor,
    });

    this.timeText = this.add.text(rX, rY + 102, `⏱️ Time: ${this.timeSeconds}s`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
    });
    this.timeBg = this.add.rectangle(rX, rY + 118, rArea.width - 16, 14, 0x21262d).setOrigin(0);
    this.timeBar = this.add.rectangle(rX, rY + 118, rArea.width - 16, 14, COLORS.warning).setOrigin(0);

    // ── Dim side panels on load — typing area is dominant visual focus until player starts ──
    this.agentWindow.container.setAlpha(0.3);
    this.resourceWindow.container.setAlpha(0.3);
    [this.budgetText, this.hardwareText, this.repText, this.hwBarBg, this.hwBar,
      this.timeText, this.timeBg, this.timeBar].forEach(obj => obj.setAlpha(0.3));

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
          state.timerBonusSeconds -= 2;
          this.terminal.addLine("🤖 Linter: 'We need to discuss the architecture first.'");
        } else if (res.trait === 'deploy_unapproved') {
          this.progress = Math.min(100, this.progress + 10);
          state.eventFlags['turbo_deployed'] = true;
          this.terminal.addLine("🤖 Turbo: 'Already deployed. You're welcome.'");
        } else if (res.trait === 'feature_creep') {
          state.timerBonusSeconds -= 4;
          this.terminal.addLine("🤖 Scope: 'I added dark mode and a settings page! You're welcome!'");
        } else if (res.trait === 'low_hallucination') {
          // Oracle: +5 rep (fewer hallucinations = better output)
          state.reputation += 5;
          this.terminal.addLine("🤖 Oracle: 'I have seen the future. It is... mostly fine.' (+5 rep)");
        } else if (res.trait === 'agreeable') {
          // Parrot: +3s timer (goes along with everything, fast)
          state.timerBonusSeconds += 3;
          this.terminal.addLine("🤖 Parrot: 'Exactly what I was thinking!' (+3s)");
        } else if (res.trait === 'wildcard_shortcut') {
          // Gremlin: 50/50 — either +6s or -3s
          if (Math.random() < 0.5) {
            state.timerBonusSeconds += 6;
            this.terminal.addLine("🤖 Gremlin: 'I found a shortcut! Don't ask how.' (+6s)");
          } else {
            state.timerBonusSeconds -= 3;
            this.terminal.addLine("🤖 Gremlin: 'I found a shortcut! It... didn't work.' (-3s)");
          }
        }
      }
    });

    this.updateProgressBar();

    // ── Typing engine — timers start on first keystroke ──
    this.typingEngine = new TypingEngine(this, this.terminal, () => {
      this.onPromptComplete();
    }, () => {
      this.onFirstKeystroke();
    }, this.typoForgiveness, () => {
      this.onAllPromptsComplete();
    });

    // Wire day-specific prompts and set time units to match prompt count
    const dayPromptDef = DAY_PROMPTS.find(d => d.day === state.day);
    if (dayPromptDef) {
      this.typingEngine.setDayPrompts(dayPromptDef.prompts);
      // Prompt count is tracked by TypingEngine, no time unit mapping needed
    }

    // ── Process consumables and show notification sequence before typing begins ──
    this.processConsumables();
    
    // Show consumable notifications, then show typing hint
    this.showConsumableNotifications().then(() => {
      // Consumable reactions — show on random agents
      const consumableKeyMap: Record<string, string> = {
        'con-coffee': 'coffee',
        'con-energy': 'energyDrink',
        'con-backup': 'cloudBackup',
        'con-api': 'apiCredits',
        'con-duck': 'rubberDuck',
      };
      const consumablesUsed = getState().consumablesUsedToday ?? [];
      let consumableDelay = 0;
      for (const consumableId of consumablesUsed) {
        const key = consumableKeyMap[consumableId];
        if (!key || !CONSUMABLE_REACTIONS[key] || this.agentPanelStates.length === 0) continue;
        const msgs = CONSUMABLE_REACTIONS[key];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        const agentState = this.agentPanelStates[Math.floor(Math.random() * this.agentPanelStates.length)];
        this.time.delayedCall(consumableDelay, () => {
          agentState.statusText.setAlpha(0).setText(msg).setColor('#39d353');
          this.tweens.add({ targets: agentState.statusText, alpha: 1, duration: 200, ease: 'Power2' });
          agentState.nextMessageAt = this.time.now + 3000;
        });
        consumableDelay += 500;
      }

      // After notifications complete, show the dominant "START TYPING" hero affordance
      const hintCenterX = 16 + tArea.x + tArea.width / 2;
      const hintCenterY = 72 + tArea.y + tArea.height / 2 - 30;

      // Pulsing background glow slab — makes the area unmissable
      this.typeHintGlow = this.add.rectangle(
        hintCenterX, hintCenterY,
        tArea.width - 32, 110,
        0x1c2a3a
      ).setOrigin(0.5).setDepth(48);
      this.typeHintGlowTween = this.tweens.add({
        targets: this.typeHintGlow,
        alpha: { from: 0.55, to: 1 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Animated focus border around the terminal window (draws the eye)
      this.terminalFocusBorder = this.add.rectangle(
        14, 70, 824, 404, 0x000000, 0
      ).setOrigin(0).setDepth(47).setStrokeStyle(2, 0x58a6ff);
      this.tweens.add({
        targets: this.terminalFocusBorder,
        alpha: { from: 1, to: 0.3 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Main hint — large, bold, impossible to miss
      this.typeHint = this.add.text(
        hintCenterX,
        hintCenterY - 16,
        TUNING.COPY.START_TYPING_PROMPT,
        { fontFamily: 'monospace', fontSize: '30px', color: '#58a6ff', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 3 }
      ).setOrigin(0.5).setDepth(50);

      // Subtitle line
      this.typeHintSubtitle = this.add.text(
        hintCenterX,
        hintCenterY + 26,
        '▶  press any key to begin  ◀',
        { fontFamily: 'monospace', fontSize: '14px', color: '#9da5b0' }
      ).setOrigin(0.5).setDepth(50);

      this.typeHintTween = this.tweens.add({
        targets: [this.typeHint, this.typeHintSubtitle],
        alpha: { from: 1, to: 0.4 },
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.typingEngine.start();
    });
  }

  /** Called once on the very first keystroke */
  private onFirstKeystroke(): void {
    if (this.startedTyping) return;
    this.startedTyping = true;

    // Kill all hint tweens
    this.typeHintTween?.destroy();
    this.typeHintGlowTween?.destroy();

    // Dismiss all hero-affordance elements
    const hintTargets: (Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle)[] = [this.typeHint];
    if (this.typeHintSubtitle) hintTargets.push(this.typeHintSubtitle);
    if (this.typeHintGlow) hintTargets.push(this.typeHintGlow);
    if (this.terminalFocusBorder) hintTargets.push(this.terminalFocusBorder);

    this.tweens.add({
      targets: hintTargets,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.typeHint?.destroy();
        this.typeHintSubtitle?.destroy();
        this.typeHintSubtitle = undefined;
        this.typeHintGlow?.destroy();
        this.typeHintGlow = undefined;
        this.terminalFocusBorder?.destroy();
        this.terminalFocusBorder = undefined;
      },
    });

    // Restore side panels — fade them in as typing begins
    this.tweens.add({
      targets: [
        this.agentWindow.container,
        this.resourceWindow.container,
        this.budgetText, this.hardwareText, this.repText,
        this.hwBarBg, this.hwBar,
        this.timeText, this.timeBg, this.timeBar,
      ],
      alpha: 1,
      duration: 500,
      ease: 'Power2.Out',
    });

    // Calculate final timer: day-specific base (via TIMER_BY_DAY) + modifiers
    const state = getState();
    const dayBase = (TUNING.TIMER_BY_DAY as Record<number, number>)[state.day] ?? TUNING.BASE_TIMER_SECONDS;
    const baseTimer = state.playerClass === 'corporateDev'
      ? Math.round(dayBase * TUNING.CORP_TIMER_RATIO)
      : dayBase;
    const agentSpeedSeconds = Math.round(baseTimer * this.speedMod);
    const eventBonus = state.timerBonusSeconds;
    this.timeSeconds = Math.max(10, baseTimer + agentSpeedSeconds + eventBonus);
    this.maxTimeSeconds = this.timeSeconds;

    this.dayTimer = this.time.addEvent({
      delay: 1000,
      repeat: this.timeSeconds - 1,
      callback: () => this.tickTime(),
    });

    this.terminal.addLine('Ready. Building...');
  }

  private onAllPromptsComplete(): void {
    // All day prompts typed — end the day successfully
    // ── Chunk-complete celebration ──
    AudioManager.getInstance().playSFX('day-complete');
    this.showChunkCompleteFlash();
    this.terminal.addLine('\n✅ All prompts complete!');
    if (this.dayTimer) {
      this.dayTimer.destroy();
    }
    this.time.delayedCall(600, () => {
      this.endDay();
    });
  }

  /** Full-screen brief green pulse on chunk/all-prompts completion */
  private showChunkCompleteFlash(): void {
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x3fb950, 0).setOrigin(0).setDepth(600);
    this.tweens.add({
      targets: overlay,
      alpha: { from: 0.18, to: 0 },
      duration: 700,
      ease: 'Power2.Out',
      onComplete: () => overlay.destroy(),
    });

    const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, '✅  BUILD COMPLETE', {
      fontFamily: 'monospace', fontSize: '36px', color: '#3fb950',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(601).setAlpha(0);

    this.tweens.add({
      targets: msg,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: 250,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: msg,
          alpha: 0,
          y: msg.y - 20,
          duration: 500,
          delay: 400,
          ease: 'Power2.In',
          onComplete: () => msg.destroy(),
        });
      },
    });
  }

  private onPromptComplete(): void {
    // Power-curve progress — early prompts barely move the bar, final prompt is the big payoff
    // 4 prompts: 8 → 29 → 60 → 100  |  10 prompts: 2 → 6 → 11 → ... → 83 → 100
    const completed = this.typingEngine.getStats().promptsCompleted;
    const total = this.typingEngine.getTotalDayPrompts();
    if (total > 0) {
      const frac = Math.pow(completed / total, 1.8);
      this.progress = Math.min(100, Math.round(frac * 100));
    }
    this.updateProgressBar();

    // ── Telemetry-driven juice ──
    const tel = this.typingEngine.getTelemetry();

    // Perfect-prompt badge
    if (tel.isPerfectPrompt && !this.inOvertime) {
      this.showPerfectFlash();
    }

    // Streak milestone flashes: fire once per milestone crossing
    const STREAK_MILESTONES = [5, 10, 15, 20, 30, 40, 50];
    for (const m of STREAK_MILESTONES) {
      if (tel.streak >= m && this.lastStreakMilestone < m) {
        this.lastStreakMilestone = m;
        this.showStreakFlash(tel.streak);
        break;
      }
    }
    // Reset milestone tracker if streak dropped below last milestone
    if (tel.streak < this.lastStreakMilestone) {
      this.lastStreakMilestone = 0;
    }

    if (this.progress >= 100 && !this.completionShown && !this.inOvertime) {
      this.showCompletionChoice();
    } else if (this.inOvertime) {
      this.overtimePromptsCompleted++;
      this.overtimeBonus += TUNING.OVERTIME_REP_PER_PROMPT;
      if (this.overtimeText) {
        this.overtimeText.setText(`${TUNING.COPY.OVERTIME_LABEL} +${this.overtimeBonus}`);
      }
    }

    // Prompt-count-triggered events (normal play only)
    if (!this.inOvertime) {
      const state = getState();
      const count = this.typingEngine.getStats().promptsCompleted;
      if (state.strategy === 'vibeCode' && [2, 4, 6, 8, 10].includes(count)) {
        const pool = Math.random() > 0.5 ? VIBE_LINES_GOOD : VIBE_LINES_BAD;
        const line = pool[Math.floor(Math.random() * pool.length)];
        this.terminal.addLine(line);
      }
      const schedule = EVENT_SCHEDULE.find(e => e.day === state.day);
      if (schedule && schedule.afterPrompts.includes(count)) {
        this.fireEvent();
      }
    }
  }

  private tickTime(): void {
    if (window.__GOD_MODE) return;
    this.timeSeconds--;

    const frac = this.timeSeconds / this.maxTimeSeconds;
    this.timeBar.width = this.timeBg.width * frac;
    this.timeText.setText(`⏱️ Time: ${this.timeSeconds}s`);
    if (frac <= 0.3) this.timeBar.setFillStyle(COLORS.error);

    this.taskbar.refresh();

    if (this.timeSeconds <= 0) {
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
    if (this.timeSeconds <= 0) return;

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

    // Snapshot current resource values for non-destructive hover preview
    const snapState = getState();
    this.previewSnapshot = {
      budget: snapState.budget,
      hardwareHp: snapState.hardwareHp,
      reputation: snapState.reputation,
    };

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

    // Dramatic pause beat: zoom terminal slightly
    this.tweens.add({
      targets: [this.terminalWindow.container],
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 300,
      ease: 'Back.Out'
    });

    this.modalGroup = this.add.container(0, 0).setDepth(200);

    // Dim overlay
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0)
      .setInteractive(); // blocks clicks through
    this.modalGroup.add(overlay);
    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 400
    });

    // ── Two-pass layout: measure body text first to know real height ──
    const dw = 700;
    const choiceH = 64;
    const tempX = (GAME_WIDTH - dw) / 2;
    const bodyMeasure = this.add.text(tempX + 20, -2000, body, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
      lineSpacing: 6, wordWrap: { width: dw - 40 },
    });
    const bodyH = bodyMeasure.height;
    bodyMeasure.destroy();

    const dh = 28 + 2 + 16 + bodyH + 16 + (choices.length * (choiceH + 8)) + 12 + 90 + 12;
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

    // Body text
    const bodyObj = this.add.text(dx + 20, dy + 28 + 2 + 16, body, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
      lineSpacing: 6, wordWrap: { width: dw - 40 },
    });
    this.modalGroup.add(bodyObj);

    // ── Two-line choice buttons ──
    const choiceStartY = dy + 28 + 2 + 16 + bodyH + 16;
    let cumulativeY = choiceStartY;

    choices.forEach((choice, i) => {
      const outcomeLine = buildOutcomeLine(choice.effects);
      const outlineColor = outcomeLineColor(choice.effects);

      const btnBg = this.add.rectangle(dx + 20, cumulativeY, dw - 40, choiceH, COLORS.titleBar)
        .setOrigin(0).setInteractive({ useHandCursor: true });
      this.modalGroup!.add(btnBg);

      // Line 1: action text
      const actionTextObj = this.add.text(dx + 48, cumulativeY + 8, `[${i + 1}] ${choice.text}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#58a6ff',
        wordWrap: { width: dw - 100 },
      });
      this.modalGroup!.add(actionTextObj);

      // Separator between action and outcome rows
      const sep = this.add.rectangle(dx + 20, cumulativeY + 28, dw - 40, 1, 0x30363d)
        .setOrigin(0).setAlpha(0.6);
      this.modalGroup!.add(sep);

      // Line 2: outcome text
      const outcomeTextObj = this.add.text(dx + 48, cumulativeY + 32, outcomeLine, {
        fontFamily: 'monospace', fontSize: '11px', color: outlineColor,
      });
      this.modalGroup!.add(outcomeTextObj);

      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(COLORS.windowBorder);
        actionTextObj.setColor('#ffffff');
        this.applyResourcePreview(choice.effects);
      });
      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(COLORS.titleBar);
        actionTextObj.setColor('#58a6ff');
        this.restoreResourcePreview();
      });
      btnBg.on('pointerdown', () => {
        AudioManager.getInstance().playSFX('choice-select');
        this.resolveEvent(i, choice);
      });

      cumulativeY += choiceH + 8;
    });

    // ── Illustration strip ──
    const stripY = cumulativeY + 12;
    // Top border line of strip
    this.modalGroup!.add(
      this.add.rectangle(dx + 20, stripY, dw - 40, 1, 0x30363d).setOrigin(0)
    );
    this.drawEventIllustration(dx + 20, stripY + 1, dw - 40, 90, evt.category);

    // Keyboard shortcuts (1/2/3)
    this.input.keyboard!.once('keydown-ONE', () => this.resolveEvent(0, choices[0]));
    this.input.keyboard!.once('keydown-TWO', () => choices.length > 1 && this.resolveEvent(1, choices[1]));
    this.input.keyboard!.once('keydown-THREE', () => choices.length > 2 && this.resolveEvent(2, choices[2]));

    // ── Countdown overlay (top-right corner of title bar) ──
    const state = getState();
    const COUNTDOWN_SEC = (TUNING.EVENT_READ_WINDOW_BY_DAY as any)[state.day] || TUNING.EVENT_READ_WINDOW_SEC;
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

  private drawEventIllustration(x: number, y: number, w: number, h: number, category: EventDef['category']): void {
    const addText = (tx: number, ty: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle) => {
      const obj = this.add.text(x + tx, y + ty, text, { fontFamily: 'monospace', ...style });
      this.modalGroup!.add(obj);
      return obj;
    };

    const addRect = (rx: number, ry: number, rw: number, rh: number, color: number, alpha = 1) => {
      const obj = this.add.rectangle(x + rx, y + ry, rw, rh, color).setOrigin(0).setAlpha(alpha);
      this.modalGroup!.add(obj);
      return obj;
    };

    const addStrokedRect = (rx: number, ry: number, rw: number, rh: number, fill: number, stroke: number) => {
      const obj = this.add.rectangle(x + rx, y + ry, rw, rh, fill).setOrigin(0).setStrokeStyle(1, stroke);
      this.modalGroup!.add(obj);
      return obj;
    };

    // Background
    addRect(0, 0, w, h, 0x0d1117);

    switch (category) {
      case 'technical': {
        const lines = [
          { text: '$ await llm.generate(prompt)', color: '#39d353' },
          { text: '> Connecting... ████░░░░ 47%', color: '#39d353' },
          { text: '> ERR: context_window_exceeded', color: '#f85149' },
          { text: '> retry? [y/N]', color: '#39d353' },
        ];
        lines.forEach((line, i) => {
          addText(8, 8 + i * 18, line.text, { fontSize: '11px', color: line.color });
        });
        // Blinking red rect top-right corner
        const blink = addRect(w - 16, 4, 8, 8, 0xf85149);
        this.tweens.add({ targets: blink, alpha: { from: 1, to: 0 }, duration: 500, yoyo: true, repeat: -1 });
        break;
      }
      case 'hardware': {
        // Wide chip diagram spanning the strip
        addStrokedRect(8, 8, w - 16, h - 16, 0x161b22, 0x484f58);
        // CPU label top-left
        addText(18, 14, '▣ CPU', { fontSize: '10px', color: '#9da5b0' });
        // Temp reading center-left
        addText(18, 34, '🔥  87°C', { fontSize: '14px', color: '#f0883e' });
        // Heat bar (wide)
        addRect(18, 58, w - 36, 8, 0x21262d);
        addRect(18, 58, Math.floor((w - 36) * 0.87), 8, 0xf85149, 0.9); // 87% filled → red
        // Throttle warning right side
        addText(w - 200, 14, 'THERMAL THROTTLE ACTIVE', { fontSize: '10px', color: '#f85149' });
        addText(w - 200, 34, 'performance: −40%', { fontSize: '10px', color: '#f0883e' });
        break;
      }
      case 'business': {
        const barValues = [0.7, 0.8, 0.75, 0.4, 0.2];
        const barColors = [0x3fb950, 0x3fb950, 0x3fb950, 0xf85149, 0xf85149];
        const barW = 80;
        const barGap = 20;
        const chartL = Math.floor((w - (barValues.length * barW + (barValues.length - 1) * barGap)) / 2);
        const chartB = h - 12;
        barValues.forEach((v, i) => {
          const bh = Math.floor((h - 28) * v);
          const bx = chartL + i * (barW + barGap);
          addRect(bx, chartB - bh, barW, bh, barColors[i], 0.8);
        });
        // Axis line
        addRect(chartL - 4, chartB, w - chartL * 2 + 8, 1, 0x484f58);
        addText(6, 6, 'Q4 PROJECTION', { fontSize: '10px', color: '#d29922' });
        break;
      }
      case 'agent': {
        const rows = [
          { icon: '●', name: 'Turbo', status: 'IDLE', color: '#3fb950' },
          { icon: '◐', name: 'Oracle', status: 'THINKING...', color: '#d29922' },
          { icon: '✗', name: 'Gremlin', status: 'TIMEOUT', color: '#f85149' },
        ];
        rows.forEach((row, i) => {
          addText(12, 16 + i * 22, `${row.icon} ${row.name}`, { fontSize: '13px', color: row.color });
          addText(130, 16 + i * 22, row.status, { fontSize: '11px', color: row.color });
        });
        break;
      }
      case 'social': {
        // User bubble 1
        addRect(10, 8, 200, 22, 0x1f6feb, 0.3);
        addText(16, 12, 'just ship it', { fontSize: '11px', color: '#79c0ff' });
        // AI bubble
        addRect(150, 36, 260, 22, 0x2d333b, 0.5);
        addText(156, 40, 'I have concerns...', { fontSize: '11px', color: '#d29922' });
        // User bubble 2
        addRect(10, 64, 160, 22, 0x1f6feb, 0.3);
        addText(16, 68, 'ship. it.', { fontSize: '11px', color: '#79c0ff' });
        break;
      }
      case 'meta': {
        addText(8, 8, 'PromptOS v2.1.0', { fontSize: '11px', color: '#9da5b0' });
        addText(8, 28, 'reality.exe has stopped working', { fontSize: '11px', color: '#f85149' });
        // Three [OK] buttons slightly misaligned as glitch effect
        addRect(20, 54, 36, 18, 0x30363d);
        addText(28, 57, '[OK]', { fontSize: '10px', color: '#e6edf3' });
        addRect(62, 57, 36, 18, 0x30363d);
        addText(70, 60, '[OK]', { fontSize: '10px', color: '#e6edf3' });
        addRect(104, 52, 36, 18, 0x30363d);
        addText(112, 55, '[OK]', { fontSize: '10px', color: '#e6edf3' });
        break;
      }
    }
  }

  /** Auto-dismiss event modal with no effect (countdown expired, no choice made) */
  private dismissEventNoEffect(): void {
    if (!this.modalGroup) return;
    this.restoreResourcePreview();
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
    const resolvedEventId = this.currentEvent?.id;
    const timerBefore = state.timerBonusSeconds;
    const logs = this.eventEngine.applyEffects(choice, state);
    Telemetry.logEvent(this.currentEvent?.id ?? 'auto-resolve', choiceIndex, logs);
    for (const line of logs) {
      this.terminal.addLine(line);
    }

    // Apply progress loss signal written by loseProgress effects
    if (state.loseProgressSignal !== undefined) {
      if (state.loseProgressSignal === 'all') {
        this.progress = 0;
      } else {
        this.progress = Math.max(0, this.progress - (state.loseProgressSignal as number) * 100);
      }
      state.loseProgressSignal = undefined;
      this.updateProgressBar();
    }

    if (this.currentEvent) {
      this.eventEngine.markFired(this.currentEvent.id, state.day);
      this.currentEvent = undefined;
    }

    // ── Voice narrator triggers (priority order, first match wins) ──
    {
      const am = AudioManager.getInstance();
      let voiced = false;
      if (!voiced && state.budget <= 0) {
        am.playVoice('event-bankruptcy');
        voiced = true;
      }
      if (!voiced && state.hardwareHp <= 20) {
        am.playVoice('event-low-hp');
        voiced = true;
      }
      if (!voiced && state.day === 13 && this.dayFirstEvent) {
        am.playVoice('event-day13');
        voiced = true;
      }
      if (!voiced && resolvedEventId === 'rate-limited') {
        am.playVoice('event-rate-limit');
        voiced = true;
      }
      if (!voiced && this.clashActive && !this.clashVoicedToday) {
        am.playVoice('event-clash');
        this.clashVoicedToday = true;
        voiced = true;
      }
      void voiced;
      this.dayFirstEvent = false;
    }

    // Apply any mid-execution timer changes from this event
    const timerDelta = state.timerBonusSeconds - timerBefore;
    if (timerDelta !== 0 && this.dayTimer) {
      this.timeSeconds = Math.max(0, this.timeSeconds + timerDelta);
      this.maxTimeSeconds = Math.max(this.maxTimeSeconds, this.timeSeconds);
    }

    // ── Parse logs for impact feedback ──
    this.applyImpactFeedback(logs, state);

    // ── Event reaction on a random agent ──
    if (this.agentPanelStates.length > 0) {
      const randomAgent = this.agentPanelStates[Math.floor(Math.random() * this.agentPanelStates.length)];
      const reaction = EVENT_REACTIONS[Math.floor(Math.random() * EVENT_REACTIONS.length)];
      randomAgent.statusText.setAlpha(0).setText(reaction).setColor('#39d353');
      this.tweens.add({ targets: randomAgent.statusText, alpha: 1, duration: 200, ease: 'Power2' });
      randomAgent.nextMessageAt = this.time.now + 3000;
      // Trait trigger flash on the agent row
      if (randomAgent.rowBg) {
        this.tweens.add({
          targets: randomAgent.rowBg,
          alpha: { from: 0, to: 0.3 },
          duration: 200,
          yoyo: true,
          ease: 'Power2',
        });
      }
    }

    // Close modal
    if (this.modalGroup) {
      this.tweens.add({
        targets: this.modalGroup,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.modalGroup?.destroy();
          this.modalGroup = undefined;
          if (this.dayTimer) this.dayTimer.paused = false;
          this.typingEngine.resume();
          this.taskbar.refresh();

          // Resume dramatic beat: zoom terminal back
          this.tweens.add({
            targets: [this.terminalWindow.container],
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 250,
            ease: 'Back.In'
          });
        },
      });
    } else {
      // If it was an auto-resolve, we might need to refresh UI anyway
      this.typingEngine.resume();
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
        const origColor = this.timeSeconds / this.maxTimeSeconds <= 0.3 ? COLORS.error : COLORS.warning;
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

  /** Temporarily update resource displays to show projected effect of a hovered choice */
  private applyResourcePreview(effects: EventEffect[]): void {
    if (!this.previewSnapshot) return;
    const { budget, hardwareHp, reputation } = this.previewSnapshot;
    const state = getState();

    for (const effect of effects) {
      if (effect.type === 'budget' && typeof effect.value === 'number' && state.playerClass !== 'corporateDev') {
        const projected = budget + effect.value;
        const isGain = effect.value > 0;
        const sign = effect.value >= 0 ? '+' : '-';
        this.budgetText
          .setText(`💰 Budget: $${projected.toLocaleString()} (${sign}$${Math.abs(effect.value)})`)
          .setColor(isGain ? '#3fb950' : '#f85149');
        this.tweens.add({ targets: this.budgetText, scaleX: 1.05, scaleY: 1.05, duration: 100, yoyo: true });
      } else if (effect.type === 'hardware' && typeof effect.value === 'number') {
        const projected = Math.max(0, Math.min(100, hardwareHp + effect.value));
        const isGain = effect.value > 0;
        const sign = effect.value >= 0 ? '+' : '-';
        this.hardwareText
          .setText(`🖥️ Hardware: ${projected}% (${sign}${Math.abs(effect.value)}%)`)
          .setColor(isGain ? '#3fb950' : '#f85149');
        this.hwBar.width = Math.round((projected / 100) * 160);
        this.hwBar.setFillStyle(isGain ? 0x3fb950 : 0xf85149);
        this.tweens.add({ targets: this.hardwareText, scaleX: 1.05, scaleY: 1.05, duration: 100, yoyo: true });
      } else if (effect.type === 'reputation' && typeof effect.value === 'number') {
        const projected = reputation + effect.value;
        const isGain = effect.value > 0;
        const sign = effect.value >= 0 ? '+' : '-';
        this.repText
          .setText(`⭐ Reputation: ${projected} (${sign}${Math.abs(effect.value)})`)
          .setColor(isGain ? '#3fb950' : '#f85149');
        this.tweens.add({ targets: this.repText, scaleX: 1.05, scaleY: 1.05, duration: 100, yoyo: true });
      } else if (effect.type === 'time' && typeof effect.value === 'number') {
        const deltaSecs = effect.value * 3;
        const projected = Math.max(0, this.timeSeconds + deltaSecs);
        const isGain = deltaSecs > 0;
        const sign = deltaSecs >= 0 ? '+' : '-';
        this.timeText
          .setText(`⏱️ Time: ${projected}s (${sign}${Math.abs(deltaSecs)}s)`)
          .setColor(isGain ? '#3fb950' : '#f85149');

        const frac = projected / this.maxTimeSeconds;
        this.timeBar.width = this.timeBg.width * frac;
        this.timeBar.setFillStyle(isGain ? 0x3fb950 : 0xf85149);
        this.tweens.add({ targets: this.timeText, scaleX: 1.05, scaleY: 1.05, duration: 100, yoyo: true });
      } else if (effect.type === 'agentSpeed' && typeof effect.value === 'number') {
        const dayBaseMid = (TUNING.TIMER_BY_DAY as Record<number, number>)[state.day] ?? TUNING.BASE_TIMER_SECONDS;
        const baseTimer = state.playerClass === 'corporateDev' ? Math.round(dayBaseMid * TUNING.CORP_TIMER_RATIO) : dayBaseMid;
        const deltaSecs = Math.round(baseTimer * (effect.value / 100));
        const projected = Math.max(0, this.timeSeconds + deltaSecs);
        const isGain = deltaSecs > 0;
        const sign = deltaSecs >= 0 ? '+' : '-';
        this.timeText
          .setText(`⏱️ Time: ${projected}s (${sign}${Math.abs(deltaSecs)}s efficiency)`)
          .setColor(isGain ? '#3fb950' : '#f85149');

        const frac = projected / this.maxTimeSeconds;
        this.timeBar.width = this.timeBg.width * frac;
        this.timeBar.setFillStyle(isGain ? 0x3fb950 : 0xf85149);
        this.tweens.add({ targets: this.timeText, scaleX: 1.05, scaleY: 1.05, duration: 100, yoyo: true });
      }
    }
  }

  /** Snap resource displays back to actual values (on pointerout or countdown auto-dismiss) */
  private restoreResourcePreview(): void {
    if (!this.previewSnapshot) return;
    const { budget, hardwareHp, reputation } = this.previewSnapshot;
    const state = getState();

    this.budgetText
      .setText(state.playerClass === 'corporateDev' ? '💳 Company Card' : `💰 Budget: $${budget.toLocaleString()}`)
      .setColor('#e6edf3')
      .setScale(1.0);

    this.hardwareText.setText(`🖥️ Hardware: ${hardwareHp}%`).setColor('#e6edf3').setScale(1.0);

    const hwBarColor = hardwareHp >= 60 ? 0x3fb950 : hardwareHp >= 30 ? 0xd29922 : 0xf85149;
    this.hwBar.width = Math.round((hardwareHp / 100) * 160);
    this.hwBar.setFillStyle(hwBarColor);

    this.repText.setText(`⭐ Reputation: ${reputation}`).setColor('#e6edf3').setScale(1.0);

    const timeFrac = this.timeSeconds / this.maxTimeSeconds;
    this.timeText.setText(`⏱️ Time: ${this.timeSeconds}s`).setColor('#9da5b0').setScale(1.0);
    this.timeBar.width = this.timeBg.width * timeFrac;
    this.timeBar.setFillStyle(timeFrac <= 0.3 ? COLORS.error : COLORS.warning);
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
    const titleObj = this.add.text(dx + 12, dy + 6, TUNING.COPY.PROJECT_COMPLETE_TITLE, {
      fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3',
    });
    this.modalGroup.add(titleObj);

    // Body
    const bodyObj = this.add.text(dx + 20, dy + 48, TUNING.COPY.PROJECT_COMPLETE_BODY, {
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
    this.scene.start('BugBountySelect');
  }

  private chooseOvertime(): void {
    this.modalGroup?.destroy();
    this.modalGroup = undefined;

    this.inOvertime = true;
    this.typingEngine.resume();
    this.terminal.addLine('Deploying to production...');

    // Swap prompt pool
    this.typingEngine.setPromptPool(OVERTIME_PROMPTS);

    // Show overtime counter overlay in terminal window corner
    const tArea = this.terminalWindow.contentArea;
    this.overtimeText = this.add.text(
      16 + tArea.x + tArea.width - 8,
      72 + tArea.y - 14,
      `${TUNING.COPY.OVERTIME_LABEL} +0`,
      { fontFamily: 'monospace', fontSize: '11px', color: '#f0883e' }
    ).setOrigin(1, 0).setDepth(100);
  }

  // ── Scoring ──

  private scoreDayAndStore(): void {
    this.typingEngine.stop();

    const state = getState();
    const dayScore = ScoringSystem.calcDayReputation(
      this.progress,
      this.typingEngine.getAccuracy(),
      state.strategy!,
      CLASS_DEFS[state.playerClass!],
      state.day,
      state.model
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
    // Idle message rotation for agent panel
    const time = this.time.now;
    for (const agentState of this.agentPanelStates) {
      if (time > agentState.nextMessageAt) {
        const messages = AGENT_MESSAGES[agentState.id]?.idle ?? ['⚡ Working...'];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        agentState.statusText.setAlpha(0).setText(msg).setColor('#39d353');
        this.tweens.add({ targets: agentState.statusText, alpha: 1, duration: 200, ease: 'Power2' });
        agentState.nextMessageAt = time + 4000 + Math.random() * 2000;
      }
    }

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
