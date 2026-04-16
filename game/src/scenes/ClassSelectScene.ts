import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CLASS_THEMES } from '../utils/constants';
import { initClassState, getState } from '../systems/GameState';
import { CLASS_DEFS } from '../data/classes';
import { Telemetry } from '../systems/Telemetry';
import type { PlayerClass } from '../systems/GameState';
import { addButtonFx } from '../ui/ButtonFx';
import AudioManager from '../systems/AudioManager';

const CLASS_EMOJI: Record<string, string> = {
  techBro: '🤑',
  corporateDev: '🏢',
  indieHacker: '🔧',
  collegeStudent: '📚',
};

const CLASS_BIO: Record<string, string> = {
  techBro: 'Best hardware.\nBig budget.\nZero self-awareness.',
  corporateDev: 'Company card and laptop.\nMeetings and HR.\nZero freedom.',
  indieHacker: 'Balanced. Resourceful.\nShips fast.\nBreak things.',
  collegeStudent: 'No money.\nBad hardware.\nUnlimited ambition.',
};

export class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ClassSelect' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Window chrome
    this.add.text(GAME_WIDTH / 2, 50, 'PromptOS — User Setup', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#e6edf3',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 84, 'Select your developer profile:', {
      fontFamily: 'monospace',
      fontSize: '15px',
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
    const cardWidth = 270;
    const cardHeight = 420;
    const cardGap = 18;
    const totalWidth = classes.length * cardWidth + (classes.length - 1) * cardGap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    classes.forEach((def, i) => {
      const x = startX + i * (cardWidth + cardGap);
      const y = GAME_HEIGHT / 2 + 10;
      const theme = CLASS_THEMES[def.id as keyof typeof CLASS_THEMES];
      const accent = theme.accent;
      const accentHex = `#${accent.toString(16).padStart(6, '0')}`;

      const halfH = cardHeight / 2;

      // Glow rect (behind card, hidden by default)
      const glowRect = this.add.rectangle(x, y, cardWidth + 8, cardHeight + 8, accent)
        .setAlpha(0)
        .setDepth(0);

      // Card background
      const card = this.add.rectangle(x, y, cardWidth, cardHeight, COLORS.windowBg)
        .setStrokeStyle(2, accent)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);

      // Tinted header rect — top of card
      this.add.rectangle(x, y - halfH + 40, cardWidth, 80, accent)
        .setAlpha(0.06)
        .setDepth(2);

      // Emoji — vertically centered in header band (nudge up to compensate for emoji descent)
      this.add.text(x, y - halfH + 36, CLASS_EMOJI[def.id] ?? '💻', {
        fontSize: '40px',
      }).setOrigin(0.5).setDepth(2);

      // Class name — below header with breathing room
      const nameGap = 30; // gap between header bottom (80) and class name
      this.add.text(x, y - halfH + 80 + nameGap, def.name, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#e6edf3',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2);

      // Bio — 3 lines, same gap below class name
      this.add.text(x, y - halfH + 80 + nameGap + 34, CLASS_BIO[def.id] ?? '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: `#${COLORS.textDim.toString(16).padStart(6, '0')}`,
        align: 'center',
        lineSpacing: 4,
      }).setOrigin(0.5, 0).setDepth(2);

      // Divider line — separates bio from difficulty + stats
      this.add.rectangle(x, y - halfH + 210, cardWidth - 40, 1, COLORS.textDim)
        .setAlpha(0.2)
        .setDepth(2);

      // Difficulty badge — below divider
      this.add.text(x, y - halfH + 228, DIFFICULTY[def.id], {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: accentHex,
      }).setOrigin(0.5).setDepth(2);

      // Stats
      const statsY = y - halfH + 258;
      const stats = [
        `Budget: $${def.startingBudget.toLocaleString()}`,
        `Hardware: ${def.hardwareHp} HP`,
        `Model: ${def.startingModel}`,
        `Score: ×${def.scoreMultiplier}`,
      ];
      stats.forEach((line, j) => {
        this.add.text(x, statsY + j * 26, line, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#e6edf3',
        }).setOrigin(0.5).setDepth(2);
      });

      // ▶ SELECT badge — hidden by default
      const selectBadge = this.add.text(x, y + halfH - 28, '▶ SELECT', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: accentHex,
      }).setOrigin(0.5).setVisible(false).setDepth(2);

      // Hover effects — glow, select badge, voice
      card.on('pointerover', () => {
        card.setStrokeStyle(2, accent);
        glowRect.setAlpha(0.08);
        selectBadge.setVisible(true);
        AudioManager.getInstance().playVoice(classVoiceMap[def.id]);
      });
      card.on('pointerout', () => {
        card.setStrokeStyle(2, accent);
        glowRect.setAlpha(0);
        selectBadge.setVisible(false);
      });

      // Voice map + selection animation
      const classVoiceMap: Record<PlayerClass, string> = {
        techBro: 'class-techbro',
        indieHacker: 'class-indie',
        collegeStudent: 'class-student',
        corporateDev: 'class-corporate',
      };

      addButtonFx(this, card);
      card.on('pointerdown', () => {
        this.tweens.add({
          targets: card,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 120,
          ease: 'Linear',
        });
        card.setStrokeStyle(2, 0xffffff);
        this.time.delayedCall(100, () => {
          card.setStrokeStyle(2, accent);
        });
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
