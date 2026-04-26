import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { DebugMenu } from './DebugMenu';
import { DEV_CONFIG } from '../utils/devConfig';
import { getTheme } from '../utils/themes';

const TASKBAR_HEIGHT = 32;

/**
 * PromptOS Taskbar — sits at the bottom of the screen.
 * Shows: budget, hardware health, rep, clock/day indicator.
 */
export class Taskbar {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  private budgetText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private repText!: Phaser.GameObjects.Text;
  private clockText!: Phaser.GameObjects.Text;
  private accentColor: number;
  private activeMenu: DebugMenu | null = null;

  constructor(scene: Phaser.Scene, accentColor?: number) {
    this.scene = scene;
    const theme = getTheme(getState().playerClass ?? undefined);
    this.accentColor = accentColor ?? theme.accent ?? COLORS.accent;
    const y = GAME_HEIGHT - TASKBAR_HEIGHT;

    this.container = scene.add.container(0, y);
    this.container.setDepth(100);

    // Background
    const bg = scene.add.rectangle(0, 0, GAME_WIDTH, TASKBAR_HEIGHT, theme.taskbarBg).setOrigin(0);
    this.container.add(bg);

    // Top border
    const border = scene.add.rectangle(0, 0, GAME_WIDTH, 1, theme.taskbarBorder).setOrigin(0);
    this.container.add(border);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9da5b0',
    };

    // Left side — system items
    const startBtnText = '◆ PromptOS ▾';
    const startBtn = scene.add.text(8, 8, startBtnText, {
      ...style, color: Phaser.Display.Color.IntegerToColor(this.accentColor).rgba,
    }).setInteractive({ useHandCursor: true });
    
    if (DEV_CONFIG.debugMenu) startBtn.on('pointerdown', () => this._openMenu());
    startBtn.on('pointerover', () => startBtn.setColor('#e6edf3'));
    startBtn.on('pointerout', () => startBtn.setColor(Phaser.Display.Color.IntegerToColor(this.accentColor).rgba));
    
    this.container.add(startBtn);

    // Separators
    const sep1 = scene.add.rectangle(120, 16, 1, 16, 0x30363d, 0.5);
    const sep2 = scene.add.rectangle(GAME_WIDTH - 155, 16, 1, 16, 0x30363d, 0.5);
    this.container.add([sep1, sep2]);

    // Right side — indicators
    this.budgetText = scene.add.text(GAME_WIDTH - 620, 8, '', style);
    this.healthText = scene.add.text(GAME_WIDTH - 490, 8, '', style);
    this.repText = scene.add.text(GAME_WIDTH - 360, 8, '', style);
    
    // System Tray
    const trayWifi = scene.add.text(GAME_WIDTH - 185, 8, '📡', style);
    const trayBattery = scene.add.text(GAME_WIDTH - 160, 8, '🔋', style);
    const trayClock = scene.add.text(GAME_WIDTH - 135, 8, this._getTimeString(), style);
    
    // Update tray clock every minute
    scene.time.addEvent({
      delay: 60000,
      loop: true,
      callback: () => {
        if (trayClock.active) trayClock.setText(this._getTimeString());
      }
    });

    this.clockText = scene.add.text(GAME_WIDTH - 70, 8, '', style);
    this.container.add([
      this.budgetText, 
      this.healthText, 
      this.repText, 
      trayWifi, 
      trayBattery, 
      trayClock, 
      this.clockText
    ]);

    this.refresh();
  }

  private _getTimeString(): string {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  refresh(): void {
    const s = getState();
    this.budgetText.setText(s.playerClass === 'corporateDev' ? '💳 $∞' : `💰 $${s.budget.toLocaleString()}`);
    this.healthText.setText(`🖥️ HW: ${s.hardwareHp}%`);
    this.repText.setText(`⭐ Rep: ${s.reputation}`);
    this.clockText.setText(`Day ${s.day}/13`);
  }

  private _openMenu(): void {
    if (this.activeMenu) {
      this.activeMenu.destroy();
      this.activeMenu = null;
    }
    const menu = new DebugMenu(this.scene, { refresh: () => this.refresh() });
    this.activeMenu = menu;
    // Clear ref when menu self-dismisses
    menu.once('destroy', () => {
      if (this.activeMenu === menu) this.activeMenu = null;
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
