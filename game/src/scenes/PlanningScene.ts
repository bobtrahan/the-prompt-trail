import Phaser from 'phaser';
import { CLASS_DEFS } from '../data/classes';
import { PROJECTS } from '../data/projects';
import { TUNING } from '../data/tuning';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import type { Strategy, ModelTier } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { EconomySystem } from '../systems/EconomySystem';
import { AgentSystem } from '../systems/AgentSystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { AGENT_ROSTER, SYNERGY_PAIRS, CLASH_PAIRS } from '../data/agents';
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
  private selectedStrategy: Strategy | null = null;
  private launchBtn!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Rectangle[] = [];

  // Effects panel refs
  private effectTimerText!: Phaser.GameObjects.Text;
  private effectTimerBar!: Phaser.GameObjects.Rectangle;
  private effectTimerBarBg!: Phaser.GameObjects.Rectangle;
  private effectCostText!: Phaser.GameObjects.Text;
  private effectRepText!: Phaser.GameObjects.Text;
  private effectRepEstText!: Phaser.GameObjects.Text;
  private effectAgentText!: Phaser.GameObjects.Text;

  // Agent picker state
  private selectedAgentIds: string[] = [];
  private agentRowBgs: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private agentCheckmarks: Map<string, Phaser.GameObjects.Text> = new Map();
  private synergyText!: Phaser.GameObjects.Text;
  private agentSlotLabel!: Phaser.GameObjects.Text;

  // Model picker state
  private modelRowBgs: Map<ModelTier, Phaser.GameObjects.Rectangle> = new Map();
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
    this.lastStrategyTimeBonus = 0;
    this.agentRowBgs = new Map();
    this.agentCheckmarks = new Map();

    new Taskbar(this, theme.accent);

    // Header
    this.add.text(12, 8, `PromptOS  ·  Day ${state.day}/13  ·  Planning`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
    });

    // ── Strategy picker window ──────────────────────────────────────────
    const STRAT_Y = 28;
    const stratWin = new Window({
      scene: this, x: 40, y: STRAT_Y,
      width: 700, height: 352,
      title: 'Strategy Picker',
      titleIcon: '⚙️',
      accentColor: theme.accent,
    });

    const sArea = stratWin.contentArea;
    this.add.text(40 + sArea.x, STRAT_Y + sArea.y, 'Choose your approach:', {
      fontFamily: 'monospace', fontSize: '14px', color: '#9da5b0',
    });

    this.modelRowBgs = new Map();
    this.cards = [];
    const CARD_H = 64;
    const CARD_STEP = 74;
    STRATEGIES.forEach((s, i) => {
      const cardY = STRAT_Y + sArea.y + 22 + i * CARD_STEP;
      const cardX = 40 + sArea.x;
      const isLocked = state.lockedStrategies.includes(s.id);

      const card = this.add.rectangle(cardX, cardY, sArea.width, CARD_H, isLocked ? 0x1a1a1a : COLORS.titleBar).setOrigin(0);
      if (!isLocked) {
        card.setInteractive({ useHandCursor: true });
        this.cards.push(card);
      }

      this.add.text(cardX + 16, cardY + 12, `${s.icon}  ${s.name}`, {
        fontFamily: 'monospace', fontSize: '16px', color: isLocked ? '#484f58' : '#e6edf3',
      });
      if (isLocked) {
        const lockMsg = state.playerClass === 'corporateDev'
          ? '🔒 Not compatible with corporate policy'
          : '🔒 Against company policy';
        this.add.text(cardX + 16, cardY + 36, lockMsg, {
          fontFamily: 'monospace', fontSize: '11px', color: '#484f58',
        });
      } else {
        this.add.text(cardX + 50, cardY + 36, s.desc, {
          fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
          wordWrap: { width: sArea.width - 80 },
        });
      }
      this.add.text(cardX + sArea.width - 120, cardY + 12, s.riskLabel, {
        fontFamily: 'monospace', fontSize: '11px',
        color: isLocked ? '#484f58' : s.riskLabel === 'Low Risk' ? '#3fb950' : s.riskLabel === 'High Risk' ? '#f85149' : '#d29922',
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
    const MODEL_WIN_H = 71 + visibleModels.length * MODEL_ROW_H;

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
    const agentWinY = 28 + MODEL_WIN_H + 8;
    const agentWin = new Window({
      scene: this, x: 760, y: agentWinY,
      width: 480, height: 350,
      title: 'Agent Selector',
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
    const ROW_H = 44;
    AGENT_ROSTER.forEach((agent, i) => {
      const rowY = ay + 20 + i * ROW_H;
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
      const circleY = rowY + 11;
      this.add.circle(circleX, circleY, 9, theme.accent).setAlpha(0.3);
      const emoji = AGENT_EMOJI[agent.id] || '🤖';
      this.add.text(circleX, circleY, emoji, {
        fontSize: '13px',
      }).setOrigin(0.5);

      this.add.text(ax + 38, rowY + 3, `${agent.name}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#e6edf3',
      });
      this.add.text(ax + 38, rowY + 19, `${agent.personality}  ·  Spd:${speedStars}  Qual:${qualStars}`, {
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

    // ── Effects Preview window ─────────────────────────────────────────
    const EFFECTS_Y = 388;
    const EFFECTS_H = 242;
    const effectsWin = new Window({
      scene: this, x: 40, y: EFFECTS_Y,
      width: 700, height: EFFECTS_H,
      title: 'Effects Preview',
      titleIcon: '📊',
      accentColor: theme.accent,
    });
    const eArea = effectsWin.contentArea;
    const ex = 40 + eArea.x;
    const ey = EFFECTS_Y + eArea.y;
    const eW = eArea.width;
    const EROW = 42;
    const labelStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0' as string };
    const valStyle   = { fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3' as string };

    // Row 0 — Timer
    this.add.text(ex + 8, ey + 6, '⏱️  Timer', labelStyle);
    this.effectTimerBarBg = this.add.rectangle(ex + 8, ey + 28, eW - 210, 6, COLORS.titleBar).setOrigin(0);
    this.effectTimerBar   = this.add.rectangle(ex + 8, ey + 28, 1, 6, 0x3fb950).setOrigin(0);
    this.effectTimerText  = this.add.text(ex + eW - 4, ey + 8, '—', valStyle).setOrigin(1, 0);
    this.add.rectangle(ex, ey + EROW - 2, eW, 1, COLORS.textDim).setAlpha(0.15).setOrigin(0);

    // Row 1 — Daily cost
    this.add.text(ex + 8, ey + EROW + 8, '💰  Daily Cost', labelStyle);
    this.effectCostText = this.add.text(ex + eW - 4, ey + EROW + 8, '—', valStyle).setOrigin(1, 0);
    this.add.rectangle(ex, ey + EROW * 2 - 2, eW, 1, COLORS.textDim).setAlpha(0.15).setOrigin(0);

    // Row 2 — Rep modifier
    this.add.text(ex + 8, ey + EROW * 2 + 8, '⭐  Rep Modifier', labelStyle);
    this.effectRepText = this.add.text(ex + eW - 4, ey + EROW * 2 + 8, '—', valStyle).setOrigin(1, 0);
    this.add.rectangle(ex, ey + EROW * 3 - 2, eW, 1, COLORS.textDim).setAlpha(0.15).setOrigin(0);

    // Row 3 — Agents
    this.add.text(ex + 8, ey + EROW * 3 + 8, '🤖  Agents', labelStyle);
    this.effectAgentText = this.add.text(ex + eW - 4, ey + EROW * 3 + 8, '—', {
      fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3',
      wordWrap: { width: eW - 120 }, align: 'right',
    }).setOrigin(1, 0);
    this.add.rectangle(ex, ey + EROW * 4 - 2, eW, 1, COLORS.textDim).setAlpha(0.15).setOrigin(0);

    // Row 4 — Reputation
    this.add.text(ex + 8, ey + EROW * 4 + 8, '⭐  Reputation', labelStyle);
    this.effectRepEstText = this.add.text(ex + eW - 4, ey + EROW * 4 + 8, '—', valStyle).setOrigin(1, 0);

    // ── Launch button ───────────────────────────────────────────────────
    this.launchBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 62, '[ Select a strategy to continue ]', {
      fontFamily: 'monospace', fontSize: '16px', color: '#30363d',
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
    this.refreshEffectsPanel();
  }

  private refreshEffectsPanel(): void {
    const state = getState();

    // ─ Timer row ─
    const dayBase = (TUNING.TIMER_BY_DAY as Record<number, number>)[state.day] ?? TUNING.BASE_TIMER_SECONDS;
    const baseTimer = state.playerClass === 'corporateDev'
      ? Math.round(dayBase * TUNING.CORP_TIMER_RATIO)
      : dayBase;
    const agentSpeedMod = AgentSystem.getSpeedModifier(this.selectedAgentIds);
    const agentSpeedSec = Math.round(baseTimer * agentSpeedMod);
    let agentTraitTimerDelta = 0;
    for (const id of this.selectedAgentIds) {
      const agent = AGENT_ROSTER.find(a => a.id === id);
      if (!agent) continue;
      if (agent.trait === 'agreeable') agentTraitTimerDelta += 3;       // always fires
      if (agent.trait === 'architecture_debates') agentTraitTimerDelta -= 2; // always fires
      // probabilistic traits (Turbo, Scope, Gremlin): annotate only, don't add to total
    }
    const strategyBonus = this.lastStrategyTimeBonus;
    let gpuBonus = 0;
    if (state.ownedUpgrades.includes('hw-gpu') && ['local', 'openSource'].includes(state.model)) {
      gpuBonus = Math.round(baseTimer * 0.1);
    }
    let monitorBonus = 0;
    if (state.ownedUpgrades.includes('hw-monitor')) {
      monitorBonus = Math.round(baseTimer * 0.05);
    }
    const totalTimer = Math.max(10, baseTimer + agentSpeedSec + agentTraitTimerDelta + strategyBonus + gpuBonus + monitorBonus);
    const maxTimer = baseTimer + 10; // rough ceiling for bar
    const timerFrac = Math.min(1, totalTimer / maxTimer);
    const timerColor = totalTimer >= baseTimer ? 0x3fb950 : totalTimer >= baseTimer * 0.7 ? 0xd29922 : 0xf85149;
    const barW = Math.max(2, Math.round(timerFrac * this.effectTimerBarBg.width));
    this.effectTimerBar.width = barW;
    this.effectTimerBar.setFillStyle(timerColor);
    const timerParts = [`${totalTimer}s`];
    if (strategyBonus !== 0) timerParts.push(`strategy ${strategyBonus > 0 ? '+' : ''}${strategyBonus}s`);
    if (agentSpeedSec !== 0) timerParts.push(`agents ${agentSpeedSec > 0 ? '+' : ''}${agentSpeedSec}s`);
    if (agentTraitTimerDelta !== 0) timerParts.push(`traits ${agentTraitTimerDelta > 0 ? '+' : ''}${agentTraitTimerDelta}s`);
    if (gpuBonus) timerParts.push(`gpu +${gpuBonus}s`);
    if (monitorBonus) timerParts.push(`monitor +${monitorBonus}s`);
    this.effectTimerText.setText(timerParts.join('  ·  ')).setColor(
      totalTimer >= baseTimer ? '#3fb950' : totalTimer >= baseTimer * 0.7 ? '#d29922' : '#f85149'
    );

    // ─ Daily cost row ─
    const modelCost = EconomySystem.getModelDayCost(state.model);
    const stratCost = this.selectedStrategy ? EconomySystem.getStrategyModifier(this.selectedStrategy).strategyCost : 0;
    const totalCost = modelCost + stratCost;
    const isCorp = state.playerClass === 'corporateDev';
    if (isCorp) {
      this.effectCostText.setText('💳 Company Card').setColor('#3fb950');
    } else {
      const affordable = state.budget >= totalCost;
      this.effectCostText
        .setText(`$${totalCost}/day  (model $${modelCost}${stratCost ? ` + strategy $${stratCost}` : ''})`)
        .setColor(affordable ? '#e6edf3' : '#f85149');
    }

    // ─ Rep modifier row ─
    const modelMod = EconomySystem.getModelQualityMod(state.model);
    const modelPct = Math.round(modelMod * 100);
    const repParts: string[] = [];
    if (modelPct !== 0) repParts.push(`${modelPct >= 0 ? '+' : ''}${modelPct}% model`);
    if (this.selectedStrategy) {
      const stratRepMap: Record<string, string> = {
        planThenBuild: '+15% strategy',
        oneShot: '-10% strategy',
        vibeCode: '-20%~+40% strategy',
      };
      if (stratRepMap[this.selectedStrategy]) repParts.push(stratRepMap[this.selectedStrategy]);
    }
    if (repParts.length === 0) repParts.push('no modifier');
    const repColor = repParts.some(p => p.startsWith('-')) ? '#d29922' : '#3fb950';
    this.effectRepText.setText(repParts.join('  ·  ')).setColor(repColor);

    // ─ Reputation estimate row ─
    const project = PROJECTS[state.day - 1];
    if (!project) {
      this.effectRepEstText.setText('—').setColor('#6e7681');
    } else {
      const stratForEst = this.selectedStrategy ?? 'justStart';
      const noStrat = !this.selectedStrategy;
      const floorScore = ScoringSystem.calcDayReputation(
        60,
        0.7,
        stratForEst,
        CLASS_DEFS[state.playerClass ?? 'techBro'],
        state.day,
        state.model
      );
      const ceilScore = ScoringSystem.calcDayReputation(
        100,
        1.0,
        stratForEst,
        CLASS_DEFS[state.playerClass ?? 'techBro'],
        state.day,
        state.model
      );
      if (stratForEst === 'vibeCode') {
        this.effectRepEstText.setText('+?? – +?? rep est.  (variable)').setColor('#d29922');
      } else {
        let traitRepBonus = 0;
        for (const id of this.selectedAgentIds) {
          const agent = AGENT_ROSTER.find(a => a.id === id);
          if (!agent) continue;
          if (agent.trait === 'low_hallucination') traitRepBonus += 5;  // Oracle, always
          if (agent.trait === 'architecture_debates') traitRepBonus += 8; // Linter, always
        }
        const lo = floorScore.total + traitRepBonus;
        const hi = ceilScore.total + traitRepBonus;
        const chanceNotes: string[] = [];
        for (const id of this.selectedAgentIds) {
          const agent = AGENT_ROSTER.find(a => a.id === id);
          if (!agent) continue;
          if (agent.trait === 'feature_creep') chanceNotes.push('25% +16 rep');
          if (agent.trait === 'deploy_unapproved') chanceNotes.push('20% -32 rep');
        }
        let synergyNote = '';
        for (const pair of SYNERGY_PAIRS) {
          if (pair.agents.every(id => this.selectedAgentIds.includes(id))) {
            synergyNote = `  ✨ +${Math.round(pair.effect * 100)}% speed synergy`;
            break;
          }
        }
        for (const pair of CLASH_PAIRS) {
          if (pair.agents.every(id => this.selectedAgentIds.includes(id))) {
            synergyNote = `  ⚡ ${Math.round(pair.effect * 100)}% speed clash`;
            break;
          }
        }
        const suffix = chanceNotes.length > 0 ? `  (${chanceNotes.join(', ')})` : (noStrat ? '  (no strategy)' : '');
        const txt = `${lo >= 0 ? '+' : ''}${lo} – ${hi >= 0 ? '+' : ''}${hi} rep est.${suffix}${synergyNote}`;
        const color = hi < 0 ? '#f85149' : lo < 0 ? '#d29922' : '#3fb950';
        this.effectRepEstText.setText(txt).setColor(color);
      }
    }

    // ─ Agents row ─
    if (this.selectedAgentIds.length === 0) {
      this.effectAgentText.setText('none selected').setColor('#6e7681');
    } else {
      const traitNotes: string[] = [];
      for (const id of this.selectedAgentIds) {
        const agent = AGENT_ROSTER.find(a => a.id === id);
        if (!agent) continue;
        const emoji = AGENT_EMOJI[id] ?? '🤖';
        if (agent.trait === 'low_hallucination') traitNotes.push(`${emoji} +5 rep`);
        else if (agent.trait === 'agreeable') traitNotes.push(`${emoji} +3s`);
        else if (agent.trait === 'architecture_debates') traitNotes.push(`${emoji} -2s / +8 rep`);
        else if (agent.trait === 'feature_creep') traitNotes.push(`${emoji} 25% -4s / +16 rep`);
        else if (agent.trait === 'deploy_unapproved') traitNotes.push(`${emoji} 20% +8s / -32 rep`);
        else if (agent.trait === 'wildcard_shortcut') traitNotes.push(`${emoji} 50% +6s or 50% -3s`);
        else traitNotes.push(`${emoji} ${agent.name}`);
      }
      // Check synergy / clash
      let synergyNote = '';
      for (const pair of SYNERGY_PAIRS) {
        if (pair.agents.every(id => this.selectedAgentIds.includes(id))) {
          const names = pair.agents.map(id => AGENT_ROSTER.find(a => a.id === id)?.name ?? id).join('+');
          synergyNote = `  │  🟢 ${names} synergy`;
          break;
        }
      }
      for (const pair of CLASH_PAIRS) {
        if (pair.agents.every(id => this.selectedAgentIds.includes(id))) {
          const names = pair.agents.map(id => AGENT_ROSTER.find(a => a.id === id)?.name ?? id).join('+');
          synergyNote = `  │  🔴 ${names} clash`;
          break;
        }
      }
      this.effectAgentText.setText(traitNotes.join('  ·  ') + synergyNote).setColor('#e6edf3');
    }
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

    this.refreshEffectsPanel();
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
    this.refreshEffectsPanel();
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
