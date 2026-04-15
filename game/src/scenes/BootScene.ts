import Phaser from 'phaser';
import AudioManager from '../systems/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    // TODO: load fonts, audio, minimal images
    // For now, just show a loading bar
    AudioManager.preload(this);
    const { width, height } = this.cameras.main;
    const bar = this.add.rectangle(width / 2, height / 2, 0, 4, 0x58a6ff);
    this.load.on('progress', (value: number) => {
      bar.width = 300 * value;
    });
  }

  create(): void {
    // Quick "PromptOS booting" animation then go to title
    const { width, height } = this.cameras.main;

    const bootText = this.add.text(width / 2, height / 2 - 40, 'PromptOS v1.0.0', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#39d353',
    }).setOrigin(0.5);

    const dots = this.add.text(width / 2, height / 2, 'Booting...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#8b949e',
    }).setOrigin(0.5);

    this.time.delayedCall(1500, () => {
      AudioManager.getInstance().playSFX('boot');
      this.scene.start('Title');
    });
  }
}
