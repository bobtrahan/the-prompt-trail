import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { CLASS_DEFS, getState, resetState } from '../systems/GameState';
import { Telemetry } from '../systems/Telemetry';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';

const RANK_COLORS: Record<string, string> = {
  S: '#f2cc60',
  A: '#3fb950',
  B: '#58a6ff',
  C: '#e6edf3',
  D: '#d68a00',
  F: '#f85149',
};

const RANK_FLAVOR: Record<string, string> = {
  S: 'You are the machine. OpenAI wants to hire you.',
  A: 'Shipped. Profitable. Your agents barely hallucinated.',
  B: "Pretty good! Only 3 production incidents.",
  C: "It works... in dev. Don't look at staging.",
  D: "Your investors are 'cautiously optimistic' (they're not).",
  F: 'The AI became sentient and quit. You owe it back pay.',
};

export class FinalScene extends Phaser.Scene {
  private window!: Window;
  private taskbar!: Taskbar;

  // Animation state
  private animProgress = 0;
  private animDuration = 1500;
  private isAnimating = true;

  // Display objects to animate
  private rawRepText!: Phaser.GameObjects.Text;
  private finalScoreText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private flavorText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private playAgainBtn!: Phaser.GameObjects.Text;

  // Computed final score data
  private rawTotal = 0;
  private multiplier = 1;
  private finalScore = 0;
  private rank: string = 'F';

  constructor() {
    super({ key: 'Final' });
  }

  create(): void {
    const state = getState();
    const playerClass = state.playerClass ?? 'techBro';
    const classDef = CLASS_DEFS[playerClass];

    const finalScoreData = ScoringSystem.calcFinalScore(state.dayScores, classDef.scoreMultiplier);
    this.rawTotal = finalScoreData.rawTotal;
    this.multiplier = finalScoreData.multiplier;
    this.finalScore = finalScoreData.finalScore;
    this.rank = finalScoreData.rank;

    Telemetry.logRunEnd(state, finalScoreData);

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.taskbar = new Taskbar(this);

    const winWidth = 700;
    const winHeight = 480;
    this.window = new Window({
      scene: this,
      x: (GAME_WIDTH - winWidth) / 2,
      y: (GAME_HEIGHT - winHeight) / 2 - 20,
      width: winWidth,
      height: winHeight,
      title: 'PromptOS ── Final Report',
      titleIcon: '🏆',
    });

    const { x, y, width } = this.window.contentArea;

    // Header
    this.window.add(this.add.text(x + width / 2, y + 12, '13 Days Complete', {
      fontFamily: 'monospace', fontSize: '20px', color: '#e6edf3', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    this.window.add(this.add.text(x + width / 2, y + 38, `Class: ${classDef.name}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#8b949e',
    }).setOrigin(0.5, 0));

    // Divider
    this.window.add(this.add.text(x + width / 2, y + 68, '── SCORE BREAKDOWN ──', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
    }).setOrigin(0.5, 0));

    // Score breakdown labels
    const labelStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#8b949e' };
    const valueStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3' };

    this.window.add(this.add.text(x + 20, y + 95, 'Raw Reputation:', labelStyle));
    this.rawRepText = this.add.text(x + 200, y + 95, '0', valueStyle);
    this.window.add(this.rawRepText);

    this.window.add(this.add.text(x + 20, y + 120, 'Class Multiplier:', labelStyle));
    this.window.add(this.add.text(x + 200, y + 120,
      `×${this.multiplier.toFixed(1)} (${classDef.name})`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
      }));

    this.window.add(this.add.text(x + 20, y + 155, 'Final Score:', {
      fontFamily: 'monospace', fontSize: '18px', color: '#e6edf3', fontStyle: 'bold',
    }));
    this.finalScoreText = this.add.text(x + 170, y + 153, '0', {
      fontFamily: 'monospace', fontSize: '22px', color: '#f2cc60', fontStyle: 'bold',
    });
    this.window.add(this.finalScoreText);

    // Rank (revealed at end of animation)
    const rankColor = RANK_COLORS[this.rank] ?? '#e6edf3';
    this.rankText = this.add.text(x + width - 20, y + 95, this.rank, {
      fontFamily: 'monospace', fontSize: '72px', color: rankColor, fontStyle: 'bold',
    }).setOrigin(1, 0).setAlpha(0);
    this.window.add(this.rankText);

    // Flavor text
    const flavor = RANK_FLAVOR[this.rank] ?? '';
    this.flavorText = this.add.text(x + width / 2, y + 205, flavor, {
      fontFamily: 'monospace', fontSize: '13px', color: '#8b949e',
      wordWrap: { width: width - 40 }, align: 'center',
    }).setOrigin(0.5, 0).setAlpha(0);
    this.window.add(this.flavorText);

    // Stats summary row
    const totalBudgetSpent = classDef.startingBudget - state.budget;
    const statsLine = `Days Survived: ${Math.min(state.day, 13)}   ·   Budget Spent: $${totalBudgetSpent.toLocaleString()}   ·   Bugs Squashed: ${state.totalBugsSquashed}`;
    this.statsText = this.add.text(x + width / 2, y + 340, statsLine, {
      fontFamily: 'monospace', fontSize: '12px', color: '#8b949e',
    }).setOrigin(0.5, 0).setAlpha(0);
    this.window.add(this.statsText);

    // Play Again button
    this.playAgainBtn = this.add.text(x + width / 2, y + 390, '[ Play Again ]', {
      fontFamily: 'monospace', fontSize: '16px', color: '#58a6ff',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setAlpha(0);

    this.playAgainBtn.on('pointerover', () => this.playAgainBtn.setColor('#79c0ff'));
    this.playAgainBtn.on('pointerout', () => this.playAgainBtn.setColor('#58a6ff'));
    this.playAgainBtn.on('pointerdown', () => {
      resetState();
      this.scene.start('Title');
    });
    this.window.add(this.playAgainBtn);

    // Start animation
    this.isAnimating = true;
    this.animProgress = 0;
  }

  update(_time: number, delta: number): void {
    if (!this.isAnimating) return;

    this.animProgress += delta;
    const factor = Math.min(this.animProgress / this.animDuration, 1);

    const curRaw = Math.floor(this.rawTotal * factor);
    const curFinal = Math.floor(this.finalScore * factor);

    this.rawRepText.setText(curRaw.toLocaleString());
    this.finalScoreText.setText(curFinal.toLocaleString());

    if (factor >= 1) {
      this.isAnimating = false;
      // Reveal rank, flavor, stats, and button
      this.tweens.add({ targets: this.rankText, alpha: 1, duration: 300 });
      this.tweens.add({ targets: this.flavorText, alpha: 1, duration: 400, delay: 200 });
      this.tweens.add({ targets: this.statsText, alpha: 1, duration: 300, delay: 400 });
      this.tweens.add({ targets: this.playAgainBtn, alpha: 1, duration: 300, delay: 600 });
    }
  }
}
