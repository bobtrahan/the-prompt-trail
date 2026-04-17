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
  techBro: 'Best hardware.\nBig budget.\nMove fast, ship faster.',
  corporateDev: 'Company card and laptop.\nMeetings buffer the soul.\nStability over chaos.',
  indieHacker: 'Balanced. Resourceful.\nShips fast on a shoestring.\nBreaks things intentionally.',
  collegeStudent: 'No money, no hardware.\nUnlimited ambition.\nGrading on a curve.',
};

const classVoiceMap: Record<PlayerClass, string> = {
  techBro: 'class-techbro',
  indieHacker: 'class-indie',
  collegeStudent: 'class-student',
  corporateDev: 'class-corporate',
};

export class ClassSelectScene extends Phaser.Scene {
  private selectedClass: PlayerClass | null = null;
  private cardRefs: { id: PlayerClass; card: Phaser.GameObjects.Rectangle; glow: Phaser.GameObjects.Rectangle; badge: Phaser.GameObjects.Text; accent: number }[] = [];
  private continueBtn: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'ClassSelect' });
  }

  create(): void {
    this.selectedClass = null;
    this.cardRefs = [];
    this.continueBtn = null;

    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Window chrome
    this.add.text(GAME_WIDTH / 2, 50, 'PromptOS — Developer Onboarding', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#e6edf3',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 84, 'Initialize developer profile:', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: `#${COLORS.textDim.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    const classIds: PlayerClass[] = ['techBro', 'corporateDev', 'indieHacker', 'collegeStudent'];
    const classes = classIds.map(id => CLASS_DEFS[id]);
    const DIFFICULTY: Record<string, string> = {
      techBro: '☆ Full Funding',
      corporateDev: '☆☆ Mid-Level Management',
      indieHacker: '☆☆☆ Ramen Profitable',
      collegeStudent: '☆☆☆☆ Total Deprivation',
    };
    const cardWidth = 270;
    const cardHeight = 420;
    const cardGap = 18;
    const totalWidth = classIds.length * cardWidth + (classIds.length - 1) * cardGap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    classes.forEach((def, i) => {
      const x = startX + i * (cardWidth + cardGap);
      const y = GAME_HEIGHT / 2 - 30;
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

      // Emoji — vertically centered in header band 
      this.add.text(x, y - halfH + 44, CLASS_EMOJI[def.id] ?? '💻', {
        fontSize: '40px',
      }).setOrigin(0.5).setDepth(2);

      // Class name — below header with breathing room
      const nameGap = 40;
      this.add.text(x, y - halfH + 80 + nameGap, def.name, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#e6edf3',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(2);

      // Bio — 3 lines
      this.add.text(x, y - halfH + 152, CLASS_BIO[def.id] ?? '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: `#${COLORS.textDim.toString(16).padStart(6, '0')}`,
        align: 'center',
        lineSpacing: 6,
      }).setOrigin(0.5, 0).setDepth(2);

      // Divider line
      this.add.rectangle(x, y - halfH + 230, cardWidth - 40, 1, COLORS.textDim)
        .setAlpha(0.2)
        .setDepth(2);

      // Difficulty badge
      this.add.text(x, y - halfH + 264, DIFFICULTY[def.id], {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: accentHex,
      }).setOrigin(0.5).setDepth(2);

      // Stats
      const statsY = y - halfH + 290;
      const stats = [
        `Budget: $${def.startingBudget.toLocaleString()}`,
        `Hardware: ${def.hardwareHp} HP`,
        `Model: ${def.startingModel}`,
        `Score: ×${def.scoreMultiplier}`,
      ];
      stats.forEach((line, j) => {
        this.add.text(x, statsY + j * 26, line, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#e6edf3',
        }).setOrigin(0.5).setDepth(2);
      });

      // ▶ SELECTED badge — hidden by default
      const selectBadge = this.add.text(x, y + halfH - 28, '▶ SELECTED', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: accentHex,
      }).setOrigin(0.5).setVisible(false).setDepth(2);

      this.cardRefs.push({ id: def.id, card, glow: glowRect, badge: selectBadge, accent });

      // Hover effects — glow only, no voice
      card.on('pointerover', () => {
        card.setStrokeStyle(2, accent);
        glowRect.setAlpha(0.08);
        if (this.selectedClass !== def.id) {
          selectBadge.setVisible(false);
        }
      });
      card.on('pointerout', () => {
        if (this.selectedClass === def.id) {
          card.setStrokeStyle(2, 0xffffff);
          glowRect.setAlpha(0.12);
          selectBadge.setVisible(true);
        } else {
          card.setStrokeStyle(2, accent);
          glowRect.setAlpha(0);
          selectBadge.setVisible(false);
        }
      });

      addButtonFx(this, card);
      card.on('pointerdown', () => {
        this.onSelectCard(def.id);
      });
    });

    // Continue button — always visible, disabled by default
    // Center between bottom of cards and bottom of game
    const btnY = GAME_HEIGHT - 80;
    this.continueBtn = this.add.text(GAME_WIDTH / 2, btnY, '[ Continue → ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#6e7681',
      backgroundColor: '#1c2128',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(10);

    // Helper text below button
    this.add.text(GAME_WIDTH / 2, btnY + 45, 'Select a profile to continue.', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${COLORS.textDim.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(10);

    // Button interaction state managed in onSelectCard
    this.disableContinueButton();
  }

  private onSelectCard(classId: PlayerClass): void {
    // Play voice on click
    AudioManager.getInstance().playVoice(classVoiceMap[classId]);

    this.selectedClass = classId;

    // Update all cards — highlight selected, reset others
    for (const ref of this.cardRefs) {
      if (ref.id === classId) {
        ref.card.setStrokeStyle(2, 0xffffff);
        ref.glow.setAlpha(0.12);
        ref.badge.setVisible(true);
        this.tweens.add({
          targets: ref.card,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 120,
          ease: 'Linear',
        });
      } else {
        ref.card.setStrokeStyle(2, ref.accent);
        ref.card.setScale(1);
        ref.glow.setAlpha(0);
        ref.badge.setVisible(false);
      }
    }

    // Enable continue button
    this.enableContinueButton();
  }

  private enableContinueButton(): void {
    if (this.continueBtn) {
      this.continueBtn.setColor('#e6edf3').setBackgroundColor('#238636').setInteractive({ useHandCursor: true });
      this.continueBtn.off('pointerover');
      this.continueBtn.off('pointerout');
      this.continueBtn.on('pointerover', () => this.continueBtn?.setBackgroundColor('#2ea043'));
      this.continueBtn.on('pointerout', () => this.continueBtn?.setBackgroundColor('#238636'));
      this.continueBtn.off('pointerdown');
      this.continueBtn.on('pointerdown', () => {
        if (this.selectedClass) {
          this.launchGame(this.selectedClass);
        }
      });
    }
  }

  private disableContinueButton(): void {
    if (this.continueBtn) {
      this.continueBtn.setColor('#6e7681').setBackgroundColor('#1c2128').disableInteractive();
      this.continueBtn.off('pointerover');
      this.continueBtn.off('pointerout');
      this.continueBtn.off('pointerdown');
    }
  }

  private launchGame(playerClass: PlayerClass): void {
    initClassState(playerClass);
    Telemetry.logRunStart(getState());
    this.scene.start('Briefing');
  }
}
