import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class ScanlineScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Scanlines', active: true });
  }

  create(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(1000);
    graphics.setAlpha(0.025);
    graphics.fillStyle(0x000000);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      graphics.fillRect(0, y, GAME_WIDTH, 1);
    }
  }
}
