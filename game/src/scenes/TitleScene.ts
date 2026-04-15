import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { resetState } from '../systems/GameState';
import AudioManager from '../systems/AudioManager';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create(): void {
    resetState();
    AudioManager.getInstance().playMusic('title');
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background — dark desktop
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Title
    const title = this.add.text(cx, cy - 80, 'The Prompt Trail', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#e6edf3',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Subtitle
    const subtitle = this.add.text(cx, cy - 20, 'An AI Developer Survival Simulator', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#9da5b0',
    }).setOrigin(0.5).setAlpha(0);

    // Version string
    const version = this.add.text(cx, cy + 10, 'v1.0.13', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#484f58',
    }).setOrigin(0.5).setAlpha(0);

    // Start prompt
    const startText = this.add.text(cx, cy + 60, '[ Press any key or click to start ]▌', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#58a6ff',
    }).setOrigin(0.5).setAlpha(0);

    // Subtle desktop hint line
    this.add.rectangle(cx, GAME_HEIGHT - 50, GAME_WIDTH - 100, 1, 0x21262d).setAlpha(0.5);

    // Credits
    const credits = this.add.text(cx, GAME_HEIGHT - 40, 'Gamedev.js Jam 2026 · Theme: Machines', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#6e7681',
    }).setOrigin(0.5).setAlpha(0);

    // Sequential fade-in animations
    this.tweens.add({ targets: title, alpha: 1, duration: 600, delay: 200 });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 500, delay: 600 });
    this.tweens.add({ targets: version, alpha: 1, duration: 500, delay: 600 });
    this.tweens.add({
      targets: startText,
      alpha: 1,
      duration: 400,
      delay: 1000,
      onComplete: () => {
        // Start blink after fade-in
        this.tweens.add({
          targets: startText,
          alpha: 0.3,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      },
    });
    this.tweens.add({ targets: credits, alpha: 1, duration: 300, delay: 1200 });

    // Input
    this.input.keyboard!.on('keydown', () => this.startGame());
    this.input.on('pointerdown', () => this.startGame());
  }

  private startGame(): void {
    this.scene.start('ClassSelect');
  }
}
