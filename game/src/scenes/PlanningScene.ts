import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';

export class PlanningScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Planning' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const state = getState();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Planning Phase', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#e6edf3',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Day ' + state.day + ' · $' + state.budget, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#8b949e',
    }).setOrigin(0.5);

    const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '[ Continue ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#58a6ff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this.advance());
  }

  private advance(): void {
    const state = getState();
    this.scene.start('Execution');
  }
}
