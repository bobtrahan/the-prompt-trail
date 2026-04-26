import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { PROJECTS } from '../data/projects';
import AudioManager from '../systems/AudioManager';
import { drawWallpaper } from '../ui/DesktopWallpaper';
import { calcRunningGrade, GRADE_FLAVOR, RANK_COLORS } from './resultsGrade';
import { TUNING } from '../data/tuning';

export class ResultsScene extends Phaser.Scene {
  private window!: Window;
  private continueBtn!: Phaser.GameObjects.Text;
  
  // Animation state
  private animProgress = 0;
  private animDuration = 1000; // 1 second // audit-ok — constant, never mutated
  private isAnimating = true;

  // Cached layout values needed in update()
  private winWidth = 500; // audit-ok — constant, never mutated
  private winHeight = 540; // audit-ok — constant, never mutated
  private themeAccent = 0x00ffcc;
  private yShift = 0;

  // Display objects
  private progressText!: Phaser.GameObjects.Text;
  private accuracyText!: Phaser.GameObjects.Text;
  private baseRepText!: Phaser.GameObjects.Text;
  private accuracyBonusText!: Phaser.GameObjects.Text;
  private strategyBonusText!: Phaser.GameObjects.Text;
  private modelBonusText!: Phaser.GameObjects.Text;
  private overtimeBonusText?: Phaser.GameObjects.Text;
  private agentBonusText?: Phaser.GameObjects.Text;
  private eventRepText?: Phaser.GameObjects.Text;
  private totalRepText!: Phaser.GameObjects.Text;
  private runningGradeDividerText!: Phaser.GameObjects.Text;
  private runningGradeLabelText!: Phaser.GameObjects.Text;
  private runningGradeText!: Phaser.GameObjects.Text;
  private runningGradeFlavorText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Results' });
  }

  create(): void {
    const state = getState();
    const result = state.lastDayResult;

    if (!result) {
      console.warn('No lastDayResult found in GameState!');
      this.advance();
      return;
    }

    AudioManager.getInstance().playMusic('night');

    const theme = getTheme(state.playerClass ?? undefined);
    this.themeAccent = theme.accent;

    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);
    new Taskbar(this, theme.accent);

    AudioManager.getInstance().playSFX('day-complete');

    // Create Results Window
    const winWidth = this.winWidth;
    const winHeight = this.winHeight;
    this.window = new Window({
      scene: this,
      x: (GAME_WIDTH - winWidth) / 2,
      y: (GAME_HEIGHT - winHeight) / 2 - 20,
      width: winWidth,
      height: winHeight,
      title: `Day ${state.day} Results`,
      titleIcon: '📊',
      accentColor: theme.accent,
    });

    const project = PROJECTS[state.day - 1];
    const { x, y, width } = this.window.contentArea;

    // Project Name & Status
    this.window.add(this.add.text(x, y + 10, `Project: ${project?.name || 'Unknown'}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#e6edf3'
    }));

    const statusLabel = result.progress >= 100 ? '✅ Complete' : '⚠️ Partial';
    const statusColor = result.progress >= 100 ? '#3fb950' : '#d29922';
    this.window.add(this.add.text(x + width, y + 10, statusLabel, {
      fontFamily: 'monospace', fontSize: '14px', color: statusColor
    }).setOrigin(1, 0));

    // Divider
    this.window.add(this.add.text(x + width/2, y + 45, '── BREAKDOWN ──', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0'
    }).setOrigin(0.5));

    // Stats Labels
    const labelStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#9da5b0' };
    const valueStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3' };

    this.window.add(this.add.text(x + 20, y + 63, 'Progress:', labelStyle));
    this.progressText = this.add.text(x + 140, y + 63, '0%', valueStyle);
    this.window.add(this.progressText);

    this.window.add(this.add.text(x + 20, y + 88, 'Accuracy:', labelStyle));
    this.accuracyText = this.add.text(x + 140, y + 88, '0%', valueStyle);
    this.window.add(this.accuracyText);

    this.window.add(this.add.text(x + 20, y + 113, 'Base Rep:', labelStyle));
    this.baseRepText = this.add.text(x + 140, y + 113, '+0', valueStyle);
    this.window.add(this.baseRepText);

    this.window.add(this.add.text(x + 20, y + 138, 'Accuracy ♙:', labelStyle));
    this.accuracyBonusText = this.add.text(x + 140, y + 138, '+0', valueStyle);
    this.window.add(this.accuracyBonusText);

    const strategyLabel = this.getStrategyLabel(state.strategy || 'justStart');
    const hasOvertime = state.overtimeBonus > 0;
    const hasAgentBonus = state.agentBonus > 0;
    const hasEventRep = state.eventRepDelta !== 0;
    this.yShift = 25; // model bonus row always present

    this.window.add(this.add.text(x + 20, y + 163, 'Strategy ♙:', labelStyle));
    this.strategyBonusText = this.add.text(x + 140, y + 163, `+0  (${strategyLabel})`, valueStyle);
    this.window.add(this.strategyBonusText);

    this.window.add(this.add.text(x + 20, y + 188, 'Model ♙:', labelStyle));
    this.modelBonusText = this.add.text(x + 140, y + 188, '+0', valueStyle);
    this.window.add(this.modelBonusText);

    let nextBonusY = y + 213;

    if (hasAgentBonus) {
      this.yShift += 25;
      this.window.add(this.add.text(x + 20, nextBonusY, 'Agent ✨:', labelStyle));
      this.agentBonusText = this.add.text(x + 140, nextBonusY, '+0', valueStyle);
      this.window.add(this.agentBonusText);
      nextBonusY += 25;
    }

    if (hasEventRep) {
      this.yShift += 25;
      this.window.add(this.add.text(x + 20, nextBonusY, 'Events ⚡:', labelStyle));
      this.eventRepText = this.add.text(x + 140, nextBonusY, '+0', valueStyle);
      this.window.add(this.eventRepText);
      nextBonusY += 25;
    }

    if (hasOvertime) {
      this.yShift += 25;
      this.window.add(this.add.text(x + 20, nextBonusY, TUNING.COPY.OVERTIME_LABEL, labelStyle));
      this.overtimeBonusText = this.add.text(x + 140, nextBonusY, '+0', valueStyle);
      this.window.add(this.overtimeBonusText);
    }

    const yShift = this.yShift;

    // Footer Divider
    this.window.add(this.add.text(x + width/2, y + 193 + yShift, '───────────', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0'
    }).setOrigin(0.5));

    // Total
    this.window.add(this.add.text(x + 20, y + 218 + yShift, 'Day Total:', {
      fontFamily: 'monospace', fontSize: '18px', color: '#e6edf3', fontStyle: 'bold'
    }));
    this.totalRepText = this.add.text(x + 140, y + 218 + yShift, '+0 ⭐', {
      fontFamily: 'monospace', fontSize: '18px', color: '#e6edf3', fontStyle: 'bold'
    });
    this.window.add(this.totalRepText);

    // Delta Stats
    const deltaY = y + 256 + yShift;
    this.window.add(this.add.text(x + 20, deltaY, `Budget Spent: $${result.budgetSpent}`, labelStyle));
    
    const hwStart = Math.round(state.dayStartHardware);
    const hwEnd = Math.round(state.hardwareHp);
    this.window.add(this.add.text(x + width - 20, deltaY, `Hardware: ${hwStart}% → ${hwEnd}%`, labelStyle).setOrigin(1, 0));

    const runningGrade = calcRunningGrade(state.dayScores, state.day);
    const runningGradeColor = RANK_COLORS[runningGrade.rank] ?? '#e6edf3';
    const runningGradeFlavor = GRADE_FLAVOR[runningGrade.rank] ?? '';

    this.runningGradeDividerText = this.add.text(x + width / 2, deltaY + 35, '── RUNNING GRADE ──', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0'
    }).setOrigin(0.5).setAlpha(0);
    this.window.add(this.runningGradeDividerText);

    this.runningGradeLabelText = this.add.text(x + 20, deltaY + 58, `Day ${state.day} Grade:`, labelStyle).setAlpha(0);
    this.window.add(this.runningGradeLabelText);

    this.runningGradeText = this.add.text(x + width - 20, deltaY + 46, runningGrade.rank, {
      fontFamily: 'monospace', fontSize: '32px', color: runningGradeColor, fontStyle: 'bold'
    }).setOrigin(1, 0).setAlpha(0);
    this.window.add(this.runningGradeText);

    this.runningGradeFlavorText = this.add.text(x + width / 2, deltaY + 94, runningGradeFlavor, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0',
      wordWrap: { width: width - 40 }, align: 'center',
    }).setOrigin(0.5, 0).setAlpha(0);
    this.window.add(this.runningGradeFlavorText);

    // Continue Button (hidden until animation ends)
    const btnText = state.day === 13 ? '[ Final Score → ]' : '[ Continue to Night → ]';
    this.continueBtn = this.add.text(x + width/2, deltaY + 140, btnText, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
      backgroundColor: '#238636', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);
    
    this.continueBtn.on('pointerdown', () => this.advance());
    this.continueBtn.on('pointerover', () => this.continueBtn.setBackgroundColor('#2ea043'));
    this.continueBtn.on('pointerout', () => this.continueBtn.setBackgroundColor('#238636'));
    this.window.add(this.continueBtn);

    // Start Animation
    this.isAnimating = true;
    this.animProgress = 0;
  }

  update(_time: number, delta: number): void {
    if (!this.isAnimating) return;

    this.animProgress += delta;
    const factor = Math.min(this.animProgress / this.animDuration, 1);
    
    const state = getState();
    const result = state.lastDayResult!;

    const curProgress = Math.floor(result.progress * factor);
    const curAccuracy = Math.floor(result.accuracy * 100 * factor);
    const curBase = Math.floor(result.score.baseRep * factor);
    const curAccBonus = Math.floor(result.score.accuracyBonus * factor);
    const curStratBonus = Math.floor(result.score.strategyBonus * factor);
    const curOvertime = Math.floor(state.overtimeBonus * factor);
    const curAgentBonus = Math.floor(state.agentBonus * factor);
    const trueTotal = result.score.total + state.agentBonus + state.eventRepDelta;
    const curTotal = Math.floor(trueTotal * factor);

    this.progressText.setText(`${curProgress}%`);
    this.accuracyText.setText(`${curAccuracy}%`);
    this.baseRepText.setText(`+${curBase}`);
    this.accuracyBonusText.setText(`+${curAccBonus}`);
    
    const strategyLabel = this.getStrategyLabel(state.strategy || 'justStart');
    this.strategyBonusText.setText(`${curStratBonus >= 0 ? '+' : ''}${curStratBonus}  (${strategyLabel})`);

    const curModelBonus = Math.floor(result.score.modelBonus * factor);
    this.modelBonusText.setText(`${curModelBonus >= 0 ? '+' : ''}${curModelBonus}`);

    if (this.overtimeBonusText) {
      this.overtimeBonusText.setText(`+${curOvertime}`);
    }
    if (this.agentBonusText) {
      this.agentBonusText.setText(`+${curAgentBonus}`);
    }

    const curEventRep = Math.floor(state.eventRepDelta * factor);
    if (this.eventRepText) {
      this.eventRepText.setText(curEventRep >= 0 ? `+${curEventRep}` : `${curEventRep}`);
    }

    this.totalRepText.setText(`+${curTotal} ⭐`);

    // Tick SFX
    if (this.isAnimating && Math.random() < 0.15) {
       AudioManager.getInstance().playSFX('score-tick', 0.1);
    }

    // Update total color dynamically
    const curTotalForColor = Math.floor(trueTotal * factor);
    if (curTotalForColor >= 40) {
      this.totalRepText.setColor('#f2cc60');
    } else if (curTotalForColor >= 20) {
      this.totalRepText.setColor('#3fb950');
    } else if (curTotalForColor >= 0) {
      this.totalRepText.setColor('#e6edf3');
    } else {
      this.totalRepText.setColor('#f85149');
    }

    if (factor >= 1) {
      this.isAnimating = false;

      const total = result.score.total;
      if (total > 0) {
        AudioManager.getInstance().playSFX('rep-gain');
      } else if (total < 0) {
        AudioManager.getInstance().playSFX('rep-loss');
      }

      // C) Border flash on high score
      if (total >= 40) {
        const flashRect = this.add.rectangle(
          this.window.container.x + this.winWidth / 2,
          this.window.container.y + this.winHeight / 2,
          this.winWidth, this.winHeight
        ).setStrokeStyle(2, this.themeAccent).setFillStyle(0, 0).setDepth(50).setAlpha(0);
        this.tweens.add({
          targets: flashRect,
          alpha: 0.8,
          duration: 400,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => flashRect.destroy(),
        });
      }

      // A) Vibe Code % reveal
      if (state.strategy === 'vibeCode') {
        const { x: cx2, y: cy2, width: cw } = this.window.contentArea;
        const vibePercent = result.progress >= 100
          ? Math.floor(50 + Math.random() * 50)
          : Math.floor(Math.random() * 40);
        const vibeText = this.add.text(cx2 + cw / 2, cy2 + 265 + this.yShift, '', {
          fontFamily: 'monospace', fontSize: '16px', color: '#d29922', fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0);
        this.window.add(vibeText);

        // Rapid cycling for 1 second
        this.time.addEvent({
          delay: 50,
          repeat: 19,
          callback: () => {
            vibeText.setText(`✨ Vibe Code: ${Math.floor(Math.random() * 100)}% ✨`);
          },
        });
        this.time.delayedCall(1000, () => {
          vibeText.setText(`✨ Vibe Code: ${vibePercent}% ✨`);
        });
        this.tweens.add({ targets: vibeText, alpha: 1, duration: 200, delay: 200 });
      }

      this.runningGradeDividerText.setAlpha(1);
      this.runningGradeLabelText.setAlpha(1);
      this.runningGradeText.setAlpha(1);
      this.runningGradeFlavorText.setAlpha(1);
      this.continueBtn.setAlpha(1);
    }
  }

  private getStrategyLabel(strat: string): string {
    const result = getState().lastDayResult;
    switch (strat) {
      case 'planThenBuild': return 'Plan Then Build +15%';
      case 'justStart': return 'Just Start +0%';
      case 'oneShot': return 'One-Shot -10%';
      case 'vibeCode': {
        if (result && result.score.baseRep > 0) {
          const pct = Math.round((result.score.strategyBonus / result.score.baseRep) * 100);
          return `Vibe Code ${pct >= 0 ? '+' : ''}${pct}%`;
        }
        return 'Vibe Code ???';
      }
      default: return 'Standard';
    }
  }

  private advance(): void {
    const state = getState();
    if (state.day >= 13) {
      this.scene.start('Final');
    } else {
      this.scene.start('Night');
    }
  }
}
