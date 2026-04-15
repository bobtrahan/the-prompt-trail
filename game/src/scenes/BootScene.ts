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
    const barWidth = 300;
    const barX = (width - barWidth) / 2;
    const barY = height / 2 + 30;
    const barBg = this.add.rectangle(width / 2, barY, barWidth, 4, 0x21262d).setOrigin(0.5);
    const bar = this.add.rectangle(barX, barY, 0, 4, 0x58a6ff).setOrigin(0, 0.5);
    this.load.on('progress', (value: number) => {
      bar.width = barWidth * value;
    });
  }

  create(): void {
    AudioManager.getInstance().init(this.game);

    const { width, height } = this.cameras.main;
    const postX = 60;
    const postY = 80;
    const lineHeight = 20;

    const postLines = [
      { text: 'PromptOS BIOS v4.2.0', color: '#39d353' },
      { text: 'Copyright (c) 2026 PromptOS Foundation', color: '#39d353' },
      { text: '', color: '#39d353' },
      { text: 'CPU: Neural Processing Unit (8 cores) .......... ', color: '#39d353', suffix: 'OK', suffixColor: '#3fb950' },
      { text: 'RAM: 64GB Tensor Memory ........................ ', color: '#39d353', suffix: 'OK', suffixColor: '#3fb950' },
      { text: 'GPU: RTX 9090 Vision Accelerator ............... ', color: '#39d353', suffix: 'OK', suffixColor: '#3fb950' },
      { text: 'DISK: 2TB Model Weight Storage ................. ', color: '#39d353', suffix: 'OK', suffixColor: '#3fb950' },
      { text: 'NET: API Gateway ............................... ', color: '#39d353', suffix: 'CONNECTED', suffixColor: '#3fb950' },
      { text: '', color: '#39d353' },
      { text: 'Loading kernel modules...', color: '#39d353' },
    ];

    const allTextObjects: Phaser.GameObjects.GameObject[] = [];

    // Phase 1: POST text (0-1.5s)
    postLines.forEach((line, index) => {
      this.time.delayedCall(index * 150, () => {
        const textObj = this.add.text(postX, postY + index * lineHeight, line.text, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: line.color,
        });
        allTextObjects.push(textObj);

        if (line.suffix) {
          const suffixObj = this.add.text(postX + textObj.width, postY + index * lineHeight, line.suffix, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: line.suffixColor,
          });
          allTextObjects.push(suffixObj);
        }
      });
    });

    // Phase 2: Kernel boot (1.5-2.5s)
    const kernelLines = [
      { prefix: '[  OK  ]', text: ' Started Agent Runtime Service' },
      { prefix: '[  OK  ]', text: ' Started Token Economy Daemon' },
      { prefix: '[  OK  ]', text: ' Mounted /dev/models' },
      { prefix: '', text: 'Initializing PromptOS v1.0.13...' },
    ];

    kernelLines.forEach((line, index) => {
      this.time.delayedCall(1500 + index * 200, () => {
        const y = postY + (postLines.length + index) * lineHeight;
        if (line.prefix) {
          const prefixObj = this.add.text(postX, y, line.prefix, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#3fb950',
          });
          const textObj = this.add.text(postX + prefixObj.width, y, line.text, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#8b949e',
          });
          allTextObjects.push(prefixObj, textObj);
        } else {
          const textObj = this.add.text(postX, y, line.text, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#8b949e',
          });
          allTextObjects.push(textObj);
        }
      });
    });

    // Phase 3: PromptOS splash (2.5-3.5s)
    this.time.delayedCall(2500, () => {
      // Fade out POST text
      allTextObjects.forEach(obj => {
        this.tweens.add({
          targets: obj,
          alpha: 0,
          duration: 300,
        });
      });

      // Display centered splash
      const splashContainer = this.add.container(width / 2, height / 2);
      const title = this.add.text(0, -20, 'PromptOS', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const version = this.add.text(0, 20, 'v1.0.13', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8b949e',
      }).setOrigin(0.5);
      
      splashContainer.add([title, version]);
      splashContainer.setAlpha(0);
      
      this.tweens.add({
        targets: splashContainer,
        alpha: 1,
        duration: 300,
      });

      AudioManager.getInstance().playSFX('boot');
    });

    // Phase 4: Fade to black (3.5-4s)
    this.time.delayedCall(3500, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Title');
      });
    });
  }
}
