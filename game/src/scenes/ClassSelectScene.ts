import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CLASS_THEMES } from '../utils/constants';
import { initClassState, getState } from '../systems/GameState';
import { CLASS_DEFS } from '../data/classes';
import { Telemetry } from '../systems/Telemetry';
import type { PlayerClass } from '../systems/GameState';
import { addButtonFx } from '../ui/ButtonFx';

const CLASS_EMOJI: Record<string, string> = {
  techBro: '🤑',
  corporateDev: '🏢',
  indieHacker: '🔧',
  collegeStudent: '📚',
};

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
      color: `#${COLORS.textDim.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    const classIds: PlayerClass[] = ['techBro', 'corporateDev', 'indieHacker', 'collegeStudent'];
    const classes = classIds.map(id => CLASS_DEFS[id]);
    const DIFFICULTY: Record<string, string> = {
      techBro: '☆ Easy',
      corporateDev: '☆☆ Medium',
      indieHacker: '☆☆☆ Hard',
      collegeStudent: '☆☆☆☆ Brutal',
    };
    const cardWidth = 260;
    const totalWidth = classes.length * cardWidth + (classes.length - 1) * 20;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    classes.forEach((def, i) => {
      const x = startX + i * (cardWidth + 20);
      const y = GAME_HEIGHT / 2 - 20;
      const theme = CLASS_THEMES[def.id as keyof typeof CLASS_THEMES];
      const accent = theme.accent;
      const accentHex = `#${accent.toString(16).padStart(6, '0')}`;

      // Glow rect (behind card, hidden by default)
      const glowRect = this.add.rectangle(x, y, cardWidth + 8, 388, accent)
        .setAlpha(0)
        .setDepth(0);

      // Card background
      const card = this.add.rectangle(x, y, cardWidth, 380, COLORS.windowBg)
        .setStrokeStyle(2, accent)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);

      // Tinted header rect (C) — 260×60 at top of card
      // Card top edge = y - 190, tinted rect center = y - 160
      this.add.rectangle(x, y - 160, cardWidth, 60, accent)
        .setAlpha(0.06)
        .setDepth(2);

      // Emoji (B) — above class name, inside tinted header area
      this.add.text(x, y - 170, CLASS_EMOJI[def.id] ?? '💻', {
        fontSize: '36px',
      }).setOrigin(0.5).setDepth(2);

      // Class name — shifted down slightly from original to accommodate emoji
      this.add.text(x, y - 118, def.name, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e6edf3',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2);

      // Description
      const descText = this.add.text(x, y - 82, def.description, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: `#${COLORS.textDim.toString(16).padStart(6, '0')}`,
        wordWrap: { width: cardWidth - 30 },
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(2);

      // Difficulty badge — text color = class accent (A)
      this.add.text(x, y - 82 + descText.height + 16, DIFFICULTY[def.id], {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: accentHex,
      }).setOrigin(0.5).setDepth(2);

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
        }).setOrigin(0.5).setDepth(2);
      });

      // ▶ SELECT badge (E) — hidden by default
      const selectBadge = this.add.text(x, statsY + 4 * 22 + 10, '▶ SELECT', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: accentHex,
      }).setOrigin(0.5).setVisible(false).setDepth(2);

      // Hover effects (A + E)
      card.on('pointerover', () => {
        card.setStrokeStyle(2, accent);
        glowRect.setAlpha(0.08);
        selectBadge.setVisible(true);
      });
      card.on('pointerout', () => {
        card.setStrokeStyle(2, accent);
        glowRect.setAlpha(0);
        selectBadge.setVisible(false);
      });

      // Selection animation (D)
      addButtonFx(this, card);
      card.on('pointerdown', () => {
        // Tween scale
        this.tweens.add({
          targets: card,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 120,
          ease: 'Linear',
        });
        // Flash border white
        card.setStrokeStyle(2, 0xffffff);
        this.time.delayedCall(100, () => {
          card.setStrokeStyle(2, accent);
        });
        // Delay scene start
        this.time.delayedCall(200, () => {
          this.selectClass(def.id);
        });
      });
    });
  }

  private selectClass(playerClass: PlayerClass): void {
    initClassState(playerClass);
    Telemetry.logRunStart(getState());
    this.scene.start('Briefing');
  }
}
