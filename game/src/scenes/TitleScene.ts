import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { resetState } from '../systems/GameState';
import { AudioManager } from '../systems/AudioManager';

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
    this.add.text(cx, cy - 80, 'The Prompt Trail', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#e6edf3',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy - 20, 'An AI Developer Survival Simulator', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8b949e',
    }).setOrigin(0.5);

    // Start prompt
    const startText = this.add.text(cx, cy + 60, '[ Press any key or click to start ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#58a6ff',
    }).setOrigin(0.5);

    // Blink effect
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Credits
    this.add.text(cx, GAME_HEIGHT - 40, 'Gamedev.js Jam 2026 · Theme: Machines', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#484f58',
    }).setOrigin(0.5);

    // Input
    this.input.keyboard!.on('keydown', () => this.startGame());
    this.input.on('pointerdown', () => this.startGame());
  }

  private startGame(): void {
    this.scene.start('ClassSelect');
  }
}
