import Phaser from 'phaser';
import { TUNING } from '../data/tuning';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import type { Strategy, ModelTier } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { EconomySystem } from '../systems/EconomySystem';
import { AgentSystem } from '../systems/AgentSystem';
import { AGENT_ROSTER, SYNERGY_PAIRS, CLASH_PAIRS } from '../data/agents';
import { BASE_TIMER_SECONDS } from '../utils/constants';
import AudioManager from '../systems/AudioManager';
import { drawWallpaper } from '../ui/DesktopWallpaper';

const AGENT_EMOJI: Record<string, string> = {
  turbo: '⚡',
  oracle: '🔮',
  gremlin: '👹',
  parrot: '🦜',
  linter: '🔍',
  scope: '🔭',
};

interface StrategyOption {
  id: Strategy;
  name: string;
  icon: string;
  desc: string;
  timeBonus: number;  // timer seconds bonus
  riskLabel: string;
}

const STRATEGIES: StrategyOption[] = [
  { id: 'planThenBuild', name: 'Plan Then Build', icon: '🎯', desc: 'Slow down and think. +6 seconds, higher success rate, fewer hallucinations.', timeBonus: 6, riskLabel: EconomySystem.getStrategyModifier('planThenBuild').riskLabel },
  { id: 'justStart', name: 'Just Start Building', icon: '🚀', desc: 'The reliable middle ground. Standard timer, balanced risk.', timeBonus: 0, riskLabel: EconomySystem.getStrategyModifier('justStart').riskLabel },
  { id: 'oneShot', name: 'One-Shot It', icon: '🎲', desc: 'Full send, no going back. −6 seconds, high hallucination chance.', timeBonus: -6, riskLabel: EconomySystem.getStrategyModifier('oneShot').riskLabel },
  { id: 'vibeCode', name: 'Vibe Code', icon: '🧠', desc: 'Ignore the specs. +3 seconds, but results are a complete toss-up.', timeBonus: 3, riskLabel: EconomySystem.getStrategyModifier('vibeCode').riskLabel },
];

export class PlanningScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private selectedStrategy: Strategy | null = null;
  private launchBtn!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private strategyPreviewText!: Phaser.GameObjects.Text;
  private agentSummaryText!: Phaser.GameObjects.Text;

  // Agent picker state
  private selectedAgentIds: string[] = [];
  private agentRowBgs: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private agentCheckmarks: Map<string, Phaser.GameObjects.Text> = new Map();
  private synergyText!: Phaser.GameObjects.Text;
  private agentSlotLabel!: Phaser.GameObjects.Text;

  // Model picker state
  private modelRowBgs: Map<ModelTier, Phaser.GameObjects.Rectangle> = new Map();
  private modelWinTitle!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Planning' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);
    this.selectedStrategy = null;
    this.selectedAgentIds = [];
    this.agentRowBgs = new Map();
    this.agentCheckmarks = new Map();

    this.taskbar = new Taskbar(this, theme.accent);

    // Header
    this.add.text(12, 8, `PromptOS  ·  Day ${state.day}/13  ·  Planning`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
    });

    // ── Strategy picker window ──────────────────────────────────────────
    const stratWin = new Window({
      scene: this, x: 40, y: 50,
      width: 700, height: 500,
      title: 'Strategy Picker',
      titleIcon: '⚙️',
      accentColor: theme.accent,
    });

    const sArea = stratWin.contentArea;
    this.add.text(40 + sArea.x, 50 + sArea.y, 'Choose your approach:', {
      fontFamily: 'monospace', fontSize: '14px', color: '#9da5b0',
    });

    this.modelRowBgs = new Map();
    this.cards = [];
    STRATEGIES.forEach((s, i) => {
      const cardY = 50 + sArea.y + 28 + i * 110;
      const cardX = 40 + sArea.x;
      const isLocked = state.lockedStrategies.includes(s.id);

      const card = this.add.rectangle(cardX, cardY, sArea.width, 90, isLocked ? 0x1a1a1a : COLORS.titleBar).setOrigin(0);
      if (!isLocked) {
        card.setInteractive({ useHandCursor: true });
        this.cards.push(card);
      }

      this.add.text(cardX + 16, cardY + 12, `${s.icon}  ${s.name}`, {
        fontFamily: 'monospace', fontSize: '16px', color: isLocked ? '#484f58' : '#e6edf3',
      });
      if (isLocked) {
        this.add.text(cardX + 16, cardY + 34, '🔒 Against company policy', {
          fontFamily: 'monospace', fontSize: '11px', color: '#484f58',
        });
      }
      this.add.text(cardX + 50, cardY + 38, s.desc, {
        fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
        wordWrap: { width: sArea.width - 80 },
      });
      this.add.text(cardX + sArea.width - 120, cardY + 12, s.riskLabel, {
        fontFamily: 'monospace', fontSize: '11px',
        color: s.riskLabel === 'Low Risk' ? '#3fb950' : s.riskLabel === 'High Risk' ? '#f85149' : '#d29922',
      });

      if (!isLocked) {
        card.on('pointerdown', () => {
          AudioManager.getInstance().playSFX('ui-click');
          this.selectStrategy(s, i);
        });
        card.on('pointerover', () => {
          if (this.selectedStrategy !== s.id) card.setFillStyle(COLORS.windowBg);
        });
        card.on('pointerout', () => {
          if (this.selectedStrategy !== s.id) card.setFillStyle(COLORS.titleBar);
        });
      }
    });

    // ── Model picker panel (right side, interactive) ──────────────────────────
    const ALL_MODELS: ModelTier[] = ['free', 'sketchy', 'local', 'openSource', 'standard', 'frontier'];
    const MODEL_STARS: Record<ModelTier, number> = {
      free: 1, sketchy: 2, local: 2, openSource: 3, standard: 3, frontier: 5,
    };
    const MODEL_NAMES: Record<ModelTier, string> = {
      free: 'Free', sketchy: 'Sketchy', local: 'Local', openSource: 'Open Source', standard: 'Standard', frontier: 'Frontier',
    };

    const isCorp = state.playerClass === 'corporateDev';
    // For corp dev, hide locked models (they can't use them); show only unlocked
    const visibleModels = isCorp
      ? ALL_MODELS.filter(m => !state.lockedModels.includes(m))
      : ALL_MODELS;

    const MODEL_ROW_H = 28;
    const MODEL_WIN_H = 42 + visibleModels.length * MODEL_ROW_H + 8;

    const modelWin = new Window({
      scene: this, x: 760, y: 28,
      width: 480, height: MODEL_WIN_H,
      title: 'Model Selector',
      titleIcon: '📡',
      accentColor: theme.accent,
    });

    const mArea = modelWin.contentArea;
    const mx = 760 + mArea.x;
    const my = 28 + mArea.y;

    this.add.text(mx, my, 'Select AI Model:', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
    });

    visibleModels.forEach((model, i) => {
      const rowY = my + 20 + i * MODEL_ROW_H;
      const rowW = mArea.width;
      const isUnlocked = state.unlockedModels.includes(model);
      const isSelected = state.model === model;
      const stars = MODEL_STARS[model];
      const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      const dailyCost = EconomySystem.getModelDayCost(model);
      const costLabel = isCorp ? '💳 Company Card — no daily cost' : `$${dailyCost}/day`;

      const rowBg = this.add.rectangle(mx, rowY, rowW, MODEL_ROW_H - 2, isSelected ? 0x1c3a1c : COLORS.titleBar).setOrigin(0);
      if (isSelected) rowBg.setStrokeStyle(1, 0x3fb950);

      if (isUnlocked) {
        rowBg.setInteractive({ useHandCursor: true });
        this.modelRowBgs.set(model, rowBg);

        rowBg.on('pointerdown', () => {
          AudioManager.getInstance().playSFX('ui-click');
          this.selectModel(model);
        });
        rowBg.on('pointerover', () => {
          if (state.model !== model) rowBg.setFillStyle(COLORS.windowBg);
        });
        rowBg.on('pointerout', () => {
          if (state.model !== model) rowBg.setFillStyle(COLORS.titleBar);
        });

        this.add.text(mx + 8, rowY + 5, `${MODEL_NAMES[model]}`, {
          fontFamily: 'monospace', fontSize: '12px', color: isSelected ? '#3fb950' : '#e6edf3',
        });
        this.add.text(mx + 130, rowY + 5, starStr, {
          fontFamily: 'monospace', fontSize: '11px', color: '#d29922',
        });
        this.add.text(mx + rowW - 4, rowY + 5, costLabel, {
          fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0',
        }).setOrigin(1, 0);
      } else {
        // Locked — show grayed with lock
        this.add.text(mx + 8, rowY + 5, `🔒 ${MODEL_NAMES[model]}`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#484f58',
        });
        this.add.text(mx + 130, rowY + 5, starStr, {
          fontFamily: 'monospace', fontSize: '11px', color: '#30363d',
        });
        this.add.text(mx + rowW - 4, rowY + 5, 'Buy in Token Market', {
          fontFamily: 'monospace', fontSize: '10px', color: '#484f58',
        }).setOrigin(1, 0);
      }
    });

    // ── Agent Dashboard (right side, interactive picker) ─────────────────
    const agentWinY = 28 + MODEL_WIN_H + 10;
    const agentWin = new Window({
      scene: this, x: 760, y: agentWinY,
      width: 480, height: 360,
      title: 'Agent Dashboard',
      titleIcon: '🤖',
      accentColor: theme.accent,
    });

    const aArea = agentWin.contentArea;
    const ax = 760 + aArea.x;
    const ay = agentWinY + aArea.y;

    // Slot counter label
    this.agentSlotLabel = this.add.text(ax, ay, `Select Agents  (0 / ${state.agentSlots})`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
    });

    // Agent rows
    const ROW_H = 42;
    AGENT_ROSTER.forEach((agent, i) => {
      const rowY = ay + 22 + i * ROW_H;
      const rowW = aArea.width;

      // Background rect (clickable)
      const bg = this.add.rectangle(ax, rowY, rowW, ROW_H - 3, COLORS.titleBar).setOrigin(0);
      bg.setInteractive({ useHandCursor: true });
      this.agentRowBgs.set(agent.id, bg);

      // Speed / quality stars
      const speedStars = '★'.repeat(agent.speed) + '☆'.repeat(5 - agent.speed);
      const qualStars  = '★'.repeat(agent.quality) + '☆'.repeat(5 - agent.quality);

      // Emoji avatar circle
      const circleX = ax + 18;
      const circleY = rowY + 13;
      this.add.circle(circleX, circleY, 10, theme.accent).setAlpha(0.3);
      const emoji = AGENT_EMOJI[agent.id] || '🤖';
      this.add.text(circleX, circleY, emoji, {
        fontSize: '14px',
      }).setOrigin(0.5);

      this.add.text(ax + 38, rowY + 4, `${agent.name}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3',
      });
      this.add.text(ax + 38, rowY + 22, `${agent.personality}  ·  Spd:${speedStars}  Qual:${qualStars}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#6e7681',
      });
      this.add.text(ax + rowW - 8, rowY + 4, agent.traitEffect.split('.')[0], {
        fontFamily: 'monospace', fontSize: '9px', color: '#9da5b0',
        wordWrap: { width: 160 },
        align: 'right',
      }).setOrigin(1, 0);

      // Checkmark (hidden until selected)
      const chk = this.add.text(ax + rowW - 8, rowY + ROW_H - 10, '', {
        fontFamily: 'monospace', fontSize: '14px', color: '#3fb950',
      }).setOrigin(1, 1);
      this.agentCheckmarks.set(agent.id, chk);

      bg.on('pointerdown', () => {
        AudioManager.getInstance().playSFX('ui-click');
        this.toggleAgent(agent.id);
      });
      bg.on('pointerover', () => {
        if (!this.selectedAgentIds.includes(agent.id)) bg.setFillStyle(COLORS.windowBg);
      });
      bg.on('pointerout', () => {
        if (!this.selectedAgentIds.includes(agent.id)) bg.setFillStyle(COLORS.titleBar);
      });
    });

    // Synergy / clash indicator
    const synergyY = ay + 22 + AGENT_ROSTER.length * ROW_H + 6;
    this.synergyText = this.add.text(ax, synergyY, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#3fb950',
      wordWrap: { width: aArea.width },
    });

    // ── Launch button ───────────────────────────────────────────────────
    this.launchBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '[ Select a strategy to continue ]', {
      fontFamily: 'monospace', fontSize: '16px', color: '#30363d',
    }).setOrigin(0.5);

    this.strategyPreviewText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 55, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
    }).setOrigin(0.5);

    this.agentSummaryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 38, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0',
    }).setOrigin(0.5);
  }

  // ── Agent picker logic ────────────────────────────────────────────────

  private toggleAgent(agentId: string): void {
    const state = getState();
    const maxSlots = state.agentSlots;
    const idx = this.selectedAgentIds.indexOf(agentId);

    if (idx >= 0) {
      // Deselect
      this.selectedAgentIds.splice(idx, 1);
    } else {
      if (this.selectedAgentIds.length >= maxSlots) {
        // Deselect oldest (first in array)
        const evicted = this.selectedAgentIds.shift()!;
        this.applyRowStyle(evicted, false);
      }
      this.selectedAgentIds.push(agentId);
    }

    this.refreshAgentUI();
  }

  private applyRowStyle(agentId: string, selected: boolean): void {
    const bg  = this.agentRowBgs.get(agentId);
    const chk = this.agentCheckmarks.get(agentId);
    if (bg) {
      bg.setFillStyle(selected ? 0x1c3a1c : COLORS.titleBar);
      bg.setStrokeStyle(selected ? 1 : 0, selected ? 0x3fb950 : 0x000000);
    }
    if (chk) chk.setText(selected ? '✔' : '');
  }

  private refreshAgentUI(): void {
    const state = getState();

    // Update row styles
    AGENT_ROSTER.forEach(a => this.applyRowStyle(a.id, this.selectedAgentIds.includes(a.id)));

    // Update slot label
    this.agentSlotLabel.setText(`Select Agents  (${this.selectedAgentIds.length} / ${state.agentSlots})`);

    // Synergy / clash check
    this.updateSynergyIndicator();

    // Re-evaluate launch readiness
    this.updateLaunchState();
    this.refreshAgentSummary();
  }

  private refreshAgentSummary(): void {
    const state = getState();
    const parts: string[] = [];

    // Timer: base + strategy + agent speed + GPU
    const baseTimer = state.playerClass === 'corporateDev' ? TUNING.CORP_TIMER_SECONDS : BASE_TIMER_SECONDS;
    const agentSpeedMod = AgentSystem.getSpeedModifier(this.selectedAgentIds);
    const agentSpeedSec = Math.round(baseTimer * agentSpeedMod);
    const strategyBonus = this.lastStrategyTimeBonus;
    let gpuBonus = 0;
    if (state.ownedUpgrades.includes('hw-gpu') && ['local', 'openSource'].includes(state.model)) {
      gpuBonus = Math.round(baseTimer * 0.1);
    }
    let monitorBonus = 0;
    if (state.ownedUpgrades.includes('hw-monitor')) {
      monitorBonus = Math.round(baseTimer * 0.05);
    }
    const totalTimer = Math.max(10, baseTimer + agentSpeedSec + strategyBonus + gpuBonus + monitorBonus);
    parts.push(`⏱️ ${totalTimer}s timer`);

    // Model rep modifier
    const modelMod = EconomySystem.getModelQualityMod(state.model);
    if (modelMod !== 0) {
      const pct = Math.round(modelMod * 100);
      parts.push(`${pct >= 0 ? '+' : ''}${pct}% rep (model)`);
    }

    // Strategy rep modifier
    if (this.selectedStrategy) {
      const option = STRATEGIES.find(s => s.id === this.selectedStrategy);
      if (option) {
        const stratMod = option.id === 'planThenBuild' ? '+15%' : option.id === 'oneShot' ? '-10%' : option.id === 'vibeCode' ? '-20%~+40%' : '';
        if (stratMod) parts.push(`${stratMod} rep (strategy)`);
      }
    }

    // Agent traits
    const traitNotes: string[] = [];
    for (const id of this.selectedAgentIds) {
      const agent = AGENT_ROSTER.find(a => a.id === id);
      if (!agent) continue;
      if (agent.trait === 'low_hallucination') traitNotes.push('Oracle: +5 rep/day');
      if (agent.trait === 'agreeable') traitNotes.push('Parrot: +3s');
      if (agent.trait === 'deploy_unapproved') traitNotes.push('Turbo: 20% chance for +10 progress');
      if (agent.trait === 'architecture_debates') traitNotes.push('Linter: -3s/day');
      if (agent.trait === 'feature_creep') traitNotes.push('Scope: 25% chance for -6s');
      if (agent.trait === 'wildcard_shortcut') traitNotes.push('Gremlin: 50/50 for +6s or -3s');
    }
    if (traitNotes.length > 0) parts.push(traitNotes.join(' · '));

    this.agentSummaryText.setText(parts.join('  │  '));
  }

  private updateSynergyIndicator(): void {
    if (this.selectedAgentIds.length < 2) {
      this.synergyText.setText('');
      return;
    }

    // Check synergies
    for (const pair of SYNERGY_PAIRS) {
      const allPresent = pair.agents.every(id => this.selectedAgentIds.includes(id));
      if (allPresent) {
        const names = pair.agents.map(id => AGENT_ROSTER.find(a => a.id === id)?.name ?? id).join(' + ');
        const pct = Math.round(pair.effect * 100);
        this.synergyText.setColor('#3fb950');
        this.synergyText.setText(`✨ Synergy: ${names} (+${pct}% speed)`);
        return;
      }
    }

    // Check clashes
    for (const pair of CLASH_PAIRS) {
      const allPresent = pair.agents.every(id => this.selectedAgentIds.includes(id));
      if (allPresent) {
        const names = pair.agents.map(id => AGENT_ROSTER.find(a => a.id === id)?.name ?? id).join(' + ');
        const pct = Math.round(Math.abs(pair.effect) * 100);
        this.synergyText.setColor('#f85149');
        this.synergyText.setText(`⚡ Clash: ${names} (-${pct}% speed)`);
        return;
      }
    }

    this.synergyText.setText('');
  }

  // ── Strategy selection ────────────────────────────────────────────────

  // ── Model selection ────────────────────────────────────────────────────

  private selectModel(model: ModelTier): void {
    const state = getState();
    state.model = model;

    // Update row highlight styles
    this.modelRowBgs.forEach((bg, m) => {
      const selected = m === model;
      bg.setFillStyle(selected ? 0x1c3a1c : COLORS.titleBar);
      if (selected) bg.setStrokeStyle(1, 0x3fb950);
      else bg.setStrokeStyle(0, 0);
    });

    // Refresh the strategy cost preview if a strategy is selected
    if (this.selectedStrategy) {
      const option = STRATEGIES.find(s => s.id === this.selectedStrategy)!;
      const mod = EconomySystem.getStrategyModifier(option.id);
      const totalDayCost = EconomySystem.getModelDayCost(state.model) + mod.strategyCost;
      const qualityLabel = option.id === 'vibeCode' ? '???' : `${mod.qualityMult.toFixed(1)}x`;
      if (state.playerClass === 'corporateDev') {
        this.strategyPreviewText.setText(`Daily cost: 💳 Company Card · Quality: ${qualityLabel}`);
      } else {
        this.strategyPreviewText.setText(`Daily cost: $${totalDayCost} (model $${EconomySystem.getModelDayCost(state.model)} + strategy $${mod.strategyCost}) · Quality: ${qualityLabel}`);
      }
    }
    this.refreshAgentSummary();
  }

  private lastStrategyTimeBonus = 0;

  private selectStrategy(option: StrategyOption, index: number): void {
    this.selectedStrategy = option.id;
    const state = getState();
    state.strategy = option.id;
    // Undo previous selection's bonus, apply new one
    state.timerBonusSeconds -= this.lastStrategyTimeBonus;
    state.timerBonusSeconds += option.timeBonus;
    this.lastStrategyTimeBonus = option.timeBonus;

    // Highlight selected card
    this.cards.forEach((c, i) => {
      c.setFillStyle(i === index ? COLORS.accent : COLORS.titleBar);
      c.setAlpha(i === index ? 0.3 : 1);
    });

    this.updateLaunchState();

    const mod = EconomySystem.getStrategyModifier(option.id);
    const totalDayCost = EconomySystem.getModelDayCost(state.model) + mod.strategyCost;
    const qualityLabel = option.id === 'vibeCode' ? '???' : `${mod.qualityMult.toFixed(1)}x`;
    if (state.playerClass === 'corporateDev') {
      this.strategyPreviewText.setText(`Daily cost: 💳 Company Card · Quality: ${qualityLabel}`);
    } else {
      this.strategyPreviewText.setText(`Daily cost: $${totalDayCost} (model $${EconomySystem.getModelDayCost(state.model)} + strategy $${mod.strategyCost}) · Quality: ${qualityLabel}`);
    }
    this.refreshAgentSummary();
  }

  private updateLaunchState(): void {
    const state = getState();
    const hasStrategy = this.selectedStrategy !== null;
    const agentsFull = this.selectedAgentIds.length === state.agentSlots;

    this.launchBtn.off('pointerdown');
    this.launchBtn.disableInteractive();

    if (!hasStrategy && !agentsFull) {
      const remaining = state.agentSlots - this.selectedAgentIds.length;
      this.launchBtn.setText(`[ Select strategy and ${remaining} agent${remaining > 1 ? 's' : ''} ]`);
      this.launchBtn.setColor('#30363d');
    } else if (!hasStrategy) {
      this.launchBtn.setText('[ Select a strategy to continue ]');
      this.launchBtn.setColor('#30363d');
    } else if (!agentsFull) {
      const remaining = state.agentSlots - this.selectedAgentIds.length;
      this.launchBtn.setText(`[ Select ${remaining} more agent${remaining > 1 ? 's' : ''} ]`);
      this.launchBtn.setColor('#30363d');
    } else {
      const option = STRATEGIES.find(s => s.id === this.selectedStrategy)!;
      this.launchBtn.setText(`[ Launch: ${option.icon} ${option.name} ]`);
      this.launchBtn.setColor('#58a6ff');
      this.launchBtn.setInteractive({ useHandCursor: true });
      this.launchBtn.on('pointerdown', () => {
        AudioManager.getInstance().playSFX('ui-click');
        this.launch();
      });
    }
  }

  private launch(): void {
    const state = getState();
    state.activeAgents = [...this.selectedAgentIds];
    this.scene.start('Execution');
  }
}
