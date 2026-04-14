import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';

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

  constructor(scene: Phaser.Scene, accentColor?: number) {
    this.scene = scene;
    this.accentColor = accentColor ?? COLORS.accent;
    const y = GAME_HEIGHT - TASKBAR_HEIGHT;

    this.container = scene.add.container(0, y);
    this.container.setDepth(100);

    // Background
    const bg = scene.add.rectangle(0, 0, GAME_WIDTH, TASKBAR_HEIGHT, 0x161b22).setOrigin(0);
    this.container.add(bg);

    // Top border
    const border = scene.add.rectangle(0, 0, GAME_WIDTH, 1, COLORS.windowBorder).setOrigin(0);
    this.container.add(border);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#8b949e',
    };

    // Left side — system items
    const startBtn = scene.add.text(8, 8, '◆ PromptOS', {
      ...style, color: Phaser.Display.Color.IntegerToColor(this.accentColor).rgba,
    });
    this.container.add(startBtn);

    // Right side — indicators
    this.budgetText = scene.add.text(GAME_WIDTH - 460, 8, '', style);
    this.healthText = scene.add.text(GAME_WIDTH - 320, 8, '', style);
    this.repText = scene.add.text(GAME_WIDTH - 180, 8, '', style);
    this.clockText = scene.add.text(GAME_WIDTH - 70, 8, '', style);
    this.container.add([this.budgetText, this.healthText, this.repText, this.clockText]);

    this.refresh();
  }

  refresh(): void {
    const s = getState();
    this.budgetText.setText(`💰 $${s.budget.toLocaleString()}`);
    this.healthText.setText(`🖥️ HW: ${s.hardwareHp}%`);
    this.repText.setText(`⭐ Rep: ${s.reputation}`);
    this.clockText.setText(`Day ${s.day}/13`);
  }

  destroy(): void {
    this.container.destroy();
  }
}
