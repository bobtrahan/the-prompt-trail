import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, TIME_UNITS_PER_DAY } from '../utils/constants';
import { getState } from '../systems/GameState';
import type { Strategy } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { EconomySystem } from '../systems/EconomySystem';

interface StrategyOption {
  id: Strategy;
  name: string;
  icon: string;
  desc: string;
  timeBonus: number;  // extra time units
  riskLabel: string;
}

const STRATEGIES: StrategyOption[] = [
  { id: 'planThenBuild', name: 'Plan Then Build', icon: '🎯', desc: 'Slower start, higher success rate, fewer hallucinations.', timeBonus: 2, riskLabel: 'Low Risk' },
  { id: 'justStart', name: 'Just Start Building', icon: '🚀', desc: 'Medium speed, medium risk. The reliable choice.', timeBonus: 0, riskLabel: 'Medium Risk' },
  { id: 'oneShot', name: 'One-Shot It', icon: '🎲', desc: 'Fast and cheap on time. High hallucination chance.', timeBonus: -2, riskLabel: 'High Risk' },
  { id: 'vibeCode', name: 'Vibe Code', icon: '🧠', desc: 'Wildcard. Could be brilliant or catastrophic.', timeBonus: 1, riskLabel: '???' },
];

export class PlanningScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private selectedStrategy: Strategy | null = null;
  private launchBtn!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private strategyPreviewText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Planning' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.selectedStrategy = null;

    this.taskbar = new Taskbar(this, theme.accent);

    // Header
    this.add.text(12, 8, `PromptOS  ·  Day ${state.day}/13  ·  Planning`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#30363d',
    });

    // Strategy picker window
    const stratWin = new Window({
      scene: this, x: 40, y: 50,
      width: 700, height: 580,
      title: 'Strategy Picker',
      titleIcon: '⚙️',
      accentColor: theme.accent,
    });

    const sArea = stratWin.contentArea;
    this.add.text(40 + sArea.x, 50 + sArea.y, 'Choose your approach:', {
      fontFamily: 'monospace', fontSize: '14px', color: '#8b949e',
    });

    this.cards = [];
    STRATEGIES.forEach((s, i) => {
      const cardY = 50 + sArea.y + 32 + i * 120;
      const cardX = 40 + sArea.x;
      const isLocked = state.lockedStrategies.includes(s.id);

      const card = this.add.rectangle(cardX, cardY, sArea.width, 100, isLocked ? 0x1a1a1a : COLORS.titleBar).setOrigin(0);
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

    // Model info panel (right side)
    const modelWin = new Window({
      scene: this, x: 760, y: 50,
      width: 480, height: 280,
      title: 'Model: ' + state.model,
      titleIcon: '📡',
      accentColor: theme.accent,
    });

    const mArea = modelWin.contentArea;
    this.add.text(760 + mArea.x, 50 + mArea.y, `Active Model: ${state.model}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
    });
    this.add.text(760 + mArea.x, 50 + mArea.y + 28, state.playerClass === 'corporateDev' ? '💳 Company Card' : `Budget: $${state.budget.toLocaleString()}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#8b949e',
    });
    this.add.text(760 + mArea.x, 50 + mArea.y + 52, `Hardware: ${state.hardwareHp}%`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#8b949e',
    });
    this.add.text(760 + mArea.x, 50 + mArea.y + 80, `Agent Slots: ${state.agentSlots}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#8b949e',
    });
    this.add.text(760 + mArea.x, 50 + mArea.y + 104, `Daily Cost: $${EconomySystem.getModelDayCost(state.model)}/day`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#8b949e',
    });

    // Agent slot (right side)
    const agentWin = new Window({
      scene: this, x: 760, y: 350,
      width: 480, height: 280,
      title: 'Agent Dashboard',
      titleIcon: '🤖',
      accentColor: theme.accent,
    });

    const aArea = agentWin.contentArea;
    this.add.text(760 + aArea.x, 350 + aArea.y, 'Active Agents:', {
      fontFamily: 'monospace', fontSize: '13px', color: '#8b949e',
    });
    // Default agent
    this.add.text(760 + aArea.x, 350 + aArea.y + 28, '🤖 Turbo — Fast & sloppy. Ships at all costs.', {
      fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3',
    });
    if (state.activeAgents.length === 0) {
      state.activeAgents = ['turbo'];
    }

    // Launch button
    this.launchBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '[ Select a strategy to continue ]', {
      fontFamily: 'monospace', fontSize: '16px', color: '#30363d',
    }).setOrigin(0.5);

    this.strategyPreviewText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
    }).setOrigin(0.5);
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

    // Enable launch
    this.launchBtn.setText(`[ Launch: ${option.icon} ${option.name} ]`);
    this.launchBtn.setColor('#58a6ff');
    this.launchBtn.setInteractive({ useHandCursor: true });
    this.launchBtn.off('pointerdown');
    this.launchBtn.on('pointerdown', () => this.scene.start('Execution'));

    const mod = EconomySystem.getStrategyModifier(option.id);
    this.strategyPreviewText.setText(`Est. cost: $${EconomySystem.getModelDayCost(state.model)}/day · Quality: ${mod.qualityMult.toFixed(1)}x`);
  }
}
