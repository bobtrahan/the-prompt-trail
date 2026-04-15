import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, TIME_UNITS_PER_DAY } from '../utils/constants';
import { getState } from '../systems/GameState';
import type { Strategy, ModelTier } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { EconomySystem } from '../systems/EconomySystem';
import { AGENT_ROSTER, SYNERGY_PAIRS, CLASH_PAIRS } from '../data/agents';

interface StrategyOption {
  id: Strategy;
  name: string;
  icon: string;
  desc: string;
  timeBonus: number;  // extra time units
  riskLabel: string;
}

const STRATEGIES: StrategyOption[] = [
  { id: 'planThenBuild', name: 'Plan Then Build', icon: '🎯', desc: 'Slower start, higher success rate, fewer hallucinations.', timeBonus: 2, riskLabel: EconomySystem.getStrategyModifier('planThenBuild').riskLabel },
  { id: 'justStart', name: 'Just Start Building', icon: '🚀', desc: 'Medium speed, medium risk. The reliable choice.', timeBonus: 0, riskLabel: EconomySystem.getStrategyModifier('justStart').riskLabel },
  { id: 'oneShot', name: 'One-Shot It', icon: '🎲', desc: 'Fast and cheap on time. High hallucination chance.', timeBonus: -2, riskLabel: EconomySystem.getStrategyModifier('oneShot').riskLabel },
  { id: 'vibeCode', name: 'Vibe Code', icon: '🧠', desc: 'Wildcard. Could be brilliant or catastrophic.', timeBonus: 1, riskLabel: EconomySystem.getStrategyModifier('vibeCode').riskLabel },
];

export class PlanningScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private selectedStrategy: Strategy | null = null;
  private launchBtn!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private strategyPreviewText!: Phaser.GameObjects.Text;

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
    this.selectedStrategy = null;
    this.selectedAgentIds = [];
    this.agentRowBgs = new Map();
    this.agentCheckmarks = new Map();

    this.taskbar = new Taskbar(this, theme.accent);

    // Header
    this.add.text(12, 8, `PromptOS  ·  Day ${state.day}/13  ·  Planning`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
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
      fontFamily: 'monospace', fontSize: '14px', color: '#8b949e',
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
        fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
        wordWrap: { width: sArea.width - 80 },
      });
      this.add.text(cardX + sArea.width - 120, cardY + 12, s.riskLabel, {
        fontFamily: 'monospace', fontSize: '11px',
        color: s.riskLabel === 'Low Risk' ? '#3fb950' : s.riskLabel === 'High Risk' ? '#f85149' : '#d29922',
      });

      if (!isLocked) {
        card.on('pointerdown', () => this.selectStrategy(s, i));
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
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
    });

    visibleModels.forEach((model, i) => {
      const rowY = my + 20 + i * MODEL_ROW_H;
      const rowW = mArea.width;
      const isUnlocked = state.unlockedModels.includes(model);
      const isSelected = state.model === model;
      const stars = MODEL_STARS[model];
      const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      const dailyCost = EconomySystem.getModelDayCost(model);
      const costLabel = isCorp ? '💳 Company Card' : `$${dailyCost}/day`;

      const rowBg = this.add.rectangle(mx, rowY, rowW, MODEL_ROW_H - 2, isSelected ? 0x1c3a1c : COLORS.titleBar).setOrigin(0);
      if (isSelected) rowBg.setStrokeStyle(1, 0x3fb950);

      if (isUnlocked) {
        rowBg.setInteractive({ useHandCursor: true });
        this.modelRowBgs.set(model, rowBg);

        rowBg.on('pointerdown', () => this.selectModel(model));
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
          fontFamily: 'monospace', fontSize: '11px', color: '#8b949e',
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
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
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

      this.add.text(ax + 10, rowY + 4, `🤖 ${agent.name}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3',
      });
      this.add.text(ax + 10, rowY + 22, `${agent.personality}  ·  Spd:${speedStars}  Qual:${qualStars}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#6e7681',
      });
      this.add.text(ax + rowW - 8, rowY + 4, agent.traitEffect.split('.')[0], {
        fontFamily: 'monospace', fontSize: '9px', color: '#8b949e',
        wordWrap: { width: 160 },
        align: 'right',
      }).setOrigin(1, 0);

      // Checkmark (hidden until selected)
      const chk = this.add.text(ax + rowW - 8, rowY + ROW_H - 10, '', {
        fontFamily: 'monospace', fontSize: '14px', color: '#3fb950',
      }).setOrigin(1, 1);
      this.agentCheckmarks.set(agent.id, chk);

      bg.on('pointerdown', () => this.toggleAgent(agent.id));
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
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
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
      this.strategyPreviewText.setText(`Daily cost: $${totalDayCost} (model $${EconomySystem.getModelDayCost(state.model)} + strategy $${mod.strategyCost}) · Quality: ${qualityLabel}`);
    }
  }

  private selectStrategy(option: StrategyOption, index: number): void {
    this.selectedStrategy = option.id;
    const state = getState();
    state.strategy = option.id;
    state.timeUnitsRemaining = TIME_UNITS_PER_DAY + option.timeBonus;

    // Highlight selected card
    this.cards.forEach((c, i) => {
      c.setFillStyle(i === index ? COLORS.accent : COLORS.titleBar);
      c.setAlpha(i === index ? 0.3 : 1);
    });

    this.updateLaunchState();

    const mod = EconomySystem.getStrategyModifier(option.id);
    const totalDayCost = EconomySystem.getModelDayCost(state.model) + mod.strategyCost;
    const qualityLabel = option.id === 'vibeCode' ? '???' : `${mod.qualityMult.toFixed(1)}x`;
    this.strategyPreviewText.setText(`Daily cost: $${totalDayCost} (model $${EconomySystem.getModelDayCost(state.model)} + strategy $${mod.strategyCost}) · Quality: ${qualityLabel}`);
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
      this.launchBtn.on('pointerdown', () => this.launch());
    }
  }

  private launch(): void {
    const state = getState();
    state.activeAgents = [...this.selectedAgentIds];
    this.scene.start('Execution');
  }
}
