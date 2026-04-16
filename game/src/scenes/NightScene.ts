import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { PROJECTS } from '../data/projects';
import AudioManager from '../systems/AudioManager';
import { drawWallpaper } from '../ui/DesktopWallpaper';
import { addButtonFx } from '../ui/ButtonFx';

export class NightScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private led!: Phaser.GameObjects.Rectangle;
  private ledTween!: Phaser.Tweens.Tween;

  constructor() {
    super({ key: 'Night' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);

    // A) Ambient elements (depth -5)
    // Monitor glow
    this.add.rectangle(100, 200, 200, 140, theme.accent, 0.015).setDepth(-5);
    this.add.rectangle(980, 240, 180, 120, theme.accent, 0.01).setDepth(-5);

    // Blinking LED
    this.led = this.add.rectangle(120, 500, 4, 4, 0x3fb950).setAlpha(0.6).setDepth(-5);
    this.ledTween = this.tweens.add({
      targets: this.led,
      alpha: 0.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Status line
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, `System idle  ·  3 processes sleeping  ·  Hardware: ${state.hardwareHp}%`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#30363d'
    }).setOrigin(0.5).setDepth(-5);

    // Fade in from results
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Setup Taskbar
    this.taskbar = new Taskbar(this, theme.accent);

    // Create Main Night Window
    const winWidth = 600;
    const winHeight = 400;
    const nightWin = new Window({
      scene: this,
      x: (GAME_WIDTH - winWidth) / 2,
      y: (GAME_HEIGHT - winHeight) / 2 - 20,
      width: winWidth,
      height: winHeight,
      title: `Night ── Day ${state.day} Complete`,
      titleIcon: '🌙',
      accentColor: theme.accent,
    });

    // B) Window entrance animation
    nightWin.container.setAlpha(0);
    nightWin.container.y += 10;
    this.tweens.add({
      targets: nightWin.container,
      alpha: 1,
      y: nightWin.container.y - 10,
      duration: 400,
      delay: 300,
      ease: 'Power2.easeOut',
    });

    const { x: cx, y: cy, width: cw } = nightWin.contentArea;

    // Body text — all content added to Window container using relative coords
    nightWin.add(this.add.text(cx, cy + 10, 'The office is quiet. Your agents are sleeping.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e6edf3',
    }));
    nightWin.add(this.add.text(cx, cy + 35, '(Your hardware hums in the dark.)', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#9da5b0',
      fontStyle: 'italic',
    }));

    // Tomorrow Preview Section
    nightWin.add(this.add.text(cx, cy + 85, '── TOMORROW ──', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#58a6ff',
    }));

    const nextProject = PROJECTS[state.day]; // state.day is 1-indexed, PROJECTS is 0-indexed. Day 1 complete -> PROJECTS[1] is Day 2.
    if (nextProject) {
      nightWin.add(this.add.text(cx, cy + 110, `Day ${state.day + 1}: ${nextProject.name}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e6edf3',
      }));

      const stars = this.getDifficultyStars(nextProject.difficulty);
      nightWin.add(this.add.text(cx, cy + 135, `Difficulty: ${stars}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9da5b0',
      }));
    } else {
      nightWin.add(this.add.text(cx, cy + 110, `The Final Stretch...`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e6edf3',
      }));
    }

    // Phase 3 Placeholders (Market / Bounty)
    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e6edf3',
      backgroundColor: '#30363d',
      padding: { x: 12, y: 8 },
    };

    // Market Button
    const marketBtn = this.add.text(cx, cy + 200, '[ Token Market ]', btnStyle)
      .setInteractive({ useHandCursor: true });
    nightWin.add(marketBtn);

    marketBtn.on('pointerover', () => {
      marketBtn.setBackgroundColor('#444c56');
    });
    marketBtn.on('pointerout', () => marketBtn.setBackgroundColor('#30363d'));
    marketBtn.on('pointerdown', () => this.scene.start('TokenMarket'));
    addButtonFx(this, marketBtn);

    // Bounty Button
    const alreadyPlayed = state.bountyPlayedTonight;
    const bountyBtn = this.add.text(cx, cy + 250, '[ Bug Bounty ]', btnStyle);
    nightWin.add(bountyBtn);

    if (alreadyPlayed) {
      bountyBtn.setAlpha(0.4);
      nightWin.add(this.add.text(cx + 160, cy + 258, '(Already played tonight)', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9da5b0',
      }));
    } else {
      bountyBtn.setInteractive({ useHandCursor: true });
      bountyBtn.on('pointerover', () => {
        bountyBtn.setBackgroundColor('#444c56');
      });
      bountyBtn.on('pointerout', () => bountyBtn.setBackgroundColor('#30363d'));
      bountyBtn.on('pointerdown', () => {
        state.bugHuntReturnScene = 'Night';
        this.scene.start('BugBountySelect');
      });
    }

    // Advance Button
    const sleepBtn = this.add.text(cx, cy + 320, '[ Sleep → Morning Briefing ]', {
      ...btnStyle,
      backgroundColor: '#238636',
    }).setInteractive({ useHandCursor: true });
    nightWin.add(sleepBtn);

    sleepBtn.on('pointerover', () => {
      sleepBtn.setBackgroundColor('#2ea043');
    });
    sleepBtn.on('pointerout', () => sleepBtn.setBackgroundColor('#238636'));
    sleepBtn.on('pointerdown', () => this.advance());
  }

  private getDifficultyStars(diff: string): string {
    switch (diff) {
      case 'easy': return '★☆☆';
      case 'medium': return '★★☆';
      case 'hard': return '★★★';
      default: return '☆☆☆';
    }
  }

  private advance(): void {
    const state = getState();
    state.bountyPlayedTonight = false;
    state.day++;
    
    // Reset consumable effects for the new day
    state.hasBackupProtection = false;
    state.hasDuckProtection = false;
    state.modelCostDiscount = 0;
    state.consumablesUsedToday = [];

    // D) Sleep transition enhancement
    if (this.ledTween) this.ledTween.stop();
    this.led.setAlpha(1);
    this.time.delayedCall(200, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Briefing');
    });
  }
}
