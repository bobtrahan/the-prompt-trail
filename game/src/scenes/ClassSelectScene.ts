import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { CLASS_DEFS, initClassState } from '../systems/GameState';
import type { PlayerClass } from '../systems/GameState';

export class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ClassSelect' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Window chrome
    this.add.text(GAME_WIDTH / 2, 40, 'PromptOS — User Setup', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#e6edf3',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 70, 'Select your developer profile:', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8b949e',
    }).setOrigin(0.5);

    const classes = Object.values(CLASS_DEFS);
    const cardWidth = 260;
    const totalWidth = classes.length * cardWidth + (classes.length - 1) * 20;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    classes.forEach((def, i) => {
      const x = startX + i * (cardWidth + 20);
      const y = GAME_HEIGHT / 2 - 20;

      // Card background
      const card = this.add.rectangle(x, y, cardWidth, 340, COLORS.windowBg)
        .setStrokeStyle(2, COLORS.windowBorder)
        .setInteractive({ useHandCursor: true });

      // Class name
      this.add.text(x, y - 130, def.name, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e6edf3',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Description
      this.add.text(x, y - 90, def.description, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8b949e',
        wordWrap: { width: cardWidth - 30 },
        align: 'center',
      }).setOrigin(0.5, 0);

      // Stats
      const statsY = y + 10;
      const stats = [
        `Budget: $${def.startingBudget.toLocaleString()}`,
        `Hardware: ${def.hardwareHp} HP`,
        `Model: ${def.startingModel}`,
        `Score: ×${def.scoreMultiplier}`,
      ];
      stats.forEach((line, j) => {
        this.add.text(x, statsY + j * 22, line, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#e6edf3',
        }).setOrigin(0.5);
      });

      // Hover effect
      card.on('pointerover', () => card.setStrokeStyle(2, COLORS.accent));
      card.on('pointerout', () => card.setStrokeStyle(2, COLORS.windowBorder));
      card.on('pointerdown', () => this.selectClass(def.id));
    });
  }

  private selectClass(playerClass: PlayerClass): void {
    initClassState(playerClass);
    this.scene.start('Briefing');
  }
}
