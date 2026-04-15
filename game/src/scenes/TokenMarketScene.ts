import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';

export class TokenMarketScene extends Phaser.Scene {
  private taskbar!: Taskbar;

  constructor() {
    super({ key: 'TokenMarket' });
  }

  create(): void {
    const state = getState();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.taskbar = new Taskbar(this);

    const winWidth = 800;
    const winHeight = 500;
    const shopWin = new Window({
      scene: this,
      x: (GAME_WIDTH - winWidth) / 2,
      y: (GAME_HEIGHT - winHeight) / 2 - 20,
      width: winWidth,
      height: winHeight,
      title: 'Token Market ── Hardware & Models',
      titleIcon: '🛒',
    });

    const { x: cx, y: cy } = shopWin.contentArea;

    shopWin.add(this.add.text(cx, cy + 20, 'TOKEN MARKET: UNDER CONSTRUCTION', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#e6edf3',
    }));

    shopWin.add(this.add.text(cx, cy + 60, '(Phase 3: Shop UI & Purchase Logic Coming Soon)', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#8b949e',
    }));

    const backBtn = this.add.text(cx, cy + 400, '[ Back to Office ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e6edf3',
      backgroundColor: '#30363d',
      padding: { x: 12, y: 8 },
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#444c56'));
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#30363d'));
    backBtn.on('pointerdown', () => this.scene.start('Night'));

    shopWin.add(backBtn);
  }
}
